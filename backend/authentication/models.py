from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', 'Super Admin (Thầy Công)'
        TEACHER = 'TEACHER', 'Giáo viên bộ môn'
        STUDENT = 'STUDENT', 'Học sinh / Đội tuyển HSG'

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Chờ phê duyệt'
        ACTIVE = 'ACTIVE', 'Đang hoạt động'
        REJECTED = 'REJECTED', 'Đã từ chối'

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.STUDENT)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    full_name = models.CharField(max_length=150, verbose_name='Họ và tên', blank=True)
    phone_number = models.CharField(max_length=20, verbose_name='Số điện thoại', blank=True)
    school = models.CharField(max_length=150, verbose_name='Trường', default='THPT Quất Lâm')
    class_name = models.CharField(max_length=100, verbose_name='Lớp / Đội tuyển', blank=True)
    student_id = models.CharField(max_length=50, verbose_name='Mã học sinh / Số báo danh', blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Teacher registration defaults to PENDING if newly created
        if self.role == self.Role.TEACHER and not self.pk and not self.is_superuser:
            self.status = self.Status.PENDING
        if not self.full_name and (self.first_name or self.last_name):
            self.full_name = f"{self.last_name} {self.first_name}".strip()
        super().save(*args, **kwargs)

    @property
    def is_admin(self):
        return self.role == self.Role.ADMIN or self.is_superuser

    @property
    def is_teacher(self):
        return self.role == self.Role.TEACHER

    @property
    def is_student(self):
        return self.role == self.Role.STUDENT

    def __str__(self):
        return f"{self.full_name or self.username} ({self.get_role_display()} - {self.get_status_display()})"


class ClassRoom(models.Model):
    class Grade(models.TextChoices):
        GRADE_10 = '10', 'Khối 10'
        GRADE_11 = '11', 'Khối 11'
        GRADE_12 = '12', 'Khối 12'
        HSG = 'HSG', 'Đội tuyển HSG'
        OTHER = 'OTHER', 'Khác'

    name = models.CharField(max_length=150, verbose_name='Tên lớp học')
    code = models.CharField(max_length=20, unique=True, blank=True, verbose_name='Mã tham gia lớp')
    grade = models.CharField(
        max_length=20,
        choices=Grade.choices,
        default=Grade.GRADE_12,
        verbose_name='Khối lớp'
    )
    school_year = models.CharField(max_length=50, default='2025-2026', blank=True, verbose_name='Năm học')
    description = models.TextField(blank=True, verbose_name='Mô tả / Ghi chú')
    teacher = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='managed_classes',
        verbose_name='Giáo viên phụ trách'
    )
    students = models.ManyToManyField(
        User,
        blank=True,
        related_name='enrolled_classrooms',
        verbose_name='Danh sách học sinh'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Ngày tạo')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Cập nhật lần cuối')

    class Meta:
        verbose_name = 'Lớp học'
        verbose_name_plural = 'Danh sách lớp học'
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.code:
            import secrets
            # Sinh mã lớp ngẫu nhiên 6 ký tự viết hoa (vd: QL8F2A)
            for _ in range(10):
                new_code = f"QL{secrets.token_hex(2).upper()}"
                if not ClassRoom.objects.filter(code=new_code).exists():
                    self.code = new_code
                    break
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} ({self.get_grade_display()}) - GV: {self.teacher.full_name or self.teacher.username}"

