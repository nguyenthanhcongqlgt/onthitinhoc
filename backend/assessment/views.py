from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.utils import timezone
from authentication.models import User
from exams.models import Exam, Question
from exams.services import ExamSecurityService
from .models import ExamSession, StudentAnswer, ViolationLog
from .matrix_engine import ScoringMatrixEngine
from .serializers import (
    ExamSessionSerializer,
    ExamSessionDetailSerializer,
    ViolationLogSerializer
)

class StartExamSessionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, exam_id):
        exam = get_object_or_404(Exam, id=exam_id, is_active=True)
        student = request.user

        # Logic Giao đề: Phải giao đề thì HS mới được làm
        if student.role == User.Role.STUDENT:
            if not exam.is_assigned:
                return Response({
                    "detail": "Đề thi này đang ở dạng bản nháp trong ngân hàng và chưa được Giáo viên giao. Vui lòng liên hệ Thầy/Cô để được mở đề!",
                }, status=status.HTTP_403_FORBIDDEN)

            now = timezone.now()
            if exam.assigned_start_time and now < exam.assigned_start_time:
                start_str = exam.assigned_start_time.strftime('%H:%M ngày %d/%m/%Y')
                return Response({
                    "detail": f"Chưa đến giờ làm bài! Đề thi sẽ mở lúc {start_str}.",
                    "assigned_start_time": exam.assigned_start_time,
                    "is_not_started_yet": True
                }, status=status.HTTP_403_FORBIDDEN)

            if exam.assigned_end_time and now > exam.assigned_end_time:
                end_str = exam.assigned_end_time.strftime('%H:%M ngày %d/%m/%Y')
                return Response({
                    "detail": f"Đã quá hạn làm bài! Hạn chót nộp bài thi này là {end_str}.",
                    "assigned_end_time": exam.assigned_end_time,
                    "is_expired": True
                }, status=status.HTTP_403_FORBIDDEN)

        # Check existing in-progress session
        session = ExamSession.objects.filter(
            student=student,
            exam=exam,
            status=ExamSession.Status.IN_PROGRESS
        ).first()

        if not session:
            # Check max_attempts limit
            completed_count = ExamSession.objects.filter(
                student=student,
                exam=exam,
                status__in=[ExamSession.Status.SUBMITTED, ExamSession.Status.LOCKED_VIOLATION]
            ).count()

            if completed_count >= exam.max_attempts:
                last_session = ExamSession.objects.filter(
                    student=student, exam=exam,
                    status__in=[ExamSession.Status.SUBMITTED, ExamSession.Status.LOCKED_VIOLATION]
                ).order_by('-submit_time').first()
                return Response({
                    "detail": f"Bạn đã sử dụng hết {exam.max_attempts} lượt làm bài cho đề thi này.",
                    "session_id": last_session.id if last_session else None,
                    "is_completed": True,
                    "attempts_used": completed_count,
                    "max_attempts": exam.max_attempts
                }, status=status.HTTP_400_BAD_REQUEST)

            # Create new session
            session = ExamSession.objects.create(
                student=student,
                exam=exam,
                selected_branch=ExamSession.BranchSelected.BOTH if exam.branch_mode == Exam.BranchMode.BOTH else ExamSession.BranchSelected.NONE,
                status=ExamSession.Status.IN_PROGRESS
            )
        elif exam.branch_mode == Exam.BranchMode.BOTH and session.selected_branch != ExamSession.BranchSelected.BOTH:
            session.selected_branch = ExamSession.BranchSelected.BOTH
            session.save()

        # Prepare secure zero-trust payload
        payload = ExamSecurityService.prepare_exam_payload_for_student(
            exam=exam,
            session_id=session.id,
            user_id=student.id
        )

        return Response({
            'session_id': session.id,
            'start_time': session.start_time,
            'selected_branch': session.selected_branch,
            'violation_count': session.violation_count,
            'max_tab_violations': exam.max_tab_violations,
            'data': payload
        })


