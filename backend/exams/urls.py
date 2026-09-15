from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ExamViewSet,
    QuestionViewSet,
    VerifyAccessCodeView,
    QuickJoinExamView,
    ImportDocxExamView,
    DownloadDocxTemplateView,
    UploadExamImageView,
    AISettingsView,
    AIToggleTeacherAccessView,
    AITestConnectionView,
    AISolveExamView,
    ExamAnalyticsView,
    QuestionFeedbackViewSet,
    ExamSittingViewSet,
    ExamFolderViewSet
)

router = DefaultRouter()
router.register(r'folders', ExamFolderViewSet, basename='folder')
router.register(r'exams', ExamViewSet, basename='exam')
router.register(r'questions', QuestionViewSet, basename='question')
router.register(r'feedbacks', QuestionFeedbackViewSet, basename='feedback')
router.register(r'sittings', ExamSittingViewSet, basename='sitting')

urlpatterns = [
    path('exams/import-docx/', ImportDocxExamView.as_view(), name='import_docx_exam'),
    path('exams/upload-image/', UploadExamImageView.as_view(), name='upload_exam_image'),
    path('exams/template-docx/', DownloadDocxTemplateView.as_view(), name='download_docx_template'),
    path('exams/ai-settings/', AISettingsView.as_view(), name='ai_settings'),
    path('exams/ai-settings/toggle-teacher-access/', AIToggleTeacherAccessView.as_view(), name='ai_toggle_teacher_access'),
    path('exams/ai-test-connection/', AITestConnectionView.as_view(), name='ai_test_connection'),
    path('exams/ai-solve/', AISolveExamView.as_view(), name='ai_solve_exam'),
    path('exams/<int:exam_id>/analytics/', ExamAnalyticsView.as_view(), name='exam_analytics'),
    path('exams/<int:exam_id>/verify-code/', VerifyAccessCodeView.as_view(), name='verify_access_code'),
    path('exams/quick-join/', QuickJoinExamView.as_view(), name='quick_join_exam'),
    path('', include(router.urls)),
]
