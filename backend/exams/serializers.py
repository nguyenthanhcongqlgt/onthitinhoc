from rest_framework import serializers
from .models import Exam, Question, QuestionOption, QuestionFeedback, ExamSitting, SittingAssignment, ExamFolder

class ExamFolderSerializer(serializers.ModelSerializer):
    creator_name = serializers.ReadOnlyField(source='creator.full_name')
    parent_name = serializers.ReadOnlyField(source='parent.name')
    full_path = serializers.SerializerMethodField()
    exam_count = serializers.SerializerMethodField()
    children_count = serializers.SerializerMethodField()
    is_owner = serializers.SerializerMethodField()

    class Meta:
        model = ExamFolder
        fields = [
            'id', 'name', 'description', 'parent', 'parent_name',
            'creator', 'creator_name', 'is_shared', 'color', 'icon',
            'order_index', 'exam_count', 'children_count', 'full_path',
            'is_owner', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'creator', 'creator_name', 'is_owner', 'created_at', 'updated_at']

    def get_full_path(self, obj) -> str:
        return obj.get_full_path()

    def get_exam_count(self, obj) -> int:
        return obj.exams.count()

    def get_children_count(self, obj) -> int:
        return obj.children.count()

    def get_is_owner(self, obj) -> bool:
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return False
        return obj.creator == request.user or request.user.is_superuser

class QuestionOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuestionOption
        fields = ['id', 'label', 'content', 'code_snippet', 'is_correct', 'order_index', 'explanation']

