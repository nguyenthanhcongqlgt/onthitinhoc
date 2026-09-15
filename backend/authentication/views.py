from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from .serializers import (
    UserSerializer,
    RegisterSerializer,
    CustomTokenObtainPairSerializer,
    TeacherApprovalSerializer
)

User = get_user_model()

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        user_data = UserSerializer(user).data
        
        msg = "Đăng ký thành công!"
        if user.role == User.Role.TEACHER:
            msg = "Đăng ký tài khoản Giáo viên thành công. Vui lòng chờ Super Admin (Thầy Công) duyệt trước khi đăng nhập."

        return Response({
            "message": msg,
            "user": user_data
        }, status=status.HTTP_201_CREATED)

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class TeacherApprovalListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not (user.is_superuser or user.role == User.Role.ADMIN):
            return User.objects.none()
        return User.objects.filter(role=User.Role.TEACHER)

class TeacherApproveView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, user_id):
        if not (request.user.is_superuser or request.user.role == User.Role.ADMIN):
            return Response({"detail": "Chỉ có Super Admin mới có quyền duyệt giáo viên."}, status=status.HTTP_403_FORBIDDEN)
        
        try:
            target_user = User.objects.get(id=user_id, role=User.Role.TEACHER)
        except User.DoesNotExist:
            return Response({"detail": "Không tìm thấy tài khoản giáo viên này."}, status=status.HTTP_404_NOT_FOUND)

        new_status = request.data.get('status')
        if new_status not in [User.Status.ACTIVE, User.Status.REJECTED]:
            return Response({"detail": "Trạng thái không hợp lệ. Chọn ACTIVE hoặc REJECTED."}, status=status.HTTP_400_BAD_REQUEST)

        target_user.status = new_status
        target_user.save()
        return Response({
            "message": f"Đã cập nhật trạng thái giáo viên {target_user.full_name or target_user.username} thành {target_user.get_status_display()}.",
            "user": UserSerializer(target_user).data
        })


