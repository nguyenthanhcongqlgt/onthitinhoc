from django.urls import path
from .class_views import (
    ClassRoomListCreateView,
    ClassRoomDetailView,
    ClassRoomStudentsView,
    JoinClassByCodeView,
    AvailableStudentsView
)

urlpatterns = [
    path('', ClassRoomListCreateView.as_view(), name='classroom_list_create'),
    path('<int:pk>/', ClassRoomDetailView.as_view(), name='classroom_detail'),
    path('<int:pk>/students/', ClassRoomStudentsView.as_view(), name='classroom_students'),
    path('<int:pk>/students/<int:student_id>/', ClassRoomStudentsView.as_view(), name='classroom_student_delete'),
    path('join/', JoinClassByCodeView.as_view(), name='classroom_join_by_code'),
    path('available-students/', AvailableStudentsView.as_view(), name='classroom_available_students'),
]
