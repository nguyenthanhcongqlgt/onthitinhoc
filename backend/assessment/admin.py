from django.contrib import admin
from .models import ExamSession, StudentAnswer, ViolationLog

class StudentAnswerInline(admin.TabularInline):
    model = StudentAnswer
    extra = 0
    readonly_fields = ('question', 'selected_option', 'part2_answers', 'is_correct', 'correct_subitems_count', 'score_awarded')

class ViolationLogInline(admin.TabularInline):
    model = ViolationLog
    extra = 0
    readonly_fields = ('violation_type', 'violation_number', 'timestamp', 'details')

@admin.register(ExamSession)
class ExamSessionAdmin(admin.ModelAdmin):
    list_display = ('id', 'student', 'exam', 'selected_branch', 'status', 'total_score', 'violation_count', 'is_locked', 'start_time')
    list_filter = ('status', 'selected_branch', 'is_locked', 'exam')
    search_fields = ('student__username', 'student__full_name', 'exam__title')
    inlines = [ViolationLogInline, StudentAnswerInline]

@admin.register(ViolationLog)
class ViolationLogAdmin(admin.ModelAdmin):
    list_display = ('id', 'session', 'violation_type', 'violation_number', 'timestamp')
    list_filter = ('violation_type', 'timestamp')
    search_fields = ('session__student__username', 'session__exam__title')
