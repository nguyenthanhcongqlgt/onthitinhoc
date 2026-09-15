from rest_framework import serializers
from .models import ExamSession, StudentAnswer, ViolationLog
from exams.serializers import ExamSerializer, QuestionSerializer, QuestionOptionSerializer

class ViolationLogSerializer(serializers.ModelSerializer):
    violation_type_display = serializers.CharField(source='get_violation_type_display', read_only=True)

    class Meta:
        model = ViolationLog
        fields = ['id', 'session', 'violation_type', 'violation_type_display', 'violation_number', 'timestamp', 'details']
        read_only_fields = ['id', 'timestamp']

class StudentAnswerSerializer(serializers.ModelSerializer):
    question_content = serializers.CharField(source='question.content', read_only=True)
    question_part = serializers.CharField(source='question.part_type', read_only=True)
    question_branch = serializers.CharField(source='question.branch', read_only=True)
    question_point = serializers.DecimalField(source='question.point', max_digits=5, decimal_places=2, read_only=True)
    question_explanation = serializers.CharField(source='question.explanation', read_only=True)
    selected_option_label = serializers.CharField(source='selected_option.label', read_only=True)

    class Meta:
        model = StudentAnswer
        fields = [
            'id', 'question', 'question_content', 'question_part', 'question_branch',
            'question_point', 'question_explanation', 'selected_option', 'selected_option_label', 'part2_answers',
            'is_correct', 'correct_subitems_count', 'score_awarded'
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            user = request.user
            is_staff = user.role in ['ADMIN', 'TEACHER'] or user.is_superuser
            if not is_staff and user == instance.session.student:
                exam = instance.session.exam
                if not exam.show_score_after_test:
                    data['score_awarded'] = None
                    data['is_correct'] = None
                    data['correct_subitems_count'] = None
                if not exam.show_explanation_after_test:
                    data['question_explanation'] = None
        return data

class ExamSessionSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    student_class = serializers.CharField(source='student.class_name', read_only=True)
    exam_title = serializers.CharField(source='exam.title', read_only=True)
    exam_total_points = serializers.DecimalField(source='exam.total_points', max_digits=6, decimal_places=2, read_only=True)
    exam_part1_total_points = serializers.DecimalField(source='exam.part1_total_points', max_digits=6, decimal_places=2, read_only=True)
    exam_part2_total_points = serializers.DecimalField(source='exam.part2_total_points', max_digits=6, decimal_places=2, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    show_score_after_test = serializers.BooleanField(source='exam.show_score_after_test', read_only=True)
    show_explanation_after_test = serializers.BooleanField(source='exam.show_explanation_after_test', read_only=True)

    class Meta:
        model = ExamSession
        fields = [
            'id', 'student', 'student_name', 'student_class', 'exam', 'exam_title',
            'exam_total_points', 'exam_part1_total_points', 'exam_part2_total_points',
            'selected_branch', 'status', 'status_display',
            'start_time', 'submit_time', 'total_score', 'part1_score', 'part2_score',
            'part1_correct_count', 'part2_correct_subitems_count',
            'violation_count', 'is_locked', 'lock_reason', 'competency_scores',
            'show_score_after_test', 'show_explanation_after_test'
        ]
        read_only_fields = [
            'id', 'student', 'start_time', 'submit_time', 'total_score',
            'part1_score', 'part2_score', 'part1_correct_count',
            'part2_correct_subitems_count', 'violation_count', 'is_locked',
            'lock_reason', 'competency_scores'
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            user = request.user
            is_staff = user.role in ['ADMIN', 'TEACHER'] or user.is_superuser
            if not is_staff and user == instance.student:
                if not instance.exam.show_score_after_test:
                    data['total_score'] = None
                    data['part1_score'] = None
                    data['part2_score'] = None
                    data['part1_correct_count'] = None
                    data['part2_correct_subitems_count'] = None
                    data['competency_scores'] = {}
        return data

class ExamSessionDetailSerializer(ExamSessionSerializer):
    answers = serializers.SerializerMethodField()
    violations = ViolationLogSerializer(many=True, read_only=True)

    class Meta(ExamSessionSerializer.Meta):
        fields = ExamSessionSerializer.Meta.fields + ['answers', 'violations']

    def get_answers(self, obj):
        serializer = StudentAnswerSerializer(obj.answers.all(), many=True, context=self.context)
        return serializer.data

