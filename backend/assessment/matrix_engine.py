from decimal import Decimal
from typing import Dict, Any, List, Optional
from exams.models import Exam, Question, QuestionOption
from .models import ExamSession, StudentAnswer

class ScoringMatrixEngine:
    @classmethod
    def calculate_part2_question_score(
        cls,
        correct_subitems_count: int,
        matrix_rules: dict,
        question_point: Optional[Decimal] = None,
        matrix_preset: str = 'HSG_QUAT_LAM'
    ) -> Decimal:
        """
        Calculates Part II score based on number of correct sub-items (k) and individual question point.
        If question_point is provided (> 0), scales score proportionally based on preset or matrix rules.
        """
        if correct_subitems_count <= 0:
            return Decimal('0.00')

        if question_point is not None and question_point > 0:
            if correct_subitems_count >= 4:
                return question_point

            # Proportions for 1, 2, 3 correct sub-items
            if matrix_preset in ['HSG_NINHBINH', 'HSG_QUAT_LAM']:
                # 1 ý: 0.3đ, 2 ý: 0.6đ, 3 ý: 1.0đ, 4 ý: 1.6đ (Tối đa 1.6đ)
                # Tỷ lệ: 0.3 / 1.6 = 0.1875, 0.6 / 1.6 = 0.375, 1.0 / 1.6 = 0.625
                ratios = {
                    1: Decimal('0.30') / Decimal('1.60'),
                    2: Decimal('0.60') / Decimal('1.60'),
                    3: Decimal('1.00') / Decimal('1.60')
                }
            elif matrix_preset == 'BGD_2025':
                # 1 ý: 0.10đ, 2 ý: 0.25đ, 3 ý: 0.50đ, 4 ý: 1.00đ (Tối đa 1.0đ)
                # 0.1 / 1.0 = 0.10, 0.25 / 1.0 = 0.25, 0.5 / 1.0 = 0.50
                ratios = {
                    1: Decimal('0.10'),
                    2: Decimal('0.25'),
                    3: Decimal('0.50')
                }
            elif matrix_preset == 'LINEAR_EQUAL':
                ratios = {
                    1: Decimal('0.25'),
                    2: Decimal('0.50'),
                    3: Decimal('0.75')
                }
            else:
                # Custom matrix proportion relative to 4 correct items
                v4 = Decimal(str(matrix_rules.get("4", 1.6))) if matrix_rules else Decimal('1.6')
                vk = Decimal(str(matrix_rules.get(str(correct_subitems_count), 0.0))) if matrix_rules else Decimal('0.0')
                ratio = vk / v4 if v4 > 0 else Decimal('0.0')
                return Decimal(str(round(float(question_point * ratio), 2)))

            ratio = ratios.get(correct_subitems_count, Decimal('0.00'))
            return Decimal(str(round(float(question_point * ratio), 2)))

        # Fallback to direct matrix lookup if no question_point given
        k_str = str(correct_subitems_count)
        if matrix_rules and k_str in matrix_rules:
            return Decimal(str(matrix_rules[k_str]))
        
        fallback_matrix = {
            1: Decimal('0.30'),
            2: Decimal('0.60'),
            3: Decimal('1.00'),
            4: Decimal('1.60')
        }
        return fallback_matrix.get(correct_subitems_count, Decimal('0.00'))

    @classmethod
    def grade_exam_session(
        cls,
        session: ExamSession,
        part1_submissions: List[Dict[str, Any]],
        part2_submissions: List[Dict[str, Any]],
        selected_branch: str
    ) -> Dict[str, Any]:
        """
        Grades the whole exam session and updates database:
        - Locks branch choice
        - Grades Part 1 based on individual question points
        - Grades Part 2 based on question points and matrix proportions
        - Computes competency breakdown for Radar chart
        """
        exam = session.exam
        session.selected_branch = selected_branch

        part1_score = Decimal('0.00')
        part2_score = Decimal('0.00')
        part1_correct_count = 0
        part2_correct_subitems_total = 0

        # Map questions for fast lookup
        questions_map = {q.id: q for q in exam.questions.prefetch_related('options').all()}

        # Competency tracking: {category: {'earned': Decimal, 'max': Decimal}}
        competency_tracker = {
            cat.value: {'earned': Decimal('0.00'), 'max': Decimal('0.00')}
            for cat in Question.CompetencyCategory
        }

        # 1. GRADE PART 1 (Trắc nghiệm nhiều lựa chọn)
        default_part1_point = Decimal(str(exam.part1_point_per_question))

        for p1_item in part1_submissions:
            q_id = p1_item.get('question_id')
            opt_id = p1_item.get('selected_option_id')
            
            if q_id not in questions_map:
                continue

            question = questions_map[q_id]
            if question.part_type != Question.PartType.PART_I:
                continue

            q_point = Decimal(str(question.point)) if question.point and question.point > 0 else default_part1_point

            cat = question.competency_category
            if cat in competency_tracker:
                competency_tracker[cat]['max'] += q_point

            selected_option = None
            is_correct = False
            q_score = Decimal('0.00')

            if opt_id:
                for opt in question.options.all():
                    if str(opt.id) == str(opt_id):  # H1: tránh int != str
                        selected_option = opt
                        if opt.is_correct:
                            is_correct = True
                            q_score = q_point
                            part1_correct_count += 1
                        break

            part1_score += q_score
            if cat in competency_tracker:
                competency_tracker[cat]['earned'] += q_score

            StudentAnswer.objects.update_or_create(
                session=session,
                question=question,
                defaults={
                    'selected_option': selected_option,
                    'selected_option_label': selected_option.label if selected_option else '',
                    'question_order_index': question.order_index,
                    'is_correct': is_correct,
                    'score_awarded': q_score
                }
            )

        # 2. GRADE PART 2 (Đúng / Sai phân hóa CS hoặc ICT)
        matrix_rules = exam.get_effective_matrix_rules()

        for p2_item in part2_submissions:
            q_id = p2_item.get('question_id')
            user_sub_answers = p2_item.get('sub_answers', {})

            if q_id not in questions_map:
                continue

            question = questions_map[q_id]
            # Ensure question belongs to either COMMON branch or the student's selected branch
            if question.part_type != Question.PartType.PART_II:
                continue
            if selected_branch != 'BOTH' and question.branch != Question.Branch.COMMON and question.branch != selected_branch:
                continue

            q_point = Decimal(str(question.point)) if question.point and question.point > 0 else Decimal('2.00')

            # Compute theoretical max for this question (max points if all 4 correct = q_point)
            max_p2_q_score = cls.calculate_part2_question_score(4, matrix_rules, q_point, exam.matrix_preset)
            cat = question.competency_category
            if cat in competency_tracker:
                competency_tracker[cat]['max'] += max_p2_q_score

            correct_subitems = 0
            for opt in question.options.all():
                opt_key_str = str(opt.id)
                if opt_key_str in user_sub_answers:
                    user_val = bool(user_sub_answers[opt_key_str])
                    if user_val == opt.is_correct:
                        correct_subitems += 1
                elif opt.label.lower() in user_sub_answers:
                    user_val = bool(user_sub_answers[opt.label.lower()])
                    if user_val == opt.is_correct:
                        correct_subitems += 1

            q_score = cls.calculate_part2_question_score(correct_subitems, matrix_rules, q_point, exam.matrix_preset)
            part2_score += q_score
            part2_correct_subitems_total += correct_subitems

            if cat in competency_tracker:
                competency_tracker[cat]['earned'] += q_score

            StudentAnswer.objects.update_or_create(
                session=session,
                question=question,
                defaults={
                    'part2_answers': user_sub_answers,
                    'question_order_index': question.order_index,
                    'correct_subitems_count': correct_subitems,
                    'score_awarded': q_score
                }
            )

        total_score = part1_score + part2_score

        # 3. Calculate competency radar score percentages
        competency_scores = {}
        for cat_key, data in competency_tracker.items():
            if data['max'] > 0:
                pct = round(float((data['earned'] / data['max']) * 100), 1)
            else:
                pct = 0.0
            competency_scores[cat_key] = {
                'earned': float(data['earned']),
                'max': float(data['max']),
                'percentage': pct
            }

        session.part1_score = part1_score
        session.part2_score = part2_score
        session.total_score = total_score
        session.part1_correct_count = part1_correct_count
        session.part2_correct_subitems_count = part2_correct_subitems_total
        session.competency_scores = competency_scores
        session.save()

        return {
            'total_score': float(total_score),
            'part1_score': float(part1_score),
            'part2_score': float(part2_score),
            'part1_correct_count': part1_correct_count,
            'part2_correct_subitems_count': part2_correct_subitems_total,
            'matrix_preset_applied': exam.matrix_preset,
            'matrix_rules_applied': matrix_rules,
            'competency_scores': competency_scores
        }

    @classmethod
    def simulate_matrix_grading(
        cls,
        exam: Exam,
        part1_submissions: List[Dict[str, Any]],
        part2_submissions: List[Dict[str, Any]],
        selected_branch: str,
        custom_matrix: Optional[dict] = None
    ) -> Dict[str, Any]:
        """
        Simulates grading without modifying database state:
        Useful for Teachers previewing score distributions and matrix tuning.
        """
        matrix_rules = custom_matrix or exam.get_effective_matrix_rules()
        questions_map = {q.id: q for q in exam.questions.prefetch_related('options').all()}

        part1_score = Decimal('0.00')
        part2_score = Decimal('0.00')
        part1_correct_count = 0
        part2_correct_subitems_total = 0
        default_part1_point = Decimal(str(exam.part1_point_per_question))

        detailed_results = {
            'part1': [],
            'part2': []
        }

        # Part 1 Simulation
        for p1_item in part1_submissions:
            q_id = p1_item.get('question_id')
            opt_id = p1_item.get('selected_option_id')
            if q_id not in questions_map: continue
            q = questions_map[q_id]
            if q.part_type != Question.PartType.PART_I: continue

            q_point = Decimal(str(q.point)) if q.point and q.point > 0 else default_part1_point
            is_correct = False
            q_score = Decimal('0.00')
            selected_opt = None
            correct_opt = None

            for opt in q.options.all():
                if opt.is_correct:
                    correct_opt = opt
                if str(opt.id) == str(opt_id):  # H1: tránh int != str
                    selected_opt = opt
                    if opt.is_correct:
                        is_correct = True
                        q_score = q_point
                        part1_correct_count += 1

            part1_score += q_score
            detailed_results['part1'].append({
                'question_id': q.id,
                'is_correct': is_correct,
                'score_awarded': float(q_score),
                'selected_option': selected_opt.label if selected_opt else None,
                'correct_option': correct_opt.label if correct_opt else None
            })

        # Part 2 Simulation
        for p2_item in part2_submissions:
            q_id = p2_item.get('question_id')
            user_sub_answers = p2_item.get('sub_answers', {})
            if q_id not in questions_map: continue
            q = questions_map[q_id]
            if q.part_type != Question.PartType.PART_II: continue
            if selected_branch != 'BOTH' and q.branch != Question.Branch.COMMON and q.branch != selected_branch: continue

            q_point = Decimal(str(q.point)) if q.point and q.point > 0 else Decimal('2.00')
            sub_eval = []
            correct_subitems = 0
            for opt in q.options.all():
                user_val = user_sub_answers.get(str(opt.id))
                is_match = (user_val is not None and bool(user_val) == opt.is_correct)
                if is_match:
                    correct_subitems += 1
                sub_eval.append({
                    'option_id': opt.id,
                    'label': opt.label,
                    'user_value': user_val,
                    'correct_value': opt.is_correct,
                    'is_match': is_match,
                    'explanation': opt.explanation
                })

            q_score = cls.calculate_part2_question_score(correct_subitems, matrix_rules, q_point, exam.matrix_preset)
            part2_score += q_score
            part2_correct_subitems_total += correct_subitems
            detailed_results['part2'].append({
                'question_id': q.id,
                'correct_subitems': correct_subitems,
                'score_awarded': float(q_score),
                'sub_eval': sub_eval
            })

        total_score = part1_score + part2_score

        return {
            'total_score': float(total_score),
            'part1_score': float(part1_score),
            'part2_score': float(part2_score),
            'part1_correct_count': part1_correct_count,
            'part2_correct_subitems_count': part2_correct_subitems_total,
            'matrix_rules_applied': matrix_rules,
            'detailed_results': detailed_results
        }

    @classmethod
    def regrade_all_sessions_for_exam(cls, exam_id: int) -> Dict[str, Any]:
        """
        Re-grades and recalculates scores, competency ratings, and analytics reports
        for ALL completed student sessions when an exam's questions or answer keys are updated.
        """
        exam = Exam.objects.prefetch_related('questions__options').get(id=exam_id)
        sessions = ExamSession.objects.filter(exam=exam).prefetch_related('answers__question__options', 'answers__selected_option')

        matrix_rules = exam.get_effective_matrix_rules()
        default_part1_point = Decimal(str(exam.part1_point_per_question))

        # Index fresh questions by order_index and part_type
        questions_by_order = {}
        for q in exam.questions.all():
            key = (q.part_type, q.order_index, q.branch)
            questions_by_order[key] = q
            questions_by_order[q.id] = q

        regraded_sessions_count = 0
        score_changes = []

        for session in sessions:
            old_total = session.total_score
            part1_score = Decimal('0.00')
            part2_score = Decimal('0.00')
            part1_correct_count = 0
            part2_correct_subitems_total = 0

            competency_tracker = {
                cat.value: {'earned': Decimal('0.00'), 'max': Decimal('0.00')}
                for cat in Question.CompetencyCategory
            }

            for ans in session.answers.all():
                q = ans.question
                if q.id in questions_by_order:
                    fresh_q = questions_by_order[q.id]
                else:
                    lookup_key = (q.part_type, ans.question_order_index or q.order_index, q.branch)
                    fresh_q = questions_by_order.get(lookup_key, q)

                cat = fresh_q.competency_category

                if fresh_q.part_type == Question.PartType.PART_I:
                    q_point = Decimal(str(fresh_q.point)) if fresh_q.point and fresh_q.point > 0 else default_part1_point

                    if cat in competency_tracker:
                        competency_tracker[cat]['max'] += q_point

                    is_correct = False
                    q_score = Decimal('0.00')
                    matching_opt = None

                    chosen_label = ans.selected_option_label or (ans.selected_option.label if ans.selected_option else '')
                    chosen_opt_id = ans.selected_option_id

                    for opt in fresh_q.options.all():
                        if (chosen_opt_id and opt.id == chosen_opt_id) or (chosen_label and opt.label.upper() == chosen_label.upper()):
                            matching_opt = opt
                            if opt.is_correct:
                                is_correct = True
                                q_score = q_point
                                part1_correct_count += 1
                            break

                    part1_score += q_score
                    if cat in competency_tracker:
                        competency_tracker[cat]['earned'] += q_score

                    ans.question = fresh_q
                    if matching_opt:
                        ans.selected_option = matching_opt
                    ans.is_correct = is_correct
                    ans.score_awarded = q_score
                    ans.save()

                elif fresh_q.part_type == Question.PartType.PART_II:
                    if fresh_q.branch == Question.Branch.COMMON or session.selected_branch == 'BOTH' or fresh_q.branch == session.selected_branch:
                        q_point = Decimal(str(fresh_q.point)) if fresh_q.point and fresh_q.point > 0 else Decimal('2.00')
                        max_p2_q_score = cls.calculate_part2_question_score(4, matrix_rules, q_point, exam.matrix_preset)
                        if cat in competency_tracker:
                            competency_tracker[cat]['max'] += max_p2_q_score

                        correct_subitems = 0
                        user_sub_answers = ans.part2_answers or {}

                        for opt in fresh_q.options.all():
                            user_val = None
                            opt_id_str = str(opt.id)
                            opt_label_lower = opt.label.lower()

                            if opt_id_str in user_sub_answers:
                                user_val = bool(user_sub_answers[opt_id_str])
                            elif opt_label_lower in user_sub_answers:
                                user_val = bool(user_sub_answers[opt_label_lower])

                            if user_val is not None:
                                if user_val == opt.is_correct:
                                    correct_subitems += 1

                        q_score = cls.calculate_part2_question_score(correct_subitems, matrix_rules, q_point, exam.matrix_preset)
                        part2_score += q_score
                        part2_correct_subitems_total += correct_subitems

                        if cat in competency_tracker:
                            competency_tracker[cat]['earned'] += q_score

                        ans.question = fresh_q
                        ans.correct_subitems_count = correct_subitems
                        ans.score_awarded = q_score
                        ans.save()

            total_score = part1_score + part2_score

            competency_scores = {}
            for cat_key, data in competency_tracker.items():
                if data['max'] > 0:
                    pct = round(float((data['earned'] / data['max']) * 100), 1)
                else:
                    pct = 0.0
                competency_scores[cat_key] = {
                    'earned': float(data['earned']),
                    'max': float(data['max']),
                    'percentage': pct
                }

            session.part1_score = part1_score
            session.part2_score = part2_score
            session.total_score = total_score
            session.part1_correct_count = part1_correct_count
            session.part2_correct_subitems_count = part2_correct_subitems_total
            session.competency_scores = competency_scores
            session.save()

            regraded_sessions_count += 1
            if old_total != total_score:
                score_changes.append({
                    'session_id': session.id,
                    'student_name': session.student.full_name or session.student.username,
                    'student_class': session.student.class_name or 'Học sinh',
                    'old_score': float(old_total),
                    'new_score': float(total_score),
                    'diff': round(float(total_score - old_total), 2)
                })

        return {
            'exam_id': exam.id,
            'exam_title': exam.title,
            'regraded_sessions_count': regraded_sessions_count,
            'score_changed_count': len(score_changes),
            'score_changes': score_changes
        }

