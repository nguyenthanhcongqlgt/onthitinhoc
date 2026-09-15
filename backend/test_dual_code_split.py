import re
from typing import List, Dict, Any, Tuple

class SmartCodeSplitter:
    """
    AI-Heuristic Engine to Automatically Split Multi-Language Code (e.g. Python + C++)
    within a single untagged question block.
    """

    LANG_HEADERS = {
        'python': re.compile(r'^\s*(?:\*\*)?(?:\[\s*)?(?:Ngôn\s*ngữ\s*)?(?:Python|Py|Python\s*3)(?:\s*\])?(?:\*\*)?\s*[:\.\-]?\s*$', re.IGNORECASE),
        'cpp': re.compile(r'^\s*(?:\*\*)?(?:\[\s*)?(?:Ngôn\s*ngữ\s*)?(?:C\+\+|CPP|C|CPlusPlus)(?:\s*\])?(?:\*\*)?\s*[:\.\-]?\s*$', re.IGNORECASE),
        'sql': re.compile(r'^\s*(?:\*\*)?(?:\[\s*)?(?:Ngôn\s*ngữ\s*)?(?:SQL|RDBMS|Truy\s*vấn\s*SQL)(?:\s*\])?(?:\*\*)?\s*[:\.\-]?\s*$', re.IGNORECASE),
        'html': re.compile(r'^\s*(?:\*\*)?(?:\[\s*)?(?:Ngôn\s*ngữ\s*)?(?:HTML|HTML5|Mã\s*HTML)(?:\s*\])?(?:\*\*)?\s*[:\.\-]?\s*$', re.IGNORECASE),
    }

    CPP_START_KEYWORDS = re.compile(r'^\s*(#include\s*<|using\s+namespace|int\s+main|void\s+|int\s+\w+\s*\(|template\s*<|struct\s+|class\s+)')
    PYTHON_START_KEYWORDS = re.compile(r'^\s*(def\s+|import\s+|from\s+\w+\s+import|\w+\s*=\s*\[|for\s+\w+\s+in\s+|print\s*\()')
    SQL_START_KEYWORDS = re.compile(r'^\s*(SELECT\s+|INSERT\s+INTO|UPDATE\s+|DELETE\s+FROM|CREATE\s+TABLE)', re.IGNORECASE)
    HTML_START_KEYWORDS = re.compile(r'^\s*(<!DOCTYPE\s+html>|<\s*html\b|<\s*div\b|<\s*table\b)', re.IGNORECASE)

    @classmethod
    def check_header(cls, line: str) -> str:
        for lang, pat in cls.LANG_HEADERS.items():
            if pat.match(line.strip()):
                return lang
        return ''

    @classmethod
    def split_code_lines(cls, lines: List[str]) -> List[Dict[str, str]]:
        """
        Splits a list of raw code lines into separate language segments.
        """
        snippets: List[Dict[str, str]] = []
        current_lang: str = ''
        current_block: List[str] = []

        for line in lines:
            line_str = line.strip()
            if not line_str:
                if current_block:
                    current_block.append(line)
                continue

            # Check explicit header like "Python:" or "C++:"
            header_lang = cls.check_header(line_str)
            if header_lang:
                if current_block and current_lang:
                    code_text = "\n".join(current_block).strip()
                    if code_text:
                        snippets.append({'language': current_lang, 'code': code_text})
                current_lang = header_lang
                current_block = []
                continue

            # Transition detection without explicit header:
            # If we were in Python and hit "#include" or "using namespace std" or "int main()"
            if current_lang == 'python' and cls.CPP_START_KEYWORDS.match(line):
                code_text = "\n".join(current_block).strip()
                if code_text:
                    snippets.append({'language': 'python', 'code': code_text})
                current_lang = 'cpp'
                current_block = [line]
                continue

            # If we were in C++ and hit "def " or "import " or Python list comprehension
            if current_lang == 'cpp' and cls.PYTHON_START_KEYWORDS.match(line) and not line_str.endswith(';'):
                code_text = "\n".join(current_block).strip()
                if code_text:
                    snippets.append({'language': 'cpp', 'code': code_text})
                current_lang = 'python'
                current_block = [line]
                continue

            # If no current_lang yet, detect initial line
            if not current_lang:
                if cls.CPP_START_KEYWORDS.match(line):
                    current_lang = 'cpp'
                elif cls.PYTHON_START_KEYWORDS.match(line):
                    current_lang = 'python'
                elif cls.SQL_START_KEYWORDS.match(line):
                    current_lang = 'sql'
                elif cls.HTML_START_KEYWORDS.match(line):
                    current_lang = 'html'

            current_block.append(line)

        if current_block:
            code_text = "\n".join(current_block).strip()
            if code_text:
                if not current_lang:
                    # Classify if language still undetermined
                    current_lang = 'python'
                snippets.append({'language': current_lang, 'code': code_text})

        return snippets


def test_splitter():
    print("[*] Testing Automatic Dual Python & C++ Code Splitting...")

    # Case 1: Python and C++ with headers "Python:" and "C++:"
    raw_lines_1 = [
        "Python:",
        "a = [3, 8, 5, 12, 7, 2]",
        "res = [x for x in a if x % 2 == 0]",
        "print(sum(res))",
        "",
        "C++:",
        "#include <iostream>",
        "#include <vector>",
        "using namespace std;",
        "int main() {",
        "    vector<int> a = {3, 8, 5, 12, 7, 2};",
        "    int sum = 0;",
        "    for (int x : a) if (x % 2 == 0) sum += x;",
        "    cout << sum << endl;",
        "    return 0;",
        "}"
    ]

    res_1 = SmartCodeSplitter.split_code_lines(raw_lines_1)
    print(f"[+] Case 1 (With Headers): Found {len(res_1)} languages -> {[r['language'] for r in res_1]}")
    assert len(res_1) == 2, f"Expected 2 blocks, got {len(res_1)}"
    assert res_1[0]['language'] == 'python'
    assert res_1[1]['language'] == 'cpp'
    assert "print(sum(res))" in res_1[0]['code']
    assert "#include <iostream>" in res_1[1]['code']

    # Case 2: Python and C++ WITHOUT ANY headers
    raw_lines_2 = [
        "def solve(a):",
        "    return sum([x for x in a if x % 2 == 0])",
        "",
        "#include <iostream>",
        "#include <vector>",
        "using namespace std;",
        "int solve(const vector<int>& a) {",
        "    int s = 0;",
        "    for(int x : a) if(x % 2 == 0) s += x;",
        "    return s;",
        "}"
    ]

    res_2 = SmartCodeSplitter.split_code_lines(raw_lines_2)
    print(f"[+] Case 2 (WITHOUT ANY Headers): Found {len(res_2)} languages -> {[r['language'] for r in res_2]}")
    assert len(res_2) == 2, f"Expected 2 blocks, got {len(res_2)}"
    assert res_2[0]['language'] == 'python'
    assert res_2[1]['language'] == 'cpp'

    print("[SUCCESS] Dual Language Auto-Splitter passed 100%!")

if __name__ == '__main__':
    test_splitter()
