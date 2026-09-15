import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from exams.docx_parser import DocxExamParser

RAW_UNTAGGED_EXAM = """[DE_THI] ĐỀ THI KHẢO SÁT CHỌN ĐỘI TUYỂN HSG TIN HỌC (KHÔNG CÓ THẺ CODE)
[THOI_GIAN] 50
[MA_TRAN] HSG_QUAT_LAM

Phần 1. TRẮC NGHIỆM

Câu 1. Cho đoạn chương trình sau:
a = [3, 8, 5, 12, 7, 2]
res = [x for x in a if x % 2 == 0]
print(sum(res))
Giá trị in ra màn hình của biến res là:
A. 20   *B. 22   C. 18   D. 15

Câu 2. Cho đoạn mã nguồn C++:
#include <iostream>
using namespace std;
int main() {
    int s = 0;
    for (int i = 1; i <= 5; i++) s += i;
    cout << s;
    return 0;
}
Kết quả in ra màn hình là:
A. 10   *B. 15   C. 20   D. 25

Câu 3. Cho câu lệnh truy vấn CSDL:
SELECT HoTen, DiemTB FROM HOC_SINH WHERE DiemTB >= 8.0 ORDER BY DiemTB DESC;
Mục đích của câu lệnh trên là:
A. Sửa điểm   *B. Lấy danh sách điểm >= 8.0 giảm dần   C. Xóa học sinh   D. Tạo bảng mới

Câu 4. Trong tài liệu HTML5:
<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body><h1>Hello World</h1></body>
</html>
Thẻ nào dùng để hiển thị tiêu đề trang?
*A. <title>   B. <body>   C. <h1>   D. <html>

Câu 5. Cho đoạn mã định dạng CSS sau:
.site-header {
    background-color: #2c3e50;
    color: #ffffff;
    padding: 15px 20px;
    font-size: 18px;
}
Thuộc tính nào dùng để đổi màu nền của phần tử header?
*A. background-color   B. color   C. padding   D. font-size
"""

def test_auto_code_detection():
    print("[*] Testing Automatic Code Detection on Raw Untagged Exam Questions...")

    res = DocxExamParser.parse_raw_text(RAW_UNTAGGED_EXAM)
    assert res['success'] is True, "Parser failed"
    assert len(res['questions']) == 5, f"Expected 5 questions, got {len(res['questions'])}"

    # Check Question 1: Python auto-detected
    q1 = res['questions'][0]
    print(f"[+] Q1 detected language: {q1['code_language']}, has code: {bool(q1['code_snippet'])}")
    assert q1['code_language'] == 'python', f"Expected python, got {q1['code_language']}"
    assert "print(sum(res))" in q1['code_snippet']
    assert "Cho đoạn chương trình sau:" in q1['content']
    assert "Giá trị in ra" in q1['content']

    # Check Question 2: C++ auto-detected
    q2 = res['questions'][1]
    print(f"[+] Q2 detected language: {q2['code_language']}, has code: {bool(q2['code_snippet'])}")
    assert q2['code_language'] == 'cpp', f"Expected cpp, got {q2['code_language']}"
    assert "cout << s;" in q2['code_snippet']

    # Check Question 3: SQL auto-detected
    q3 = res['questions'][2]
    print(f"[+] Q3 detected language: {q3['code_language']}, has code: {bool(q3['code_snippet'])}")
    assert q3['code_language'] == 'sql', f"Expected sql, got {q3['code_language']}"
    assert "SELECT HoTen" in q3['code_snippet']

    # Check Question 4: HTML auto-detected
    q4 = res['questions'][3]
    print(f"[+] Q4 detected language: {q4['code_language']}, has code: {bool(q4['code_snippet'])}")
    assert q4['code_language'] == 'html', f"Expected html, got {q4['code_language']}"
    assert "<!DOCTYPE html>" in q4['code_snippet']

    # Check Question 5: CSS auto-detected
    q5 = res['questions'][4]
    print(f"[+] Q5 detected language: {q5['code_language']}, has code: {bool(q5['code_snippet'])}")
    assert q5['code_language'] == 'css', f"Expected css, got {q5['code_language']}"
    assert "background-color: #2c3e50;" in q5['code_snippet']
    assert "Cho đoạn mã định dạng CSS sau:" in q5['content']
    assert "Thuộc tính nào dùng để đổi màu nền" in q5['content']

    print("\n" + "="*70)
    print("[SUCCESS] CHUC NANG TU DONG NHAN DIEN CODE (PYTHON, C++, SQL, HTML, CSS) HOAT DONG HOAN HAO 100%!")
    print("="*70)

if __name__ == '__main__':
    test_auto_code_detection()
