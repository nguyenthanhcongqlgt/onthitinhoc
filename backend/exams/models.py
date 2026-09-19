from django.db import models
from django.conf import settings

MATRIX_PRESETS = {
    'HSG_NINHBINH': {
        "1": 0.3,
        "2": 0.6,
        "3": 1.0,
        "4": 1.6
    },
    'HSG_QUAT_LAM': {
        "1": 0.3,
        "2": 0.6,
        "3": 1.0,
        "4": 1.6
    },
    'BGD_2025': {
        "1": 0.1,
        "2": 0.25,
        "3": 0.5,
        "4": 1.0
    },
    'LINEAR_EQUAL': {
        "1": 0.25,
        "2": 0.5,
        "3": 0.75,
        "4": 1.0
    }
}

def default_part2_matrix():
    return MATRIX_PRESETS['HSG_NINHBINH']

class ExamFolder(models.Model):
    name = models.CharField(max_length=255, verbose_name='Tên thư mục')
    description = models.TextField(blank=True, verbose_name='Mô tả chi tiết')
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='children',
        verbose_name='Thư mục cha'
    )
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_exam_folders',
        verbose_name='Người tạo'
    )
    is_shared = models.BooleanField(
        default=False,
        verbose_name='Thư mục dùng chung toàn trường / tổ bộ môn'
    )
    color = models.CharField(max_length=30, default='blue', verbose_name='Màu sắc hiển thị')
    icon = models.CharField(max_length=50, default='folder', verbose_name='Biểu tượng icon')
    order_index = models.IntegerField(default=1, verbose_name='Thứ tự sắp xếp')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Thư mục đề thi'
        verbose_name_plural = 'Quản lý Thư mục đề thi'
        ordering = ['order_index', 'name']
        indexes = [
            models.Index(fields=['parent', 'order_index']),
            models.Index(fields=['creator', 'is_shared']),
        ]

    def __str__(self):
        return self.get_full_path()

    def get_full_path(self) -> str:
        names = [self.name]
        curr = self.parent
        visited = {self.id}
        while curr and curr.id not in visited:
            names.append(curr.name)
            visited.add(curr.id)
            curr = curr.parent
        return ' / '.join(reversed(names))

    def get_all_descendant_ids(self) -> list:
        descendants = [self.id]
        to_check = [self.id]
        while to_check:
            child_ids = list(ExamFolder.objects.filter(parent_id__in=to_check).values_list('id', flat=True))
            if not child_ids:
                break
            descendants.extend(child_ids)
            to_check = child_ids
        return descendants


