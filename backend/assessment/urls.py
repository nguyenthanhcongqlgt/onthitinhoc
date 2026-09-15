from django.urls import path
from .views import (
    StartExamSessionView,
    SelectBranchView,
    LogViolationView,
    SubmitExamView,
    ExamSessionListView,
    ExamSessionDetailView,
    SimulateScoringView,
    RegradeExamSessionsView,
    LiveProctorView,
    SessionControlView,
    AutoSaveDraftView,
    StudentAnalyticsView
)

urlpatterns = [
    path('exams/<int:exam_id>/start/', StartExamSessionView.as_view(), name='start_exam_session'),
    path('exams/<int:exam_id>/simulate-score/', SimulateScoringView.as_view(), name='simulate_scoring'),
    path('exams/<int:exam_id>/regrade/', RegradeExamSessionsView.as_view(), name='regrade_exam_sessions'),
    path('exams/<int:exam_id>/live-proctor/', LiveProctorView.as_view(), name='live_proctor'),
    path('sessions/<int:session_id>/select-branch/', SelectBranchView.as_view(), name='select_branch'),
    path('sessions/<int:session_id>/log-violation/', LogViolationView.as_view(), name='log_violation'),
    path('sessions/<int:session_id>/submit/', SubmitExamView.as_view(), name='submit_exam'),
    path('sessions/<int:session_id>/control/', SessionControlView.as_view(), name='session_control'),
    path('sessions/<int:session_id>/auto-save/', AutoSaveDraftView.as_view(), name='auto_save_draft'),
    path('sessions/', ExamSessionListView.as_view(), name='session_list'),
    path('sessions/<int:pk>/', ExamSessionDetailView.as_view(), name='session_detail'),
    path('student-analytics/', StudentAnalyticsView.as_view(), name='student_analytics'),
]