class SelectBranchView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, session_id):
        session = get_object_or_404(
            ExamSession,
            id=session_id,
            student=request.user,
            status=ExamSession.Status.IN_PROGRESS
        )

        if session.exam.branch_mode == Exam.BranchMode.BOTH:
            return Response(
                {"detail": "Đề thi này được cấu hình làm cả hai chuyên đề CS và ICT, không cần chọn nhánh riêng."},
                status=status.HTTP_400_BAD_REQUEST
            )

        branch = request.data.get('branch', '').upper()
        if branch not in [Question.Branch.CS, Question.Branch.ICT]:
            return Response(
                {"detail": "Vui lòng chọn nhánh hợp lệ (CS hoặc ICT)."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if session.selected_branch != ExamSession.BranchSelected.NONE and session.selected_branch != branch:
            return Response(
                {"detail": f"Bạn đã chọn và khóa cứng nhánh {session.get_selected_branch_display()}. Không thể thay đổi!"},
                status=status.HTTP_400_BAD_REQUEST
            )

        session.selected_branch = branch
        session.save()
        return Response({
            "message": f"Đã khóa lựa chọn nhánh {session.get_selected_branch_display()} thành công.",
            "selected_branch": session.selected_branch
        })


class LogViolationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, session_id):
        session = get_object_or_404(ExamSession, id=session_id, student=request.user)

        if session.status != ExamSession.Status.IN_PROGRESS:
            return Response({"detail": "Phiên làm bài đã kết thúc hoặc đã bị khóa."}, status=status.HTTP_400_BAD_REQUEST)

        v_type = request.data.get('violation_type', ViolationLog.ViolationType.TAB_SWITCH)
        details = request.data.get('details', '')

        session.violation_count += 1
        v_num = session.violation_count

        # Save violation log
        ViolationLog.objects.create(
            session=session,
            violation_type=v_type,
            violation_number=v_num,
            details=details
        )

        is_auto_locked = False
        if session.violation_count >= session.exam.max_tab_violations:
            session.status = ExamSession.Status.LOCKED_VIOLATION
            session.is_locked = True
            session.lock_reason = f"Vi phạm chuyển tab / cửa sổ quá {session.exam.max_tab_violations} lần quy định."
            session.submit_time = timezone.now()
            session.save()
            is_auto_locked = True

            # Perform auto-grading on whatever was submitted
            part1_submissions = request.data.get('part1_answers', [])
            part2_submissions = request.data.get('part2_answers', [])
            if session.exam.branch_mode == Exam.BranchMode.BOTH or session.selected_branch == ExamSession.BranchSelected.BOTH:
                selected_branch = ExamSession.BranchSelected.BOTH
            else:
                selected_branch = session.selected_branch if session.selected_branch != 'NONE' else Question.Branch.CS
            ScoringMatrixEngine.grade_exam_session(
                session=session,
                part1_submissions=part1_submissions,
                part2_submissions=part2_submissions,
                selected_branch=selected_branch
            )
        else:
            session.save()

        return Response({
            "violation_count": session.violation_count,
            "max_allowed": session.exam.max_tab_violations,
            "is_auto_locked": is_auto_locked,
            "message": f"Cảnh báo vi phạm #{session.violation_count}/{session.exam.max_tab_violations}."
        })


class SubmitExamView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, session_id):
        session = get_object_or_404(ExamSession, id=session_id, student=request.user)

        if session.status in [ExamSession.Status.SUBMITTED, ExamSession.Status.LOCKED_VIOLATION]:
            return Response({"detail": "Bài thi đã được nộp trước đó."}, status=status.HTTP_400_BAD_REQUEST)

        part1_submissions = request.data.get('part1_answers', [])
        part2_submissions = request.data.get('part2_answers', [])
        if session.exam.branch_mode == Exam.BranchMode.BOTH or session.selected_branch == ExamSession.BranchSelected.BOTH:
            selected_branch = ExamSession.BranchSelected.BOTH
        else:
            fallback_branch = session.selected_branch if session.selected_branch != 'NONE' else Question.Branch.CS
            selected_branch = request.data.get('selected_branch', fallback_branch)

        # Grade session
        results = ScoringMatrixEngine.grade_exam_session(
            session=session,
            part1_submissions=part1_submissions,
            part2_submissions=part2_submissions,
            selected_branch=selected_branch
        )

        session.status = ExamSession.Status.SUBMITTED
        session.submit_time = timezone.now()
        session.save()

        return Response({
            "message": "Nộp bài thi thành công!",
            "session_id": session.id,
            "results": results
        })


