from django.contrib import admin
from .models import Exam, Question, QuestionOption

class QuestionOptionInline(admin.TabularInline):
    model = QuestionOption
    extra = 4
    fields = ('label', 'content', 'code_snippet', 'is_correct', 'order_index', 'explanation')

@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('id', 'exam', 'part_type', 'branch', 'order_index', 'competency_category', 'difficulty_level', 'short_content')
    list_filter = ('exam', 'part_type', 'branch', 'competency_category', 'difficulty_level')
    search_fields = ('content', 'code_snippet')
    inlines = [QuestionOptionInline]

    def short_content(self, obj):
        return obj.content[:60]
    short_content.short_description = 'Nội dung'

@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'creator', 'duration_minutes', 'access_type', 'is_active', 'created_at')
    list_filter = ('access_type', 'is_active', 'created_at')
    search_fields = ('title', 'description', 'access_code')

from .models import ExamSitting, SittingAssignment

@admin.register(ExamSitting)
class ExamSittingAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'room_code', 'creator', 'is_active', 'start_time', 'end_time', 'created_at')
    list_filter = ('is_active', 'distribution_mode', 'created_at')
    search_fields = ('name', 'room_code', 'description')
    filter_horizontal = ('exams',)

@admin.register(SittingAssignment)
class SittingAssignmentAdmin(admin.ModelAdmin):
    list_display = ('id', 'sitting', 'student', 'exam', 'assigned_at')
    list_filter = ('sitting', 'exam')
    search_fields = ('student__username', 'student__full_name', 'sitting__name')

