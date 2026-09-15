import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from exams.docx_parser import DocxExamParser

DUAL_CODE_RAW_EXAM = """[DE_THI] ĐỀ THI TIN HỌC HSG SONG NGỮ (KHÔNG CÓ THẺ CODE)
[THOI_GIAN] 50
[MA_TRAN] HSG_QUAT_LAM

Phần 1. TRẮC NGHIỆM

Câu 1. Cho đoạn chương trình tính tổng các số chẵn trong mảng sau bằng Python và C++:
Python:
a = [3, 8, 5, 12, 7, 2]
res = [x for x in a if x % 2 == 0]
print(sum(res))

C++:
#include <iostream>
#include <vector>
using namespace std;
int main() {
    vector<int> a = {3, 8, 5, 12, 7, 2};
    int sum = 0;
    for (int x : a) if (x % 2 == 0) sum += x;
    cout << sum << endl;
    return 0;
}
Giá trị in ra màn hình của biến sau khi thực thi là:
A. 20   *B. 22   C. 18   D. 15
"""

def test_dual_code_exam():
    print("[*] Testing Automatic Dual-Language Extraction (Python + C++) from Raw Exam...")

    res = DocxExamParser.parse_raw_text(DUAL_CODE_RAW_EXAM)
    assert res['success'] is True, "Parser failed"
    assert len(res['questions']) == 1, "Expected 1 question"

    q1 = res['questions'][0]
    print("[+] Q1 code snippet length:", len(q1['code_snippet']))
    print("[+] Contains ```python:", "```python" in q1['code_snippet'])
    print("[+] Contains ```cpp:", "```cpp" in q1['code_snippet'])

    assert "```python" in q1['code_snippet'], "Expected python block in snippet"
    assert "```cpp" in q1['code_snippet'], "Expected cpp block in snippet"
    assert "print(sum(res))" in q1['code_snippet']
    assert "#include <iostream>" in q1['code_snippet']

    print("\n" + "="*70)
    print("[SUCCESS] TU DONG PHAN CHIA PYTHON VA C++ TRONG 1 CAU HOAN TAT 100%!")
    print("="*70)

if __name__ == '__main__':
    test_dual_code_exam()