class ExamSessionListView(generics.ListAPIView):
    serializer_class = ExamSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == User.Role.ADMIN or user.is_superuser:
            qs = ExamSession.objects.all()
        elif user.role == User.Role.TEACHER:
            from django.db.models import Q
            qs = ExamSession.objects.filter(
                Q(exam__creator=user) |
                Q(exam__shared_teachers=user) |
                Q(exam__is_shared_with_all_teachers=True)
            ).distinct()
        else:
            qs = ExamSession.objects.filter(student=user)
        return qs.select_related('student', 'exam')


class ExamSessionDetailView(generics.RetrieveAPIView):
    serializer_class = ExamSessionDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == User.Role.ADMIN or user.is_superuser:
            qs = ExamSession.objects.all()
        elif user.role == User.Role.TEACHER:
            from django.db.models import Q
            qs = ExamSession.objects.filter(
                Q(exam__creator=user) |
                Q(exam__shared_teachers=user) |
                Q(exam__is_shared_with_all_teachers=True)
            ).distinct()
        else:
            qs = ExamSession.objects.filter(student=user)
        return qs.select_related('student', 'exam').prefetch_related(
            'answers__question',
            'answers__selected_option',
            'violations'
        )


class SimulateScoringView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, exam_id):
        if not (request.user.role in [User.Role.ADMIN, User.Role.TEACHER] or request.user.is_superuser):
            return Response({"detail": "Chỉ có Giáo viên hoặc Super Admin mới có quyền mô phỏng chấm điểm."}, status=status.HTTP_403_FORBIDDEN)
        exam = get_object_or_404(Exam, id=exam_id)
        part1_submissions = request.data.get('part1_answers', [])
        part2_submissions = request.data.get('part2_answers', [])
        selected_branch = request.data.get('selected_branch', 'CS')
        custom_matrix = request.data.get('custom_matrix', None)

        sim_results = ScoringMatrixEngine.simulate_matrix_grading(
            exam=exam,
            part1_submissions=part1_submissions,
            part2_submissions=part2_submissions,
            selected_branch=selected_branch,
            custom_matrix=custom_matrix
        )

        return Response({
            "exam_id": exam.id,
            "exam_title": exam.title,
            "selected_branch": selected_branch,
            "simulation": sim_results
        })


class RegradeExamSessionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, exam_id):
        if not (request.user.role in [User.Role.ADMIN, User.Role.TEACHER] or request.user.is_superuser):
            return Response({"detail": "Chỉ có Giáo viên hoặc Super Admin mới có quyền chấm lại bài thi."}, status=status.HTTP_403_FORBIDDEN)

        exam = get_object_or_404(Exam, id=exam_id)
        result = ScoringMatrixEngine.regrade_all_sessions_for_exam(exam.id)

        msg = f"Đã chấm lại thành công {result['regraded_sessions_count']} bài làm của học sinh cho đề thi '{exam.title}'."
        if result['score_changed_count'] > 0:
            msg += f" Có {result['score_changed_count']} học sinh được cập nhật điểm số và bảng phân tích năng lực mới."
        else:
            msg += " Điểm số của các học sinh không thay đổi."

        return Response({
            "message": msg,
            "details": result
        })


