import os
import django
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from authentication.models import User
from exams.models import Exam, Question, QuestionOption
from assessment.models import ExamSession, StudentAnswer
from assessment.matrix_engine import ScoringMatrixEngine

def test_automatic_regrade_on_exam_correction():
    print("[*] Testing Automatic Score & Report Recalculation after Exam Correction...")

    # 1. Setup Teacher & Student
    teacher, _ = User.objects.get_or_create(
        username='teacher_regrade_test',
        defaults={'email': 'teacher_regrade@test.com', 'role': User.Role.TEACHER, 'status': User.Status.ACTIVE}
    )
    student, _ = User.objects.get_or_create(
        username='student_regrade_test',
        defaults={'email': 'student_regrade@test.com', 'full_name': 'Nguyen Van A', 'role': User.Role.STUDENT, 'status': User.Status.ACTIVE, 'class_name': '12A1'}
    )

    # 2. Setup Exam with Original (Flawed) Answer Key
    exam = Exam.objects.create(
        title='ĐỀ THI TIN HỌC KHẢO SÁT 2025',
        creator=teacher,
        is_assigned=True,
        matrix_preset=Exam.MatrixPreset.HSG_QUAT_LAM, # 1=0.3, 2=0.6, 3=1.0, 4=1.5
        part1_point_per_question=Decimal('0.40')
    )

    # Part 1 Question: Original key has A as correct (Typo in exam)
    q1 = Question.objects.create(
        exam=exam,
        order_index=1,
        part_type=Question.PartType.PART_I,
        branch=Question.Branch.COMMON,
        content='Câu 1: Giá trị của x?',
        competency_category=Question.CompetencyCategory.PROG_BASIC,
        difficulty_level=Question.Difficulty.TH
    )
    opt1_a = QuestionOption.objects.create(question=q1, label='A', content='10', is_correct=True, order_index=1)
    opt1_b = QuestionOption.objects.create(question=q1, label='B', content='20', is_correct=False, order_index=2) # Actually correct in reality
    opt1_c = QuestionOption.objects.create(question=q1, label='C', content='30', is_correct=False, order_index=3)
    opt1_d = QuestionOption.objects.create(question=q1, label='D', content='40', is_correct=False, order_index=4)

    # Part 2 Question: Original key has b=False (Typo: b is actually True)
    q2 = Question.objects.create(
        exam=exam,
        order_index=2,
        part_type=Question.PartType.PART_II,
        branch=Question.Branch.COMMON,
        content='Câu 2: Xét tính đúng sai của các mệnh đề:',
        competency_category=Question.CompetencyCategory.ALGO_DS,
        difficulty_level=Question.Difficulty.VD
    )
    opt2_a = QuestionOption.objects.create(question=q2, label='a', content='Ý a', is_correct=True, order_index=1)
    opt2_b = QuestionOption.objects.create(question=q2, label='b', content='Ý b', is_correct=False, order_index=2) # Actually True
    opt2_c = QuestionOption.objects.create(question=q2, label='c', content='Ý c', is_correct=True, order_index=3)
    opt2_d = QuestionOption.objects.create(question=q2, label='d', content='Ý d', is_correct=False, order_index=4)

    # 3. Student Takes Exam and submits:
    # - Part 1: Student chose B (which is correct in reality, but scored 0 under flawed key A)
    # - Part 2: Student answered: a=True, b=True, c=True, d=False (which is 100% correct in reality, but scored 3/4=1.0đ under flawed key)
    session = ExamSession.objects.create(
        student=student,
        exam=exam,
        status=ExamSession.Status.SUBMITTED
    )

    part1_sub = [{'question_id': q1.id, 'selected_option_id': opt1_b.id}]
    part2_sub = [{'question_id': q2.id, 'sub_answers': {
        str(opt2_a.id): True,
        str(opt2_b.id): True,
        str(opt2_c.id): True,
        str(opt2_d.id): False
    }}]

    initial_grade = ScoringMatrixEngine.grade_exam_session(
        session=session,
        part1_submissions=part1_sub,
        part2_submissions=part2_sub,
        selected_branch=Question.Branch.CS
    )

    print(f"[+] Initial Grading (Before Key Fix):")
    print(f"    - Part 1 Score: {initial_grade['part1_score']} (Correct: {initial_grade['part1_correct_count']}/1)")
    print(f"    - Part 2 Score: {initial_grade['part2_score']} (Correct subitems: {initial_grade['part2_correct_subitems_count']}/4)")
    print(f"    - Total Score: {initial_grade['total_score']}d")

    assert initial_grade['part1_score'] == 0.0, "Expected 0.0 under flawed key"
    assert initial_grade['part2_score'] == 1.0, "Expected 1.0 under flawed key (3/4 correct)"
    assert initial_grade['total_score'] == 1.0, "Expected 1.0 total"

    # 4. Teacher Discovers the Typo and Fixes Answer Key in the Exam:
    # Part 1: B is correct (not A)
    opt1_a.is_correct = False
    opt1_a.save()
    opt1_b.is_correct = True
    opt1_b.save()

    # Part 2: b is True (not False)
    opt2_b.is_correct = True
    opt2_b.save()

    # 5. Execute Regrade Engine
    regrade_result = ScoringMatrixEngine.regrade_all_sessions_for_exam(exam.id)
    print(f"\n[+] Regrade Engine executed:")
    print(f"    - Regraded sessions count: {regrade_result['regraded_sessions_count']}")
    print(f"    - Score changed count: {regrade_result['score_changed_count']}")
    print(f"    - Score change details: {regrade_result['score_changes']}")

    # 6. Verify Student's Updated Score & Analytics Report
    session.refresh_from_db()
    print(f"\n[+] Recalculated Score (After Key Fix):")
    print(f"    - Part 1 Score: {session.part1_score}d (Expected 0.40d)")
    print(f"    - Part 2 Score: {session.part2_score}d (Expected 1.50d - 4/4 correct)")
    print(f"    - Total Score: {session.total_score}d (Expected 1.90d)")

    assert session.part1_score == Decimal('0.40'), f"Expected 0.40, got {session.part1_score}"
    assert session.part2_score == Decimal('1.50'), f"Expected 1.50, got {session.part2_score}"
    assert session.total_score == Decimal('1.90'), f"Expected 1.90, got {session.total_score}"
    assert session.competency_scores['PROG_BASIC']['percentage'] == 100.0
    assert session.competency_scores['ALGO_DS']['percentage'] == 100.0

    print("\n" + "="*70)
    print("[SUCCESS] TU DONG CAP NHAT DIEM VA BAO CAO HOC SINH KHI SUA DE HOAN TAT 100%!")
    print("="*70)

if __name__ == '__main__':
    test_automatic_regrade_on_exam_correction()