class Exam(models.Model):
    class ExamType(models.TextChoices):
        HSG = 'HSG', 'Đề thi Học sinh giỏi (HSG THPT)'
        TN_THPT = 'TN_THPT', 'Đề ôn luyện thi Tốt nghiệp THPT'

    class AccessType(models.TextChoices):
        PUBLIC = 'PUBLIC', 'Tất cả học sinh (Công khai)'
        PROTECTED = 'PROTECTED', 'Cần mã Access Code'
        ASSIGNED = 'ASSIGNED', 'Chỉ định theo Lớp / Đội tuyển'

    class MatrixPreset(models.TextChoices):
        HSG_NINHBINH = 'HSG_NINHBINH', 'Chuẩn Đề thi HSG (30 câu P1 = 12đ, 7 câu P2 = 8đ, Thang 20đ)'
        HSG_QUAT_LAM = 'HSG_QUAT_LAM', 'Chuẩn HSG THPT Quất Lâm (30 câu P1 = 12đ, 7 câu P2 = 8đ, Thang 20đ)'
        BGD_2025 = 'BGD_2025', 'Chuẩn Đề thi Tốt nghiệp THPT Bộ GD&ĐT (24 câu P1 = 6đ, 6 câu P2 = 4đ, Thang 10đ)'
        LINEAR_EQUAL = 'LINEAR_EQUAL', 'Tuyến tính Đều (1=0.25, 2=0.5, 3=0.75, 4=1.0đ)'
        CUSTOM = 'CUSTOM', 'Tùy chỉnh Ma trận Điểm'

    class BranchMode(models.TextChoices):
        SINGLE = 'SINGLE', 'Học sinh chỉ được phép làm CS hoặc ICT (Chọn 1 trong 2)'
        BOTH = 'BOTH', 'Học sinh được phép làm cả CS và ICT (Thời gian giữ nguyên)'

    title = models.CharField(max_length=255, verbose_name='Tên đề thi')
    description = models.TextField(blank=True, verbose_name='Mô tả / Hướng dẫn')
    folder = models.ForeignKey(
        ExamFolder,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='exams',
        verbose_name='Thư mục đề thi'
    )
    exam_type = models.CharField(
        max_length=20,
        choices=ExamType.choices,
        default=ExamType.HSG,
        verbose_name='Phân loại đề thi'
    )
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_exams',
        verbose_name='Người tạo đề'
    )
    shared_teachers = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name='shared_exams',
        verbose_name='Giáo viên được chia sẻ quyền sử dụng'
    )
    is_shared_with_all_teachers = models.BooleanField(
        default=False,
        verbose_name='Chia sẻ công khai cho tất cả giáo viên'
    )
    duration_minutes = models.IntegerField(default=50, verbose_name='Thời gian làm bài (Phút)')
    access_type = models.CharField(
        max_length=20,
        choices=AccessType.choices,
        default=AccessType.PUBLIC,
        verbose_name='Chế độ truy cập'
    )
    access_code = models.CharField(max_length=50, blank=True, verbose_name='Mã truy cập / Mật khẩu đề')
    allowed_classes = models.TextField(
        blank=True,
        help_text='Danh sách lớp được phép thi, phân cách bởi dấu phẩy (vd: 12A1, 12A2, Đội tuyển HSG)',
        verbose_name='Lớp được phân quyền'
    )
    is_active = models.BooleanField(default=True, verbose_name='Kích hoạt')

    # Assignment logic: Phải giao đề thì HS mới được làm
    is_assigned = models.BooleanField(default=False, verbose_name='Đã giao đề cho học sinh')
    assigned_classes = models.TextField(
        blank=True,
        default='Toàn trường',
        help_text='Danh sách lớp được giao đề (vd: 12A1, 12A2, Đội tuyển HSG, Toàn trường)',
        verbose_name='Lớp được giao'
    )
    assigned_start_time = models.DateTimeField(null=True, blank=True, verbose_name='Thời gian bắt đầu mở đề')
    assigned_end_time = models.DateTimeField(null=True, blank=True, verbose_name='Hạn chót nộp bài')
    max_attempts = models.IntegerField(default=1, verbose_name='Số lần làm bài tối đa')
    show_score_after_test = models.BooleanField(default=True, verbose_name='Cho phép học sinh xem điểm số sau khi thi')
    show_explanation_after_test = models.BooleanField(default=True, verbose_name='Cho phép học sinh xem lời giải & đáp án chi tiết sau khi thi')
    branch_mode = models.CharField(
        max_length=20,
        choices=BranchMode.choices,
        default=BranchMode.SINGLE,
        verbose_name='Chế độ phân nhánh chuyên đề Phần II'
    )
    
    # Anti-Cheat configurations
    max_tab_violations = models.IntegerField(default=5, verbose_name='Số lần tối đa chuyển tab/cửa sổ')
    allow_run_code = models.BooleanField(default=True, verbose_name='Cho phép học sinh chạy thử Code (IDE)')
    shuffle_questions = models.BooleanField(default=True, verbose_name='Đảo thứ tự câu hỏi')
    shuffle_options = models.BooleanField(default=True, verbose_name='Đảo thứ tự phương án A/B/C/D')
    
    # Scoring configurations
    part1_total_points = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=12.00,
        verbose_name='Tổng điểm Phần I (Trắc nghiệm)'
    )
    part2_total_points = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=8.00,
        verbose_name='Tổng điểm Phần II (Đúng / Sai)'
    )
    total_points = models.DecimalField(
        max_digits=6,
        decimal_places=2,
        default=20.00,
        verbose_name='Tổng điểm bài thi'
    )
    part1_point_per_question = models.DecimalField(
        max_digits=4,
        decimal_places=2,
        default=0.50,
        verbose_name='Điểm mỗi câu Phần I (Mặc định)'
    )
    matrix_preset = models.CharField(
        max_length=30,
        choices=MatrixPreset.choices,
        default=MatrixPreset.HSG_QUAT_LAM,
        verbose_name='Preset Ma trận chấm Phần II'
    )
    part2_matrix_rules = models.JSONField(
        default=default_part2_matrix,
        verbose_name='Ma trận điểm Phần II (Số ý đúng -> Điểm)'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def get_effective_matrix_rules(self) -> dict:
        """Returns active scoring matrix rules based on preset or custom rules"""
        if self.matrix_preset in MATRIX_PRESETS:
            return MATRIX_PRESETS[self.matrix_preset]
        return self.part2_matrix_rules or MATRIX_PRESETS['HSG_QUAT_LAM']

    class Meta:
        verbose_name = 'Đề thi'
        verbose_name_plural = 'Danh sách Đề thi'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['is_active', 'is_assigned']),
            models.Index(fields=['folder', 'is_active']),
        ]

    def __str__(self):
        return f"{self.title} ({self.duration_minutes} phút)"