class UserManagementListView(generics.ListCreateAPIView):
    """
    Super Admin API to list, search, filter and create users.
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if not (user.is_superuser or user.role == User.Role.ADMIN):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Bạn không có quyền truy cập danh sách người dùng.")

        qs = User.objects.all().order_by('-created_at')
        role = self.request.query_params.get('role')
        status_param = self.request.query_params.get('status')
        class_name = self.request.query_params.get('class_name')
        search = self.request.query_params.get('search')

        if role:
            qs = qs.filter(role=role)
        if status_param:
            qs = qs.filter(status=status_param)
        if class_name:
            qs = qs.filter(class_name__icontains=class_name)
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(username__icontains=search) |
                Q(full_name__icontains=search) |
                Q(student_id__icontains=search) |
                Q(email__icontains=search)
            )
        return qs

    def perform_create(self, serializer):
        if not (self.request.user.is_superuser or self.request.user.role == User.Role.ADMIN):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Chỉ có Super Admin mới có quyền tạo người dùng trực tiếp.")
        user = serializer.save()
        raw_password = self.request.data.get('password')
        if raw_password:
            user.set_password(raw_password)
            user.save()


class UserBulkImportView(APIView):
    """
    Super Admin API to bulk import students or teachers.
    Payload: {"users": [{"username": "...", "full_name": "...", "role": "STUDENT", "class_name": "...", "student_id": "...", "password": "..."}, ...]}
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if not (request.user.is_superuser or request.user.role == User.Role.ADMIN):
            return Response({"detail": "Chỉ có Super Admin mới có quyền nhập người dùng hàng loạt."}, status=status.HTTP_403_FORBIDDEN)

        users_data = request.data.get('users', [])
        if not isinstance(users_data, list) or len(users_data) == 0:
            return Response({"detail": "Danh sách người dùng trống hoặc không hợp lệ."}, status=status.HTTP_400_BAD_REQUEST)

        created_count = 0
        updated_count = 0
        errors = []

        for idx, item in enumerate(users_data):
            # L4: Xử lý null username tránh str(None) -> "None"
            username_raw = item.get('username')
            username = str(username_raw).strip() if username_raw is not None else ''
            if not username:
                errors.append(f"Dòng {idx + 1}: Thiếu username.")
                continue

            full_name = str(item.get('full_name', '')).strip()
            role = str(item.get('role', User.Role.STUDENT)).upper()
            if role not in [User.Role.ADMIN, User.Role.TEACHER, User.Role.STUDENT]:
                role = User.Role.STUDENT
            
            status_val = User.Status.ACTIVE
            # H3: Theo dõi password được cung cấp hay tự tạo
            provided_password = item.get('password')
            raw_password = str(provided_password).strip() if provided_password is not None and provided_password != '' else None
            class_name = str(item.get('class_name', '')).strip()
            student_id = str(item.get('student_id', '')).strip()
            school = str(item.get('school', 'THPT Quất Lâm')).strip()
            email = str(item.get('email', f"{username}@quatlam.edu.vn")).strip()
            phone_number = str(item.get('phone_number', '')).strip()

            user_obj = User.objects.filter(username=username).first()
            if user_obj:
                user_obj.full_name = full_name or user_obj.full_name
                user_obj.role = role
                user_obj.class_name = class_name or user_obj.class_name
                user_obj.student_id = student_id or user_obj.student_id
                user_obj.school = school or user_obj.school
                user_obj.email = email or user_obj.email
                user_obj.phone_number = phone_number or user_obj.phone_number
                user_obj.status = status_val
                # H3: Chỉ đặt lại mật khẩu khi được cung cấp rõ ràng
                if raw_password:
                    user_obj.set_password(raw_password)
                user_obj.save()
                updated_count += 1
            else:
                # Sinh mật khẩu ngẫu nhiên cho user mới nếu không cung cấp
                if not raw_password:
                    import secrets
                    raw_password = secrets.token_urlsafe(8)
                user_obj = User.objects.create_user(
                    username=username,
                    email=email,
                    password=raw_password,
                    full_name=full_name,
                    role=role,
                    status=status_val,
                    class_name=class_name,
                    student_id=student_id,
                    school=school,
                    phone_number=phone_number
                )
                created_count += 1

        return Response({
            "message": f"Nhập dữ liệu thành công! Đã tạo mới {created_count} tài khoản, cập nhật {updated_count} tài khoản.",
            "created_count": created_count,
            "updated_count": updated_count,
            "errors": errors
        })


class UserStatusToggleView(APIView):
    """
    Super Admin API to activate/deactivate/reject any user account.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, user_id):
        if not (request.user.is_superuser or request.user.role == User.Role.ADMIN):
            return Response({"detail": "Chỉ có Super Admin mới có quyền thay đổi trạng thái tài khoản."}, status=status.HTTP_403_FORBIDDEN)

        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"detail": "Không tìm thấy người dùng này."}, status=status.HTTP_404_NOT_FOUND)

        # Chặn Admin tự khóa chính mình
        if target_user.id == request.user.id:
            return Response({"detail": "Bạn không thể thay đổi trạng thái tài khoản của chính mình."}, status=status.HTTP_400_BAD_REQUEST)

        new_status = request.data.get('status')
        if new_status not in [User.Status.ACTIVE, User.Status.REJECTED, User.Status.PENDING]:
            return Response({"detail": "Trạng thái không hợp lệ."}, status=status.HTTP_400_BAD_REQUEST)

        target_user.status = new_status
        target_user.save()
        return Response({
            "message": f"Đã cập nhật tài khoản {target_user.username} thành '{target_user.get_status_display()}'.",
            "user": UserSerializer(target_user).data
        })


class UserPasswordResetView(APIView):
    """
    Super Admin API to reset password for a user.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, user_id):
        if not (request.user.is_superuser or request.user.role == User.Role.ADMIN):
            return Response({"detail": "Chỉ có Super Admin mới có quyền đặt lại mật khẩu người dùng."}, status=status.HTTP_403_FORBIDDEN)

        try:
            target_user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"detail": "Không tìm thấy người dùng này."}, status=status.HTTP_404_NOT_FOUND)

        new_password = (request.data.get('new_password') or '').strip()  # M1: xử lý null
        if not new_password or len(new_password) < 6:
            return Response({"detail": "Mật khẩu mới phải có tối thiểu 6 ký tự."}, status=status.HTTP_400_BAD_REQUEST)

        target_user.set_password(new_password)
        target_user.save()
        return Response({
            "message": f"Đã đặt lại mật khẩu cho tài khoản {target_user.username} thành công!"
        })