class QuestionSerializer(serializers.ModelSerializer):
    options = QuestionOptionSerializer(many=True, required=False)

    class Meta:
        model = Question
        fields = [
            'id', 'exam', 'part_type', 'branch', 'order_index', 'point',
            'content', 'code_snippet', 'code_language',
            'competency_category', 'difficulty_level', 'explanation', 'options'
        ]

    def create(self, validated_data):
        options_data = validated_data.pop('options', [])
        question = Question.objects.create(**validated_data)
        for opt_data in options_data:
            QuestionOption.objects.create(question=question, **opt_data)
        return question

    def update(self, instance, validated_data):
        options_data = validated_data.pop('options', None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()

        if options_data is not None:
            instance.options.all().delete()
            for opt_data in options_data:
                QuestionOption.objects.create(question=instance, **opt_data)
        return instance

class ExamSerializer(serializers.ModelSerializer):
    questions_count = serializers.SerializerMethodField()
    creator_name = serializers.ReadOnlyField(source='creator.full_name')
    exam_type_display = serializers.CharField(source='get_exam_type_display', read_only=True)
    is_owner = serializers.SerializerMethodField()
    is_shared = serializers.SerializerMethodField()
    shared_teachers_count = serializers.SerializerMethodField()
    folder_name = serializers.ReadOnlyField(source='folder.name')
    folder_color = serializers.ReadOnlyField(source='folder.color')
    folder_path = serializers.SerializerMethodField()

    class Meta:
        model = Exam
        fields = [
            'id', 'title', 'description', 'folder', 'folder_name', 'folder_path', 'folder_color',
            'exam_type', 'exam_type_display',
            'creator', 'creator_name', 'is_owner', 'is_shared',
            'is_shared_with_all_teachers', 'shared_teachers_count',
            'duration_minutes', 'access_type', 'access_code', 'allowed_classes',
            'is_active', 'is_assigned', 'assigned_classes', 'assigned_start_time',
            'assigned_end_time', 'max_attempts', 'allow_run_code', 'show_score_after_test', 'show_explanation_after_test',
            'branch_mode',
            'max_tab_violations', 'shuffle_questions', 'shuffle_options',
            'part1_total_points', 'part2_total_points', 'total_points',
            'part1_point_per_question', 'matrix_preset', 'part2_matrix_rules',
            'questions_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'creator', 'creator_name', 'is_owner', 'is_shared', 'shared_teachers_count', 'created_at', 'updated_at']

    def get_folder_path(self, obj) -> str:
        return obj.folder.get_full_path() if obj.folder else ''

    def get_is_owner(self, obj) -> bool:
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return False
        return obj.creator == request.user or request.user.is_superuser

    def get_is_shared(self, obj) -> bool:
        request = self.context.get('request')
        if not request or not request.user or not request.user.is_authenticated:
            return False
        if obj.creator == request.user:
            return False
        return obj.is_shared_with_all_teachers or obj.shared_teachers.filter(id=request.user.id).exists()

    def get_shared_teachers_count(self, obj) -> int:
        return obj.shared_teachers.count()

    def get_questions_count(self, obj):
        return {
            'total': obj.questions.count(),
            'part1': obj.questions.filter(part_type=Question.PartType.PART_I).count(),
            'part2_cs': obj.questions.filter(part_type=Question.PartType.PART_II, branch=Question.Branch.CS).count(),
            'part2_ict': obj.questions.filter(part_type=Question.PartType.PART_II, branch=Question.Branch.ICT).count(),
        }

class ExamDetailWithQuestionsSerializer(ExamSerializer):
    questions = QuestionSerializer(many=True, read_only=True)

    class Meta(ExamSerializer.Meta):
        fields = ExamSerializer.Meta.fields + ['questions']


from .models import UserAISetting

class UserAISettingSerializer(serializers.ModelSerializer):
    has_api_key = serializers.SerializerMethodField()
    masked_api_key = serializers.SerializerMethodField()

    class Meta:
        model = UserAISetting
        fields = [
            'provider', 'model', 'base_url', 'auto_explain',
            'share_with_teachers', 'use_shared_admin_api',
            'has_api_key', 'masked_api_key', 'updated_at'
        ]

    def get_has_api_key(self, obj) -> bool:
        return bool(obj.api_key and obj.api_key.strip())

    def get_masked_api_key(self, obj) -> str:
        return obj.get_masked_api_key()


class QuestionFeedbackSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    student_class = serializers.CharField(source='student.class_name', read_only=True)
    exam_title = serializers.CharField(source='exam.title', read_only=True)
    question_content = serializers.CharField(source='question.content', read_only=True)
    question_order_index = serializers.IntegerField(source='question.order_index', read_only=True)
    question_part = serializers.CharField(source='question.part_type', read_only=True)
    question_branch = serializers.CharField(source='question.branch', read_only=True)
    feedback_type_display = serializers.CharField(source='get_feedback_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    reviewer_name = serializers.CharField(source='reviewed_by.full_name', read_only=True)

    class Meta:
        model = QuestionFeedback
        fields = [
            'id', 'student', 'student_name', 'student_class',
            'exam', 'exam_title', 'question', 'question_content',
            'question_order_index', 'question_part', 'question_branch',
            'session_id', 'feedback_type', 'feedback_type_display',
            'student_note', 'suggested_option', 'status', 'status_display',
            'teacher_reply', 'reviewed_by', 'reviewer_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'student', 'reviewed_by', 'created_at', 'updated_at']


# ========================================================================
# CA THI (EXAM SITTING) SERIALIZERS
# ========================================================================

class SittingAssignmentSerializer(serializers.ModelSerializer):
    student_name = serializers.ReadOnlyField(source='student.full_name')
    student_class = serializers.ReadOnlyField(source='student.class_name')
    student_id_code = serializers.ReadOnlyField(source='student.student_id')
    exam_title = serializers.ReadOnlyField(source='exam.title')

    class Meta:
        model = SittingAssignment
        fields = [
            'id', 'sitting', 'student', 'student_name',
            'student_class', 'student_id_code',
            'exam', 'exam_title', 'assigned_at'
        ]


class ExamSittingSerializer(serializers.ModelSerializer):
    creator_name = serializers.ReadOnlyField(source='creator.full_name')
    exams_count = serializers.SerializerMethodField()
    exams_detail = serializers.SerializerMethodField()
    total_students = serializers.SerializerMethodField()
    exam_ids = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False
    )

    class Meta:
        model = ExamSitting
        fields = [
            'id', 'name', 'description', 'room_code', 'password',
            'creator', 'creator_name', 'assigned_classes',
            'start_time', 'end_time', 'max_attempts', 'allow_run_code',
            'distribution_mode', 'is_active',
            'show_score_after_test', 'show_explanation_after_test',
            'exams_count', 'exams_detail', 'total_students',
            'exam_ids',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'creator', 'room_code', 'created_at', 'updated_at']

    def get_exams_count(self, obj):
        return obj.exams.count()

    def get_exams_detail(self, obj):
        return [
            {
                'id': e.id,
                'title': e.title,
                'questions_count': e.questions.count(),
                'duration_minutes': e.duration_minutes,
            }
            for e in obj.exams.all()
        ]

    def get_total_students(self, obj):
        return obj.assignments.count()

    def create(self, validated_data):
        exam_ids = validated_data.pop('exam_ids', [])
        sitting = ExamSitting.objects.create(**validated_data)
        if exam_ids:
            exams = Exam.objects.filter(id__in=exam_ids)
            sitting.exams.set(exams)
        return sitting

    def update(self, instance, validated_data):
        exam_ids = validated_data.pop('exam_ids', None)
        for attr, val in validated_data.items():
            setattr(instance, attr, val)
        instance.save()
        if exam_ids is not None:
            exams = Exam.objects.filter(id__in=exam_ids)
            instance.exams.set(exams)
        return instance
