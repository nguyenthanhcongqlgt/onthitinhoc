from rest_framework import viewsets, permissions, status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from authentication.models import User
from .models import Exam, Question, QuestionOption, UserAISetting, QuestionFeedback, ExamSitting, SittingAssignment, ExamFolder
from .serializers import (
    ExamSerializer,
    ExamDetailWithQuestionsSerializer,
    QuestionSerializer,
    QuestionOptionSerializer,
    UserAISettingSerializer,
    QuestionFeedbackSerializer,
    ExamSittingSerializer,
    SittingAssignmentSerializer,
    ExamFolderSerializer
)
from .services import ExamSecurityService
from .docx_parser import DocxExamParser
from .template_generator import generate_exam_docx_template
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from rest_framework.decorators import action
from django.db import models

class IsTeacherOrAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and (
            request.user.role in [User.Role.ADMIN, User.Role.TEACHER] or request.user.is_superuser
        )

class IsTeacherOrAdmin(permissions.BasePermission):
    """Chặn student hoàn toàn (không cho read-only)."""
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        return request.user.is_superuser or request.user.role in [User.Role.ADMIN, User.Role.TEACHER]


class ExamFolderViewSet(viewsets.ModelViewSet):
    serializer_class = ExamFolderSerializer
    permission_classes = [IsTeacherOrAdminOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return ExamFolder.objects.none()

        if user.role == User.Role.ADMIN or user.is_superuser:
            qs = ExamFolder.objects.all()
        elif user.role == User.Role.TEACHER:
            # Shared folders OR created by this teacher
            qs = ExamFolder.objects.filter(
                models.Q(is_shared=True) | models.Q(creator=user)
            )
        else:
            # Student: visible shared folders
            qs = ExamFolder.objects.filter(is_shared=True)

        # Filter by is_shared if specified
        is_shared_param = self.request.query_params.get('is_shared')
        if is_shared_param is not None and is_shared_param != '':
            if is_shared_param.lower() in ['true', '1']:
                qs = qs.filter(is_shared=True)
            elif is_shared_param.lower() in ['false', '0']:
                qs = qs.filter(is_shared=False)

        parent_param = self.request.query_params.get('parent')
        if parent_param is not None and parent_param != '':
            if parent_param.lower() in ['null', 'none', 'root']:
                qs = qs.filter(parent__isnull=True)
            else:
                qs = qs.filter(parent_id=parent_param)

        return qs.select_related('creator', 'parent').distinct().order_by('order_index', 'name')

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

    def perform_update(self, serializer):
        user = self.request.user
        instance = self.get_object()
        if instance.creator and instance.creator != user and user.role != User.Role.ADMIN and not user.is_superuser:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Bạn chỉ có thể chỉnh sửa thư mục do chính mình tạo ra.")
        serializer.save()

    def perform_destroy(self, instance):
        user = self.request.user
        if instance.creator and instance.creator != user and user.role != User.Role.ADMIN and not user.is_superuser:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Bạn chỉ có thể xóa thư mục do chính mình tạo ra.")

        # Safe deletion: move all exams in this folder to parent folder (or None / Uncategorized)
        instance.exams.update(folder=instance.parent)
        # Re-parent children to parent folder
        instance.children.update(parent=instance.parent)
        instance.delete()

    @action(detail=False, methods=['post'], url_path='move-exams')
    def move_exams(self, request):
        """
        Di chuyển 1 hoặc nhiều đề thi vào thư mục đích (hoặc null để về Chưa phân loại)
        Payload: { "exam_ids": [1, 2], "target_folder_id": 5 (hoặc null) }
        """
        exam_ids = request.data.get('exam_ids', [])
        target_folder_id = request.data.get('target_folder_id')

        if not isinstance(exam_ids, list) or not exam_ids:
            return Response({'detail': 'Vui lòng cung cấp danh sách ID đề thi.'}, status=status.HTTP_400_BAD_REQUEST)

        target_folder = None
        if target_folder_id is not None and target_folder_id != '':
            target_folder = get_object_or_404(ExamFolder, id=target_folder_id)

        user = request.user
        exams_to_update = Exam.objects.filter(id__in=exam_ids)

        count = 0
        for exam in exams_to_update:
            if exam.creator == user or user.role == User.Role.ADMIN or user.is_superuser or exam.shared_teachers.filter(id=user.id).exists():
                exam.folder = target_folder
                exam.save(update_fields=['folder'])
                count += 1

        folder_name = target_folder.name if target_folder else "Chưa phân loại"
        return Response({
            'success': True,
            'message': f'Đã di chuyển thành công {count} đề thi vào thư mục "{folder_name}".',
            'moved_count': count
        })


class ExamViewSet(viewsets.ModelViewSet):
    permission_classes = [IsTeacherOrAdminOrReadOnly]

    def get_serializer_class(self):
        if self.action in ['retrieve', 'details_with_questions'] and (
            self.request.user.role in [User.Role.ADMIN, User.Role.TEACHER] or self.request.user.is_superuser
        ):
            return ExamDetailWithQuestionsSerializer
        return ExamSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Exam.objects.none()

        if user.role == User.Role.ADMIN or user.is_superuser:
            qs = Exam.objects.all().distinct()
        elif user.role == User.Role.TEACHER:
            # ONLY exams created by this teacher OR shared with this teacher (or shared with all teachers)
            qs = Exam.objects.filter(
                models.Q(creator=user) |
                models.Q(shared_teachers=user) |
                models.Q(is_shared_with_all_teachers=True)
            ).distinct()
        else:
            # For Students: Phải giao đề (is_assigned=True) thì HS mới được thấy và làm
            # Loại trừ các đề đang nằm trong các Ca thi đang hoạt động (để HS phải nhập room_code)
            base_qs = Exam.objects.filter(is_active=True, is_assigned=True).exclude(sittings__is_active=True)
            if not user.class_name or not user.class_name.strip():
                # Học sinh chưa điền lớp: vẫn thấy các đề giao "Toàn trường" hoặc không giới hạn lớp
                qs = base_qs.filter(
                    models.Q(assigned_classes__icontains='Toàn trường') |
                    models.Q(assigned_classes__exact='') |
                    models.Q(assigned_classes__isnull=True)
                ).distinct()
            else:
                u_class = user.class_name.strip()
                all_assigned_exams = base_qs.exclude(assigned_classes__exact='').exclude(assigned_classes__isnull=True)
                open_exams = base_qs.filter(
                    models.Q(assigned_classes__icontains='Toàn trường') |
                    models.Q(assigned_classes__exact='') |
                    models.Q(assigned_classes__isnull=True)
                )
                matched_ids = []
                for exam in all_assigned_exams:
                    if exam.assigned_classes:
                        assigned_list = [c.strip().lower() for c in exam.assigned_classes.split(',')]
                        if u_class.lower() in assigned_list or 'toàn trường' in assigned_list:
                            matched_ids.append(exam.id)
                qs = (open_exams | base_qs.filter(id__in=matched_ids)).distinct()

        # Folder filtering (supports subfolders)
        folder_id = self.request.query_params.get('folder_id')
        if folder_id is not None and folder_id != '':
            if folder_id in ['none', 'null', 'uncategorized']:
                qs = qs.filter(folder__isnull=True)
            else:
                include_subfolders = self.request.query_params.get('include_subfolders', 'true').lower() == 'true'
                if include_subfolders:
                    target_folder = ExamFolder.objects.filter(id=folder_id).first()
                    if target_folder:
                        descendant_ids = target_folder.get_all_descendant_ids()
                        qs = qs.filter(folder_id__in=descendant_ids)
                    else:
                        qs = qs.filter(folder_id=folder_id)
                else:
                    qs = qs.filter(folder_id=folder_id)

        qs = qs.select_related('creator', 'folder').prefetch_related('shared_teachers')
        if getattr(self, 'action', None) in ['retrieve', 'details_with_questions']:
            qs = qs.prefetch_related('questions__options')

        return qs

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

    def perform_destroy(self, instance):
        user = self.request.user
        if user != instance.creator and user.role != User.Role.ADMIN and not user.is_superuser:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Bạn chỉ có thể xóa đề thi do chính mình tạo ra.")
        instance.delete()

    def perform_update(self, serializer):
        user = self.request.user
        exam = self.get_object()
        if user != exam.creator and user.role != User.Role.ADMIN and not user.is_superuser:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Bạn chỉ có thể chỉnh sửa đề thi do chính mình tạo ra.")
        serializer.save()

    @action(detail=True, methods=['post'], permission_classes=[IsTeacherOrAdminOrReadOnly])
    def assign(self, request, pk=None):
        """
        API Giao đề cho học sinh theo lớp / thời gian / mật khẩu / cài đặt xem điểm
        """
        exam = self.get_object()
        is_assigned = request.data.get('is_assigned', True)
        assigned_classes = request.data.get('assigned_classes', 'Toàn trường')
        assigned_start_time = request.data.get('assigned_start_time')
        assigned_end_time = request.data.get('assigned_end_time')
        max_attempts = int(request.data.get('max_attempts', 1))

        # Validate time range
        if assigned_start_time and assigned_end_time:
            from django.utils.dateparse import parse_datetime
            start_dt = parse_datetime(str(assigned_start_time)) if isinstance(assigned_start_time, str) else assigned_start_time
            end_dt = parse_datetime(str(assigned_end_time)) if isinstance(assigned_end_time, str) else assigned_end_time
            if start_dt and end_dt and start_dt >= end_dt:
                return Response({"detail": "Thời gian bắt đầu phải trước thời gian kết thúc."}, status=status.HTTP_400_BAD_REQUEST)

        access_code = request.data.get('access_code', '').strip()
        access_type = request.data.get('access_type', exam.access_type)

        show_score_after_test = request.data.get('show_score_after_test', exam.show_score_after_test)
        show_explanation_after_test = request.data.get('show_explanation_after_test', exam.show_explanation_after_test)
        allow_run_code = request.data.get('allow_run_code', exam.allow_run_code)

        exam.is_assigned = is_assigned
        exam.assigned_classes = assigned_classes
        exam.assigned_start_time = assigned_start_time if assigned_start_time else None
        exam.assigned_end_time = assigned_end_time if assigned_end_time else None
        exam.max_attempts = max_attempts
        exam.allow_run_code = bool(allow_run_code)
        exam.show_score_after_test = bool(show_score_after_test)
        exam.show_explanation_after_test = bool(show_explanation_after_test)
        branch_mode = request.data.get('branch_mode')
        if branch_mode in [Exam.BranchMode.SINGLE, Exam.BranchMode.BOTH]:
            exam.branch_mode = branch_mode

        if access_code:
            exam.access_code = access_code
            exam.access_type = Exam.AccessType.PROTECTED
        else:
            exam.access_type = access_type

        exam.save()

        msg = f"Đã giao đề thi '{exam.title}' thành công cho: {assigned_classes}!" if is_assigned else f"Đã thu hồi / chuyển đề '{exam.title}' về trạng thái Chưa giao (Bản nháp)."
        return Response({
            "message": msg,
            "exam": ExamSerializer(exam, context={'request': request}).data
        })

    @action(detail=True, methods=['get', 'post'], permission_classes=[IsTeacherOrAdminOrReadOnly])
    def share(self, request, pk=None):
        """
        API Xem và Cập nhật phân quyền chia sẻ đề thi cho các giáo viên khác
        """
        exam = self.get_object()
        if request.user != exam.creator and request.user.role != User.Role.ADMIN and not request.user.is_superuser:
            return Response({"detail": "Chỉ người tạo đề hoặc Super Admin mới có quyền chia sẻ đề thi này."}, status=status.HTTP_403_FORBIDDEN)

        if request.method == 'POST':
            teacher_ids = request.data.get('teacher_ids', [])
            is_shared_all = bool(request.data.get('is_shared_with_all_teachers', False))
            exam.is_shared_with_all_teachers = is_shared_all
            if isinstance(teacher_ids, list):
                valid_teachers = User.objects.filter(id__in=teacher_ids, role=User.Role.TEACHER)
                exam.shared_teachers.set(valid_teachers)
            exam.save()
            return Response({
                "message": "Cập nhật quyền chia sẻ đề thi thành công!",
                "exam": ExamSerializer(exam, context={'request': request}).data
            })

        # GET: List available teachers in system
        teachers = User.objects.filter(role=User.Role.TEACHER, status=User.Status.ACTIVE).exclude(id=request.user.id)
        shared_ids = list(exam.shared_teachers.values_list('id', flat=True))
        return Response({
            "exam_id": exam.id,
            "exam_title": exam.title,
            "is_shared_with_all_teachers": exam.is_shared_with_all_teachers,
            "shared_teacher_ids": shared_ids,
            "available_teachers": [
                {
                    "id": t.id,
                    "full_name": t.full_name,
                    "username": t.username,
                    "email": t.email,
                    "is_shared": t.id in shared_ids
                } for t in teachers
            ]
        })

    @action(detail=True, methods=['get'])
    def export_docx(self, request, pk=None):
        from docx import Document
        from django.http import HttpResponse
        import io

        exam = self.get_object()
        document = Document()
        
        # Add Exam Title
        document.add_heading(exam.title, 0)
        
        if exam.description:
            document.add_paragraph(exam.description)
            
        questions = exam.questions.all().order_by('order_index', 'id')
        for q in questions:
            # Question content
            p = document.add_paragraph()
            p.add_run(f"Câu {q.order_index}: ").bold = True
            p.add_run(q.content)
            
            # Question options
            options = q.options.all().order_by('order_index', 'id')
            labels = ['A', 'B', 'C', 'D', 'E', 'F']
            for idx, opt in enumerate(options):
                lbl = labels[idx] if idx < len(labels) else str(idx)
                # If label exists in option, use it, otherwise use generated label
                lbl_to_use = opt.label if opt.label else lbl
                opt_p = document.add_paragraph()
                opt_p.add_run(f"{lbl_to_use}. {opt.content}")

        # Save to BytesIO
        f = io.BytesIO()
        document.save(f)
        f.seek(0)
        
        response = HttpResponse(f.read(), content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document')
        response['Content-Disposition'] = f'attachment; filename="exam.docx"'
        return response


class QuestionViewSet(viewsets.ModelViewSet):
    serializer_class = QuestionSerializer
    permission_classes = [IsTeacherOrAdmin]  # Chặn student xem đáp án (is_correct/explanation)

    def get_queryset(self):
        user = self.request.user
        qs = Question.objects.all()
        
        # Admin thấy toàn bộ, Teacher chỉ thấy câu hỏi thuộc đề của mình hoặc được share
        if user.role != 'ADMIN':
            qs = qs.filter(
                models.Q(exam__creator=user) | 
                models.Q(exam__shared_teachers=user) |
                models.Q(exam__is_shared_with_all_teachers=True)
            ).distinct()

        exam_id = self.request.query_params.get('exam_id')
        if exam_id:
            qs = qs.filter(exam_id=exam_id)
        return qs

    def perform_create(self, serializer):
        exam = serializer.validated_data.get('exam')
        user = self.request.user
        if user.role != 'ADMIN' and exam.creator != user and user not in exam.shared_teachers.all() and not exam.is_shared_with_all_teachers:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Bạn không có quyền thêm câu hỏi vào đề thi này.")
        serializer.save()


class VerifyAccessCodeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, exam_id):
        exam = get_object_or_404(Exam, id=exam_id, is_active=True)
        if exam.access_type != Exam.AccessType.PROTECTED:
            return Response({"valid": True, "message": "Đề thi không yêu cầu mật khẩu."})

        code = request.data.get('access_code', '').strip()
        # So sánh timing-safe chống timing attack
        import hmac
        if hmac.compare_digest(code, exam.access_code):
            return Response({"valid": True, "message": "Mã truy cập chính xác."})
        return Response(
            {"valid": False, "detail": "Mã truy cập / Mật khẩu đề thi không đúng."},
            status=status.HTTP_400_BAD_REQUEST
        )


class QuickJoinExamView(APIView):
    """
    API Tra cứu siêu tốc và tham gia ca thi qua mã (Exam ID, Access Code, Room Code, hoặc Tên đề)
    Hỗ trợ cả người dùng chưa đăng nhập (để kiểm tra sự tồn tại của mã) và học sinh đã đăng nhập.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        raw_code = str(request.data.get('code', '')).strip()
        access_password = str(request.data.get('access_code', '')).strip()
        if not raw_code:
            return Response(
                {"success": False, "detail": "Vui lòng nhập mã phòng thi hoặc mã đề thi."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ===== BƯỚC 0: Kiểm tra có phải Mã Ca thi (Room Code) không =====
        sitting = ExamSitting.objects.filter(
            room_code__iexact=raw_code, is_active=True
        ).first()
        if sitting:
            return self._handle_sitting_join(request, sitting, access_password)

        # ===== Tiếp tục logic cũ: tìm đề đơn lẻ =====
        # Không cho phép join trực tiếp vào đề thi đơn lẻ nếu nó đang nằm trong 1 ca thi hoạt động
        assigned_exams = Exam.objects.filter(is_active=True, is_assigned=True).exclude(sittings__is_active=True)

        matched_exam = None

        # 1. Thử tìm theo ID nếu là chữ số
        if raw_code.isdigit():
            matched_exam = assigned_exams.filter(id=int(raw_code)).first()

        # 2. Thử tìm theo Access Code (chính xác không phân biệt hoa thường)
        if not matched_exam:
            matched_exam = assigned_exams.filter(access_code__iexact=raw_code).first()

        # 3. Thử tìm theo Tiêu đề chính xác
        if not matched_exam:
            matched_exam = assigned_exams.filter(title__iexact=raw_code).first()

        # 4. Thử tìm theo Tiêu đề chứa từ khóa
        if not matched_exam:
            title_matches = assigned_exams.filter(title__icontains=raw_code)
            if title_matches.count() == 1:
                matched_exam = title_matches.first()

        if not matched_exam:
            return Response({
                "success": False,
                "status": "NOT_FOUND",
                "detail": f"Không tìm thấy ca thi nào khớp với mã '{raw_code}'. Vui lòng kiểm tra lại mã do Thầy/Cô cung cấp."
            }, status=status.HTTP_404_NOT_FOUND)

        # Nếu chưa đăng nhập
        if not request.user or not request.user.is_authenticated:
            return Response({
                "success": True,
                "status": "REQUIRE_LOGIN",
                "exam_id": matched_exam.id,
                "title": matched_exam.title,
                "duration_minutes": matched_exam.duration_minutes,
                "access_type": matched_exam.access_type,
                "detail": f"Đã tìm thấy đề thi '{matched_exam.title}'. Vui lòng đăng nhập để bắt đầu làm bài."
            })

        user = request.user

        # Nếu là Giáo viên hoặc Admin: Cho phép xem/thử
        if user.role in [User.Role.ADMIN, User.Role.TEACHER] or user.is_superuser:
            return Response({
                "success": True,
                "status": "CAN_ENTER",
                "exam_id": matched_exam.id,
                "title": matched_exam.title,
                "duration_minutes": matched_exam.duration_minutes,
                "message": f"Chào Thầy/Cô, ca thi '{matched_exam.title}' sẵn sàng."
            })

        # Đối với Học sinh: Kiểm tra phân quyền lớp học
        assigned_cls_raw = (matched_exam.assigned_classes or '').strip()
        assigned_lower = assigned_cls_raw.lower()
        if assigned_cls_raw and 'toàn trường' not in assigned_lower and 'toan truong' not in assigned_lower:
            user_class = (user.class_name or '').strip().lower()
            assigned_list = [c.strip().lower() for c in assigned_cls_raw.split(',') if c.strip()]
            if user_class not in assigned_list:
                return Response({
                    "success": False,
                    "status": "CLASS_NOT_ALLOWED",
                    "detail": f"Đề thi này chỉ dành cho các lớp: {matched_exam.assigned_classes}. Lớp của bạn là '{user.class_name or 'Chưa phân lớp'}'."
                }, status=status.HTTP_403_FORBIDDEN)

        # Kiểm tra thời gian bắt đầu và kết thúc
        from django.utils import timezone
        now = timezone.now()
        if matched_exam.assigned_start_time and now < matched_exam.assigned_start_time:
            start_str = matched_exam.assigned_start_time.strftime("%H:%M ngày %d/%m/%Y")
            return Response({
                "success": False,
                "status": "NOT_STARTED",
                "detail": f"Ca thi '{matched_exam.title}' chưa đến giờ mở. Thời gian bắt đầu: {start_str}."
            }, status=status.HTTP_400_BAD_REQUEST)

        if matched_exam.assigned_end_time and now > matched_exam.assigned_end_time:
            end_str = matched_exam.assigned_end_time.strftime("%H:%M ngày %d/%m/%Y")
            return Response({
                "success": False,
                "status": "EXPIRED",
                "detail": f"Ca thi '{matched_exam.title}' đã kết thúc lúc {end_str}."
            }, status=status.HTTP_400_BAD_REQUEST)

        # Kiểm tra số lần làm bài
        from assessment.models import ExamSession
        completed_sessions = ExamSession.objects.filter(
            exam=matched_exam,
            student=user,
            status__in=[ExamSession.Status.SUBMITTED, ExamSession.Status.LOCKED_VIOLATION]
        ).count()

        if matched_exam.max_attempts and completed_sessions >= matched_exam.max_attempts:
            in_progress = ExamSession.objects.filter(
                exam=matched_exam,
                student=user,
                status=ExamSession.Status.IN_PROGRESS
            ).first()
            if not in_progress:
                return Response({
                    "success": False,
                    "status": "MAX_ATTEMPTS_REACHED",
                    "detail": f"Bạn đã hoàn thành tối đa số lượt thi cho phép ({matched_exam.max_attempts}/{matched_exam.max_attempts} lượt) cho đề thi này."
                }, status=status.HTTP_400_BAD_REQUEST)

        # Kiểm tra mật khẩu vào thi (Access Code)
        if matched_exam.access_type == Exam.AccessType.PROTECTED:
            import hmac
            provided_pass = access_password or raw_code
            if not hmac.compare_digest(provided_pass.strip(), matched_exam.access_code.strip()):
                return Response({
                    "success": True,
                    "status": "NEED_PASSWORD",
                    "exam_id": matched_exam.id,
                    "title": matched_exam.title,
                    "duration_minutes": matched_exam.duration_minutes,
                    "detail": "Đề thi yêu cầu Mật khẩu ca thi."
                })

        return Response({
            "success": True,
            "status": "CAN_ENTER",
            "exam_id": matched_exam.id,
            "title": matched_exam.title,
            "duration_minutes": matched_exam.duration_minutes,
            "message": f"Ca thi '{matched_exam.title}' hợp lệ. Đang vào phòng thi..."
        })

    def _handle_sitting_join(self, request, sitting, access_password):
        """Xử lý tham gia Ca thi: kiểm tra quyền, thời gian, mật khẩu, phân đề"""
        from django.utils import timezone
        from assessment.models import ExamSession
        import hmac

        # Nếu chưa đăng nhập
        if not request.user or not request.user.is_authenticated:
            return Response({
                "success": True,
                "status": "REQUIRE_LOGIN",
                "sitting_id": sitting.id,
                "sitting_name": sitting.name,
                "room_code": sitting.room_code,
                "detail": f"Đã tìm thấy Ca thi '{sitting.name}'. Vui lòng đăng nhập để bắt đầu làm bài."
            })

        user = request.user

        # Giáo viên/Admin → cho xem thông tin ca thi
        if user.role in [User.Role.ADMIN, User.Role.TEACHER] or user.is_superuser:
            return Response({
                "success": True,
                "status": "SITTING_INFO",
                "sitting_id": sitting.id,
                "sitting_name": sitting.name,
                "room_code": sitting.room_code,
                "exams_count": sitting.exams.count(),
                "total_students": sitting.assignments.count(),
                "message": f"Chào Thầy/Cô, Ca thi '{sitting.name}' có {sitting.exams.count()} đề thi."
            })

        # ===== Kiểm tra Học sinh =====

        # Kiểm tra lớp học
        assigned_cls_raw = (sitting.assigned_classes or '').strip()
        assigned_lower = assigned_cls_raw.lower()
        if assigned_cls_raw and 'toàn trường' not in assigned_lower and 'toan truong' not in assigned_lower:
            user_class = (user.class_name or '').strip().lower()
            assigned_list = [c.strip().lower() for c in assigned_cls_raw.split(',') if c.strip()]
            if user_class not in assigned_list:
                return Response({
                    "success": False,
                    "status": "CLASS_NOT_ALLOWED",
                    "detail": f"Ca thi này chỉ dành cho các lớp: {sitting.assigned_classes}. Lớp của bạn là '{user.class_name or 'Chưa phân lớp'}'."
                }, status=status.HTTP_403_FORBIDDEN)

        # Kiểm tra thời gian
        now = timezone.now()
        if sitting.start_time and now < sitting.start_time:
            start_str = sitting.start_time.strftime("%H:%M ngày %d/%m/%Y")
            return Response({
                "success": False,
                "status": "NOT_STARTED",
                "detail": f"Ca thi '{sitting.name}' chưa đến giờ mở. Thời gian bắt đầu: {start_str}."
            }, status=status.HTTP_400_BAD_REQUEST)

        if sitting.end_time and now > sitting.end_time:
            end_str = sitting.end_time.strftime("%H:%M ngày %d/%m/%Y")
            return Response({
                "success": False,
                "status": "EXPIRED",
                "detail": f"Ca thi '{sitting.name}' đã kết thúc lúc {end_str}."
            }, status=status.HTTP_400_BAD_REQUEST)

        # Kiểm tra mật khẩu ca thi
        if sitting.password:
            provided_pass = access_password
            if not provided_pass or not hmac.compare_digest(provided_pass.strip(), sitting.password.strip()):
                return Response({
                    "success": True,
                    "status": "NEED_PASSWORD",
                    "sitting_id": sitting.id,
                    "sitting_name": sitting.name,
                    "room_code": sitting.room_code,
                    "detail": "Ca thi yêu cầu nhập Mật khẩu."
                })

        # Phân phối đề cho học sinh
        assigned_exam = sitting.get_exam_for_student(user)

        selected_exam_id = request.data.get('selected_exam_id')
        if assigned_exam is None and sitting.distribution_mode == ExamSitting.DistributionMode.MANUAL and selected_exam_id:
            try:
                chosen = sitting.exams.get(id=selected_exam_id, is_active=True)
                from .models import SittingAssignment
                SittingAssignment.objects.create(sitting=sitting, student=user, exam=chosen)
                assigned_exam = chosen
            except Exception:
                pass

        if assigned_exam is None:
            if sitting.distribution_mode == ExamSitting.DistributionMode.MANUAL:
                # Chế độ thủ công: trả về danh sách đề cho HS chọn
                exam_choices = [
                    {'id': e.id, 'title': e.title, 'duration_minutes': e.duration_minutes}
                    for e in sitting.exams.filter(is_active=True).order_by('id')
                ]
                return Response({
                    "success": True,
                    "status": "CHOOSE_EXAM",
                    "sitting_id": sitting.id,
                    "sitting_name": sitting.name,
                    "exam_choices": exam_choices,
                    "detail": "Vui lòng chọn một đề thi."
                })
            return Response({
                "success": False,
                "detail": "Ca thi chưa có đề thi nào. Vui lòng liên hệ Thầy/Cô."
            }, status=status.HTTP_400_BAD_REQUEST)

        # Kiểm tra số lần làm bài cho đề đã phân
        completed = ExamSession.objects.filter(
            exam=assigned_exam,
            student=user,
            status__in=[ExamSession.Status.SUBMITTED, ExamSession.Status.LOCKED_VIOLATION]
        ).count()

        if sitting.max_attempts and completed >= sitting.max_attempts:
            in_progress = ExamSession.objects.filter(
                exam=assigned_exam,
                student=user,
                status=ExamSession.Status.IN_PROGRESS
            ).first()
            if not in_progress:
                return Response({
                    "success": False,
                    "status": "MAX_ATTEMPTS_REACHED",
                    "detail": f"Bạn đã hoàn thành tối đa {sitting.max_attempts} lượt thi cho Ca thi này."
                }, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            "success": True,
            "status": "CAN_ENTER",
            "exam_id": assigned_exam.id,
            "title": assigned_exam.title,
            "duration_minutes": assigned_exam.duration_minutes,
            "sitting_id": sitting.id,
            "sitting_name": sitting.name,
            "message": f"Ca thi '{sitting.name}' — Bạn được phân đề '{assigned_exam.title}'. Đang vào phòng thi..."
        })


from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

class ImportDocxExamView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        if not (request.user.role in [User.Role.ADMIN, User.Role.TEACHER] or request.user.is_superuser):
            return Response({"detail": "Chỉ có Giáo viên hoặc Super Admin mới có quyền import đề."}, status=status.HTTP_403_FORBIDDEN)

        uploaded_file = request.FILES.get('file')
        raw_text = request.data.get('text', '').strip()
        action = request.data.get('action', 'preview') # 'preview' or 'save'

        if not uploaded_file and not raw_text:
            return Response({"detail": "Vui lòng đính kèm file Word (.docx) hoặc dán văn bản đề thi."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            if uploaded_file:
                # Check filename extension (.docx, .doc, .pdf)
                fname_lower = uploaded_file.name.lower()
                if fname_lower.endswith('.pdf'):
                    parsed_data = DocxExamParser.parse_pdf_file(uploaded_file)
                elif fname_lower.endswith('.docx'):  # M4: .doc gây crash BadZipFile, chỉ hỗ trợ .docx
                    parsed_data = DocxExamParser.parse_docx_file(uploaded_file)
                else:
                    return Response({"detail": "Vui lòng chọn file định dạng Microsoft Word (.docx) hoặc Adobe PDF (.pdf)."}, status=status.HTTP_400_BAD_REQUEST)
            else:
                parsed_data = DocxExamParser.parse_raw_text(raw_text)
        except Exception as e:
            return Response({"detail": f"Lỗi đọc file: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

        if action == 'preview':
            return Response(parsed_data)

        # Action == 'save': Create or Update Exam & Questions in DB
        exam_meta = parsed_data.get('exam_metadata', {})
        custom_title = request.data.get('title', '').strip() or exam_meta.get('title', 'ĐỀ THI TIN HỌC HSG THPT QUẤT LÂM')
        duration_minutes = int(request.data.get('duration_minutes') or exam_meta.get('duration_minutes', 50))
        matrix_preset = request.data.get('matrix_preset') or exam_meta.get('matrix_preset', 'HSG_QUAT_LAM')
        default_type = Exam.ExamType.TN_THPT if matrix_preset == 'BGD_2025' else Exam.ExamType.HSG
        exam_type = request.data.get('exam_type') or exam_meta.get('exam_type') or default_type
        access_type = request.data.get('access_type', Exam.AccessType.PUBLIC)
        access_code = request.data.get('access_code', '')
        # L2: Kiểm tra None thay vì dùng or (giá trị 0 là falsy, bị ghi đè sai)
        p1_val = request.data.get('part1_total_points')
        part1_total_points = float(p1_val) if p1_val not in [None, ''] else float(exam_meta.get('part1_total_points', 12.0))
        p2_val = request.data.get('part2_total_points')
        part2_total_points = float(p2_val) if p2_val not in [None, ''] else float(exam_meta.get('part2_total_points', 8.0))
        tp_val = request.data.get('total_points')
        total_points = float(tp_val) if tp_val not in [None, ''] else float(exam_meta.get('total_points', round(part1_total_points + part2_total_points, 2)))

        folder_id = request.data.get('folder_id') or request.data.get('folder')
        target_folder = None
        if folder_id:
            try:
                target_folder = ExamFolder.objects.get(id=int(folder_id))
            except (ExamFolder.DoesNotExist, ValueError):
                pass

        existing_exam_id = request.data.get('exam_id')
        if existing_exam_id:
            exam = get_object_or_404(Exam, id=existing_exam_id)
            if exam.creator != request.user and request.user.role != User.Role.ADMIN and not request.user.is_superuser:  # M5: bỏ guard exam.creator để chặn orphan bypass
                return Response({"detail": "Bạn chỉ có thể chỉnh sửa đề thi do chính mình tạo ra."}, status=status.HTTP_403_FORBIDDEN)
            exam.title = custom_title
            exam.exam_type = exam_type
            exam.duration_minutes = duration_minutes
            exam.matrix_preset = matrix_preset
            exam.access_type = access_type
            exam.part1_total_points = part1_total_points
            exam.part2_total_points = part2_total_points
            exam.total_points = total_points
            if target_folder:
                exam.folder = target_folder
            elif folder_id in ['none', 'null', 0, '0']:
                exam.folder = None
            if access_code:
                exam.access_code = access_code
            exam.save()
            # Clear old questions to replace with updated list
            exam.questions.all().delete()
        else:
            exam = Exam.objects.create(
                title=custom_title,
                description=f"Đề thi gồm {parsed_data['summary']['total_questions']} câu hỏi.",
                creator=request.user,
                folder=target_folder,
                exam_type=exam_type,
                duration_minutes=duration_minutes,
                matrix_preset=matrix_preset,
                access_type=access_type,
                access_code=access_code,
                part1_total_points=part1_total_points,
                part2_total_points=part2_total_points,
                total_points=total_points,
                is_active=True
            )

        questions_payload = request.data.get('questions')
        if isinstance(questions_payload, list) and len(questions_payload) > 0:
            final_questions = questions_payload
        else:
            final_questions = parsed_data.get('questions', [])

        for q_data in final_questions:
            default_pt = 0.50 if q_data['part_type'] == Question.PartType.PART_I else 2.00
            q_point = q_data.get('point')
            if q_point is None or q_point == '':
                q_point = default_pt
            else:
                q_point = float(q_point)

            question = Question.objects.create(
                exam=exam,
                part_type=q_data['part_type'],
                branch=q_data.get('branch', Question.Branch.COMMON),
                order_index=q_data.get('order_index', 1),
                point=q_point,
                content=q_data['content'],
                code_snippet=q_data.get('code_snippet', ''),
                code_language=q_data.get('code_language', 'python'),
                competency_category=q_data.get('competency_category', 'PROG_BASIC'),
                difficulty_level=q_data.get('difficulty_level', 'TH'),
                explanation=q_data.get('explanation', '')
            )

            for opt_data in q_data.get('options', []):
                QuestionOption.objects.create(
                    question=question,
                    label=opt_data['label'],
                    content=opt_data['content'],
                    is_correct=opt_data.get('is_correct', False),
                    order_index=opt_data.get('order_index', 1),
                    explanation=opt_data.get('explanation', '')
                )

        from assessment.matrix_engine import ScoringMatrixEngine
        regrade_summary = None
        if existing_exam_id:
            regrade_summary = ScoringMatrixEngine.regrade_all_sessions_for_exam(exam.id)

        msg = f"Cập nhật đề thi thành công! Đã đồng bộ {parsed_data['summary']['total_questions']} câu hỏi." if existing_exam_id else f"Nhập đề thi thành công! Đã tạo {parsed_data['summary']['total_questions']} câu hỏi."
        if regrade_summary and regrade_summary['score_changed_count'] > 0:
            msg += f" Đã tự động chấm lại {regrade_summary['regraded_sessions_count']} bài làm và cập nhật điểm cho {regrade_summary['score_changed_count']} học sinh theo đáp án mới!"

        return Response({
            "message": msg,
            "exam_id": exam.id,
            "exam": ExamSerializer(exam).data,
            "summary": parsed_data['summary'],
            "warnings": parsed_data['warnings'],
            "regrade_summary": regrade_summary
        }, status=status.HTTP_200_OK if existing_exam_id else status.HTTP_201_CREATED)


class DownloadDocxTemplateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from django.http import HttpResponse
        from .template_generator import generate_exam_docx_template

        buffer = generate_exam_docx_template()
        response = HttpResponse(
            buffer.getvalue(),
            content_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )
        response['Content-Disposition'] = 'attachment; filename="Mau_De_Thi_HSG_THPT_Quat_Lam.docx"'
        return response


class UploadExamImageView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        import os
        import uuid
        from datetime import datetime
        from django.conf import settings
        from django.core.files.storage import default_storage
        from django.core.files.base import ContentFile

        file = request.FILES.get('image') or request.FILES.get('file')
        if not file:
            return Response({'detail': 'Vui lòng chọn hình ảnh để tải lên.'}, status=status.HTTP_400_BAD_REQUEST)

        # Security: File size limit (5MB)
        MAX_UPLOAD_SIZE = 5 * 1024 * 1024
        if file.size > MAX_UPLOAD_SIZE:
            return Response({'detail': 'Kích thước file vượt quá giới hạn 5MB.'}, status=status.HTTP_400_BAD_REQUEST)

        # Generate safe unique filename
        ext = os.path.splitext(file.name)[1].lower() if file.name else '.png'
        if ext not in ['.png', '.jpg', '.jpeg', '.gif', '.webp']:
            ext = '.png'

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        unique_id = uuid.uuid4().hex[:8]
        filename = f"exam_img_{timestamp}_{unique_id}{ext}"
        relative_path = os.path.join('exam_images', filename)

        saved_path = default_storage.save(relative_path, ContentFile(file.read()))
        media_url = default_storage.url(saved_path)

        return Response({
            'url': media_url,
            'filename': filename,
            'markdown': f"![Hình ảnh]({media_url})"
        }, status=status.HTTP_201_CREATED)


class AISettingsView(APIView):
    """
    API for managing User AI Configuration, secure key storage and teacher permission sharing.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        ai_setting, _ = UserAISetting.objects.get_or_create(user=user)
        is_admin = user.is_superuser or user.role == User.Role.ADMIN

        # Find the Super Admin AI Setting
        admin_user = User.objects.filter(models.Q(role=User.Role.ADMIN) | models.Q(is_superuser=True)).first()
        admin_setting = None
        if admin_user:
            admin_setting, _ = UserAISetting.objects.get_or_create(user=admin_user)

        teachers_access_list = []
        if is_admin and admin_setting:
            teachers = User.objects.filter(role=User.Role.TEACHER).order_by('full_name', 'username')
            allowed_ids = set(admin_setting.allowed_teachers.values_list('id', flat=True))
            for t in teachers:
                teachers_access_list.append({
                    'id': t.id,
                    'username': t.username,
                    'full_name': t.full_name or t.username,
                    'email': t.email,
                    'school': t.school,
                    'class_name': t.class_name,
                    'status': t.status,
                    'is_granted': t.id in allowed_ids
                })

        is_granted_shared_access = False
        admin_has_api = False
        admin_provider = 'gemini'
        admin_model = 'gemini-3.7-flash'

        if admin_setting:
            admin_has_api = bool(admin_setting.get_api_key())
            admin_provider = admin_setting.provider
            admin_model = admin_setting.model
            if is_admin:
                is_granted_shared_access = True
            elif admin_setting.share_with_teachers:
                is_granted_shared_access = admin_setting.allowed_teachers.filter(id=user.id).exists()

        return Response({
            'user_settings': {
                'provider': ai_setting.provider,
                'model': ai_setting.model,
                'base_url': ai_setting.base_url,
                'auto_explain': ai_setting.auto_explain,
                'share_with_teachers': ai_setting.share_with_teachers,
                'use_shared_admin_api': ai_setting.use_shared_admin_api,
                'has_api_key': bool(ai_setting.get_api_key()),
                'masked_api_key': ai_setting.get_masked_api_key(),
            },
            'is_admin': is_admin,
            'shared_admin_info': {
                'admin_name': admin_user.full_name or admin_user.username if admin_user else 'Super Admin (Thầy Công)',
                'admin_has_api': admin_has_api,
                'admin_provider': admin_provider,
                'admin_model': admin_model,
                'is_granted_shared_access': is_granted_shared_access,
            },
            'teachers_access_list': teachers_access_list,
        })

    def post(self, request):
        user = request.user
        ai_setting, _ = UserAISetting.objects.get_or_create(user=user)
        data = request.data
        is_admin = user.is_superuser or user.role == User.Role.ADMIN

        if 'provider' in data:
            ai_setting.provider = data['provider']
        if 'model' in data:
            ai_setting.model = data['model']
        if 'base_url' in data:
            ai_setting.base_url = data['base_url']
        if 'auto_explain' in data:
            ai_setting.auto_explain = bool(data['auto_explain'])
        if 'use_shared_admin_api' in data:
            ai_setting.use_shared_admin_api = bool(data['use_shared_admin_api'])

        if is_admin and 'share_with_teachers' in data:
            ai_setting.share_with_teachers = bool(data['share_with_teachers'])

        # Update API key if provided and not masked — mã hóa trước khi lưu
        new_api_key = data.get('api_key')
        if new_api_key is not None:
            new_api_key = str(new_api_key).strip()
            if new_api_key and '••••' not in new_api_key:
                ai_setting.set_api_key(new_api_key)
            elif new_api_key == '' and data.get('clear_key', False):
                ai_setting.api_key = ''

        ai_setting.save()
        return Response({
            'message': 'Đã lưu cài đặt AI thành công!',
            'user_settings': {
                'provider': ai_setting.provider,
                'model': ai_setting.model,
                'base_url': ai_setting.base_url,
                'auto_explain': ai_setting.auto_explain,
                'share_with_teachers': ai_setting.share_with_teachers,
                'use_shared_admin_api': ai_setting.use_shared_admin_api,
                'has_api_key': bool(ai_setting.get_api_key()),
                'masked_api_key': ai_setting.get_masked_api_key(),
            }
        })


class AIToggleTeacherAccessView(APIView):
    """
    Super Admin API to grant or revoke AI sharing permission for teachers.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if not (request.user.is_superuser or request.user.role == User.Role.ADMIN):
            return Response({"detail": "Chỉ có Super Admin mới có quyền phân quyền chia sẻ API."}, status=status.HTTP_403_FORBIDDEN)

        admin_setting, _ = UserAISetting.objects.get_or_create(user=request.user)

        grant_all = request.data.get('grant_all')
        if grant_all is not None:
            teachers = User.objects.filter(role=User.Role.TEACHER)
            if grant_all:
                admin_setting.allowed_teachers.add(*teachers)
                admin_setting.share_with_teachers = True
                admin_setting.save()
                msg = f"✓ Đã cấp quyền sử dụng API của Super Admin cho tất cả {teachers.count()} giáo viên!"
            else:
                admin_setting.allowed_teachers.clear()
                admin_setting.save()
                msg = "✓ Đã thu hồi quyền sử dụng API của tất cả giáo viên."
            return Response({'message': msg, 'allowed_count': admin_setting.allowed_teachers.count()})

        teacher_id = request.data.get('teacher_id')
        granted = bool(request.data.get('granted', True))

        if not teacher_id:
            return Response({"detail": "Thiếu teacher_id."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            teacher = User.objects.get(id=teacher_id, role=User.Role.TEACHER)
        except User.DoesNotExist:
            return Response({"detail": "Không tìm thấy tài khoản giáo viên."}, status=status.HTTP_404_NOT_FOUND)

        if granted:
            admin_setting.allowed_teachers.add(teacher)
            admin_setting.share_with_teachers = True
            admin_setting.save()
            msg = f"✓ Đã cấp quyền sử dụng API của Super Admin cho giáo viên {teacher.full_name or teacher.username}!"
        else:
            admin_setting.allowed_teachers.remove(teacher)
            admin_setting.save()
            msg = f"✓ Đã thu hồi quyền sử dụng API của giáo viên {teacher.full_name or teacher.username}."

        return Response({'message': msg, 'teacher_id': teacher.id, 'is_granted': granted})


def resolve_ai_credentials(user, requested_use_shared=None, requested_provider=None, requested_model=None, requested_api_key=None, requested_base_url=None):
    ai_setting, _ = UserAISetting.objects.get_or_create(user=user)
    is_admin = user.is_superuser or user.role == User.Role.ADMIN

    use_shared = requested_use_shared if requested_use_shared is not None else ai_setting.use_shared_admin_api

    if use_shared and not is_admin:
        admin_user = User.objects.filter(models.Q(role=User.Role.ADMIN) | models.Q(is_superuser=True)).first()
        if not admin_user:
            raise RuntimeError("Hệ thống chưa thiết lập tài khoản Super Admin.")
        admin_setting, _ = UserAISetting.objects.get_or_create(user=admin_user)

        if not admin_setting.share_with_teachers or not admin_setting.allowed_teachers.filter(id=user.id).exists():
            raise PermissionError("Bạn chưa được Super Admin (Thầy Công) cấp quyền sử dụng API dùng chung! Vui lòng liên hệ Admin hoặc sử dụng API Key cá nhân của bạn.")

        admin_key = admin_setting.get_api_key()
        if not admin_key:
            raise RuntimeError("Super Admin chưa cấu hình API Key trong hệ thống.")

        return {
            'provider': requested_provider or admin_setting.provider,
            'api_key': admin_key,
            'model': requested_model or admin_setting.model,
            'base_url': requested_base_url if requested_base_url is not None else admin_setting.base_url,
            'is_shared': True
        }

    key = requested_api_key if (requested_api_key and '••••' not in requested_api_key) else ai_setting.get_api_key()
    if not key:
        raise RuntimeError("Bạn chưa thiết lập API Key cá nhân. Vui lòng mở Cài đặt AI để nhập API Key hoặc chọn 'Sử dụng API của Super Admin chia sẻ'.")

    return {
        'provider': requested_provider or ai_setting.provider,
        'api_key': key,
        'model': requested_model or ai_setting.model,
        'base_url': requested_base_url if requested_base_url is not None else ai_setting.base_url,
        'is_shared': False
    }


class AITestConnectionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        from .ai_solver import AISolverEngine

        requested_provider = request.data.get('provider')
        requested_api_key = request.data.get('api_key', '').strip()
        requested_model = request.data.get('model', '').strip() or None
        requested_base_url = request.data.get('base_url', '').strip() or None
        requested_use_shared = request.data.get('use_shared_admin_api')

        try:
            creds = resolve_ai_credentials(
                user=request.user,
                requested_use_shared=requested_use_shared,
                requested_provider=requested_provider,
                requested_model=requested_model,
                requested_api_key=requested_api_key,
                requested_base_url=requested_base_url
            )
        except PermissionError as pe:
            return Response({'success': False, 'detail': str(pe), 'error': str(pe)}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return Response({'success': False, 'detail': str(e), 'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        res = AISolverEngine.test_connection(
            provider=creds['provider'],
            api_key=creds['api_key'],
            model=creds['model'],
            base_url=creds['base_url']
        )

        if not res.get('success'):
            return Response(res, status=status.HTTP_400_BAD_REQUEST)
        return Response(res, status=status.HTTP_200_OK)


class AISolveExamView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        from .ai_solver import AISolverEngine

        questions = request.data.get('questions', [])
        raw_text = request.data.get('text', '')
        requested_provider = request.data.get('provider')
        requested_api_key = request.data.get('api_key', '').strip()
        requested_model = request.data.get('model', '').strip() or None
        requested_base_url = request.data.get('base_url', '').strip() or None
        requested_use_shared = request.data.get('use_shared_admin_api')

        solve_mode = request.data.get('solve_mode', 'unanswered_only') # 'unanswered_only' | 'all' | 'selected_only'
        selected_indices = request.data.get('selected_indices', None)
        include_explanations = request.data.get('include_explanations', True)

        # If raw_text was provided, parse questions first
        if not questions and raw_text:
            parsed = DocxExamParser.parse_raw_text(raw_text)
            questions = parsed.get('questions', [])

        if not questions:
            return Response({'detail': 'Không tìm thấy câu hỏi nào để giải.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            creds = resolve_ai_credentials(
                user=request.user,
                requested_use_shared=requested_use_shared,
                requested_provider=requested_provider,
                requested_model=requested_model,
                requested_api_key=requested_api_key,
                requested_base_url=requested_base_url
            )
        except PermissionError as pe:
            return Response({'success': False, 'detail': str(pe), 'error': str(pe)}, status=status.HTTP_403_FORBIDDEN)
        except Exception as e:
            return Response({'success': False, 'detail': str(e), 'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        try:
            res = AISolverEngine.solve_exam(
                questions=questions,
                provider=creds['provider'],
                api_key=creds['api_key'],
                model=creds['model'],
                base_url=creds['base_url'],
                solve_mode=solve_mode,
                selected_indices=selected_indices,
                include_explanations=include_explanations
            )
            return Response(res, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'detail': str(e),
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class ExamPreviewView(APIView):
    """
    Teacher/Admin Exam Preview API:
    Renders the exact student-facing payload (with options, KaTeX, IDE code snippets)
    without creating a DB ExamSession, without anti-cheat enforcement,
    and enriches with is_correct & explanation for teacher inspection.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, exam_id):
        from django.utils import timezone
        user = request.user
        if not (user.is_superuser or user.role in [User.Role.ADMIN, User.Role.TEACHER]):
            return Response(
                {"detail": "Chỉ có Giáo viên hoặc Quản trị viên mới có quyền xem trước đề thi."},
                status=status.HTTP_403_FORBIDDEN
            )

        exam = get_object_or_404(Exam, id=exam_id)

        # Teachers can view if creator, admin, or shared
        if not (user.is_superuser or user.role == User.Role.ADMIN or exam.creator == user or exam.shared_teachers.filter(id=user.id).exists() or exam.is_shared_with_all_teachers):
            return Response(
                {"detail": "Bạn không có quyền xem trước đề thi này."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Prepare exact student exam payload
        payload = ExamSecurityService.prepare_exam_payload_for_student(
            exam=exam,
            session_id=0,
            user_id=user.id
        )

        # Enrich options with is_correct and explanations for teacher inspection!
        q_map = {q.id: q for q in exam.questions.prefetch_related('options').all()}
        opt_map = {}
        for q in q_map.values():
            for opt in q.options.all():
                opt_map[opt.id] = opt

        def enrich_question(q_dict):
            qid = q_dict.get('id')
            orig_q = q_map.get(qid)
            if orig_q:
                q_dict['explanation'] = orig_q.explanation
                for opt_dict in q_dict.get('options', []):
                    oid = opt_dict.get('id')
                    orig_opt = opt_map.get(oid)
                    if orig_opt:
                        opt_dict['is_correct'] = orig_opt.is_correct
                        opt_dict['explanation'] = orig_opt.explanation

        for q in payload.get('part1_questions', []):
            enrich_question(q)
        for q in payload.get('part2_common_questions', []):
            enrich_question(q)
        for branch_key in ['CS', 'ICT']:
            for q in payload.get('part2_branches', {}).get(branch_key, []):
                enrich_question(q)

        return Response({
            'session_id': 0,
            'is_preview': True,
            'start_time': timezone.now().isoformat(),
            'selected_branch': 'BOTH' if exam.branch_mode == Exam.BranchMode.BOTH else 'NONE',
            'violation_count': 0,
            'max_tab_violations': exam.max_tab_violations,
            'data': payload
        }, status=status.HTTP_200_OK)



class ExamAnalyticsView(APIView):
    """
    Comprehensive Exam Analytics API: Score distribution, averages, question difficulty and discrimination index,
    with class-level filtering, student ranking scoreboard, and cross-class comparison.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, exam_id):
        from assessment.models import ExamSession, StudentAnswer
        from django.utils import timezone

        exam = get_object_or_404(Exam, id=exam_id)
        if not (request.user.role in [User.Role.ADMIN, User.Role.TEACHER] or request.user.is_superuser):
            return Response({"detail": "Chỉ có Giáo viên hoặc Super Admin mới có quyền xem phân tích đề thi."}, status=status.HTTP_403_FORBIDDEN)

        all_sessions = ExamSession.objects.filter(
            exam=exam,
            status__in=[ExamSession.Status.SUBMITTED, ExamSession.Status.LOCKED_VIOLATION]
        ).select_related('student').prefetch_related('student__enrolled_classrooms')

        # 1. Discover all available classes for this exam
        class_set = set()
        for s in all_sessions:
            if s.student.class_name and s.student.class_name.strip():
                class_set.add(s.student.class_name.strip())
            for cr in s.student.enrolled_classrooms.all():
                if cr.name and cr.name.strip():
                    class_set.add(cr.name.strip())

        if exam.assigned_classes and exam.assigned_classes.strip():
            for c in exam.assigned_classes.split(','):
                c_clean = c.strip()
                if c_clean and c_clean.lower() != 'toàn trường':
                    class_set.add(c_clean)

        available_classes = sorted(list(class_set))

        # 2. Check if a specific class is requested
        requested_class = request.query_params.get('class_name', '').strip()
        if requested_class and requested_class != 'ALL':
            sessions = all_sessions.filter(
                models.Q(student__class_name__iexact=requested_class) |
                models.Q(student__enrolled_classrooms__name__iexact=requested_class)
            ).distinct()
            selected_class = requested_class
        else:
            sessions = all_sessions
            selected_class = 'ALL'

        max_scale = float(exam.part1_total_points + exam.part2_total_points) or 20.0

        # 3. Cross-class Comparison Summary
        classes_comparison = []
        for cls_name in available_classes:
            cls_sessions = [
                s for s in all_sessions
                if (s.student.class_name and s.student.class_name.strip().lower() == cls_name.lower()) or
                   any(cr.name.strip().lower() == cls_name.lower() for cr in s.student.enrolled_classrooms.all())
            ]
            if cls_sessions:
                cls_scores = [float(s.total_score) for s in cls_sessions]
                c_sub = len(cls_scores)
                c_avg = round(sum(cls_scores) / c_sub, 2)
                c_max = round(max(cls_scores), 2)
                c_min = round(min(cls_scores), 2)

                exc = sum(1 for sc in cls_scores if sc >= 0.8 * max_scale)
                good = sum(1 for sc in cls_scores if 0.65 * max_scale <= sc < 0.8 * max_scale)
                avg = sum(1 for sc in cls_scores if 0.5 * max_scale <= sc < 0.65 * max_scale)
                below = sum(1 for sc in cls_scores if sc < 0.5 * max_scale)
                pass_rate = round(((c_sub - below) / c_sub) * 100, 1)

                classes_comparison.append({
                    "class_name": cls_name,
                    "total_submissions": c_sub,
                    "average_score": c_avg,
                    "highest_score": c_max,
                    "lowest_score": c_min,
                    "excellent_count": exc,
                    "good_count": good,
                    "average_count": avg,
                    "below_average_count": below,
                    "pass_rate": pass_rate
                })

        # 4. Handle empty filtered sessions
        total_submissions = sessions.count()
        if total_submissions == 0:
            return Response({
                "exam_id": exam.id,
                "exam_title": exam.title,
                "total_submissions": 0,
                "average_score": 0.0,
                "highest_score": 0.0,
                "lowest_score": 0.0,
                "max_scale": max_scale,
                "score_distribution": [],
                "questions_analysis": [],
                "branch_stats": {"CS": 0, "ICT": 0, "BOTH": 0},
                "available_classes": available_classes,
                "selected_class": selected_class,
                "class_student_results": [],
                "classes_comparison": classes_comparison
            })

        scores = [float(s.total_score) for s in sessions]
        avg_score = round(sum(scores) / total_submissions, 2)
        highest_score = round(max(scores), 2)
        lowest_score = round(min(scores), 2)

        # 5. Score distribution brackets
        step = max_scale / 5.0
        brackets = [
            {"range": f"0 - {step:.1f}", "count": 0, "min": 0, "max": step},
            {"range": f"{step:.1f} - {2*step:.1f}", "count": 0, "min": step, "max": 2*step},
            {"range": f"{2*step:.1f} - {3*step:.1f}", "count": 0, "min": 2*step, "max": 3*step},
            {"range": f"{3*step:.1f} - {4*step:.1f}", "count": 0, "min": 3*step, "max": 4*step},
            {"range": f"{4*step:.1f} - {max_scale:.1f}", "count": 0, "min": 4*step, "max": max_scale + 0.01},
        ]
        for sc in scores:
            for b in brackets:
                if b['min'] <= sc < b['max'] or (sc == max_scale and b['max'] >= max_scale):
                    b['count'] += 1
                    break

        # 6. Branch stats
        cs_count = sessions.filter(selected_branch=ExamSession.BranchSelected.CS).count()
        ict_count = sessions.filter(selected_branch=ExamSession.BranchSelected.ICT).count()
        both_count = sessions.filter(selected_branch=ExamSession.BranchSelected.BOTH).count()

        # 7. Detailed student scoreboard sorted by score descending, then submit_time ascending
        sorted_student_sessions = sorted(
            list(sessions),
            key=lambda s: (-float(s.total_score), s.submit_time or timezone.now())
        )
        class_student_results = []
        for rank, s in enumerate(sorted_student_sessions, start=1):
            sc = float(s.total_score)
            if sc >= 0.8 * max_scale:
                grade_code = 'XUAT_SAC'
                grade_label = 'Xuất sắc'
            elif sc >= 0.7 * max_scale:
                grade_code = 'GIOI'
                grade_label = 'Giỏi'
            elif sc >= 0.55 * max_scale:
                grade_code = 'KHA'
                grade_label = 'Khá'
            elif sc >= 0.4 * max_scale:
                grade_code = 'TRUNG_BINH'
                grade_label = 'Trung bình'
            else:
                grade_code = 'YEU'
                grade_label = 'Chưa đạt'

            enrolled_first = s.student.enrolled_classrooms.first()
            cls_display = s.student.class_name or (enrolled_first.name if enrolled_first else 'Chưa phân lớp')

            class_student_results.append({
                "rank": rank,
                "session_id": s.id,
                "student_id": s.student.id,
                "full_name": s.student.full_name or s.student.username,
                "username": s.student.username,
                "student_code": s.student.student_id or s.student.username,
                "class_name": cls_display,
                "part1_score": float(s.part1_score),
                "part2_score": float(s.part2_score),
                "total_score": float(s.total_score),
                "selected_branch": s.selected_branch,
                "submit_time": s.submit_time.strftime('%H:%M:%S %d/%m/%Y') if s.submit_time else '-',
                "violation_count": s.violation_count,
                "status": s.status,
                "grade_classification": grade_code,
                "grade_classification_display": grade_label
            })

        # 8. Question difficulty & discrimination index
        questions_qs = exam.questions.all().order_by('part_type', 'branch', 'order_index')
        questions_analysis = []

        sorted_sessions = list(sessions.order_by('-total_score'))
        k = max(1, int(len(sorted_sessions) * 0.27))
        top_group_ids = set(s.id for s in sorted_sessions[:k])
        bot_group_ids = set(s.id for s in sorted_sessions[-k:])

        for q in questions_qs:
            answers = StudentAnswer.objects.filter(session__in=sessions, question=q)
            ans_count = answers.count()
            if ans_count == 0:
                continue

            if q.part_type == Question.PartType.PART_I:
                correct_count = answers.filter(is_correct=True).count()
                facility_index = round((correct_count / ans_count) * 100, 1)

                top_correct = answers.filter(session_id__in=top_group_ids, is_correct=True).count()
                bot_correct = answers.filter(session_id__in=bot_group_ids, is_correct=True).count()
                discrimination = round((top_correct - bot_correct) / k, 2) if k > 0 else 0.0
            else:
                total_subitems = sum(a.correct_subitems_count for a in answers)
                max_subitems = ans_count * 4
                facility_index = round((total_subitems / max_subitems) * 100, 1) if max_subitems > 0 else 0.0
                discrimination = 0.5

            diff_level = "Dễ" if facility_index >= 70 else ("Trung bình" if facility_index >= 40 else "Khó / Phân hóa cao")

            questions_analysis.append({
                "question_id": q.id,
                "part_type": q.part_type,
                "branch": q.branch,
                "order_index": q.order_index,
                "content_snippet": (q.content[:80] + '...') if len(q.content) > 80 else q.content,
                "facility_index": facility_index,
                "difficulty_label": diff_level,
                "discrimination_index": discrimination,
                "competency_category": q.competency_category
            })

        return Response({
            "exam_id": exam.id,
            "exam_title": exam.title,
            "total_submissions": total_submissions,
            "average_score": avg_score,
            "highest_score": highest_score,
            "lowest_score": lowest_score,
            "max_scale": max_scale,
            "score_distribution": brackets,
            "questions_analysis": questions_analysis,
            "branch_stats": {
                "CS": cs_count,
                "ICT": ict_count,
                "BOTH": both_count
            },
            "available_classes": available_classes,
            "selected_class": selected_class,
            "class_student_results": class_student_results,
            "classes_comparison": classes_comparison
        })


class QuestionFeedbackViewSet(viewsets.ModelViewSet):
    """
    API for students to submit dispute/feedback on questions and
    for teachers/admins to review, accept, correct answer key, and auto-regrade.
    """
    serializer_class = QuestionFeedbackSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == User.Role.ADMIN or user.is_superuser:
            return QuestionFeedback.objects.all().order_by('-created_at')
        if user.role == User.Role.TEACHER:
            # Feedbacks for exams created by or shared with teacher
            return QuestionFeedback.objects.filter(
                models.Q(exam__creator=user) |
                models.Q(exam__shared_teachers=user) |
                models.Q(exam__is_shared_with_all_teachers=True)
            ).distinct().order_by('-created_at')
        # Student sees own feedbacks
        return QuestionFeedback.objects.filter(student=user).order_by('-created_at')

    def perform_create(self, serializer):
        serializer.save(student=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[IsTeacherOrAdminOrReadOnly])
    def review(self, request, pk=None):
        """
        Teacher or Admin reviews a feedback.
        Payload:
        {
            "status": "ACCEPTED" or "REJECTED",
            "teacher_reply": "...",
            "correct_option_id": 123,           # For Part 1 if updating answer key
            "part2_correct_keys": {"124": True, "125": False}, # For Part 2 if updating
            "auto_regrade": True
        }
        """
        feedback = self.get_object()
        new_status = request.data.get('status')
        teacher_reply = request.data.get('teacher_reply', '').strip()
        correct_option_id = request.data.get('correct_option_id')
        part2_correct_keys = request.data.get('part2_correct_keys')
        auto_regrade = bool(request.data.get('auto_regrade', True))

        if new_status not in [QuestionFeedback.Status.ACCEPTED, QuestionFeedback.Status.REJECTED]:
            return Response({"detail": "Trạng thái không hợp lệ. Chọn ACCEPTED hoặc REJECTED."}, status=status.HTTP_400_BAD_REQUEST)

        feedback.status = new_status
        feedback.teacher_reply = teacher_reply
        feedback.reviewed_by = request.user
        feedback.save()

        regrade_result = None
        regraded_msg = ""

        # If ACCEPTED and teacher updated answer keys:
        if new_status == QuestionFeedback.Status.ACCEPTED:
            question = feedback.question
            key_updated = False

            # Part 1: Update correct option
            if correct_option_id:
                try:
                    target_opt = question.options.get(id=correct_option_id)
                    question.options.all().update(is_correct=False)
                    target_opt.is_correct = True
                    target_opt.save()
                    key_updated = True
                except QuestionOption.DoesNotExist:
                    pass

            # Part 2: Update subitems correct boolean
            if isinstance(part2_correct_keys, dict) and len(part2_correct_keys) > 0:
                for opt_id, is_corr in part2_correct_keys.items():
                    question.options.filter(id=opt_id).update(is_correct=bool(is_corr))
                key_updated = True

            # Trigger automatic regrade if requested
            if auto_regrade:
                from assessment.matrix_engine import ScoringMatrixEngine
                regrade_result = ScoringMatrixEngine.regrade_all_sessions_for_exam(feedback.exam.id)
                regraded_msg = f"Đã tự động chấm lại {regrade_result['regraded_sessions_count']} bài thi. Có {regrade_result['score_changed_count']} thí sinh được cập nhật điểm số mới!"

        msg = f"Đã duyệt phản ánh #{feedback.id} thành công ({feedback.get_status_display()})."
        if regraded_msg:
            msg += f" {regraded_msg}"

        return Response({
            "message": msg,
            "feedback": QuestionFeedbackSerializer(feedback).data,
            "regrade_result": regrade_result
        })


# ========================================================================
# CA THI (EXAM SITTING) VIEWSET
# ========================================================================

class ExamSittingViewSet(viewsets.ModelViewSet):
    """CRUD + Kích hoạt / Thu hồi / Bảng kết quả Ca thi"""
    serializer_class = ExamSittingSerializer
    permission_classes = [IsTeacherOrAdmin]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.role == User.Role.ADMIN:
            return ExamSitting.objects.all()
        return ExamSitting.objects.filter(models.Q(creator=user) | models.Q(creator__isnull=True))

    def perform_create(self, serializer):
        serializer.save(creator=self.request.user)

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.delete()

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Kích hoạt Ca thi → đánh dấu is_active=True, các đề gắn kèm cũng is_assigned=True"""
        sitting = self.get_object()

        if sitting.exams.count() == 0:
            return Response({
                "success": False,
                "detail": "Ca thi chưa gắn đề thi nào. Vui lòng thêm ít nhất 1 đề."
            }, status=status.HTTP_400_BAD_REQUEST)

        sitting.is_active = True
        sitting.save(update_fields=['is_active', 'updated_at'])

        # Đánh dấu các exam liên kết là is_assigned=True
        for exam in sitting.exams.all():
            if not exam.is_assigned:
                exam.is_assigned = True
                exam.is_active = True
                # Kế thừa cấu hình từ ca thi vào đề
                if sitting.assigned_classes:
                    exam.assigned_classes = sitting.assigned_classes
                if sitting.start_time:
                    exam.assigned_start_time = sitting.start_time
                if sitting.end_time:
                    exam.assigned_end_time = sitting.end_time
                if sitting.max_attempts:
                    exam.max_attempts = sitting.max_attempts
                exam.allow_run_code = sitting.allow_run_code
                exam.show_score_after_test = sitting.show_score_after_test
                exam.show_explanation_after_test = sitting.show_explanation_after_test
                exam.save()

        return Response({
            "success": True,
            "message": f"Ca thi '{sitting.name}' đã được kích hoạt với {sitting.exams.count()} đề thi.",
            "room_code": sitting.room_code,
            "data": ExamSittingSerializer(sitting, context={'request': request}).data
        })

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Thu hồi Ca thi → is_active=False"""
        sitting = self.get_object()
        sitting.is_active = False
        sitting.save(update_fields=['is_active', 'updated_at'])
        return Response({
            "success": True,
            "message": f"Ca thi '{sitting.name}' đã được thu hồi.",
            "data": ExamSittingSerializer(sitting, context={'request': request}).data
        })

    @action(detail=True, methods=['get'])
    def results(self, request, pk=None):
        """Bảng kết quả tổng hợp tất cả học sinh trong Ca thi"""
        from assessment.models import ExamSession
        sitting = self.get_object()

        # Lấy tất cả assignment trong ca thi
        assignments = SittingAssignment.objects.filter(
            sitting=sitting
        ).select_related('student', 'exam')

        results = []
        for assignment in assignments:
            # Tìm session mới nhất (SUBMITTED hoặc LOCKED_VIOLATION)
            session = ExamSession.objects.filter(
                student=assignment.student,
                exam=assignment.exam,
                status__in=[ExamSession.Status.SUBMITTED, ExamSession.Status.LOCKED_VIOLATION]
            ).order_by('-submit_time').first()

            # Nếu chưa nộp, tìm session IN_PROGRESS
            in_progress = None
            if not session:
                in_progress = ExamSession.objects.filter(
                    student=assignment.student,
                    exam=assignment.exam,
                    status=ExamSession.Status.IN_PROGRESS
                ).first()

            results.append({
                'student_id': assignment.student.id,
                'student_name': assignment.student.full_name,
                'student_class': assignment.student.class_name or '',
                'student_id_code': assignment.student.student_id or '',
                'exam_id': assignment.exam.id,
                'exam_title': assignment.exam.title,
                'session_id': session.id if session else (in_progress.id if in_progress else None),
                'status': session.status if session else (in_progress.status if in_progress else 'NOT_STARTED'),
                'total_score': float(session.total_score) if session else None,
                'part1_score': float(session.part1_score) if session else None,
                'part2_score': float(session.part2_score) if session else None,
                'submit_time': session.submit_time.isoformat() if session and session.submit_time else None,
                'violation_count': session.violation_count if session else (in_progress.violation_count if in_progress else 0),
            })

        # Sắp xếp theo lớp → điểm giảm dần
        results.sort(key=lambda r: (r['student_class'], -(r['total_score'] or 0)))

        # Thống kê tổng quan
        submitted_results = [r for r in results if r['status'] == 'SUBMITTED']
        scores = [r['total_score'] for r in submitted_results if r['total_score'] is not None]

        summary = {
            'sitting_id': sitting.id,
            'sitting_name': sitting.name,
            'room_code': sitting.room_code,
            'total_assigned': len(results),
            'total_submitted': len(submitted_results),
            'total_in_progress': sum(1 for r in results if r['status'] == 'IN_PROGRESS'),
            'total_not_started': sum(1 for r in results if r['status'] == 'NOT_STARTED'),
            'average_score': round(sum(scores) / len(scores), 2) if scores else None,
            'highest_score': max(scores) if scores else None,
            'lowest_score': min(scores) if scores else None,
        }

        return Response({
            "success": True,
            "summary": summary,
            "results": results
        })

    @action(detail=True, methods=['get', 'post'])
    def broadcasts(self, request, pk=None):
        sitting = self.get_object()
        from assessment.models import ExamBroadcast
        
        if request.method == 'GET':
            broadcasts = ExamBroadcast.objects.filter(sitting=sitting).order_by('-created_at')
            data = [{"id": b.id, "message": b.message, "created_at": b.created_at} for b in broadcasts]
            return Response(data)
            
        elif request.method == 'POST':
            if request.user.role not in ['ADMIN', 'TEACHER'] and not request.user.is_superuser:
                return Response({"detail": "Không có quyền gửi thông báo."}, status=status.HTTP_403_FORBIDDEN)
                
            message = request.data.get('message', '').strip()
            if not message:
                return Response({"detail": "Nội dung không được để trống."}, status=status.HTTP_400_BAD_REQUEST)
                
            broadcast = ExamBroadcast.objects.create(sitting=sitting, message=message)
            return Response({
                "id": broadcast.id,
                "message": broadcast.message,
                "created_at": broadcast.created_at
            }, status=status.HTTP_201_CREATED)




