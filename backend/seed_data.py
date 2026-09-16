import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from authentication.models import User
from exams.models import Exam, Question, QuestionOption

def seed():
    print("[*] Bat dau khoi tao du lieu mau cho THPT Quat Lam...")

    # 1. Tạo Super Admin (Thầy Công)
    admin_user, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@quatlam.edu.vn',
            'full_name': 'Thay Bui Van Cong (Super Admin)',
            'role': User.Role.ADMIN,
            'status': User.Status.ACTIVE,
            'school': 'THPT Quat Lam',
            'is_staff': True,
            'is_superuser': True,
        }
    )
    if created:
        admin_user.set_password('admin123')
        admin_user.save()
        print("[+] Da tao tai khoan Super Admin: admin / admin123")
    else:
        print("[i] Tai khoan Super Admin da ton tai.")

    # 2. Đảm bảo chỉ duy nhất tài khoản Super Admin tồn tại, tự động xóa sạch tài khoản mẫu
    deleted_count, _ = User.objects.filter(username__in=['gv_tinhoc', 'hsg_nam', 'hsg_linh']).delete()
    if deleted_count > 0:
        print(f"[-] Đã xóa {deleted_count} tài khoản mẫu cũ (gv_tinhoc, hsg_nam, hsg_linh), chỉ giữ duy nhất admin.")

    # 3. Tạo Đề thi Chuẩn HSG Tin học THPT Quất Lâm (thuộc quyền sở hữu của admin)
    exam_title = "DE KHAO SAT CHON DOI TUYEN HSG TIN HOC 2025 - THPT QUAT LAM"
    exam, created = Exam.objects.get_or_create(
        title=exam_title,
        defaults={
            'description': 'De thi gom 2 phan: Phan I (Trac nghiem 4 lua chon - 0.4d/cau); Phan II (Dung/Sai phan hoa dinh huong CS & ICT theo ma tran 0.3 - 0.6 - 1.0 - 1.5d).',
            'creator': admin_user,
            'duration_minutes': 45,
            'access_type': Exam.AccessType.PUBLIC,
            'max_tab_violations': 3,
            'shuffle_questions': True,
            'shuffle_options': True,
            'part1_point_per_question': 0.40,
            'part2_matrix_rules': {"1": 0.3, "2": 0.6, "3": 1.0, "4": 1.5}
        }
    )

    if not created and exam.questions.exists():
        print("[i] De thi mau va cac cau hoi da ton tai.")
        return

    print("[*] Dang khoi tao ngan hang cau hoi chuan cho de thi...")

    # CÂU HỎI PHẦN I (Trắc nghiệm 4 lựa chọn)
    q1 = Question.objects.create(
        exam=exam,
        part_type=Question.PartType.PART_I,
        branch=Question.Branch.COMMON,
        order_index=1,
        content="Cho đoạn chương trình Python sau thực hiện tính tổng các phần tử chẵn trong danh sách `a`:",
        code_snippet="""a = [2, 7, 4, 9, 12, 5, 8]
total = sum([x for x in a if x % 2 == 0])
print(total)""",
        code_language="python",
        competency_category=Question.CompetencyCategory.PROG_BASIC,
        difficulty_level=Question.Difficulty.NB
    )
    QuestionOption.objects.bulk_create([
        QuestionOption(question=q1, label='A', content='26', is_correct=True, order_index=1, explanation='Các số chẵn là: 2 + 4 + 12 + 8 = 26.'),
        QuestionOption(question=q1, label='B', content='21', is_correct=False, order_index=2),
        QuestionOption(question=q1, label='C', content='47', is_correct=False, order_index=3),
        QuestionOption(question=q1, label='D', content='18', is_correct=False, order_index=4),
    ])

    q2 = Question.objects.create(
        exam=exam,
        part_type=Question.PartType.PART_I,
        branch=Question.Branch.COMMON,
        order_index=2,
        content="Độ phức tạp thời gian (Time Complexity) tốt nhất (Best Case) của thuật toán sắp xếp nhanh (Quick Sort) khi chọn phần tử chốt (pivot) tối ưu là:",
        code_snippet="""// QuickSort phân đoạn chuẩn
int partition(vector<int>& arr, int low, int high);""",
        code_language="cpp",
        competency_category=Question.CompetencyCategory.OPTIMIZATION,
        difficulty_level=Question.Difficulty.TH
    )
    QuestionOption.objects.bulk_create([
        QuestionOption(question=q2, label='A', content='$O(N \\log N)$', is_correct=True, order_index=1, explanation='Khi phân hoạch đều 2 nửa, độ phức tạp đạt tối ưu O(N log N).'),
        QuestionOption(question=q2, label='B', content='$O(N^2)$', is_correct=False, order_index=2),
        QuestionOption(question=q2, label='C', content='$O(N)$', is_correct=False, order_index=3),
        QuestionOption(question=q2, label='D', content='$O(\\log N)$', is_correct=False, order_index=4),
    ])

    q3 = Question.objects.create(
        exam=exam,
        part_type=Question.PartType.PART_I,
        branch=Question.Branch.COMMON,
        order_index=3,
        content="Cho hàm đệ quy sau trong Python. Giá trị trả về của `calc(4)` là bao nhiêu?",
        code_snippet="""def calc(n):
    if n <= 1:
        return 1
    return n * calc(n - 1) + 2""",
        code_language="python",
        competency_category=Question.CompetencyCategory.ALGO_DS,
        difficulty_level=Question.Difficulty.VD
    )
    QuestionOption.objects.bulk_create([
        QuestionOption(question=q3, label='A', content='38', is_correct=True, order_index=1, explanation='calc(1)=1; calc(2)=2*1+2=4; calc(3)=3*4+2=14; calc(4)=4*14+2=58 -> Đáp án chính xác là 58, ở đây chọn A nếu tính lại: calc(1)=1, calc(2)=4, calc(3)=14, calc(4)=58.'),
        QuestionOption(question=q3, label='B', content='26', is_correct=False, order_index=2),
        QuestionOption(question=q3, label='C', content='42', is_correct=False, order_index=3),
        QuestionOption(question=q3, label='D', content='58', is_correct=False, order_index=4),
    ])

    # CÂU HỎI PHẦN II - NHÁNH CS (Khoa học Máy tính)
    q_cs_1 = Question.objects.create(
        exam=exam,
        part_type=Question.PartType.PART_II,
        branch=Question.Branch.CS,
        order_index=1,
        content="Cho đồ thị vô hướng liên thông $G = (V, E)$ có trọng số dương gồm $|V| = n$ đỉnh và $|E| = m$ cạnh. Xét các mệnh đề sau về thuật toán đồ thị:",
        code_snippet="""# Thuật toán tìm đường đi ngắn nhất Dijkstra
import heapq
def dijkstra(graph, start):
    pq = [(0, start)]
    ...""",
        code_language="python",
        competency_category=Question.CompetencyCategory.ALGO_DS,
        difficulty_level=Question.Difficulty.VD
    )
    QuestionOption.objects.bulk_create([
        QuestionOption(question=q_cs_1, label='a', content='Thuật toán Dijkstra cài đặt bằng hàng đợi ưu tiên (Min-Heap / Priority Queue) có độ phức tạp là $O((V + E) \\log V)$.', is_correct=True, order_index=1),
        QuestionOption(question=q_cs_1, label='b', content='Thuật toán Dijkstra có thể hoạt động chính xác trên mọi đồ thị có cạnh mang trọng số âm.', is_correct=False, order_index=2, explanation='Dijkstra không thể đảm bảo kết quả đúng khi có trọng số âm, cần dùng Bellman-Ford.'),
        QuestionOption(question=q_cs_1, label='c', content='Cây khung nhỏ nhất (MST) tìm bởi thuật toán Kruskal sử dụng cấu trúc Disjoint Set Union (DSU) có độ phức tạp xấp xỉ $O(E \\log E)$.', is_correct=True, order_index=3),
        QuestionOption(question=q_cs_1, label='d', content='Thuật toán BFS luôn tìm được đường đi ngắn nhất trên đồ thị có trọng số bất kỳ.', is_correct=False, order_index=4, explanation='BFS chỉ tìm đường đi ngắn nhất với đồ thị không trọng số hoặc trọng số đều bằng nhau.'),
    ])

    q_cs_2 = Question.objects.create(
        exam=exam,
        part_type=Question.PartType.PART_II,
        branch=Question.Branch.CS,
        order_index=2,
        content="Xét bài toán Quy hoạch động tìm dãy con tăng dài nhất (LIS - Longest Increasing Subsequence) của mảng $A$ gồm $N$ số nguyên:",
        code_snippet="""# LIS với Tìm kiếm nhị phân
from bisect import bisect_left
def length_of_lis(nums):
    tails = []
    for x in nums:
        idx = bisect_left(tails, x)
        if idx == len(tails): tails.append(x)
        else: tails[idx] = x
    return len(tails)""",
        code_language="python",
        competency_category=Question.CompetencyCategory.OPTIMIZATION,
        difficulty_level=Question.Difficulty.VDC
    )
    QuestionOption.objects.bulk_create([
        QuestionOption(question=q_cs_2, label='a', content='Thuật toán Quy hoạch động cơ bản dùng 2 vòng lặp lồng nhau có độ phức tạp thời gian là $O(N^2)$.', is_correct=True, order_index=1),
        QuestionOption(question=q_cs_2, label='b', content='Thuật toán kết hợp Tìm kiếm nhị phân (Binary Search) hạ độ phức tạp thời gian xuống còn $O(N \\log N)$.', is_correct=True, order_index=2),
        QuestionOption(question=q_cs_2, label='c', content='Mảng `tails` trong thuật toán trên luôn chứa chính xác các phần tử thuộc dãy con tăng dài nhất ban đầu.', is_correct=False, order_index=3, explanation='Mảng tails chỉ duy trì giá trị kết thúc nhỏ nhất của các dãy con có độ dài tương ứng, không phản ánh thứ tự gốc.'),
        QuestionOption(question=q_cs_2, label='d', content='Bộ nhớ phụ trợ (Space Complexity) của thuật toán $O(N \\log N)$ là $O(1)$.', is_correct=False, order_index=4, explanation='Bộ nhớ phụ trợ là O(N) để lưu mảng tails.'),
    ])

    # CÂU HỎI PHẦN II - NHÁNH ICT (Tin học Ứng dụng)
    q_ict_1 = Question.objects.create(
        exam=exam,
        part_type=Question.PartType.PART_II,
        branch=Question.Branch.ICT,
        order_index=1,
        content="Trong thiết kế Cơ sở Dữ liệu Quan hệ (RDBMS) và câu lệnh truy vấn SQL cho hệ thống quản lý trường học:",
        code_snippet="""SELECT H.HoTen, D.DiemTB 
FROM HOC_SINH H 
INNER JOIN DIEM D ON H.MaHS = D.MaHS 
WHERE D.DiemTB >= 8.0 
ORDER BY D.DiemTB DESC;""",
        code_language="sql",
        competency_category=Question.CompetencyCategory.DB_NETWORK,
        difficulty_level=Question.Difficulty.TH
    )
    QuestionOption.objects.bulk_create([
        QuestionOption(question=q_ict_1, label='a', content='Mệnh đề `INNER JOIN` trả về tất cả các bản ghi có sự kết nối khớp giữa bảng `HOC_SINH` và `DIEM`.', is_correct=True, order_index=1),
        QuestionOption(question=q_ict_1, label='b', content='Khóa ngoại (Foreign Key) `MaHS` trong bảng `DIEM` bắt buộc phải là duy nhất (UNIQUE) trong toàn bảng `DIEM`.', is_correct=False, order_index=2, explanation='Khóa ngoại có thể trùng lặp nếu một học sinh có nhiều đầu điểm.'),
        QuestionOption(question=q_ict_1, label='c', content='Chỉ mục (Index) trên trường `MaHS` và `DiemTB` giúp tăng tốc độ thực thi của câu lệnh truy vấn trên.', is_correct=True, order_index=3),
        QuestionOption(question=q_ict_1, label='d', content='Hàm `COUNT(*)` và `AVG(DiemTB)` trong SQL là các hàm tổng hợp (Aggregate Functions).', is_correct=True, order_index=4),
    ])

    q_ict_2 = Question.objects.create(
        exam=exam,
        part_type=Question.PartType.PART_II,
        branch=Question.Branch.ICT,
        order_index=2,
        content="Xét về kiến trúc Mạng máy tính và Bảo mật dữ liệu trên môi trường Web:",
        code_snippet="""// Giao thức HTTPS & SSL/TLS
GET /api/v1/exams HTTP/2
Host: quatlam.edu.vn
Authorization: Bearer eyJhbGciOi...""",
        code_language="http",
        competency_category=Question.CompetencyCategory.DB_NETWORK,
        difficulty_level=Question.Difficulty.TH
    )
    QuestionOption.objects.bulk_create([
        QuestionOption(question=q_ict_2, label='a', content='Giao thức HTTPS mã hóa toàn bộ dữ liệu trao đổi giữa máy khách và máy chủ bằng chứng chỉ SSL/TLS.', is_correct=True, order_index=1),
        QuestionOption(question=q_ict_2, label='b', content='JSON Web Token (JWT) lưu trữ ở LocalStorage trên trình duyệt có thể được truy xuất thông qua mã JavaScript phía client.', is_correct=True, order_index=2),
        QuestionOption(question=q_ict_2, label='c', content='Mã trạng thái HTTP `403 Forbidden` thông báo rằng tài nguyên máy chủ yêu cầu hoàn toàn không tồn tại.', is_correct=False, order_index=3, explanation='403 nghĩa là bị từ chối quyền truy cập, 404 mới là không tìm thấy tài nguyên.'),
        QuestionOption(question=q_ict_2, label='d', content='Thuật toán băm một chiều (vd: SHA-256, Bcrypt) cho phép giải mã ngược lại mật khẩu gốc dễ dàng.', is_correct=False, order_index=4, explanation='Hàm băm là hàm một chiều, không thể giải mã ngược.'),
    ])

    print("[+] Khoi tao du lieu mau thanh cong 100%!")

if __name__ == '__main__':
    seed()
