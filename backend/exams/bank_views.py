from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .models import QuestionCategory, BankQuestion, BankQuestionOption, Exam, Question, QuestionOption
from .bank_serializers import QuestionCategorySerializer, BankQuestionSerializer
from rest_framework.views import APIView
import random
import string

User = get_user_model()


class IsTeacherOrAdmin(permissions.BasePermission):
    """Chỉ cho phép Teacher/Admin truy cập (chặn Student hoàn toàn)."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.is_superuser or request.user.role in [User.Role.ADMIN, User.Role.TEACHER]


class QuestionCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = QuestionCategorySerializer
    permission_classes = [IsTeacherOrAdmin]

    def get_queryset(self):
        return QuestionCategory.objects.all()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class BankQuestionViewSet(viewsets.ModelViewSet):
    serializer_class = BankQuestionSerializer
    permission_classes = [IsTeacherOrAdmin]
    filterset_fields = ['category', 'part_type', 'branch', 'competency_category', 'difficulty_level']
    search_fields = ['content']

    def get_queryset(self):
        return BankQuestion.objects.all()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['post'])
    def ai_save(self, request):
        q_data = request.data
        options_data = q_data.get('options', [])
        
        options_text = []
        for opt in options_data:
            options_text.append(f"{opt.get('label', '')}: {opt.get('content', '')} ({'Đúng' if opt.get('is_correct') else 'Sai'})")
            
        from .ai_solver import AISolverEngine
        from .models import UserAISetting, BankQuestionOption
        
        try:
            ai_setting = UserAISetting.objects.get(user=request.user)
            ai_result = AISolverEngine.classify_question(
                provider=ai_setting.provider,
                api_key=ai_setting.get_api_key(),
                model=ai_setting.model,
                base_url=ai_setting.base_url,
                question_text=q_data.get('content', ''),
                options=options_text
            )
            comp_cat = ai_result['competency_category']
            diff_level = ai_result['difficulty_level']
        except UserAISetting.DoesNotExist:
            comp_cat = q_data.get('competency_category', 'PROG_BASIC')
            diff_level = q_data.get('difficulty_level', 'TH')
            
        bank_q = BankQuestion.objects.create(
            created_by=request.user,
            part_type=q_data.get('part_type') or 'PART_I',
            branch=q_data.get('branch') or 'COMMON',
            content=q_data.get('content') or '',
            code_snippet=q_data.get('code_snippet') or '',
            code_language=q_data.get('code_language') or 'python',
            competency_category=comp_cat,
            difficulty_level=diff_level,
            explanation=q_data.get('explanation') or ''
        )
        
        for opt in options_data:
            BankQuestionOption.objects.create(
                bank_question=bank_q,
                label=opt.get('label') or '',
                content=opt.get('content') or '',
                code_snippet=opt.get('code_snippet') or '',
                is_correct=bool(opt.get('is_correct')),
                order_index=opt.get('order_index') or 1,
                explanation=opt.get('explanation') or ''
            )
            
        return Response({
            "message": f"Đã lưu vào Ngân hàng! AI nhận diện: {bank_q.get_competency_category_display()} - Mức {bank_q.get_difficulty_level_display()}.",
            "bank_question_id": bank_q.id,
            "competency_category": comp_cat,
            "difficulty_level": diff_level
        })

    @action(detail=True, methods=['post'])
    def clone_to_exam(self, request, pk=None):
        bank_question = self.get_object()
        exam_id = request.data.get('exam_id')
        
        try:
            exam = Exam.objects.get(id=exam_id)
        except Exam.DoesNotExist:
            return Response({'detail': 'Exam not found'}, status=status.HTTP_404_NOT_FOUND)

        if exam.creator != request.user and request.user.role != User.Role.ADMIN and not request.user.is_superuser:
            return Response({'detail': 'Bạn không có quyền chỉnh sửa đề thi này.'}, status=status.HTTP_403_FORBIDDEN)
            
        last_question = exam.questions.order_by('order_index').last()
        next_order = last_question.order_index + 1 if last_question else 1
        
        point = exam.part1_point_per_question if bank_question.part_type == 'PART_I' else 1.0

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

class AutoGenerateExamView(APIView):
    permission_classes = [IsTeacherOrAdmin]

    def post(self, request, *args, **kwargs):
        base_title = request.data.get('base_title')
        folder_id = request.data.get('folder_id')
        num_exams = int(request.data.get('num_exams', 1))
        matrix = request.data.get('matrix', [])

        if not base_title or not matrix:
            return Response({'detail': 'Thiếu tham số base_title hoặc matrix'}, status=status.HTTP_400_BAD_REQUEST)

        from .models import ExamFolder
        folder = None
        if folder_id:
            try:
                folder = ExamFolder.objects.get(id=folder_id)
            except ExamFolder.DoesNotExist:
                pass

        rule_querysets = []
        for rule in matrix:
            competency_category = rule.get('competency_category')
            difficulty_level = rule.get('difficulty_level')
            part_type = rule.get('part_type')
            count = int(rule.get('count', 0))
            
            qs = BankQuestion.objects.prefetch_related('options').filter(
                competency_category=competency_category,
                difficulty_level=difficulty_level,
                part_type=part_type
            )
            total = qs.count()
            if total < count:
                return Response(
                    {'detail': f'Không đủ câu hỏi cho {competency_category} - {difficulty_level} - {part_type}. Yêu cầu {count}, hiện có {total}.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            rule_querysets.append({
                'rule': rule,
                'qs_list': list(qs),
                'count': count
            })

        created_exams = []

        for _ in range(num_exams):
            random_code = ''.join(random.choices(string.digits, k=3))
            exam_title = f"{base_title} - Mã đề {random_code}"
            
            exam = Exam.objects.create(
                title=exam_title,
                folder=folder,
                creator=request.user
            )
            
            order_idx = 1
            for rule_data in rule_querysets:
                count = rule_data['count']
                qs_list = rule_data['qs_list']
                
                selected_qs = random.sample(qs_list, count)
                
                for bq in selected_qs:
                    point = exam.part1_point_per_question if bq.part_type == 'PART_I' else 1.0

                    new_q = Question.objects.create(
                        exam=exam,
                        part_type=bq.part_type,
                        branch=bq.branch,
                        order_index=order_idx,
                        point=point,
                        content=bq.content,
                        code_snippet=bq.code_snippet,
                        code_language=bq.code_language,
                        competency_category=bq.competency_category,
                        difficulty_level=bq.difficulty_level,
                        explanation=bq.explanation
                    )
                    
                    for opt in bq.options.all():
                        QuestionOption.objects.create(
                            question=new_q,
                            label=opt.label,
                            content=opt.content,
                            code_snippet=opt.code_snippet,
                            is_correct=opt.is_correct,
                            order_index=opt.order_index,
                            explanation=opt.explanation
                        )
                    order_idx += 1
            
            created_exams.append({
                'id': exam.id,
                'title': exam.title
            })

        return Response({'exams': created_exams}, status=status.HTTP_200_OK)
