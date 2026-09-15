from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .bank_views import QuestionCategoryViewSet, BankQuestionViewSet

router = DefaultRouter()
router.register(r'categories', QuestionCategoryViewSet, basename='question-category')
router.register(r'questions', BankQuestionViewSet, basename='bank-question')

urlpatterns = [
    path('', include(router.urls)),
]
