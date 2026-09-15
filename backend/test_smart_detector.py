import re
from typing import Tuple, List, Optional

class SmartCodeDetector:
    """
    AI-Heuristic Automatic Code Detection & Language Classifier
    Detects Python, C++, SQL, and HTML in raw exam text without explicit backticks or tags.
    """

    CPP_SIGNATURES = [
        r'#include\s*<', r'using\s+namespace\s+std', r'\bint\s+main\s*\(',
        r'\bcout\s*<<', r'\bcin\s*>>', r'\bstd::', r'\bvector\s*<', r'\bqueue\s*<',
        r'\bstack\s*<', r'\bpair\s*<', r'\bmap\s*<', r'\bset\s*<',
        r'\bprintf\s*\(', r'\bscanf\s*\(', r'\bvoid\s+\w+\s*\(',
        r'\bfor\s*\(\s*int\s+', r'\bwhile\s*\(', r';\s*$', r'\{\s*$', r'^\s*\}\s*$'
    ]

    PYTHON_SIGNATURES = [
        r'\bdef\s+\w+\s*\(', r'\bprint\s*\(', r'\bimport\s+\w+', r'\bfrom\s+\w+\s+import',
        r'\bfor\s+\w+\s+in\s+', r'\bwhile\s+.+:', r'\bif\s+.+:\s*$', r'\belif\s+.+:\s*$',
        r'\belse\s*:\s*$', r'\breturn\b', r'\b\[\s*x\s+for\s+x\s+in\s+',
        r'\blen\s*\(', r'\brange\s*\(', r'\bsum\s*\(', r'\bappend\s*\(', r'\.split\s*\('
    ]

    SQL_SIGNATURES = [
        r'\bSELECT\s+', r'\bFROM\s+\w+', r'\bWHERE\s+', r'\bINNER\s+JOIN\b',
        r'\bLEFT\s+JOIN\b', r'\bRIGHT\s+JOIN\b', r'\bGROUP\s+BY\b', r'\bORDER\s+BY\b',
        r'\bINSERT\s+INTO\b', r'\bUPDATE\s+\w+\s+SET\b', r'\bDELETE\s+FROM\b',
        r'\bCREATE\s+TABLE\b', r'\bPRIMARY\s+KEY\b', r'\bFOREIGN\s+KEY\b'
    ]

    HTML_SIGNATURES = [
        r'<!DOCTYPE\s+html>', r'<\s*html\b', r'<\s*head\b', r'<\s*body\b',
        r'<\s*div\b', r'<\s*span\b', r'<\s*table\b', r'<\s*h[1-6]\b',
        r'<\s*p\b', r'<\s*a\s+href=', r'<\s*img\s+src=', r'<\s*script\b',
        r'<\s*style\b', r'<\s*\/\s*\w+\s*>'
    ]

    CSS_SIGNATURES = [
        r'(?:^[a-zA-Z0-9_\-\.#\s,>+~*:]+)\s*\{[\s\S]*?(?:color|margin|padding|background|font|display|width|height|border|text|position|top|left|right|bottom|float|clear|flex|align|justify|opacity|z-index)\s*:',
        r'^\s*(?:\.[a-zA-Z_-][a-zA-Z0-9_-]*|#[a-zA-Z_-][a-zA-Z0-9_-]*|body\b|html\b|p\b|h[1-6]\b|div\b|table\b|tr\b|td\b|th\b|ul\b|ol\b|li\b|span\b|a\b|img\b|button\b|input\b|form\b|header\b|footer\b|nav\b|section\b|article\b|main\b)\s*\{',
        r'^\s*[a-zA-Z0-9_\-\.#\s,>+~*:]+:[a-zA-Z_-]+\s*\{',
        r'^\s*@(media|keyframes|import|font-face|supports)\b',
        r'^\s*color\s*:\s*[^;{}]+;?',
        r'^\s*background(?:-color|-image|-size|-position|-repeat)?\s*:\s*[^;{}]+;?',
        r'^\s*font(?:-size|-family|-weight|-style)?\s*:\s*[^;{}]+;?',
        r'^\s*text-(?:align|decoration|transform|indent|shadow)\s*:\s*[^;{}]+;?',
        r'^\s*margin(?:-(?:top|bottom|left|right))?\s*:\s*[^;{}]+;?',
        r'^\s*padding(?:-(?:top|bottom|left|right))?\s*:\s*[^;{}]+;?',
        r'^\s*border(?:-(?:top|bottom|left|right|radius|color|width|style))?\s*:\s*[^;{}]+;?',
        r'^\s*display\s*:\s*(?:flex|grid|block|inline|inline-block|none|table)\s*;?',
        r'^\s*(?:width|height|max-width|min-width|max-height|min-height)\s*:\s*[^;{}]+;?',
        r'^\s*position\s*:\s*(?:relative|absolute|fixed|sticky|static)\s*;?',
        r'^\s*(?:top|bottom|left|right|z-index)\s*:\s*[^;{}]+;?',
        r'^\s*(?:justify-content|align-items|align-content|flex-direction|flex-wrap)\s*:\s*[^;{}]+;?',
        r'^\s*(?:float|clear|overflow|box-sizing|opacity|cursor|line-height|letter-spacing)\s*:\s*[^;{}]+;?',
        r'^\s*[a-z][a-z0-9\-]*\s*:\s*[^;{}]+\s*;\s*$'
    ]

    CODE_TRIGGER_PHRASES = [
        r'đoạn\s+chương\s+trình', r'đoạn\s+mã', r'mã\s+nguồn', r'hàm\s+sau',
        r'câu\s+lệnh', r'chương\s+trình\s+sau', r'đoạn\s+code', r'khối\s+lệnh',
        r'mã\s+sau', r'chương\s+trình\s+python', r'chương\s+trình\s+c\+\+',
        r'truy\s+vấn\s+sql', r'cấu\s+trúc\s+html', r'mã\s+html', r'mã\s+css', r'đoạn\s+css'
    ]

    QUESTION_TRAILING_PHRASES = [
        r'kết\s+quả', r'giá\s+trị', r'in\s+ra', r'mục\s+đích', r'sau\s+khi',
        r'khi\s+thực\s+thi', r'cho\s+kết\s+quả', r'chạy\s+xong', r'hỏi\s+',
        r'phương\s+án', r'kết\s+luận', r'thực\s+hiện', r'kết\s+quả\s+của'
    ]

    @classmethod
    def classify_language(cls, code_str: str) -> str:
        """
        Determines the programming language based on syntax score heuristics.
        Returns: 'python', 'cpp', 'sql', 'html', or 'css'.
        """
        if not code_str or not code_str.strip():
            return 'python'

        scores = {'python': 0, 'cpp': 0, 'sql': 0, 'html': 0, 'css': 0}

        # Check Python
        for pattern in cls.PYTHON_SIGNATURES:
            if re.search(pattern, code_str, re.IGNORECASE if 'for' not in pattern else 0):
                scores['python'] += 2

        # Check C++
        for pattern in cls.CPP_SIGNATURES:
            if re.search(pattern, code_str, re.IGNORECASE if 'for' not in pattern else 0):
                scores['cpp'] += 2

        # Check SQL
        for pattern in cls.SQL_SIGNATURES:
            if re.search(pattern, code_str, re.IGNORECASE):
                scores['sql'] += 3

        # Check HTML
        for pattern in cls.HTML_SIGNATURES:
            if re.search(pattern, code_str, re.IGNORECASE):
                scores['html'] += 3

        # Check CSS
        for pattern in cls.CSS_SIGNATURES:
            if re.search(pattern, code_str, re.IGNORECASE | re.MULTILINE):
                scores['css'] += 2

        css_props = re.findall(r'(?:\b(?:color|background|font|margin|padding|border|display|width|height|text|align|justify|flex|position|top|left|right|bottom|opacity|overflow|z-index)[a-z\-]*\s*:\s*[^;{}]+;)', code_str, re.IGNORECASE)
        scores['css'] += len(css_props) * 2

        if re.search(r'(?:^[a-zA-Z0-9_\-\.#\s,>+~*:]+)\s*\{[^}]*\}', code_str, re.MULTILINE):
            scores['css'] += 3

        # Semicolon density heavily correlates with C++ / SQL / CSS
        semicolon_count = code_str.count(';')
        lines_count = max(1, len(code_str.split('\n')))
        if semicolon_count / lines_count > 0.4:
            scores['cpp'] += 2
            scores['sql'] += 1
            if scores['css'] > 0:
                scores['css'] += 2

        # Indentation heavily correlates with Python
        if re.search(r'\n\s{4,}\w+', code_str) and not re.search(r'[\{\}]', code_str):
            scores['python'] += 2

        if scores['css'] > 0 and not re.search(r'(#include|using\s+namespace|int\s+main|std::|cout|cin|\bint\s+\w+\s*=)', code_str):
            if not re.search(r'<!DOCTYPE|<\s*html|<\s*body|<\s*head|<\s*table|<\s*div\b|<\s*p\b|<\s*script\b', code_str, re.IGNORECASE):
                scores['css'] += 3

        # Return language with highest score (default to python)
        best_lang = max(scores, key=scores.get)
        return best_lang if scores[best_lang] > 0 else 'python'

    @classmethod
    def is_line_code(cls, line: str) -> bool:
        """
        Checks if a single line contains code signatures.
        """
        line_s = line.strip()
        if not line_s:
            return False

        # If it's pure natural language question text, return False
        if re.search(r'^(Câu|PHẦN|A\.|B\.|C\.|D\.|a\)|b\)|c\)|d\)|\[)', line_s, re.IGNORECASE):
            return False

        all_patterns = cls.CPP_SIGNATURES + cls.PYTHON_SIGNATURES + cls.SQL_SIGNATURES + cls.HTML_SIGNATURES + cls.CSS_SIGNATURES
        for p in all_patterns:
            if re.search(p, line_s, re.IGNORECASE):
                return True

        # Check operators or assignment
        if re.search(r'^\s*[a-zA-Z_]\w*\s*(=|\+=|-=|\*=|\/=|%=)\s*[^?]+$', line_s):
            return True

        # Check function call: foo(x, y)
        if re.search(r'^\s*[a-zA-Z_]\w*\s*\([^\)]*\)\s*;?\s*$', line_s):
            return True

        return False

    @classmethod
    def extract_unformatted_code(cls, text: str) -> Tuple[str, str, str, str]:
        """
        Extracts unformatted code from a question text block without ``` tags.
        Returns (cleaned_prompt_before, code_snippet, cleaned_prompt_after, language).
        """
        lines = text.split('\n')
        code_start_idx = -1
        code_end_idx = -1

        for i, line in enumerate(lines):
            if cls.is_line_code(line):
                if code_start_idx == -1:
                    code_start_idx = i
                code_end_idx = i

        if code_start_idx != -1 and code_end_idx != -1 and (code_end_idx - code_start_idx + 1) >= 1:
            code_lines = lines[code_start_idx:code_end_idx + 1]
            code_str = "\n".join(code_lines).strip()
            lang = cls.classify_language(code_str)

            before_lines = lines[:code_start_idx]
            after_lines = lines[code_end_idx + 1:]

            prompt_before = "\n".join(before_lines).strip()
            prompt_after = "\n".join(after_lines).strip()

            return prompt_before, code_str, prompt_after, lang

        return text, "", "", "python"


