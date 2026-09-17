from django.db import models
from django.conf import settings
from exams.models import Exam, Question, QuestionOption

class ExamSession(models.Model):
    class Status(models.TextChoices):
        IN_PROGRESS = 'IN_PROGRESS', 'Đang làm bài'
        SUBMITTED = 'SUBMITTED', 'Đã nộp bài'
        LOCKED_VIOLATION = 'LOCKED_VIOLATION', 'Bị khóa do gian lận (Quá số lần chuyển tab)'
        CANCELLED = 'CANCELLED', 'Đã hủy'

    class BranchSelected(models.TextChoices):
        NONE = 'NONE', 'Chưa chọn'
        CS = 'CS', 'Khoa học Máy tính (CS)'
        ICT = 'ICT', 'Tin học Ứng dụng (ICT)'
        BOTH = 'BOTH', 'Cả CS và ICT'

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='exam_sessions',
        verbose_name='Học sinh'
    )
    exam = models.ForeignKey(
        Exam,
        on_delete=models.CASCADE,
        related_name='sessions',
        verbose_name='Đề thi'
    )
    selected_branch = models.CharField(
        max_length=10,
        choices=BranchSelected.choices,
        default=BranchSelected.NONE,
        verbose_name='Nhánh Phần II đã chọn (Hard-lock)'
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.IN_PROGRESS,
        verbose_name='Trạng thái phiên thi'
    )
    start_time = models.DateTimeField(auto_now_add=True, verbose_name='Thời gian bắt đầu')
    submit_time = models.DateTimeField(null=True, blank=True, verbose_name='Thời gian nộp bài')
    
    total_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.00, verbose_name='Tổng điểm')
    part1_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.00, verbose_name='Điểm Phần I')
    part2_score = models.DecimalField(max_digits=5, decimal_places=2, default=0.00, verbose_name='Điểm Phần II')
    
    part1_correct_count = models.IntegerField(default=0, verbose_name='Số câu đúng Phần I')
    part2_correct_subitems_count = models.IntegerField(default=0, verbose_name='Tổng số ý đúng Phần II')
    
    violation_count = models.IntegerField(default=0, verbose_name='Số lần cảnh báo vi phạm')
    is_locked = models.BooleanField(default=False, verbose_name='Đã bị khóa')
    lock_reason = models.CharField(max_length=255, blank=True, verbose_name='Lý do khóa bài')
    extra_time_minutes = models.IntegerField(default=0, verbose_name='Thời gian gia hạn thêm (phút)')
    draft_answers = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Dữ liệu câu trả lời lưu nháp định kỳ'
    )
    
    competency_scores = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='Phân tích Năng lực (% Điểm theo danh mục)'
    )

    class Meta:
        verbose_name = 'Phiên làm bài thi'
        verbose_name_plural = 'Danh sách Phiên thi'
        ordering = ['-start_time']
        indexes = [
            models.Index(fields=['student', 'exam', 'status']),
            models.Index(fields=['exam', 'status']),
        ]

    def __str__(self):
        return f"{self.student.full_name or self.student.username} - {self.exam.title} ({self.total_score}đ - {self.get_status_display()})"


class StudentAnswer(models.Model):
    session = models.ForeignKey(ExamSession, on_delete=models.CASCADE, related_name='answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    
    # For Part I (Single choice)
    selected_option = models.ForeignKey(
        QuestionOption,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='selected_by_answers'
    )
    selected_option_label = models.CharField(max_length=10, blank=True, verbose_name='Chữ cái đáp án chọn (A, B, C, D)')
    question_order_index = models.IntegerField(default=1, verbose_name='Thứ tự câu hỏi')
    
    # For Part II (True/False per subitem)
    # Format: {"<option_id>": true/false, ...} or {"a": true, "b": false, ...}
    part2_answers = models.JSONField(default=dict, blank=True)
    
    is_correct = models.BooleanField(default=False, verbose_name='Đúng hoàn toàn (Part I)')
    correct_subitems_count = models.IntegerField(default=0, verbose_name='Số ý đúng (Part II)')
    score_awarded = models.DecimalField(max_digits=4, decimal_places=2, default=0.00, verbose_name='Điểm đạt được')

    class Meta:
        verbose_name = 'Câu trả lời của thí sinh'
        verbose_name_plural = 'Chi tiết Câu trả lời'
        unique_together = ('session', 'question')
        indexes = [
            models.Index(fields=['session', 'question']),
        ]

    def __str__(self):
        return f"Session {self.session.id} - Q{self.question.id} ({self.score_awarded}đ)"


class ViolationLog(models.Model):
    class ViolationType(models.TextChoices):
        TAB_SWITCH = 'TAB_SWITCH', 'Chuyển Tab / Cửa sổ khác'
        FULLSCREEN_EXIT = 'FULLSCREEN_EXIT', 'Thoát chế độ Toàn màn hình'
        WINDOW_BLUR = 'WINDOW_BLUR', 'Mất tiêu điểm chuột (Window Blur)'
        DEVTOOLS_KEY = 'DEVTOOLS_KEY', 'Cố gắng nhấn phím mở DevTools (F12/Ctrl+Shift+I)'
        COPY_PASTE = 'COPY_PASTE', 'Cố gắng Sao chép / Dán dữ liệu'

    session = models.ForeignKey(ExamSession, on_delete=models.CASCADE, related_name='violations')
    violation_type = models.CharField(max_length=30, choices=ViolationType.choices, default=ViolationType.TAB_SWITCH)
    violation_number = models.IntegerField(default=1, verbose_name='Lần vi phạm thứ')
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.TextField(blank=True, verbose_name='Thông tin chi tiết (URL, user-agent...)')

    class Meta:
        verbose_name = 'Nhật ký Vi phạm'
        verbose_name_plural = 'Nhật ký Vi phạm thi cử'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['session', 'timestamp']),
        ]

    def __str__(self):
        return f"Session {self.session.id} - {self.get_violation_type_display()} (Lần {self.violation_number})"

class ExamBroadcast(models.Model):
    sitting = models.ForeignKey(
        'exams.ExamSitting',
        on_delete=models.CASCADE,
        related_name='broadcasts',
        verbose_name='Ca thi'
    )
    message = models.TextField(verbose_name='Nội dung thông báo')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Thời gian tạo')

    class Meta:
        verbose_name = 'Thông báo phiên thi'
        verbose_name_plural = 'Thông báo phiên thi'
        ordering = ['-created_at']

    def __str__(self):
        return f"Broadcast for Session {self.sitting_id}"

