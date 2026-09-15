from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .models import QuestionCategory, BankQuestion, BankQuestionOption, Exam, Question, QuestionOption
from .bank_serializers import QuestionCategorySerializer, BankQuestionSerializer

User = get_user_model()


class IsTeacherOrAdmin(permissions.BasePermission):
    """Chỉ cho phép Teacher/Admin truy cập (chặn Student hoàn toàn)."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.is_superuser or request.user.role in [User.Role.ADMIN, User.Role.TEACHER]


class QuestionCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = QuestionCategorySerializer
    permission_classes = [IsTeacherOrAdmin]  # C3: Chặn student truy cập ngân hàng

    def get_queryset(self):
        return QuestionCategory.objects.all()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class BankQuestionViewSet(viewsets.ModelViewSet):
    serializer_class = BankQuestionSerializer
    permission_classes = [IsTeacherOrAdmin]  # C3: Chặn student truy cập ngân hàng
    filterset_fields = ['category', 'part_type', 'branch', 'competency_category', 'difficulty_level']
    search_fields = ['content']

    def get_queryset(self):
        return BankQuestion.objects.all()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=['post'])
    def clone_to_exam(self, request, pk=None):
        bank_question = self.get_object()
        exam_id = request.data.get('exam_id')
        
        try:
            exam = Exam.objects.get(id=exam_id)
        except Exam.DoesNotExist:
            return Response({'detail': 'Exam not found'}, status=status.HTTP_404_NOT_FOUND)

        # H4: Kiểm tra quyền sở hữu đề thi đích
        if exam.creator != request.user and request.user.role != User.Role.ADMIN and not request.user.is_superuser:
            return Response({'detail': 'Bạn không có quyền chỉnh sửa đề thi này.'}, status=status.HTTP_403_FORBIDDEN)
            
        # Determine order index
        last_question = exam.questions.order_by('order_index').last()
        next_order = last_question.order_index + 1 if last_question else 1
        
        # Default point
        point = exam.part1_point_per_question if bank_question.part_type == 'PART_I' else 1.0

        # Clone Question
        new_q = Question.objects.create(
            exam=exam,
            part_type=bank_question.part_type,
            branch=bank_question.branch,
            order_index=next_order,
            point=point,
            content=bank_question.content,
            code_snippet=bank_question.code_snippet,
            code_language=bank_question.code_language,
            competency_category=bank_question.competency_category,
            difficulty_level=bank_question.difficulty_level,
            explanation=bank_question.explanation
        )
        
        # Clone Options
        for opt in bank_question.options.all():
            QuestionOption.objects.create(
                question=new_q,
                label=opt.label,
                content=opt.content,
                code_snippet=opt.code_snippet,
                is_correct=opt.is_correct,
                order_index=opt.order_index,
                explanation=opt.explanation
            )
            
        return Response({'detail': 'Cloned successfully', 'new_question_id': new_q.id}, status=status.HTTP_201_CREATED)