class Question(models.Model):
    class PartType(models.TextChoices):
        PART_I = 'PART_I', 'Phần I: Trắc nghiệm 4 lựa chọn'
        PART_II = 'PART_II', 'Phần II: Đúng / Sai'

    class Branch(models.TextChoices):
        COMMON = 'COMMON', 'Phần Chung (Bắt buộc)'
        CS = 'CS', 'Khoa học Máy tính (CS)'
        ICT = 'ICT', 'Tin học Ứng dụng (ICT)'

    class CompetencyCategory(models.TextChoices):
        PROG_BASIC = 'PROG_BASIC', 'Lập trình & Cú pháp cơ bản'
        ALGO_DS = 'ALGO_DS', 'Thuật toán & Cấu trúc Dữ liệu'
        OPTIMIZATION = 'OPTIMIZATION', 'Tối ưu hóa & Độ phức tạp'
        DB_NETWORK = 'DB_NETWORK', 'Cơ sở Dữ liệu & Mạng máy tính'
        ICT_APP = 'ICT_APP', 'Ứng dụng Tin học & Đa phương tiện'

    class Difficulty(models.TextChoices):
        NB = 'NB', 'Nhận biết'
        TH = 'TH', 'Thông hiểu'
        VD = 'VD', 'Vận dụng'
        VDC = 'VDC', 'Vận dụng cao'

    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='questions', verbose_name='Đề thi')
    part_type = models.CharField(max_length=20, choices=PartType.choices, default=PartType.PART_I, verbose_name='Phần đề thi')
    branch = models.CharField(max_length=20, choices=Branch.choices, default=Branch.COMMON, verbose_name='Phân nhánh chuyên đề')
    order_index = models.IntegerField(default=1, verbose_name='Thứ tự gốc')
    point = models.DecimalField(max_digits=5, decimal_places=2, default=0.50, verbose_name='Điểm của câu hỏi')
    content = models.TextField(verbose_name='Nội dung câu hỏi (hỗ trợ LaTeX / Markdown)')
    
    code_snippet = models.TextField(blank=True, verbose_name='Đoạn mã code (Code Snippet)')
    code_language = models.CharField(max_length=30, default='python', verbose_name='Ngôn ngữ code (python / cpp / c / java)')
    
    competency_category = models.CharField(
        max_length=50,
        choices=CompetencyCategory.choices,
        default=CompetencyCategory.PROG_BASIC,
        verbose_name='Ma trận Năng lực'
    )
    difficulty_level = models.CharField(
        max_length=20,
        choices=Difficulty.choices,
        default=Difficulty.TH,
        verbose_name='Mức độ tư duy'
    )
    explanation = models.TextField(blank=True, verbose_name='Lời giải / Hướng dẫn chi tiết')

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Câu hỏi'
        verbose_name_plural = 'Ngân hàng Câu hỏi'
        ordering = ['part_type', 'branch', 'order_index']
        indexes = [
            models.Index(fields=['exam', 'part_type', 'order_index']),
            models.Index(fields=['exam', 'branch']),
        ]

    def __str__(self):
        return f"[{self.get_part_type_display()} - {self.get_branch_display()}] Câu {self.order_index}: {self.content[:60]}..."


class QuestionOption(models.Model):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='options', verbose_name='Câu hỏi')
    label = models.CharField(max_length=10, verbose_name='Ký hiệu (A/B/C/D hoặc a/b/c/d)')
    content = models.TextField(verbose_name='Nội dung phương án')
    code_snippet = models.TextField(blank=True, verbose_name='Mã code của phương án (nếu có)')
    is_correct = models.BooleanField(default=False, verbose_name='Là đáp án đúng (hoặc Đúng trong Part II)')
    order_index = models.IntegerField(default=1, verbose_name='Thứ tự')
    explanation = models.TextField(blank=True, verbose_name='Lời giải chi tiết')

    class Meta:
        verbose_name = 'Phương án / Ý trả lời'
        verbose_name_plural = 'Danh sách Phương án'
        ordering = ['order_index']
        indexes = [
            models.Index(fields=['question', 'order_index']),
        ]

    def __str__(self):
        return f"Ý {self.label}: {self.content[:40]} ({'ĐÚNG' if self.is_correct else 'SAI'})"


