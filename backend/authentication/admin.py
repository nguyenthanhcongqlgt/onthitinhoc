from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ('username', 'full_name', 'email', 'role', 'status', 'school', 'class_name', 'is_staff')
    list_filter = ('role', 'status', 'is_staff', 'is_superuser', 'created_at')
    search_fields = ('username', 'full_name', 'email', 'phone_number', 'student_id')
    ordering = ('-date_joined',)

    fieldsets = BaseUserAdmin.fieldsets + (
        ('Thông tin Học sinh & Giáo viên THPT Quất Lâm', {
            'fields': ('role', 'status', 'full_name', 'phone_number', 'school', 'class_name', 'student_id')
        }),
    )

    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Thông tin Học sinh & Giáo viên THPT Quất Lâm', {
            'fields': ('role', 'status', 'full_name', 'phone_number', 'school', 'class_name', 'student_id')
        }),
    )