def test_smart_detector():
    print("[*] Testing SmartCodeDetector heuristics...")

    # Case 1: Untagged Python code
    py_text = """Cho đoạn chương trình sau:
a = [3, 8, 5, 12, 7, 2]
res = [x for x in a if x % 2 == 0]
print(sum(res))
Giá trị in ra màn hình của biến res sau khi thực thi là:"""

    p_before, code, p_after, lang = SmartCodeDetector.extract_unformatted_code(py_text)
    print(f"[+] Python Test: detected lang={lang}, lines={len(code.splitlines())}")
    assert lang == 'python', f"Expected python, got {lang}"
    assert "print(sum(res))" in code
    assert "Cho đoạn chương trình sau:" in p_before
    assert "Giá trị in ra" in p_after

    # Case 2: Untagged C++ code
    cpp_text = """Cho đoạn mã nguồn C++:
#include <iostream>
using namespace std;
int main() {
    int s = 0;
    for (int i = 1; i <= 5; i++) s += i;
    cout << s;
    return 0;
}
Kết quả in ra là:"""

    p_before, code, p_after, lang = SmartCodeDetector.extract_unformatted_code(cpp_text)
    print(f"[+] C++ Test: detected lang={lang}, lines={len(code.splitlines())}")
    assert lang == 'cpp', f"Expected cpp, got {lang}"
    assert "cout << s;" in code

    # Case 3: Untagged SQL
    sql_text = """Cho câu lệnh truy vấn CSDL:
SELECT HoTen, DiemTB FROM HOC_SINH WHERE DiemTB >= 8.0 ORDER BY DiemTB DESC;
Ý nghĩa câu lệnh là:"""

    p_before, code, p_after, lang = SmartCodeDetector.extract_unformatted_code(sql_text)
    print(f"[+] SQL Test: detected lang={lang}")
    assert lang == 'sql', f"Expected sql, got {lang}"

    # Case 4: Untagged HTML
    html_text = """Trong cấu trúc HTML:
<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body><h1>Hello</h1></body>
</html>
Thẻ nào là thẻ tiêu đề?"""

    p_before, code, p_after, lang = SmartCodeDetector.extract_unformatted_code(html_text)
    print(f"[+] HTML Test: detected lang={lang}")
    assert lang == 'html', f"Expected html, got {lang}"

    # Case 5: Untagged CSS
    css_text = """Cho đoạn mã CSS sau:
.card-container {
    background-color: #f0f2f5;
    padding: 20px;
    border-radius: 8px;
    margin: 15px auto;
}
Thuộc tính nào dùng để bo góc phần tử?"""

    p_before, code, p_after, lang = SmartCodeDetector.extract_unformatted_code(css_text)
    print(f"[+] CSS Test: detected lang={lang}, lines={len(code.splitlines())}")
    assert lang == 'css', f"Expected css, got {lang}"
    assert "border-radius: 8px;" in code
    assert "Cho đoạn mã CSS sau:" in p_before
    assert "Thuộc tính nào dùng để bo góc" in p_after

    print("[SUCCESS] SmartCodeDetector passed all 5 language heuristic tests (Python, C++, SQL, HTML, CSS) 100%!")

if __name__ == '__main__':
    test_smart_detector()