class UserAISetting(models.Model):
    class Provider(models.TextChoices):
        GEMINI = 'gemini', 'Google Gemini'
        OPENAI = 'openai', 'OpenAI ChatGPT'

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='ai_setting',
        verbose_name='Người dùng'
    )
    provider = models.CharField(
        max_length=20,
        choices=Provider.choices,
        default=Provider.GEMINI,
        verbose_name='Nhà cung cấp AI'
    )
    api_key = models.TextField(
        blank=True,
        verbose_name='API Key (Mã hóa Fernet)'
    )
    model = models.CharField(
        max_length=100,
        default='gemini-3.7-flash',
        verbose_name='Mô hình AI'
    )
    base_url = models.CharField(
        max_length=255,
        blank=True,
        verbose_name='Endpoint tùy chỉnh'
    )
    auto_explain = models.BooleanField(
        default=True,
        verbose_name='Tự động sinh lời giải chi tiết'
    )
    
    # Dành cho Super Admin: Bật chia sẻ API cho giáo viên
    share_with_teachers = models.BooleanField(
        default=True,
        verbose_name='Cho phép chia sẻ API cho giáo viên được chọn'
    )
    allowed_teachers = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        blank=True,
        related_name='granted_admin_ai_settings',
        verbose_name='Danh sách Giáo viên được cấp quyền dùng API của Admin'
    )

    # Lựa chọn của Giáo viên: Sử dụng API cá nhân hay API được Admin chia sẻ
    use_shared_admin_api = models.BooleanField(
        default=False,
        verbose_name='Sử dụng API dùng chung do Super Admin chia sẻ'
    )

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Cấu hình AI Người dùng'
        verbose_name_plural = 'Cấu hình AI Người dùng'

    def __str__(self):
        return f"AI Setting - {self.user.username} ({self.provider}:{self.model})"

    def set_api_key(self, plaintext_key: str):
        """Mã hóa và lưu API key."""
        from core.crypto import encrypt_value
        if plaintext_key and plaintext_key.strip() and '••••' not in plaintext_key:
            self.api_key = encrypt_value(plaintext_key.strip())
        elif not plaintext_key:
            self.api_key = ''

    def get_api_key(self) -> str:
        """Giải mã và trả về API key plaintext."""
        from core.crypto import decrypt_value
        return decrypt_value(self.api_key) if self.api_key else ''

    def get_masked_api_key(self) -> str:
        """Returns a securely masked version of the API Key."""
        k = self.get_api_key()
        if not k:
            return ''
        if len(k) <= 8:
            return '••••••••'
        return f"{k[:6]}••••••••••••{k[-4:]}"



class QuestionFeedback(models.Model):
    class FeedbackType(models.TextChoices):
        WRONG_KEY = 'WRONG_KEY', 'Sai đáp án'
        WRONG_CONTENT = 'WRONG_CONTENT', 'Lỗi nội dung / câu hỏi'
        TYPO = 'TYPO', 'Lỗi hiển thị / chính tả'
        OTHER = 'OTHER', 'Khác'

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Chờ xử lý'
        ACCEPTED = 'ACCEPTED', 'Đã chấp thuận & Sửa đáp án'
        REJECTED = 'REJECTED', 'Từ chối phản ánh'

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='question_feedbacks',
        verbose_name='Học sinh gửi phản ánh'
    )
    exam = models.ForeignKey(
        Exam,
        on_delete=models.CASCADE,
        related_name='feedbacks',
        verbose_name='Đề thi'
    )
    question = models.ForeignKey(
        Question,
        on_delete=models.CASCADE,
        related_name='feedbacks',
        verbose_name='Câu hỏi phản ánh'
    )
    session_id = models.IntegerField(null=True, blank=True, verbose_name='Mã phiên thi (nếu có)')
    feedback_type = models.CharField(
        max_length=30,
        choices=FeedbackType.choices,
        default=FeedbackType.WRONG_KEY,
        verbose_name='Phân loại phản ánh'
    )
    student_note = models.TextField(verbose_name='Mô tả / Phân tích chi tiết của học sinh')
    suggested_option = models.CharField(max_length=50, blank=True, verbose_name='Đáp án đề xuất của học sinh')
    
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        verbose_name='Trạng thái xử lý'
    )
    teacher_reply = models.TextField(blank=True, verbose_name='Phản hồi của Giáo viên')
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_feedbacks',
        verbose_name='Giáo viên duyệt'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Thời gian gửi')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Thời gian cập nhật')

    class Meta:
        verbose_name = 'Phản ánh câu hỏi'
        verbose_name_plural = 'Danh sách Phản ánh câu hỏi'
        ordering = ['-created_at']

    def __str__(self):
        return f"Phản ánh #{self.id} từ {self.student.username} (Câu {self.question.order_index} - {self.get_status_display()})"


