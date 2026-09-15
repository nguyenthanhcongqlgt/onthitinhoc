import io
import docx
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT

def generate_exam_docx_template() -> io.BytesIO:
    """
    Generates a standardized Microsoft Word (.docx) exam template for Teachers of THPT Quất Lâm.
    Demonstrates:
    - Part I (30 or 24 questions) with Red Font / Asterisk * on correct options (A. B. C. D.)
    - Part II Section A (Phần chung cho tất cả thí sinh: a) b) c) d))
    - Part II Section B (Phần riêng CS / ICT)
    - Answer Key Table at the bottom
    """
    doc = docx.Document()

    # Style configuration
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Times New Roman'
    font.size = Pt(12)

    # Document Header
    p_school = doc.add_paragraph()
    p_school.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_school = p_school.add_run("SỞ GD&ĐT NINH BÌNH\nTRƯỜNG THPT QUẤT LÂM - NINH BÌNH\n")
    r_school.bold = True
    r_school.font.size = Pt(13)

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_title = p_title.add_run("ĐỀ THI KHẢO SÁT CHỌN ĐỘI TUYỂN HSG TIN HỌC 2025\n")
    r_title.bold = True
    r_title.font.size = Pt(14)
    r_title.font.color.rgb = RGBColor(20, 73, 225)

    # Metadata Header Tags
    p_meta = doc.add_paragraph()
    p_meta.add_run("[DE_THI] ĐỀ KHẢO SÁT CHỌN ĐỘI TUYỂN HSG TIN HỌC 2025 - THPT QUẤT LÂM - NINH BÌNH\n").bold = True
    p_meta.add_run("[THOI_GIAN] 50\n").bold = True
    p_meta.add_run("[MA_TRAN] HSG_QUAT_LAM\n\n").bold = True

    # =========================================================================
    # SECTION 1: PHẦN I
    # =========================================================================
    p_p1 = doc.add_paragraph()
    r_p1 = p_p1.add_run("PHẦN I. CÂU TRẮC NGHIỆM NHIỀU PHƯƠNG ÁN LỰA CHỌN (0.4 điểm/câu)\n")
    r_p1.bold = True
    r_p1.font.color.rgb = RGBColor(20, 73, 225)

    # Câu 1: Sử dụng Bôi đỏ (Red Font) cho phương án đúng
    p_c1 = doc.add_paragraph()
    p_c1.add_run("Câu 1. [PROG_BASIC] [NB] Cho đoạn chương trình Python sau:\n").bold = True
    p_c1.add_run("```python\n"
                 "a = [3, 8, 5, 12, 7, 2]\n"
                 "res = [x for x in a if x % 2 == 0]\n"
                 "print(sum(res))\n"
                 "```\n"
                 "Giá trị in ra màn hình của biến `res` sau khi thực thi là:\n"
                 "A. 20\n")
    # Phương án B bôi đỏ chữ
    r_b_red = p_c1.add_run("B. 22\n")
    r_b_red.font.color.rgb = RGBColor(255, 0, 0)
    r_b_red.bold = True
    p_c1.add_run("C. 18\n"
                 "D. 15\n"
                 "[HUONG_DAN] Các số chẵn là 8, 12, 2 -> Tổng là 22.\n")

    # Câu 2: Sử dụng Dấu sao * (B*.)
    p_c2 = doc.add_paragraph()
    p_c2.add_run("Câu 2. [OPTIMIZATION] [TH] Độ phức tạp thời gian trung bình của thuật toán sắp xếp hòa nhập (Merge Sort) trên mảng $N$ phần tử là:\n").bold = True
    p_c2.add_run("A*. $O(N \\log N)$\n"
                 "B. $O(N^2)$\n"
                 "C. $O(N)$\n"
                 "D. $O(\\log N)$\n"
                 "[HUONG_DAN] Thuật toán Merge Sort luôn có độ phức tạp O(N log N).\n")

    # =========================================================================
    # SECTION 2: PHẦN II - MỤC A. PHẦN CHUNG CHO TẤT CẢ THÍ SINH
    # =========================================================================
    p_p2 = doc.add_paragraph()
    r_p2 = p_p2.add_run("PHẦN II. CÂU TRẮC NGHIỆM ĐÚNG / SAI\n")
    r_p2.bold = True
    r_p2.font.color.rgb = RGBColor(79, 70, 229)

    p_p2_common = doc.add_paragraph()
    r_p2_common = p_p2_common.add_run("A. Phần chung cho tất cả các thí sinh\n")
    r_p2_common.bold = True

    # Câu 1 (Phần chung)
    p_p2_c1 = doc.add_paragraph()
    p_p2_c1.add_run("Câu 1. [PROG_BASIC] [VD] Cho đoạn mã nguồn giải phương trình bậc nhất $ax + b = 0$ bằng Python. Xét tính Đúng/Sai của các phát biểu sau:\n").bold = True
    
    # Ý a Đúng (Bôi đỏ)
    r_ya = p_p2_c1.add_run("a) Khi a == 0 và b == 0 thì phương trình có vô số nghiệm\n")
    r_ya.font.color.rgb = RGBColor(255, 0, 0)
    
    # Ý b Sai
    p_p2_c1.add_run("b) Khi a == 0 và b != 0 thì nghiệm là x = 0\n")
    
    # Ý c Sai
    p_p2_c1.add_run("c) Biểu thức float(b / a) luôn thực hiện an toàn mà không cần kiểm tra điều kiện a != 0\n")
    
    # Ý d Đúng (Bôi đỏ)
    r_yd = p_p2_c1.add_run("d) Khi a != 0 thì nghiệm duy nhất của phương trình là x = -b / a\n")
    r_yd.font.color.rgb = RGBColor(255, 0, 0)

    p_p2_c1.add_run("[HUONG_DAN] a) Đúng; b) Sai vì vô nghiệm; c) Sai vì lỗi chia cho 0; d) Đúng.\n")

    # =========================================================================
    # SECTION 3: PHẦN II - MỤC B. PHẦN RIÊNG (CS VÀ ICT)
    # =========================================================================
    p_p2_spec = doc.add_paragraph()
    r_p2_spec = p_p2_spec.add_run("B. Phần riêng (CS và ICT)\n")
    r_p2_spec.bold = True

    # Nhánh CS
    p_cs_head = doc.add_paragraph()
    p_cs_head.add_run("[PHAN_II_CS] Chuyên đề Khoa học máy tính (CS)\n").bold = True
    p_cs_head.add_run("Câu 2. [ALGO_DS] [VD] Cho đồ thị vô hướng có trọng số dương $G = (V, E)$. Xét các mệnh đề:\n"
                    "a*) Thuật toán Dijkstra tìm đường đi ngắn nhất với Min-Heap có độ phức tạp $O((V + E) \\log V)$\n"
                    "b) Thuật toán Dijkstra hoạt động chính xác cả khi đồ thị có trọng số âm\n"
                    "c*) Thuật toán Bellman-Ford phát hiện được chu trình âm trong đồ thị có hướng\n"
                    "d) Thuật toán Floyd-Warshall có độ phức tạp thời gian là $O(V^2)$\n"
                    "[HUONG_DAN] a Đúng; b Sai; c Đúng; d Sai vì O(V^3).\n")

    # Nhánh ICT
    p_ict_head = doc.add_paragraph()
    p_ict_head.add_run("[PHAN_II_ICT] Chuyên đề Tin học ứng dụng (ICT)\n").bold = True
    p_ict_head.add_run("Câu 2. [DB_NETWORK] [TH] Trong hệ quản trị CSDL Quan hệ SQL và Mạng máy tính:\n"
                     "a*) Mệnh đề ORDER BY ... DESC sắp xếp kết quả theo thứ tự giảm dần\n"
                     "b) Khóa chính Primary Key trong một bảng có thể mang giá trị NULL\n"
                     "c*) Giao thức HTTPS sử dụng cổng mặc định là 443 và mã hóa dữ liệu qua SSL/TLS\n"
                     "d) Mã phản hồi HTTP 404 cho biết máy chủ gặp lỗi nội bộ Server Error\n"
                     "[HUONG_DAN] a Đúng; b Sai; c Đúng; d Sai vì 404 là Not Found.\n")

    # =========================================================================
    # SECTION 4: BẢNG ĐÁP ÁN THAM KHẢO Ở CUỐI TRANG (Answer Key Table)
    # =========================================================================
    p_ans_head = doc.add_paragraph()
    r_ans_head = p_ans_head.add_run("\nBẢNG ĐÁP ÁN THAM KHẢO\n")
    r_ans_head.bold = True
    r_ans_head.font.size = Pt(13)

    # Table 1: Phần I
    doc.add_paragraph("1. Đáp án Phần I (Trắc nghiệm):").bold = True
    table_p1 = doc.add_table(rows=2, cols=10)
    table_p1.alignment = WD_TABLE_ALIGNMENT.CENTER
    for c_idx in range(10):
        table_p1.rows[0].cells[c_idx].text = f"Câu {c_idx + 1}"
        table_p1.rows[1].cells[c_idx].text = "B" if c_idx == 0 else "A" if c_idx == 1 else "-"

    # Table 2: Phần II
    doc.add_paragraph("\n2. Đáp án Phần II (Đúng / Sai):").bold = True
    table_p2 = doc.add_table(rows=2, cols=4)
    table_p2.alignment = WD_TABLE_ALIGNMENT.CENTER
    table_p2.rows[0].cells[0].text = "Câu"
    table_p2.rows[0].cells[1].text = "Câu 1 (Chung)"
    table_p2.rows[0].cells[2].text = "Câu 2 (CS)"
    table_p2.rows[0].cells[3].text = "Câu 2 (ICT)"

    table_p2.rows[1].cells[0].text = "Đáp án"
    table_p2.rows[1].cells[1].text = "a) Đúng\nb) Sai\nc) Sai\nd) Đúng"
    table_p2.rows[1].cells[2].text = "a) Đúng\nb) Sai\nc) Đúng\nd) Sai"
    table_p2.rows[1].cells[3].text = "a) Đúng\nb) Sai\nc) Đúng\nd) Sai"

    buffer = io.BytesIO()
    doc.save(buffer)
    buffer.seek(0)
    return buffer