class UserDetailUpdateView(generics.RetrieveUpdateAPIView):  # M2: bỏ Destroy để chặn xóa tài khoản
    """
    API for Super Admin and Teacher to view and update student/user info:
    - class_name (sửa lớp học)
    - full_name (sửa họ và tên)
    - student_id (sửa mã định danh/SBD)
    - phone_number, email
    """
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    queryset = User.objects.all()

    def get_object(self):
        user = self.request.user
        target_user = get_object_or_404(User, id=self.kwargs.get('pk'))

        # Permission check:
        # Admin can update anyone
        # Teacher can update Students
        # Student can update own profile only
        if user.is_superuser or user.role == User.Role.ADMIN:
            return target_user
        if user.role == User.Role.TEACHER and target_user.role == User.Role.STUDENT:
            return target_user
        if user.id == target_user.id:
            return target_user

        from rest_framework.exceptions import PermissionDenied
        raise PermissionDenied("Bạn không có quyền chỉnh sửa thông tin tài khoản này.")

    def perform_update(self, serializer):
        user = self.request.user
        target = serializer.instance  # Tránh gọi get_object() lần 2

        # Only admin can change roles or status
        if not (user.is_superuser or user.role == User.Role.ADMIN):
            serializer.save(role=target.role, status=target.status)
        else:
            serializer.save()


class SystemStatsView(APIView):
    """
    Super Admin & Teacher System Overview KPI Stats.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from exams.models import Exam, Question
        from assessment.models import ExamSession
        from django.db.models import Avg, Count

        total_students = User.objects.filter(role=User.Role.STUDENT).count()
        total_teachers = User.objects.filter(role=User.Role.TEACHER, status=User.Status.ACTIVE).count()
        pending_teachers = User.objects.filter(role=User.Role.TEACHER, status=User.Status.PENDING).count()
        total_exams = Exam.objects.count()
        active_exams = Exam.objects.filter(is_active=True, is_assigned=True).count()
        total_questions = Question.objects.count()

        sessions_qs = ExamSession.objects.filter(status__in=[ExamSession.Status.SUBMITTED, ExamSession.Status.LOCKED_VIOLATION])
        total_sessions = sessions_qs.count()
        avg_score = sessions_qs.aggregate(Avg('total_score'))['total_score__avg'] or 0.0

        # Classes distribution
        classes = User.objects.filter(role=User.Role.STUDENT).exclude(class_name='').values('class_name').annotate(count=Count('id')).order_by('-count')[:8]

        return Response({
            "total_students": total_students,
            "total_teachers": total_teachers,
            "pending_teachers": pending_teachers,
            "total_exams": total_exams,
            "active_exams": active_exams,
            "total_questions": total_questions,
            "total_completed_sessions": total_sessions,
            "average_score": round(float(avg_score), 2),
            "classes_distribution": list(classes)
        })


class ChangePasswordView(APIView):
    """
    API cho phép người dùng tự đổi mật khẩu.
    POST /auth/change-password/
    Body: { "current_password": "...", "new_password": "..." }
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        current_password = (request.data.get('current_password') or '').strip()  # M1: xử lý null
        new_password = (request.data.get('new_password') or '').strip()  # M1: xử lý null

        if not current_password or not new_password:
            return Response(
                {"detail": "Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not user.check_password(current_password):
            return Response(
                {"detail": "Mật khẩu hiện tại không đúng."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(new_password) < 6:
            return Response(
                {"detail": "Mật khẩu mới phải có ít nhất 6 ký tự."},
                status=status.HTTP_400_BAD_REQUEST
            )

        if current_password == new_password:
            return Response(
                {"detail": "Mật khẩu mới phải khác mật khẩu hiện tại."},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.set_password(new_password)
        user.save()

        return Response({"detail": "Đổi mật khẩu thành công! Vui lòng đăng nhập lại."})