class QuestionCategory(models.Model):
    name = models.CharField(max_length=255, verbose_name='Tên chuyên đề / Thư mục')
    description = models.TextField(blank=True, verbose_name='Mô tả chi tiết')
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='subcategories', verbose_name='Thư mục cha')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='created_categories', verbose_name='Người tạo')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Thư mục câu hỏi'
        verbose_name_plural = 'Quản lý Thư mục câu hỏi'
        ordering = ['name']

    def __str__(self):
        return self.name


class BankQuestion(models.Model):
    category = models.ForeignKey(QuestionCategory, on_delete=models.SET_NULL, null=True, blank=True, related_name='questions', verbose_name='Thư mục')
    part_type = models.CharField(max_length=20, choices=Question.PartType.choices, default=Question.PartType.PART_I, verbose_name='Phần đề thi')
    branch = models.CharField(max_length=20, choices=Question.Branch.choices, default=Question.Branch.COMMON, verbose_name='Phân nhánh chuyên đề')
    content = models.TextField(verbose_name='Nội dung câu hỏi (hỗ trợ LaTeX / Markdown)')
    
    code_snippet = models.TextField(blank=True, verbose_name='Đoạn mã code (Code Snippet)')
    code_language = models.CharField(max_length=30, default='python', verbose_name='Ngôn ngữ code (python / cpp / c / java)')
    
    competency_category = models.CharField(
        max_length=50,
        choices=Question.CompetencyCategory.choices,
        default=Question.CompetencyCategory.PROG_BASIC,
        verbose_name='Ma trận Năng lực'
    )
    difficulty_level = models.CharField(
        max_length=20,
        choices=Question.Difficulty.choices,
        default=Question.Difficulty.TH,
        verbose_name='Mức độ tư duy'
    )
    explanation = models.TextField(blank=True, verbose_name='Lời giải / Hướng dẫn chi tiết')

    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='bank_questions', verbose_name='Người tạo')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Câu hỏi Ngân hàng'
        verbose_name_plural = 'Ngân hàng Câu hỏi'
        ordering = ['-created_at']

    def __str__(self):
        return f"[Bank] {self.get_part_type_display()} - {self.content[:60]}..."


class BankQuestionOption(models.Model):
    bank_question = models.ForeignKey(BankQuestion, on_delete=models.CASCADE, related_name='options', verbose_name='Câu hỏi gốc')
    label = models.CharField(max_length=10, verbose_name='Ký hiệu (A/B/C/D hoặc a/b/c/d)')
    content = models.TextField(verbose_name='Nội dung phương án')
    code_snippet = models.TextField(blank=True, verbose_name='Mã code của phương án (nếu có)')
    is_correct = models.BooleanField(default=False, verbose_name='Là đáp án đúng (hoặc Đúng trong Part II)')
    order_index = models.IntegerField(default=1, verbose_name='Thứ tự')
    explanation = models.TextField(blank=True, verbose_name='Lời giải chi tiết')

    class Meta:
        verbose_name = 'Phương án Ngân hàng'
        verbose_name_plural = 'Danh sách Phương án Ngân hàng'
        ordering = ['order_index']

    def __str__(self):
        return f"Ý {self.label}: {self.content[:40]} ({'ĐÚNG' if self.is_correct else 'SAI'})"


# ========================================================================
# CA THI (EXAM SITTING) — Gom nhóm nhiều đề thi dưới 1 phiên thi duy nhất
# ========================================================================

import random
import string

def generate_room_code():
    """Tự động sinh mã phòng thi 6 ký tự (chữ hoa + số), dễ đọc, dễ nhập"""
    # Loại bỏ các ký tự dễ nhầm: 0/O, 1/I/L
    chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
    return ''.join(random.choices(chars, k=6))


