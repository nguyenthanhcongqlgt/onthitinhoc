import random
from typing import Dict, List, Any
from .models import Exam, Question, QuestionOption

class ExamSecurityService:
    @staticmethod
    def shuffle_list_with_seed(items: list, seed_val: int) -> list:
        """Fisher-Yates shuffle with deterministic seed per student session"""
        shuffled = list(items)
        rng = random.Random(seed_val)
        n = len(shuffled)
        for i in range(n - 1, 0, -1):
            j = rng.randint(0, i)
            shuffled[i], shuffled[j] = shuffled[j], shuffled[i]
        return shuffled

    @classmethod
    def prepare_exam_payload_for_student(cls, exam: Exam, session_id: int, user_id: int) -> Dict[str, Any]:
        """
        Builds a safe, zero-trust exam payload for the student:
        - Drops is_correct and explanation
        - Applies Fisher-Yates shuffle if exam has shuffle_questions or shuffle_options enabled
        - Groups questions by Part I, Part II Common, Part II CS, Part II ICT
        """
        seed_base = (session_id * 10007) + (user_id * 37)

        # Get all questions
        all_questions = list(exam.questions.prefetch_related('options').all())

        part1_questions = [q for q in all_questions if q.part_type == Question.PartType.PART_I]
        part2_common_questions = [q for q in all_questions if q.part_type == Question.PartType.PART_II and q.branch == Question.Branch.COMMON]
        part2_cs_questions = [q for q in all_questions if q.part_type == Question.PartType.PART_II and q.branch == Question.Branch.CS]
        part2_ict_questions = [q for q in all_questions if q.part_type == Question.PartType.PART_II and q.branch == Question.Branch.ICT]

        if exam.shuffle_questions:
            part1_questions = cls.shuffle_list_with_seed(part1_questions, seed_base + 1)
            part2_common_questions = cls.shuffle_list_with_seed(part2_common_questions, seed_base + 2)
            part2_cs_questions = cls.shuffle_list_with_seed(part2_cs_questions, seed_base + 3)
            part2_ict_questions = cls.shuffle_list_with_seed(part2_ict_questions, seed_base + 4)

        def serialize_question(q: Question, q_number: int, seed_offset: int) -> Dict[str, Any]:
            options = list(q.options.all())
            if exam.shuffle_options:
                options = cls.shuffle_list_with_seed(options, seed_base + seed_offset + q.id)
            
            # Format labels: for Part 1: A, B, C, D; for Part 2: a, b, c, d
            labels_p1 = ['A', 'B', 'C', 'D', 'E', 'F']
            labels_p2 = ['a', 'b', 'c', 'd', 'e', 'f']
            chosen_labels = labels_p1 if q.part_type == Question.PartType.PART_I else labels_p2

            serialized_options = []
            for opt_idx, opt in enumerate(options):
                display_label = chosen_labels[opt_idx] if opt_idx < len(chosen_labels) else opt.label
                serialized_options.append({
                    'id': opt.id,
                    'display_label': display_label,
                    'content': opt.content,
                    'code_snippet': opt.code_snippet,
                    # NOTE: is_correct is intentionally excluded for Zero-Trust!
                })

            return {
                'id': q.id,
                'display_number': q_number,
                'part_type': q.part_type,
                'branch': q.branch,
                'point': float(q.point) if q.point is not None else (0.50 if q.part_type == Question.PartType.PART_I else 2.00),  # L3: 0 is falsy, dùng is not None
                'content': q.content,
                'code_snippet': q.code_snippet,
                'code_language': q.code_language,
                'competency_category': q.competency_category,
                'difficulty_level': q.difficulty_level,
                'options': serialized_options
            }

        serialized_part1 = [
            serialize_question(q, idx + 1, 100)
            for idx, q in enumerate(part1_questions)
        ]
        serialized_part2_common = [
            serialize_question(q, idx + 1, 150)
            for idx, q in enumerate(part2_common_questions)
        ]

        p2_branch_start_num = len(serialized_part2_common) + 1
        serialized_part2_cs = [
            serialize_question(q, p2_branch_start_num + idx, 200)
            for idx, q in enumerate(part2_cs_questions)
        ]

        if exam.branch_mode == Exam.BranchMode.BOTH:
            p2_ict_start_num = p2_branch_start_num + len(serialized_part2_cs)
            serialized_part2_ict = [
                serialize_question(q, p2_ict_start_num + idx, 300)
                for idx, q in enumerate(part2_ict_questions)
            ]
        else:
            serialized_part2_ict = [
                serialize_question(q, p2_branch_start_num + idx, 300)
                for idx, q in enumerate(part2_ict_questions)
            ]

        return {
            'exam': {
                'id': exam.id,
                'title': exam.title,
                'description': exam.description,
                'duration_minutes': exam.duration_minutes,
                'branch_mode': exam.branch_mode,
                'max_tab_violations': exam.max_tab_violations,
                'part1_total_points': float(exam.part1_total_points),
                'part2_total_points': float(exam.part2_total_points),
                'total_points': float(exam.total_points),
                'part1_point_per_question': float(exam.part1_point_per_question),
                'matrix_preset': exam.matrix_preset,
                'part2_matrix_rules': exam.part2_matrix_rules,
            },
            'part1_questions': serialized_part1,
            'part2_common_questions': serialized_part2_common,
            'part2_branches': {
                'CS': serialized_part2_cs,
                'ICT': serialized_part2_ict
            }
        }
