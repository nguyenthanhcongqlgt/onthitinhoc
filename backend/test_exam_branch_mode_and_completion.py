import os
import django
from decimal import Decimal

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from authentication.models import User
from exams.models import Exam, Question, QuestionOption
from assessment.models import ExamSession, StudentAnswer
from assessment.matrix_engine import ScoringMatrixEngine
from rest_framework.test import APIRequestFactory, force_authenticate
from assessment.views import StartExamSessionView, SubmitExamView
from exams.views import ExamViewSet

def run_tests():
    print("[*] Starting Branch Mode & Scoring Engine Verification...")

    teacher, _ = User.objects.get_or_create(
        username='teacher_branch_test',
        defaults={'email': 'teacher_branch@test.com', 'role': User.Role.TEACHER, 'status': User.Status.ACTIVE}
    )
    student, _ = User.objects.get_or_create(
        username='student_branch_test',
        defaults={'email': 'student_branch@test.com', 'role': User.Role.STUDENT, 'status': User.Status.ACTIVE, 'class_name': '12A1'}
    )

    # 1. Test Single Mode
    exam_single = Exam.objects.create(
        title='ĐỀ THI TEST SINGLE BRANCH',
        creator=teacher,
        is_assigned=True,
        assigned_classes='Toàn trường',
        branch_mode=Exam.BranchMode.SINGLE,
        duration_minutes=50,
        is_active=True
    )
    # Questions
    q_p1 = Question.objects.create(exam=exam_single, part_type=Question.PartType.PART_I, content='P1 Q1', point=Decimal('0.5'))
    opt_p1_correct = QuestionOption.objects.create(question=q_p1, label='A', content='Ans A', is_correct=True)
    QuestionOption.objects.create(question=q_p1, label='B', content='Ans B', is_correct=False)

    q_p2_cs = Question.objects.create(exam=exam_single, part_type=Question.PartType.PART_II, branch=Question.Branch.CS, content='P2 CS Q1', point=Decimal('1.6'))
    opt_cs1 = QuestionOption.objects.create(question=q_p2_cs, label='a', content='Sub a', is_correct=True)
    opt_cs2 = QuestionOption.objects.create(question=q_p2_cs, label='b', content='Sub b', is_correct=False)

    q_p2_ict = Question.objects.create(exam=exam_single, part_type=Question.PartType.PART_II, branch=Question.Branch.ICT, content='P2 ICT Q1', point=Decimal('1.6'))
    opt_ict1 = QuestionOption.objects.create(question=q_p2_ict, label='a', content='Sub a', is_correct=True)
    opt_ict2 = QuestionOption.objects.create(question=q_p2_ict, label='b', content='Sub b', is_correct=False)

    factory = APIRequestFactory()

    # Start session single
    req = factory.post(f'/api/assessment/exams/{exam_single.id}/start/')
    force_authenticate(req, user=student)
    resp = StartExamSessionView.as_view()(req, exam_id=exam_single.id)
    assert resp.status_code == 200
    session_id_single = resp.data['session_id']
    session_single = ExamSession.objects.get(id=session_id_single)
    assert session_single.selected_branch == ExamSession.BranchSelected.NONE
    print("[+] Test 1 PASS: Single mode session initialized with selected_branch=NONE")

    # 2. Test Both Mode
    exam_both = Exam.objects.create(
        title='ĐỀ THI TEST BOTH BRANCHES',
        creator=teacher,
        is_assigned=True,
        assigned_classes='Toàn trường',
        branch_mode=Exam.BranchMode.BOTH,
        duration_minutes=50,
        is_active=True
    )
    # Add questions to exam_both
    q_b_p1 = Question.objects.create(exam=exam_both, part_type=Question.PartType.PART_I, content='P1 Q1', point=Decimal('0.5'))
    opt_b_p1 = QuestionOption.objects.create(question=q_b_p1, label='A', content='Ans A', is_correct=True)

    q_b_cs = Question.objects.create(exam=exam_both, part_type=Question.PartType.PART_II, branch=Question.Branch.CS, content='P2 CS Q1', point=Decimal('1.6'))
    opt_b_cs1 = QuestionOption.objects.create(question=q_b_cs, label='a', content='Sub a', is_correct=True)
    opt_b_cs2 = QuestionOption.objects.create(question=q_b_cs, label='b', content='Sub b', is_correct=False)

    q_b_ict = Question.objects.create(exam=exam_both, part_type=Question.PartType.PART_II, branch=Question.Branch.ICT, content='P2 ICT Q1', point=Decimal('1.6'))
    opt_b_ict1 = QuestionOption.objects.create(question=q_b_ict, label='a', content='Sub a', is_correct=True)
    opt_b_ict2 = QuestionOption.objects.create(question=q_b_ict, label='b', content='Sub b', is_correct=False)

    req2 = factory.post(f'/api/assessment/exams/{exam_both.id}/start/')
    force_authenticate(req2, user=student)
    resp2 = StartExamSessionView.as_view()(req2, exam_id=exam_both.id)
    assert resp2.status_code == 200
    session_id_both = resp2.data['session_id']
    session_both = ExamSession.objects.get(id=session_id_both)
    assert session_both.selected_branch == ExamSession.BranchSelected.BOTH
    print("[+] Test 2 PASS: Both mode session automatically initialized with selected_branch=BOTH")

    # 3. Test submitting BOTH mode
    # Student answers P1, CS, and ICT
    submit_data = {
        'part1_answers': [{'question_id': q_b_p1.id, 'selected_option_id': opt_b_p1.id}],
        'part2_answers': [
            {'question_id': q_b_cs.id, 'sub_answers': {str(opt_b_cs1.id): True, str(opt_b_cs2.id): False}},
            {'question_id': q_b_ict.id, 'sub_answers': {str(opt_b_ict1.id): True, str(opt_b_ict2.id): False}},
        ]
    }
    req_sub = factory.post(f'/api/assessment/sessions/{session_id_both}/submit/', submit_data, format='json')
    force_authenticate(req_sub, user=student)
    resp_sub = SubmitExamView.as_view()(req_sub, session_id=session_id_both)
    assert resp_sub.status_code == 200

    session_both.refresh_from_db()
    assert session_both.status == ExamSession.Status.SUBMITTED
    assert session_both.part1_score > Decimal('0')
    assert session_both.part2_score > Decimal('0')
    # Both CS and ICT answers should be recorded
    answers_count = StudentAnswer.objects.filter(session=session_both).count()
    assert answers_count == 3  # 1 in P1 + 1 in CS + 1 in ICT
    print(f"[+] Test 3 PASS: Graded both branches successfully! Total score={session_both.total_score} (Part1={session_both.part1_score}, Part2={session_both.part2_score})")

    # 4. Test Teacher Assign with branch_mode
    exam_view = ExamViewSet.as_view({'post': 'assign'})
    assign_req = factory.post(f'/api/exams/{exam_single.id}/assign/', {
        'is_assigned': True,
        'assigned_classes': '12A1',
        'branch_mode': 'BOTH'
    }, format='json')
    force_authenticate(assign_req, user=teacher)
    assign_resp = exam_view(assign_req, pk=exam_single.id)
    assert assign_resp.status_code == 200
    exam_single.refresh_from_db()
    assert exam_single.branch_mode == Exam.BranchMode.BOTH
    print("[+] Test 4 PASS: Teacher assign updated branch_mode to BOTH successfully")

    print("\n=======================================================")
    print("[SUCCESS] ALL BACKEND BRANCH MODE TESTS PASSED 100%!")
    print("=======================================================")

if __name__ == '__main__':
    run_tests()