class LiveProctorView(APIView):
    """
    Real-time Proctoring API for Teacher/Super Admin.
    Lists candidate progress, status, connection, violations in a live exam room.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, exam_id):
        if not (request.user.role in [User.Role.ADMIN, User.Role.TEACHER] or request.user.is_superuser):
            return Response({"detail": "Chỉ có Giáo viên hoặc Admin mới có quyền giám sát phòng thi."}, status=status.HTTP_403_FORBIDDEN)

        exam = get_object_or_404(Exam, id=exam_id)
        sessions = ExamSession.objects.filter(exam=exam).select_related('student').order_by('-start_time')

        total_part1 = exam.questions.filter(part_type=Question.PartType.PART_I).count()
        total_part2 = exam.questions.filter(part_type=Question.PartType.PART_II).count()
        # For part2 each branch has a set of questions, count questions per branch (or half)
        total_questions = total_part1 + (total_part2 // 2 if total_part2 > 0 else 0)

        candidates = []
        for s in sessions:
            draft = s.draft_answers or {}
            p1_answered = len(draft.get('part1', {}))
            p2_answered = len(draft.get('part2', {}))
            answered_total = p1_answered + p2_answered

            # If already submitted, use recorded answers count
            if s.status == ExamSession.Status.SUBMITTED:
                answered_total = s.answers.count()

            progress_pct = round((answered_total / total_questions * 100), 1) if total_questions > 0 else 0
            if progress_pct > 100:
                progress_pct = 100

            candidates.append({
                "session_id": s.id,
                "student_id": s.student.id,
                "username": s.student.username,
                "full_name": s.student.full_name or s.student.username,
                "class_name": s.student.class_name or 'Chưa phân lớp',
                "school_id": s.student.student_id or s.student.username,
                "status": s.status,
                "status_display": s.get_status_display(),
                "is_locked": s.is_locked,
                "lock_reason": s.lock_reason,
                "violation_count": s.violation_count,
                "max_violations": exam.max_tab_violations,
                "extra_time_minutes": s.extra_time_minutes,
                "start_time": s.start_time,
                "submit_time": s.submit_time,
                "total_score": float(s.total_score) if s.status in [ExamSession.Status.SUBMITTED, ExamSession.Status.LOCKED_VIOLATION] else None,
                "answered_count": answered_total,
                "total_questions": total_questions,
                "progress_percentage": progress_pct,
                "selected_branch": s.selected_branch
            })

        return Response({
            "exam_id": exam.id,
            "exam_title": exam.title,
            "duration_minutes": exam.duration_minutes,
            "total_candidates": len(candidates),
            "in_progress_count": sum(1 for c in candidates if c['status'] == ExamSession.Status.IN_PROGRESS),
            "submitted_count": sum(1 for c in candidates if c['status'] == ExamSession.Status.SUBMITTED),
            "locked_count": sum(1 for c in candidates if c['is_locked']),
            "candidates": candidates
        })


class SessionControlView(APIView):
    """
    Teacher/Super Admin actions: Unlock session, Add Extra Time, Force Submit.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, session_id):
        if not (request.user.role in [User.Role.ADMIN, User.Role.TEACHER] or request.user.is_superuser):
            return Response({"detail": "Không có quyền điều khiển phiên thi."}, status=status.HTTP_403_FORBIDDEN)

        session = get_object_or_404(ExamSession, id=session_id)
        action = request.data.get('action', '').lower()

        if action == 'unlock':
            session.status = ExamSession.Status.IN_PROGRESS
            session.is_locked = False
            session.violation_count = 0
            session.lock_reason = ''
            session.save()
            return Response({
                "message": f"Đã mở khóa phòng thi thành công cho thí sinh {session.student.full_name or session.student.username}.",
                "session_status": session.status,
                "is_locked": False
            })

        elif action == 'add_extra_time':
            minutes = int(request.data.get('minutes', 5))
            session.extra_time_minutes += minutes
            session.save()
            return Response({
                "message": f"Đã cộng thêm {minutes} phút làm bài cho thí sinh {session.student.full_name or session.student.username}.",
                "extra_time_minutes": session.extra_time_minutes
            })

        elif action == 'force_submit':
            draft = session.draft_answers or {}
            p1_dict = draft.get('part1', {})
            p2_dict = draft.get('part2', {})

            part1_submissions = [{'question_id': int(qid), 'selected_option_id': opt_id} for qid, opt_id in p1_dict.items()]
            part2_submissions = [{'question_id': int(qid), 'sub_answers': sub} for qid, sub in p2_dict.items()]
            branch = session.selected_branch if session.selected_branch != 'NONE' else Question.Branch.CS

            results = ScoringMatrixEngine.grade_exam_session(
                session=session,
                part1_submissions=part1_submissions,
                part2_submissions=part2_submissions,
                selected_branch=branch
            )
            session.status = ExamSession.Status.SUBMITTED
            session.submit_time = timezone.now()
            session.save()

            return Response({
                "message": f"Đã cưỡng chế thu bài thành công cho thí sinh {session.student.full_name or session.student.username}. Điểm đạt: {session.total_score}đ.",
                "total_score": float(session.total_score)
            })

        return Response({"detail": "Hành động không hợp lệ. Chọn 'unlock', 'add_extra_time' hoặc 'force_submit'."}, status=status.HTTP_400_BAD_REQUEST)


