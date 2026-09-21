from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Count
from .models import BankQuestion, Exam, Question, QuestionOption, QuestionCategory
from authentication.models import User
import random

class MatrixValidationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if not (request.user.role in [User.Role.ADMIN, User.Role.TEACHER] or request.user.is_superuser):
            return Response({'detail': 'Không có quyền truy cập.'}, status=status.HTTP_403_FORBIDDEN)
            
        rules = request.data.get('matrix_rules', [])
        results = []
        for rule in rules:
            cat_id = rule.get('knowledge_unit_id')
            diff_level = rule.get('cognitive_level', 'TH').upper()
            part_type_raw = rule.get('question_type', 'trac-nghiem')
            
            db_part = 'PART_II' if part_type_raw == 'dung-sai' else 'PART_I'
            qs = BankQuestion.objects.filter(difficulty_level=diff_level, part_type=db_part)
            if cat_id and str(cat_id).isdigit():
                qs = qs.filter(category_id=int(cat_id))
                
            results.append({
                'rule': rule,
                'available_count': qs.count()
            })
            
        return Response({'success': True, 'results': results})

class GenerateExamFromMatrixView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if not (request.user.role in [User.Role.ADMIN, User.Role.TEACHER] or request.user.is_superuser):
            return Response({'detail': 'Chỉ Giáo viên/Admin mới được tạo đề.'}, status=status.HTTP_403_FORBIDDEN)

        data = request.data
        test_config = data.get('test_config', {})
        matrix_rules = data.get('matrix_rules', [])

        if not matrix_rules:
            return Response({'detail': 'Ma trận trống (không có rules).'}, status=status.HTTP_400_BAD_REQUEST)

        errors = []
        selected_questions = []

        for idx, rule in enumerate(matrix_rules):
            cat_id = rule.get('knowledge_unit_id')
            diff_level = rule.get('cognitive_level', 'TH').upper()
            part_type = rule.get('question_type', 'trac-nghiem')
            quantity = int(rule.get('quantity', 0))

            if quantity <= 0: continue
            
            db_part = 'PART_II' if part_type == 'dung-sai' else 'PART_I'
            qs = BankQuestion.objects.filter(difficulty_level=diff_level, part_type=db_part)
            
            if cat_id and str(cat_id).isdigit():
                qs = qs.filter(category_id=int(cat_id))

            available_count = qs.count()
            if available_count < quantity:
                cat_name = rule.get('knowledge_unit_name', f'ID={cat_id}')
                errors.append(f'Không đủ câu hỏi cho {cat_name} ({diff_level} - {db_part}). Cần: {quantity}, Có sẵn: {available_count}.')
            else:
                ids = list(qs.values_list('id', flat=True))
                chosen = random.sample(ids, quantity)
                selected_questions.extend(chosen)

        if errors:
            return Response({'success': False, 'errors': errors}, status=status.HTTP_400_BAD_REQUEST)

        bank_qs = BankQuestion.objects.filter(id__in=selected_questions)
        bank_q_map = {q.id: q for q in bank_qs}

        has_part1 = any(q.part_type == 'PART_I' for q in bank_qs)
        has_part2 = any(q.part_type == 'PART_II' for q in bank_qs)
        
        total_score_val = float(test_config.get('total_score', 10.0))
        p1_pts = total_score_val if has_part1 and not has_part2 else (total_score_val * 0.6 if has_part1 else 0.0)
        p2_pts = total_score_val if has_part2 and not has_part1 else (total_score_val * 0.4 if has_part2 else 0.0)

        exam = Exam.objects.create(
            title=test_config.get('name', 'Đề thi tự sinh từ Ma Trận'),
            duration_minutes=test_config.get('total_time_minutes', 45),
            total_points=total_score_val,
            part1_total_points=p1_pts,
            part2_total_points=p2_pts,
            creator=request.user
        )
        order = 1
        for q_id in selected_questions:
            bq = bank_q_map[q_id]
            new_q = Question.objects.create(
                exam=exam, part_type=bq.part_type, branch=bq.branch, order_index=order,
                content=bq.content, code_snippet=bq.code_snippet, code_language=bq.code_language,
                competency_category=bq.competency_category, difficulty_level=bq.difficulty_level,
                explanation=bq.explanation
            )
            order += 1
            opts = bq.options.all()
            for opt in opts:
                QuestionOption.objects.create(
                    question=new_q, label=opt.label, content=opt.content,
                    code_snippet=opt.code_snippet, is_correct=opt.is_correct,
                    order_index=opt.order_index, explanation=opt.explanation
                )

        return Response({
            'success': True,
            'message': f'Tạo đề thành công với {len(selected_questions)} câu hỏi.',
            'exam_id': exam.id
        })
