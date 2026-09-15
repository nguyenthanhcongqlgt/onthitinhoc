import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from authentication.models import User
from exams.models import Exam, Question, QuestionOption
from rest_framework.test import APIRequestFactory, force_authenticate
from assessment.views import StartExamSessionView
from exams.views import ExamViewSet

def test_exam_assignment_logic():
    print("[*] Testing Exam Assignment & Permissions Logic...")

    # 1. Setup Teacher & Student
    teacher, _ = User.objects.get_or_create(
        username='teacher_test_assign',
        defaults={'email': 'teacher_assign@test.com', 'role': User.Role.TEACHER, 'status': User.Status.ACTIVE}
    )
    student, _ = User.objects.get_or_create(
        username='student_test_assign',
        defaults={'email': 'student_assign@test.com', 'role': User.Role.STUDENT, 'status': User.Status.ACTIVE, 'class_name': '12A1'}
    )

    # 2. Create Unassigned Exam (Draft in Bank)
    exam = Exam.objects.create(
        title='ĐỀ THI TEST BẢN NHÁP (CHƯA GIAO)',
        creator=teacher,
        is_assigned=False,
        assigned_classes='12A1',
        duration_minutes=45,
        is_active=True
    )
    Question.objects.create(
        exam=exam,
        content='Câu hỏi 1?',
        part_type=Question.PartType.PART_I
    )

    factory = APIRequestFactory()

    # 3. Student tries to start unassigned exam -> MUST BE 403 FORBIDDEN
    req = factory.post(f'/api/assessment/exams/{exam.id}/start/')
    force_authenticate(req, user=student)
    view = StartExamSessionView.as_view()
    resp = view(req, exam_id=exam.id)
    print(f"[+] Student start unassigned exam status: {resp.status_code} (Expected 403)")
    assert resp.status_code == 403, f"Expected 403, got {resp.status_code}"

    # 4. Teacher assigns the exam
    exam_view = ExamViewSet.as_view({'post': 'assign'})
    assign_req = factory.post(f'/api/exams/{exam.id}/assign/', {
        'is_assigned': True,
        'assigned_classes': '12A1 (HSG Tin)',
        'max_attempts': 1
    }, format='json')
    force_authenticate(assign_req, user=teacher)
    assign_resp = exam_view(assign_req, pk=exam.id)
    print(f"[+] Teacher assign exam status: {assign_resp.status_code}")
    assert assign_resp.status_code == 200, f"Expected 200, got {assign_resp.status_code}"

    exam.refresh_from_db()
    assert exam.is_assigned is True, "Exam should be assigned"
    print(f"[+] Exam is_assigned status: {exam.is_assigned}, classes: {exam.assigned_classes}")

    # 5. Student starts assigned exam -> MUST SUCCEED (200 OK)
    req2 = factory.post(f'/api/assessment/exams/{exam.id}/start/')
    force_authenticate(req2, user=student)
    resp2 = view(req2, exam_id=exam.id)
    print(f"[+] Student start assigned exam status: {resp2.status_code} (Expected 200)")
    assert resp2.status_code == 200, f"Expected 200, got {resp2.status_code}"

    print("\n" + "="*70)
    print("[SUCCESS] LOGIC GIAO DE & PHAN QUYEN HOC SINH HOAN THANH 100%!")
    print("="*70)

if __name__ == '__main__':
    test_exam_assignment_logic()
