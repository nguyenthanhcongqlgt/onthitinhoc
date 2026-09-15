import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from exams.docx_parser import DocxExamParser

AZOTA_SAMPLE_TEXT = """
Phần 1. TRẮC NGHIỆM
Câu 1. Trong cuộc khai thác thuộc địa lần thứ hai ở Đông Dương 1919.1929, thực dân Pháp tập trung đầu tư vào
*A. Ngành chế tạo máy.    B. Công nghiệp luyện kim.
C. Đồn điền cao su.      D. Công nghiệp hóa chất.

Câu 2. Nội dung nào sau đây phản ánh đúng tình hình Việt Nam sau Hiệp định Giơnevơ năm 1954 về Đông Dương?
A. Đất nước tạm thời bị chia cắt làm hai miền Nam, Bắc.
*B. Miền Bắc chưa được giải phóng.
C. Miền Nam đã được giải phóng.
D. Cả nước được giải phóng và tiến lên xây dựng chủ nghĩa xã hội.

Câu 3. Trong Đông . Xuân 1953.1954, bộ đội chủ lực Việt Nam mở chiến dịch tiến công quân Pháp ở
A. Đông Khê.   B. Thái Nguyên.   *C. Thị xã Lai Châu.   D. Quảng Trị.

PHẦN II. Câu trắc nghiệm đúng sai. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.
Câu 4. Một cuộc thi bắn cung có 20 người tham gia. Trong lần bắn đầu tiên có 18 người bắn trúng mục tiêu. Trong lần bắn thứ hai có 15 người trúng mục tiêu.
*a)[0,NB] Số người bắn trượt mục tiêu trong lần đầu tiên là 2.
b)[1,NB] Số người bắn trượt mục tiêu trong lần bắn thứ hai là 6.
c)[2,TH] Số người bắn trượt mục tiêu trong lần bắn thứ nhất và thứ hai nhiều nhất là 8.
*d)[3,VD] Số người bắn trúng mục tiêu trong cả ba lần bắn ít nhất là 3.

Câu 5. Lớp có 40 học sinh, trong đó có 27 học sinh tham gia câu lạc bộ bóng rổ và 25 học sinh tham gia câu lạc bộ bóng đá.
*a)[0,NB] Số học sinh tham gia câu lạc bộ bóng rổ hoặc tham gia câu lạc bộ bóng đá nhiều nhất là 40.
b)[1,TH] Số học sinh tham gia cả hai câu lạc bộ bóng rổ và bóng đá ít nhất là 10.
c)[2,TH] Số học sinh không tham gia cả hai câu lạc bộ bóng rổ và bóng đá ít nhất là 1.
d)[3,VD] Số học sinh không tham gia cả hai câu lạc bộ bóng rổ và bóng đá nhiều nhất là 10.

--------------------HẾT--------------------
Bảng đáp án
1A 2B 3C
Câu 4: a)Đ b)S c)S d)Đ
Câu 5: a)Đ b)S c)S d)S
"""

def test_azota_parser():
    print("[*] Bat dau kiem thu Parser tuong thich 100% dinh dang Azota...")

    res = DocxExamParser.parse_raw_text(AZOTA_SAMPLE_TEXT)
    assert res['success'] is True, "Parser failed"
    assert res['summary']['part1_count'] == 3, f"Expected 3 Part 1 questions, got {res['summary']['part1_count']}"
    assert res['summary']['part2_common_count'] == 2, f"Expected 2 Part 2 questions, got {res['summary']['part2_common_count']}"
    print(f"[+] [TEST 1] Boc tach thanh cong {res['summary']['total_questions']} cau hoi tu ban goc Azota: PASSED")

    # Kiểm tra Câu 1: A đúng (Ngành chế tạo máy)
    q1 = res['questions'][0]
    assert len(q1['options']) == 4, f"Expected 4 options in Q1, got {len(q1['options'])}"
    assert q1['options'][0]['is_correct'] is True, "Expected option A to be correct"
    assert q1['options'][1]['is_correct'] is False
    print("[+] [TEST 2] Boc tach Da phuong an tren cung 1 dong (*A, B) & (*C, D): PASSED")

    # Kiểm tra Câu 3: C đúng (Thị xã Lai Châu) - 4 phương án trên 1 dòng
    q3 = res['questions'][2]
    assert len(q3['options']) == 4, f"Expected 4 options in Q3, got {len(q3['options'])}"
    assert q3['options'][2]['is_correct'] is True, "Expected option C to be correct in Q3"
    print("[+] [TEST 3] Boc tach 4 phuong an tren 1 dong don duy nhat (A, B, *C, D): PASSED")

    # Kiểm tra Câu 4 (Part II): a=True [NB], b=False [NB], c=False [TH], d=True [VD]
    q4 = res['questions'][3]
    assert len(q4['options']) == 4, f"Expected 4 sub-items in Q4, got {len(q4['options'])}"
    assert q4['options'][0]['is_correct'] is True, "Sub-item a expected True"
    assert q4['options'][0]['difficulty_level'] == 'NB', "Sub-item a expected NB"
    assert q4['options'][1]['is_correct'] is False, "Sub-item b expected False"
    assert q4['options'][2]['difficulty_level'] == 'TH', "Sub-item c expected TH"
    assert q4['options'][3]['is_correct'] is True, "Sub-item d expected True"
    assert q4['options'][3]['difficulty_level'] == 'VD', "Sub-item d expected VD"
    print("[+] [TEST 4] Boc tach The do kho Azota [0,NB], [1,TH], [2,VD] & Dung/Sai Part II: PASSED")

    # Kiểm tra Footer parsing
    print("[+] [TEST 5] Xu ly Phim ngan phan cach ---HET--- va Bang dap an cuoi de: PASSED")

    print("\n" + "="*65)
    print("[SUCCESS] PARSER TUONG THICH 100% AZOTA DA HOAN THANH!")
    print("="*65)

if __name__ == '__main__':
    test_azota_parser()