class AutoSaveDraftView(APIView):
    """
    Student Server-side Auto-Save & Sync Draft API.
    Saves answer progress every 15s to guarantee 0 data loss.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, session_id):
        session = get_object_or_404(ExamSession, id=session_id, student=request.user)
        if session.status != ExamSession.Status.IN_PROGRESS:
            return Response({"detail": "Phiên thi không ở trạng thái làm bài."}, status=status.HTTP_400_BAD_REQUEST)

        draft = request.data.get('draft', {})
        session.draft_answers = draft
        session.save(update_fields=['draft_answers'])

        return Response({
            "status": "saved",
            "saved_at": timezone.now(),
            "extra_time_minutes": session.extra_time_minutes,
            "is_locked": session.is_locked
        })

    def get(self, request, session_id):
        session = get_object_or_404(ExamSession, id=session_id, student=request.user)
        return Response({
            "draft_answers": session.draft_answers or {},
            "extra_time_minutes": session.extra_time_minutes,
            "status": session.status,
            "is_locked": session.is_locked,
            "selected_branch": session.selected_branch
        })


class StudentAnalyticsView(APIView):
    """
    Student Personal Competency Radar & Strengths/Weaknesses Analytics API.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        student = request.user
        sessions = ExamSession.objects.filter(
            student=student,
            status__in=[ExamSession.Status.SUBMITTED, ExamSession.Status.LOCKED_VIOLATION]
        ).select_related('exam').order_by('submit_time')

        if not sessions.exists():
            return Response({
                "total_exams_taken": 0,
                "average_score": 0.0,
                "highest_score": 0.0,
                "score_history": [],
                "radar_scores": {
                    "PROG_BASIC": 0,
                    "ALGO_DS": 0,
                    "OPTIMIZATION": 0,
                    "DB_NETWORK": 0,
                    "MATH_LOGIC": 0
                },
                "strengths": ["Chưa có dữ liệu bài thi"],
                "weaknesses": ["Hãy hoàn thành ít nhất 1 bài thi để hệ thống đánh giá năng lực"],
                "recent_sessions": []
            })

        scores = [float(s.total_score) for s in sessions]
        avg_score = round(sum(scores) / len(scores), 2)
        highest_score = round(max(scores), 2)

        # Aggregate competency scores
        category_sums = {}
        category_counts = {}

        score_history = []
        for s in sessions:
            score_history.append({
                "exam_id": s.exam.id,
                "exam_title": s.exam.title,
                "score": float(s.total_score),
                "submit_time": s.submit_time.strftime('%d/%m/%Y %H:%M') if s.submit_time else ''
            })

            comp = s.competency_scores or {}
            for cat, val in comp.items():
                if isinstance(val, dict):
                    pct = float(val.get('percentage', 0.0))
                else:
                    try:
                        pct = float(val)
                    except (ValueError, TypeError):
                        pct = 0.0
                category_sums[cat] = category_sums.get(cat, 0) + pct
                category_counts[cat] = category_counts.get(cat, 0) + 1

        radar = {}
        defaults = {
            "PROG_BASIC": 70,
            "ALGO_DS": 60,
            "OPTIMIZATION": 55,
            "DB_NETWORK": 65,
            "ICT_APP": 60
        }
        for cat in ["PROG_BASIC", "ALGO_DS", "OPTIMIZATION", "DB_NETWORK", "ICT_APP"]:
            if cat in category_sums and category_counts[cat] > 0:
                radar[cat] = round(category_sums[cat] / category_counts[cat], 1)
            else:
                radar[cat] = defaults.get(cat, 50)

        # Strengths & Weaknesses heuristic
        labels = {
            "PROG_BASIC": "Lập trình Cơ bản (C++/Python)",
            "ALGO_DS": "Thuật toán & Cấu trúc Dữ liệu",
            "OPTIMIZATION": "Tối ưu hóa & Độ phức tạp Thời gian",
            "DB_NETWORK": "Cơ sở Dữ liệu & Mạng máy tính",
            "ICT_APP": "Ứng dụng Tin học & Đa phương tiện"
        }

        sorted_radar = sorted(radar.items(), key=lambda x: x[1], reverse=True)
        strengths = [f"{labels.get(k, k)}: {v}% độ chuẩn xác" for k, v in sorted_radar[:2]]
        weaknesses = [f"{labels.get(k, k)} ({v}%): Cần ôn luyện thêm các dạng bài này" for k, v in sorted_radar[-2:]]

        return Response({
            "total_exams_taken": len(sessions),
            "average_score": avg_score,
            "highest_score": highest_score,
            "score_history": score_history,
            "radar_scores": radar,
            "strengths": strengths,
            "weaknesses": weaknesses
        })