class ExamSitting(models.Model):
    """Ca thi — Gom nhóm nhiều đề thi dưới 1 phiên thi duy nhất"""

    class DistributionMode(models.TextChoices):
        RANDOM = 'RANDOM', 'Ngẫu nhiên (cân bằng số lượng)'
        ROUND_ROBIN = 'ROUND_ROBIN', 'Tuần tự (xoay vòng theo thứ tự)'
        MANUAL = 'MANUAL', 'Thủ công (Học sinh tự chọn đề)'

    name = models.CharField(max_length=255, verbose_name='Tên ca thi')
    description = models.TextField(blank=True, verbose_name='Mô tả')

    # Mã phòng thi — unique, dùng để học sinh nhập vào Quick Join
    room_code = models.CharField(
        max_length=20, unique=True, default=generate_room_code,
        verbose_name='Mã phòng thi'
    )
    password = models.CharField(max_length=50, blank=True, verbose_name='Mật khẩu vào thi')

    # Gắn nhiều đề thi
    exams = models.ManyToManyField('Exam', related_name='sittings', blank=True)

    # Phân quyền
    creator = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='created_sittings'
    )
    assigned_classes = models.TextField(blank=True, default='Toàn trường',
                                        verbose_name='Lớp / Đối tượng')

    # Thời gian
    start_time = models.DateTimeField(null=True, blank=True, verbose_name='Giờ mở thi')
    end_time = models.DateTimeField(null=True, blank=True, verbose_name='Hạn chót nộp bài')

    # Cấu hình
    max_attempts = models.IntegerField(default=1, verbose_name='Số lần làm bài tối đa')
    allow_run_code = models.BooleanField(default=True, verbose_name='Cho phép học sinh chạy thử Code (IDE)')
    distribution_mode = models.CharField(
        max_length=20, choices=DistributionMode.choices,
        default=DistributionMode.RANDOM, verbose_name='Chế độ phân đề'
    )
    is_active = models.BooleanField(default=False, verbose_name='Đang hoạt động')

    # Hiển thị kết quả
    show_score_after_test = models.BooleanField(default=True, verbose_name='Cho xem điểm sau thi')
    show_explanation_after_test = models.BooleanField(default=True, verbose_name='Cho xem đáp án sau thi')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Ca thi'
        verbose_name_plural = 'Danh sách Ca thi'
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.room_code}] {self.name}"

    def get_exam_for_student(self, student):
        """Phân phối đề cho học sinh theo chế độ distribution_mode"""
        # Kiểm tra đã phân đề chưa
        existing = SittingAssignment.objects.filter(
            sitting=self, student=student
        ).first()
        if existing:
            return existing.exam

        exam_list = list(self.exams.filter(is_active=True).order_by('id'))
        if not exam_list:
            return None

        if self.distribution_mode == self.DistributionMode.MANUAL:
            # Chế độ thủ công: trả về None, frontend sẽ hiện danh sách cho HS chọn
            return None

        if self.distribution_mode == self.DistributionMode.ROUND_ROBIN:
            # Tuần tự: đếm số assignment hiện tại, chia dư
            count = SittingAssignment.objects.filter(sitting=self).count()
            selected = exam_list[count % len(exam_list)]
        else:
            # Random: chọn đề ít người nhất
            from django.db.models import Count, Q
            exam_ids = [e.id for e in exam_list]
            counts = dict(
                SittingAssignment.objects.filter(
                    sitting=self, exam_id__in=exam_ids
                ).values_list('exam_id').annotate(c=Count('id')).values_list('exam_id', 'c')
            )
            # Tìm đề có ít HS nhất
            min_count = min((counts.get(e.id, 0) for e in exam_list), default=0)
            candidates = [e for e in exam_list if counts.get(e.id, 0) == min_count]
            selected = random.choice(candidates)

        # Ghi nhận phân đề
        SittingAssignment.objects.create(
            sitting=self, student=student, exam=selected
        )
        return selected


class SittingAssignment(models.Model):
    """Bản ghi: Học sinh X được phân đề Y trong Ca thi Z"""
    sitting = models.ForeignKey(ExamSitting, on_delete=models.CASCADE, related_name='assignments')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sitting_assignments')
    exam = models.ForeignKey('Exam', on_delete=models.CASCADE, related_name='sitting_assignments')
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('sitting', 'student')
        verbose_name = 'Phân đề Ca thi'
        verbose_name_plural = 'Phân đề Ca thi'

    def __str__(self):
        return f"{self.student} → {self.exam.title} (Ca: {self.sitting.name})"
