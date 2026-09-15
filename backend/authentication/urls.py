from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    CustomTokenObtainPairView,
    RegisterView,
    UserProfileView,
    TeacherApprovalListView,
    TeacherApproveView,
    UserManagementListView,
    UserBulkImportView,
    UserStatusToggleView,
    UserPasswordResetView,
    UserDetailUpdateView,
    SystemStatsView,
    ChangePasswordView
)

urlpatterns = [
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', RegisterView.as_view(), name='register'),
    path('profile/', UserProfileView.as_view(), name='user_profile'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('teachers/pending/', TeacherApprovalListView.as_view(), name='teacher_pending_list'),
    path('teachers/<int:user_id>/approve/', TeacherApproveView.as_view(), name='teacher_approve'),
    path('users/', UserManagementListView.as_view(), name='user_management_list'),
    path('users/<int:pk>/', UserDetailUpdateView.as_view(), name='user_detail_update'),
    path('users/bulk-import/', UserBulkImportView.as_view(), name='user_bulk_import'),
    path('users/<int:user_id>/toggle-status/', UserStatusToggleView.as_view(), name='user_toggle_status'),
    path('users/<int:user_id>/reset-password/', UserPasswordResetView.as_view(), name='user_reset_password'),
    path('system-stats/', SystemStatsView.as_view(), name='system_stats'),
]
