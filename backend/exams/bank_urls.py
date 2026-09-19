from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .bank_views import QuestionCategoryViewSet, BankQuestionViewSet, AutoGenerateExamView

router = DefaultRouter()
router.register(r'categories', QuestionCategoryViewSet, basename='question-category')
router.register(r'questions', BankQuestionViewSet, basename='bank-question')

urlpatterns = [
    path('generate/', AutoGenerateExamView.as_view(), name='auto-generate-exam'),
    path('', include(router.urls)),
]
