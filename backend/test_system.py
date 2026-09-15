import os
import django
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from authentication.models import User
from exams.models import Exam, Question, QuestionOption, MATRIX_PRESETS
from exams.services import ExamSecurityService
from assessment.models import ExamSession, ViolationLog, StudentAnswer
from assessment.matrix_engine import ScoringMatrixEngine

def run_verification_tests():
    print("[*] Bat dau kiem thu toan dien He thong Database Models & Matrix Scoring Engine...")

    # 1. Phân quyền User & RBAC
    admin = User.objects.get(username='admin')
    student = User.objects.get(username='hsg_nam')
    teacher = User.objects.get(username='gv_tinhoc')

    assert admin.role == User.Role.ADMIN, "Admin role check failed"
    assert student.role == User.Role.STUDENT, "Student role check failed"
    assert teacher.role == User.Role.TEACHER, "Teacher role check failed"
    print("[+] [TEST 1] Phan quyen User & RBAC: PASSED")

    # 2. Cấu trúc Đề thi & Ngân hàng câu hỏi
    exam = Exam.objects.filter(questions__branch=Question.Branch.CS).distinct().first() or Exam.objects.first()
    assert exam is not None, "Exam not found"
    p1_count = exam.questions.filter(part_type=Question.PartType.PART_I).count()
    p2_cs_count = exam.questions.filter(part_type=Question.PartType.PART_II, branch=Question.Branch.CS).count()
    p2_ict_count = exam.questions.filter(part_type=Question.PartType.PART_II, branch=Question.Branch.ICT).count()
    
    assert p1_count > 0, "Part 1 questions missing"
    assert p2_cs_count > 0, "Part 2 CS questions missing"
    assert p2_ict_count > 0, "Part 2 ICT questions missing"
    print(f"[+] [TEST 2] Cau truc De thi (Phan I: {p1_count} cau, Phan II CS: {p2_cs_count} cau, ICT: {p2_ict_count} cau): PASSED")

    # 3. Kiểm tra tất cả 4 Presets Ma trận Chấm điểm (Matrix Presets)
    # Preset 1: HSG THPT Quất Lâm
    hsg_matrix = MATRIX_PRESETS['HSG_QUAT_LAM']
    assert ScoringMatrixEngine.calculate_part2_question_score(1, hsg_matrix) == Decimal('0.30')
    assert ScoringMatrixEngine.calculate_part2_question_score(2, hsg_matrix) == Decimal('0.60')
    assert ScoringMatrixEngine.calculate_part2_question_score(3, hsg_matrix) == Decimal('1.00')
    assert ScoringMatrixEngine.calculate_part2_question_score(4, hsg_matrix) == Decimal('1.50')

    # Preset 2: Bộ GD&ĐT 2025
    bgd_matrix = MATRIX_PRESETS['BGD_2025']
    assert ScoringMatrixEngine.calculate_part2_question_score(1, bgd_matrix) == Decimal('0.10')
    assert ScoringMatrixEngine.calculate_part2_question_score(2, bgd_matrix) == Decimal('0.25')
    assert ScoringMatrixEngine.calculate_part2_question_score(3, bgd_matrix) == Decimal('0.50')
    assert ScoringMatrixEngine.calculate_part2_question_score(4, bgd_matrix) == Decimal('1.00')

    # Preset 3: Tuyến tính đều
    linear_matrix = MATRIX_PRESETS['LINEAR_EQUAL']
    assert ScoringMatrixEngine.calculate_part2_question_score(1, linear_matrix) == Decimal('0.25')
    assert ScoringMatrixEngine.calculate_part2_question_score(2, linear_matrix) == Decimal('0.50')
    assert ScoringMatrixEngine.calculate_part2_question_score(3, linear_matrix) == Decimal('0.75')
    assert ScoringMatrixEngine.calculate_part2_question_score(4, linear_matrix) == Decimal('1.00')

    # Preset 4: Custom Matrix
    custom_matrix = {"1": 0.5, "2": 1.0, "3": 1.5, "4": 2.0}
    assert ScoringMatrixEngine.calculate_part2_question_score(4, custom_matrix) == Decimal('2.0')
    print("[+] [TEST 3] Kiem tra 4 Presets Ma tran Cham diem (HSG Quat Lam, Bo GD&DT 2025, Tuyen tinh, Custom): PASSED")

    # 4. Zero-Trust Payload Masking
    session, _ = ExamSession.objects.get_or_create(student=student, exam=exam)
    payload = ExamSecurityService.prepare_exam_payload_for_student(exam, session.id, student.id)
    for q in payload['part1_questions']:
        for opt in q['options']:
            assert 'is_correct' not in opt, "Security Breach: is_correct found"
    for q in payload['part2_branches']['CS']:
        for opt in q['options']:
            assert 'is_correct' not in opt, "Security Breach in CS: is_correct found"
    for q in payload['part2_branches']['ICT']:
        for opt in q['options']:
            assert 'is_correct' not in opt, "Security Breach in ICT: is_correct found"
    print("[+] [TEST 4] Zero-Trust Payload Masking ca 2 nhanh CS & ICT: PASSED")

    # 5. Chấm điểm thực tế Nhánh CS (Khoa học Máy tính)
    q1 = exam.questions.filter(part_type=Question.PartType.PART_I).first()
    correct_opt_p1 = q1.options.filter(is_correct=True).first()
    q_cs_1 = exam.questions.filter(part_type=Question.PartType.PART_II, branch=Question.Branch.CS).first()
    correct_cs_sub = {str(opt.id): opt.is_correct for opt in q_cs_1.options.all()}

    res_cs = ScoringMatrixEngine.grade_exam_session(
        session=session,
        part1_submissions=[{'question_id': q1.id, 'selected_option_id': correct_opt_p1.id}],
        part2_submissions=[{'question_id': q_cs_1.id, 'sub_answers': correct_cs_sub}],
        selected_branch='CS'
    )
    assert res_cs['part1_score'] == 0.40
    assert res_cs['part2_score'] == 1.50
    assert res_cs['total_score'] == 1.90
    print("[+] [TEST 5] Cham diem Chuyen sau Nhanh CS (1.90d): PASSED")

    # 6. Chấm điểm thực tế Nhánh ICT (Tin học Ứng dụng)
    student2 = User.objects.get(username='hsg_linh')
    session_ict, _ = ExamSession.objects.get_or_create(student=student2, exam=exam)
    q_ict_1 = exam.questions.filter(part_type=Question.PartType.PART_II, branch=Question.Branch.ICT).first()
    correct_ict_sub = {str(opt.id): opt.is_correct for opt in q_ict_1.options.all()}

    res_ict = ScoringMatrixEngine.grade_exam_session(
        session=session_ict,
        part1_submissions=[{'question_id': q1.id, 'selected_option_id': correct_opt_p1.id}],
        part2_submissions=[{'question_id': q_ict_1.id, 'sub_answers': correct_ict_sub}],
        selected_branch='ICT'
    )
    assert res_ict['part1_score'] == 0.40
    assert res_ict['part2_score'] == 1.50
    assert res_ict['total_score'] == 1.90
    print("[+] [TEST 6] Cham diem Chuyen sau Nhanh ICT (1.90d): PASSED")

    # 7. Mô phỏng chấm điểm ma trận (Simulate Scoring API Engine)
    sim_res = ScoringMatrixEngine.simulate_matrix_grading(
        exam=exam,
        part1_submissions=[{'question_id': q1.id, 'selected_option_id': correct_opt_p1.id}],
        part2_submissions=[{'question_id': q_cs_1.id, 'sub_answers': correct_cs_sub}],
        selected_branch='CS',
        custom_matrix=bgd_matrix
    )
    # With BGD matrix, 4 correct sub-items = 1.00 pt instead of 1.50 pt
    assert sim_res['part2_score'] == 1.00
    assert sim_res['total_score'] == 1.40
    assert len(sim_res['detailed_results']['part2'][0]['sub_eval']) == 4
    print("[+] [TEST 7] Engine Mo phong Cham diem & Phan tich tung Y con (Simulation API): PASSED")

    print("\n" + "="*65)
    print("[SUCCESS] TAT CA 7 BO TEST MODELS & MATRIX ENGINE DA HOAN THANH 100%!")
    print("="*65)

if __name__ == '__main__':
    run_verification_tests()
