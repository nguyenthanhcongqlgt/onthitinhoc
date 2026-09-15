import os
import django
import io

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from authentication.models import User
from exams.models import Exam, Question, QuestionOption
from exams.docx_parser import DocxExamParser
from exams.template_generator import generate_exam_docx_template

def test_docx_import_pipeline():
    print("[*] Bat dau kiem thu Pipeline Import De thi tu file Word (.docx)...")

    # 1. Tạo file DOCX template mẫu
    buffer = generate_exam_docx_template()
    assert buffer is not None, "Failed to generate template buffer"
    assert buffer.getbuffer().nbytes > 0, "Generated buffer is empty"
    print("[+] [TEST 1] Sinh file Word (.docx) mau chuan THPT Quat Lam: PASSED")

    # 2. Parse file DOCX template
    buffer.seek(0)
    parsed_res = DocxExamParser.parse_docx_file(buffer)
    assert parsed_res['success'] is True, "Parser reported failure"
    assert parsed_res['summary']['total_questions'] >= 4, f"Expected >= 4 questions, got {parsed_res['summary']['total_questions']}"
    assert parsed_res['summary']['part1_count'] >= 2, "Expected Part 1 questions"
    assert parsed_res['summary']['part2_cs_count'] >= 1, "Expected Part 2 CS question"
    assert parsed_res['summary']['part2_ict_count'] >= 1, "Expected Part 2 ICT question"
    print(f"[+] [TEST 2] DocxExamParser boc tach thanh cong ({parsed_res['summary']['total_questions']} cau hoi): PASSED")

    # 3. Kiểm tra chi tiết Part I options & code snippet
    p1_q1 = [q for q in parsed_res['questions'] if q['part_type'] == 'PART_I'][0]
    assert len(p1_q1['options']) == 4, f"Expected 4 options in Part 1 Q1, got {len(p1_q1['options'])}"
    assert p1_q1['code_snippet'] != "", "Code snippet was not extracted properly"
    assert any(opt['is_correct'] for opt in p1_q1['options']), "No correct option marked in Part 1 Q1"
    print("[+] [TEST 3] Trich xuat Code Python & Dap an dung Part I: PASSED")

    # 4. Kiểm tra chi tiết Part II sub-items (a, b, c, d)
    p2_cs_q1 = [q for q in parsed_res['questions'] if q['part_type'] == 'PART_II' and q['branch'] == 'CS'][0]
    assert len(p2_cs_q1['options']) == 4, f"Expected 4 sub-items in Part 2 CS Q1, got {len(p2_cs_q1['options'])}"
    # Verify sub-item a is True, sub-item b is False
    assert p2_cs_q1['options'][0]['is_correct'] is True, "Sub-item a expected True"
    assert p2_cs_q1['options'][1]['is_correct'] is False, "Sub-item b expected False"
    print("[+] [TEST 4] Trich xuat Dung/Sai Part II CS (Dijkstra, Bellman-Ford): PASSED")

    # 5. Lưu vào Database
    admin_user = User.objects.get(username='admin')
    imported_exam = Exam.objects.create(
        title="ĐỀ THI IMPORT TỰ ĐỘNG TỪ WORD (.DOCX) TEST",
        description="Đề thi tạo tự động qua pipeline test.",
        creator=admin_user,
        duration_minutes=50,
        matrix_preset='HSG_QUAT_LAM',
        is_active=True
    )

    for q_data in parsed_res['questions']:
        q = Question.objects.create(
            exam=imported_exam,
            part_type=q_data['part_type'],
            branch=q_data['branch'],
            order_index=q_data['order_index'],
            content=q_data['content'],
            code_snippet=q_data.get('code_snippet', ''),
            code_language=q_data.get('code_language', 'python'),
            competency_category=q_data.get('competency_category', 'PROG_BASIC'),
            difficulty_level=q_data.get('difficulty_level', 'TH')
        )
        for opt in q_data['options']:
            QuestionOption.objects.create(
                question=q,
                label=opt['label'],
                content=opt['content'],
                is_correct=opt['is_correct'],
                order_index=opt['order_index'],
                explanation=opt.get('explanation', '')
            )

    assert imported_exam.questions.count() == parsed_res['summary']['total_questions']
    print(f"[+] [TEST 5] Ghi nhan Exam & {imported_exam.questions.count()} Questions vao Database: PASSED")

    print("\n" + "="*65)
    print("[SUCCESS] PIPELINE IMPORT WORD (.DOCX) DA HOAN THANH 100%!")
    print("="*65)

if __name__ == '__main__':
    test_docx_import_pipeline()
