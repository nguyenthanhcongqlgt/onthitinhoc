from rest_framework import generics, status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, NotFound, ValidationError
from django.shortcuts import get_object_or_404
from django.db.models import Q

from .models import User, ClassRoom
from .serializers import UserSerializer
from .class_serializers import (
    ClassRoomSerializer,
    ClassRoomDetailSerializer,
    ManageClassStudentsSerializer,
    JoinClassByCodeSerializer
)


class ClassRoomListCreateView(generics.ListCreateAPIView):
    """
    API Danh sách & Tạo mới lớp học.
    - Teacher: Thấy các lớp do mình quản lý.
    - Admin: Thấy tất cả lớp trong trường.
    - Student: Thấy các lớp mình đang theo học.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        return ClassRoomSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.role == User.Role.ADMIN:
            return ClassRoom.objects.all().select_related('teacher').prefetch_related('students')
        elif user.role == User.Role.TEACHER:
            return ClassRoom.objects.filter(teacher=user).select_related('teacher').prefetch_related('students')
        elif user.role == User.Role.STUDENT:
            return ClassRoom.objects.filter(students=user).select_related('teacher').prefetch_related('students')
        return ClassRoom.objects.none()

    def perform_create(self, serializer):
        user = self.request.user
        if not (user.is_superuser or user.role in [User.Role.ADMIN, User.Role.TEACHER]):
            raise PermissionDenied("Chỉ Giáo viên và Quản trị viên mới có quyền tạo lớp học.")
        serializer.save(teacher=user)


class ClassRoomDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    API Xem chi tiết, cập nhật và xóa lớp học.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return ClassRoomDetailSerializer
        return ClassRoomSerializer

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser or user.role == User.Role.ADMIN:
            return ClassRoom.objects.all().select_related('teacher').prefetch_related('students')
        elif user.role == User.Role.TEACHER:
            return ClassRoom.objects.filter(teacher=user).select_related('teacher').prefetch_related('students')
        return ClassRoom.objects.filter(students=user).select_related('teacher').prefetch_related('students')

    def check_object_permissions(self, request, obj):
        super().check_object_permissions(request, obj)
        user = request.user
        # Sửa hoặc xóa chỉ dành cho giáo viên tạo lớp hoặc admin
        if request.method in ['PUT', 'PATCH', 'DELETE']:
            if not (user.is_superuser or user.role == User.Role.ADMIN or obj.teacher_id == user.id):
                raise PermissionDenied("Bạn không có quyền chỉnh sửa hoặc xóa lớp học này.")


class ClassRoomStudentsView(APIView):
    """
    API thêm hoặc xóa học sinh khỏi lớp học:
    - POST: Thêm danh sách học sinh (student_ids: [1, 2, 3])
    - DELETE: Xóa 1 học sinh (student_id qua URL hoặc body)
    """
    permission_classes = [permissions.IsAuthenticated]

    def _get_class_and_check_perm(self, request, pk):
        classroom = get_object_or_404(ClassRoom, id=pk)
        user = request.user
        if not (user.is_superuser or user.role == User.Role.ADMIN or classroom.teacher_id == user.id):
            raise PermissionDenied("Bạn không có quyền quản lý học sinh của lớp học này.")
        return classroom

    def post(self, request, pk):
        classroom = self._get_class_and_check_perm(request, pk)
        serializer = ManageClassStudentsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        student_ids = serializer.validated_data['student_ids']
        valid_students = User.objects.filter(id__in=student_ids, role=User.Role.STUDENT)

        added_count = 0
        for student in valid_students:
            if not classroom.students.filter(id=student.id).exists():
                classroom.students.add(student)
                added_count += 1
                # Cập nhật tên lớp mặc định cho học sinh nếu học sinh chưa có tên lớp
                if not student.class_name or not student.class_name.strip():
                    student.class_name = classroom.name
                    student.save(update_fields=['class_name'])

        return Response({
            "detail": f"Đã thêm thành công {added_count} học sinh vào lớp {classroom.name}.",
            "students_count": classroom.students.count()
        })

    def delete(self, request, pk, student_id=None):
        classroom = self._get_class_and_check_perm(request, pk)
        target_student_id = student_id or request.data.get('student_id')

        if not target_student_id:
            return Response({"detail": "Vui lòng cung cấp ID học sinh cần xóa khỏi lớp."}, status=status.HTTP_400_BAD_REQUEST)

        student = get_object_or_404(User, id=target_student_id)
        if classroom.students.filter(id=student.id).exists():
            classroom.students.remove(student)
            return Response({
                "detail": f"Đã xóa học sinh {student.full_name or student.username} khỏi lớp {classroom.name}.",
                "students_count": classroom.students.count()
            })
        return Response({"detail": "Học sinh này không thuộc lớp học."}, status=status.HTTP_400_BAD_REQUEST)


class JoinClassByCodeView(APIView):
    """
    API dành cho Học sinh nhập mã tham gia lớp học.
    POST /api/classes/join/
    Body: { "code": "QLABCD" }
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.role != User.Role.STUDENT:
            return Response({"detail": "Chỉ học sinh mới có thể tham gia lớp học bằng mã."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = JoinClassByCodeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        code = serializer.validated_data['code'].strip().upper()
        classroom = ClassRoom.objects.filter(code=code).first()

        if not classroom:
            return Response({"detail": "Mã lớp học không tồn tại. Vui lòng kiểm tra lại với Thầy/Cô."}, status=status.HTTP_404_NOT_FOUND)

        if classroom.students.filter(id=user.id).exists():
            return Response({"detail": f"Bạn đã tham gia lớp {classroom.name} trước đó rồi.", "class_id": classroom.id})

        classroom.students.add(user)
        if not user.class_name or not user.class_name.strip():
            user.class_name = classroom.name
            user.save(update_fields=['class_name'])

        return Response({
            "detail": f"Tham gia lớp '{classroom.name}' thành công!",
            "classroom": ClassRoomSerializer(classroom).data
        })


class AvailableStudentsView(APIView):
    """
    API lấy danh sách học sinh của trường để Giáo viên tìm và thêm vào lớp học.
    GET /api/classes/available-students/?search=...&class_name=...
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if not (user.is_superuser or user.role in [User.Role.ADMIN, User.Role.TEACHER]):
            raise PermissionDenied("Chỉ Giáo viên và Admin mới có quyền tra cứu danh sách học sinh.")

        search = request.query_params.get('search', '').strip()
        class_name = request.query_params.get('class_name', '').strip()

        qs = User.objects.filter(role=User.Role.STUDENT, status=User.Status.ACTIVE)

        if search:
            qs = qs.filter(
                Q(username__icontains=search) |
                Q(full_name__icontains=search) |
                Q(student_id__icontains=search)
            )

        if class_name:
            qs = qs.filter(class_name__icontains=class_name)

        qs = qs.order_by('full_name', 'username')[:100]  # Giới hạn 100 kết quả
        return Response(UserSerializer(qs, many=True).data)
