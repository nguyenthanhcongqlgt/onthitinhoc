import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { examsApi, aiApi, foldersApi, bankApi } from '../services/api';
import { ExamFolder } from '../types';
import { ConfirmModal } from '../components/common/ConfirmModal';
import { CodeViewer } from '../components/exam/CodeViewer';
import { MathFormula } from '../components/exam/MathFormula';
import {
  AISettingsModal,
  getStoredAISettings,
  AISettings,
  AI_PROVIDERS,
} from '../components/common/AISettingsModal';
import { BankQuestionPickerModal } from '../components/bank/BankQuestionPickerModal';
import { ThemeToggle } from '../components/common/ThemeToggle';
import {
  Home,
  FileText,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Cpu,
  Globe,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Edit3,
  Check,
  Plus,
  Trash2,
  Copy,
  Eye,
  Save,
  RefreshCw,
  HelpCircle,
  Lightbulb,
  Image as ImageIcon,
  Code,
  Bot,
  Zap,
  X,
  Trophy,
  GraduationCap,
} from 'lucide-react';

export const NINHBINH_HSG_TEMPLATE = `[DE_THI] ĐỀ THI CHỌN HỌC SINH GIỎI TỈNH NINH BÌNH - MÔN TIN HỌC
[THOI_GIAN] 50
[MA_TRAN] HSG_NINHBINH
[TONG_DIEM_P1] 12
[TONG_DIEM_P2] 8
[TONG_DIEM] 20

PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn (Thí sinh trả lời 30 câu, mỗi câu 0.4 điểm).
Câu 1. [0.4đ] [PROG_BASIC] [NB] Cho đoạn chương trình tính tổng các số chẵn trong mảng $A$ bằng Python và C++:
\`\`\`python
a = [3, 8, 5, 12, 7, 2]
res = [x for x in a if x % 2 == 0]
print(sum(res))
\`\`\`
\`\`\`cpp
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
\`\`\`
Giá trị in ra màn hình của biến sau khi thực thi chương trình là:
A. 20
*B. 22
C. 18
D. 15
[HUONG_DAN] Các số chẵn trong danh sách là 8, 12, 2 -> Tổng sum = 8 + 12 + 2 = 22.

Câu 2. [0.4đ] [DB_NETWORK] [TH] Cho câu lệnh truy vấn Cơ sở Dữ liệu Quan hệ SQL:
\`\`\`sql
SELECT HoTen, DiemTB FROM HOC_SINH WHERE DiemTB >= 8.0 ORDER BY DiemTB DESC;
\`\`\`
Mục đích của câu lệnh trên là:
A. Cập nhật điểm trung bình của tất cả học sinh lên 8.0.
*B. Lấy họ tên và điểm trung bình của học sinh có điểm >= 8.0 theo thứ tự giảm dần.
C. Xóa học sinh có điểm trung bình nhỏ hơn 8.0.
D. Tạo bảng mới chứa danh sách học sinh giỏi.

Câu 3. [0.4đ] [ICT_APP] [NB] Trong HTML5, thẻ nào sau đây dùng để nhúng liên kết tệp định kiểu CSS bên ngoài?
*A. <link rel="stylesheet" href="style.css">
B. <style src="style.css">
C. <script href="style.css">
D. <css link="style.css">

PHẦN II. Câu trắc nghiệm đúng sai (Đề có 7 câu, thí sinh làm 5 câu gồm 3 câu chung và 2 câu định hướng, tối đa 1.6 điểm/câu: 1 ý=0.3đ, 2 ý=0.6đ, 3 ý=1.0đ, 4 ý=1.6đ).
A. Phần chung cho tất cả các thí sinh (3 câu: Câu 4, 5, 6)

Câu 4. [1.6đ] [PROG_BASIC] [VD] Xét thuật toán tìm ước chung lớn nhất của 2 số nguyên dương $a$ và $b$:
\`\`\`python
def gcd(a, b):
    while b != 0:
        a, b = b, a % b
    return a
\`\`\`
*a)[0,NB] Khi $b = 0$, thuật toán dừng và trả về giá trị của $a$ là ước chung lớn nhất.
b)[1,TH] Độ phức tạp thời gian trong trường hợp xấu nhất của thuật toán là $O(a + b)$.
*c)[2,TH] Độ phức tạp thời gian thực tế của thuật toán Euclid là $O(\\log(\\min(a, b)))$.
d)[3,VD] Nếu $a < b$, thuật toán sẽ rơi vào vòng lặp vô tận (Infinite Loop).

Câu 5. [1.6đ] [ALGO_DS] [VD] Cho thuật toán tìm kiếm nhị phân (Binary Search) trên mảng đã sắp xếp tăng dần:
*a)[0,NB] Mảng đầu vào bắt buộc phải được sắp xếp trước khi áp dụng tìm kiếm nhị phân.
*b)[1,TH] Độ phức tạp thời gian của thuật toán tìm kiếm nhị phân là $O(\\log n)$.
c)[2,TH] Thuật toán tìm kiếm nhị phân chỉ áp dụng được trên danh sách liên kết đơn (Linked List).
d)[3,VD] Nếu phần tử không tồn tại trong mảng, thuật toán cần $O(n)$ phép so sánh.

Câu 6. [1.6đ] [OPTIMIZATION] [VD] Xét bài toán Quy hoạch động (Dynamic Programming):
*a)[0,NB] Bài toán quy hoạch động thỏa mãn tính chất các bài toán con gối nhau (Overlapping Subproblems).
*b)[1,TH] Kỹ thuật Memoization (Ghi nhớ) lưu kết quả bài toán con để tránh tính toán lại.
*c)[2,TH] Bảng phương án trong quy hoạch động thường được điền theo thứ tự từ bài toán cơ sở đến bài toán lớn.
d)[3,VD] Mọi bài toán tối ưu đều giải được hiệu quả bằng thuật toán tham lam (Greedy).

B. Phần riêng (Thí sinh chọn 1 trong 2 nhánh: CS hoặc ICT)
[PHAN_II_CS] Chuyên đề Khoa học máy tính (CS) (2 câu: Câu 7, 8)

Câu 7. [1.6đ] [ALGO_DS] [VD] Cho thuật toán tìm đường đi ngắn nhất Dijkstra với hàng đợi ưu tiên trong C++ và Python:
*a)[0,NB] Thuật toán Dijkstra tìm đường đi ngắn nhất với Min-Heap có độ phức tạp $O((V + E) \\log V)$.
b)[1,TH] Thuật toán Dijkstra luôn tìm được đường đi ngắn nhất khi đồ thị có cạnh mang trọng số âm.
*c)[2,TH] Thuật toán Bellman-Ford có thể phát hiện chu trình âm (Negative Cycle) trong đồ thị.
d)[3,VD] Thuật toán Floyd-Warshall có độ phức tạp là $O(V^2)$.

Câu 8. [1.6đ] [ALGO_DS] [VD] Về Cây khung nhỏ nhất (Minimum Spanning Tree):
*a)[0,NB] Thuật toán Kruskal sắp xếp các cạnh theo trọng số tăng dần rồi lần lượt kết nạp cạnh không tạo chu trình.
*b)[1,TH] Cấu trúc dữ liệu Disjoint Set Union (DSU) giúp kiểm tra chu trình nhanh chóng trong thuật toán Kruskal.
*c)[2,TH] Thuật toán Prim phát triển cây khung từ một đỉnh gốc bằng cách chọn cạnh nối nhỏ nhất.
d)[3,VD] Đồ thị vô hướng có $n$ đỉnh thì cây khung có đúng $n$ cạnh.

[PHAN_II_ICT] Chuyên đề Tin học ứng dụng (ICT) (2 câu: Câu 7, 8)

Câu 7. [1.6đ] [DB_NETWORK] [TH] Trong quản trị CSDL SQL và Giao thức Mạng:
*a)[0,NB] Mệnh đề \`INNER JOIN\` kết nối 2 bảng dựa trên điều kiện khóa ngoại.
b)[1,TH] Khóa ngoại trong một bảng bắt buộc phải mang giá trị duy nhất (UNIQUE).
*c)[2,TH] Tạo Chỉ mục (Index) trên cột giúp tăng tốc độ truy vấn lọc và sắp xếp.
*d)[3,VD] Giao thức HTTPS sử dụng cổng mặc định là 443 và mã hóa qua SSL/TLS.

Câu 8. [1.6đ] [ICT_APP] [VD] Trong thiết kế Trang web và Ứng dụng Web hiện đại:
*a)[0,NB] CSS Flexbox và CSS Grid hỗ trợ bố cục giao diện phản hồi (Responsive Design).
*b)[1,TH] RESTful API sử dụng các phương thức HTTP như GET, POST, PUT, DELETE để trao đổi dữ liệu.
*c)[2,TH] Định dạng JSON (JavaScript Object Notation) là định dạng dữ liệu dạng văn bản nhẹ, dễ đọc.
d)[3,VD] Cookie lưu trữ dữ liệu an toàn tuyệt đối và không thể bị đánh cắp qua tấn công XSS.

--------------------HẾT--------------------
`;

export const BGD_GRADUATION_TEMPLATE = `[DE_THI] ĐỀ THI TỐT NGHIỆP THPT 2025 - MÔN TIN HỌC (BỘ GD&ĐT)
[THOI_GIAN] 50
[MA_TRAN] BGD_2025
[TONG_DIEM_P1] 6
[TONG_DIEM_P2] 4
[TONG_DIEM] 10

PHẦN I. Câu trắc nghiệm nhiều phương án lựa chọn (Thí sinh trả lời 24 câu, mỗi câu 0.25 điểm).
Câu 1. [0.25đ] [PROG_BASIC] [NB] Cho đoạn mã Python:
\`\`\`python
s = "Tin Hoc 12"
print(s.lower())
\`\`\`
Kết quả in ra màn hình là:
*A. tin hoc 12
B. TIN HOC 12
C. Tin hoc 12
D. Tin Hoc 12

Câu 2. [0.25đ] [DB_NETWORK] [TH] Trong mô hình mạng máy tính, thiết bị nào định tuyến các gói tin giữa các mạng khác nhau?
A. Hub
B. Switch
*C. Router
D. Repeater

Câu 3. [0.25đ] [ICT_APP] [NB] Trong bảng tính Excel, công thức nào tính trung bình cộng của vùng A1:A5?
*A. =AVERAGE(A1:A5)
B. =SUM(A1:A5)
C. =MEAN(A1:A5)
D. =COUNT(A1:A5)

PHẦN II. Câu trắc nghiệm đúng sai (Đề có 6 câu, thí sinh làm 4 câu gồm 2 câu chung và 2 câu định hướng, tối đa 1.0 điểm/câu: 1 ý=0.1đ, 2 ý=0.25đ, 3 ý=0.5đ, 4 ý=1.0đ).
A. Phần chung cho tất cả các thí sinh (2 câu: Câu 4, 5)

Câu 4. [1.0đ] [PROG_BASIC] [TH] Xét hàm kiểm tra số nguyên tố trong Python:
\`\`\`python
def is_prime(n):
    if n < 2: return False
    for i in range(2, int(n**0.5) + 1):
        if n % i == 0: return False
    return True
\`\`\`
*a)[0,NB] Hàm trả về True nếu $n$ là số nguyên tố và False nếu ngược lại.
*b)[1,TH] Vòng lặp duyệt $i$ từ $2$ đến $\\lfloor\\sqrt{n}\\rfloor$ giúp tối ưu thời gian chạy.
c)[2,TH] Khi $n = 1$, hàm trả về True vì 1 là số nguyên tố.
d)[3,VD] Hàm có độ phức tạp thời gian là $O(n)$.

Câu 5. [1.0đ] [DB_NETWORK] [VD] Trong an toàn thông tin và bảo mật dữ liệu:
*a)[0,NB] Mật khẩu mạnh nên có độ dài tối thiểu 8 ký tự, gồm chữ hoa, chữ thường, chữ số và ký tự đặc biệt.
*b)[1,TH] Xác thực 2 yếu tố (2FA) tăng cường bảo mật cho tài khoản người dùng.
*c)[2,TH] Tấn công Phishing là hình thức giả mạo website hoặc email nhằm lừa người dùng cung cấp thông tin nhạy cảm.
d)[3,VD] Sao lưu dữ liệu (Backup) định kỳ chỉ cần thiết cho các doanh nghiệp lớn.

B. Phần riêng (Thí sinh chọn 1 trong 2 nhánh: CS hoặc ICT)
[PHAN_II_CS] Chuyên đề Khoa học máy tính (CS) (2 câu: Câu 6, 7)

Câu 6. [1.0đ] [ALGO_DS] [VD] Cho thuật toán sắp xếp nhanh QuickSort:
*a)[0,NB] QuickSort sử dụng chiến lược chia để trị (Divide and Conquer).
*b)[1,TH] Phần tử chốt (Pivot) được dùng để phân hoạch mảng thành 2 nửa.
*c)[2,TH] Độ phức tạp thời gian trung bình của QuickSort là $O(n \\log n)$.
d)[3,VD] QuickSort là thuật toán sắp xếp ổn định (Stable Sort) trong mọi trường hợp cài đặt.

Câu 7. [1.0đ] [ALGO_DS] [VD] Về Cấu trúc dữ liệu Ngăn xếp (Stack) và Hàng đợi (Queue):
*a)[0,NB] Ngăn xếp hoạt động theo nguyên lý LIFO (Last In First Out).
*b)[1,TH] Hàng đợi hoạt động theo nguyên lý FIFO (First In First Out).
*c)[2,TH] Thao tác Push thêm phần tử vào đỉnh ngăn xếp, Pop lấy phần tử ra khỏi đỉnh.
d)[3,VD] Hàng đợi chỉ cho phép lấy phần tử ở cả hai đầu.

[PHAN_II_ICT] Chuyên đề Tin học ứng dụng (ICT) (2 câu: Câu 6, 7)

Câu 6. [1.0đ] [DB_NETWORK] [TH] Trong Cơ sở dữ liệu quan hệ:
*a)[0,NB] Bảng gồm các hàng (bản ghi) và các cột (thuộc tính).
*b)[1,TH] Khóa chính (Primary Key) định danh duy nhất mỗi bản ghi trong bảng.
*c)[2,TH] Lệnh DELETE xóa bản ghi nhưng giữ lại cấu trúc của bảng.
d)[3,VD] Lệnh DROP TABLE chỉ xóa dữ liệu bên trong mà vẫn giữ lại bảng.

Câu 7. [1.0đ] [ICT_APP] [VD] Về xử lý ảnh và thiết kế đồ họa số:
*a)[0,NB] Ảnh Bitmap được tạo thành từ lưới các điểm ảnh (Pixel).
*b)[1,TH] Ảnh Vector không bị giảm chất lượng khi phóng to hoặc thu nhỏ.
*c)[2,TH] Không gian màu RGB thường dùng cho hiển thị màn hình số, CMYK dùng cho in ấn.
d)[3,VD] Định dạng tệp PNG không hỗ trợ nền trong suốt (Transparency).

--------------------HẾT--------------------
`;

const AZOTA_SAMPLE_TEMPLATE = NINHBINH_HSG_TEMPLATE;

const questionsToAzotaText = (
  qList: any[],
  examTitle: string = 'ĐỀ THI KHẢO SÁT TIN HỌC 2025 - THPT QUẤT LÂM',
  examDuration: number = 50,
  examMatrix: string = 'HSG_QUAT_LAM',
  part1TotalScore: number = 12,
  part2TotalScore: number = 8
): string => {
  if (!qList || qList.length === 0) return '';

  const totalScore = Number((part1TotalScore + part2TotalScore).toFixed(2));
  let text = `[DE_THI] ${examTitle}\n[THOI_GIAN] ${examDuration}\n[MA_TRAN] ${examMatrix}\n[TONG_DIEM_P1] ${part1TotalScore}\n[TONG_DIEM_P2] ${part2TotalScore}\n[TONG_DIEM] ${totalScore}\n\n`;

  const part1 = qList.filter((q) => q.part_type === 'PART_I');
  const part2Common = qList.filter((q) => q.part_type === 'PART_II' && (q.branch === 'COMMON' || !q.branch));
  const part2CS = qList.filter((q) => q.part_type === 'PART_II' && q.branch === 'CS');
  const part2ICT = qList.filter((q) => q.part_type === 'PART_II' && q.branch === 'ICT');

  if (part1.length > 0) {
    text += `PHẦN I. Thí sinh trả lời từ câu 1 đến câu ${part1.length}. Mỗi câu hỏi thí sinh chỉ chọn một phương án.\n\n`;
    part1.forEach((q, idx) => {
      const qNum = idx + 1;
      const cat = q.competency_category || 'PROG_BASIC';
      const diff = q.difficulty_level || 'TH';
      const qPt = q.point !== undefined && q.point !== null ? q.point : 0.5;
      text += `Câu ${qNum}. [${qPt}đ] [${cat}] [${diff}] ${q.content}\n`;
      if (q.code_snippet && q.code_snippet.trim()) {
        text += `\`\`\`${q.code_language || 'python'}\n${q.code_snippet}\n\`\`\`\n`;
      }
      if (q.options && q.options.length > 0) {
        q.options.forEach((opt: any) => {
          const prefix = opt.is_correct ? `*${opt.label}.` : `${opt.label}.`;
          text += `${prefix} ${opt.content}\n`;
        });
      }
      if (q.explanation && q.explanation.trim()) {
        text += `[LOI_GIAI] ${q.explanation.trim()}\n`;
      }
      text += '\n';
    });
  }

  if (part2Common.length > 0 || part2CS.length > 0 || part2ICT.length > 0) {
    text += `PHẦN II. Câu trắc nghiệm đúng sai. Trong mỗi ý a), b), c), d) ở mỗi câu, thí sinh chọn đúng hoặc sai.\n`;

    if (part2Common.length > 0) {
      text += `A. Phần chung cho tất cả các thí sinh\n\n`;
      part2Common.forEach((q, idx) => {
        const qNum = part1.length + idx + 1;
        const cat = q.competency_category || 'PROG_BASIC';
        const diff = q.difficulty_level || 'VD';
        const qPt = q.point !== undefined && q.point !== null ? q.point : 2.0;
        text += `Câu ${qNum}. [${qPt}đ] [${cat}] [${diff}] ${q.content}\n`;
        if (q.code_snippet && q.code_snippet.trim()) {
          text += `\`\`\`${q.code_language || 'python'}\n${q.code_snippet}\n\`\`\`\n`;
        }
        if (q.options && q.options.length > 0) {
          q.options.forEach((opt: any, optIdx: number) => {
            const diffTag = opt.difficulty_level ? `[${optIdx},${opt.difficulty_level}]` : `[${optIdx},TH]`;
            const prefix = opt.is_correct ? `*${opt.label})${diffTag}` : `${opt.label})${diffTag}`;
            text += `${prefix} ${opt.content}\n`;
          });
        }
        if (q.explanation && q.explanation.trim()) {
          text += `[LOI_GIAI] ${q.explanation.trim()}\n`;
        }
        text += '\n';
      });
    }

    if (part2CS.length > 0 || part2ICT.length > 0) {
      text += `B. Phần riêng (CS và ICT)\n`;
      if (part2CS.length > 0) {
        text += `[PHAN_II_CS] Chuyên đề Khoa học máy tính (CS)\n\n`;
        part2CS.forEach((q, idx) => {
          const qNum = part1.length + part2Common.length + idx + 1;
          const cat = q.competency_category || 'ALGO_DS';
          const diff = q.difficulty_level || 'VD';
          const qPt = q.point !== undefined && q.point !== null ? q.point : 2.0;
          text += `Câu ${qNum}. [${qPt}đ] [${cat}] [${diff}] ${q.content}\n`;
          if (q.code_snippet && q.code_snippet.trim()) {
            text += `\`\`\`${q.code_language || 'python'}\n${q.code_snippet}\n\`\`\`\n`;
          }
          if (q.options && q.options.length > 0) {
            q.options.forEach((opt: any, optIdx: number) => {
              const diffTag = opt.difficulty_level ? `[${optIdx},${opt.difficulty_level}]` : `[${optIdx},TH]`;
              const prefix = opt.is_correct ? `*${opt.label})${diffTag}` : `${opt.label})${diffTag}`;
              text += `${prefix} ${opt.content}\n`;
            });
          }
          if (q.explanation && q.explanation.trim()) {
            text += `[LOI_GIAI] ${q.explanation.trim()}\n`;
          }
          text += '\n';
        });
      }

      if (part2ICT.length > 0) {
        text += `[PHAN_II_ICT] Chuyên đề Tin học ứng dụng (ICT)\n\n`;
        part2ICT.forEach((q, idx) => {
          const qNum = part1.length + part2Common.length + idx + 1;
          const cat = q.competency_category || 'DB_NETWORK';
          const diff = q.difficulty_level || 'VD';
          const qPt = q.point !== undefined && q.point !== null ? q.point : 2.0;
          text += `Câu ${qNum}. [${qPt}đ] [${cat}] [${diff}] ${q.content}\n`;
          if (q.code_snippet && q.code_snippet.trim()) {
            text += `\`\`\`${q.code_language || 'python'}\n${q.code_snippet}\n\`\`\`\n`;
          }
          if (q.options && q.options.length > 0) {
            q.options.forEach((opt: any, optIdx: number) => {
              const diffTag = opt.difficulty_level ? `[${optIdx},${opt.difficulty_level}]` : `[${optIdx},TH]`;
              const prefix = opt.is_correct ? `*${opt.label})${diffTag}` : `${opt.label})${diffTag}`;
              text += `${prefix} ${opt.content}\n`;
            });
          }
          if (q.explanation && q.explanation.trim()) {
            text += `[LOI_GIAI] ${q.explanation.trim()}\n`;
          }
          text += '\n';
        });
      }
    }
  }

  return text;
};

export interface IssueItem {
  type: 'error' | 'warning';
  code: string;
  message: string;
  suggestion: string;
}

export interface ValidationSummary {
  total_questions: number;
  valid_count: number;
  error_count: number;
  warning_count: number;
  error_question_indices: number[];
  warning_question_indices: number[];
  detailed_issues: Array<{
    list_index: number;
    order_index: number;
    part_type: string;
    branch: string;
    has_error: boolean;
    has_warning: boolean;
    issues: IssueItem[];
  }>;
}

export const validateQuestionsClient = (questionsList: any[]): ValidationSummary => {
  const total = questionsList.length;
  const error_indices: number[] = [];
  const warning_indices: number[] = [];
  const detailed_issues: Array<{
    list_index: number;
    order_index: number;
    part_type: string;
    branch: string;
    has_error: boolean;
    has_warning: boolean;
    issues: IssueItem[];
  }> = [];

  questionsList.forEach((q, idx) => {
    const issues: IssueItem[] = [];
    const part_type = q.part_type || 'PART_I';
    const content = (q.content || '').trim();
    const code_snippet = (q.code_snippet || '').trim();
    const options = q.options || [];
    const explanation = (q.explanation || '').trim();

    // 1. Check Empty Prompt
    if (!content && !code_snippet) {
      issues.push({
        type: 'error',
        code: 'EMPTY_PROMPT',
        message: 'Nội dung câu hỏi đang bị rỗng.',
        suggestion: 'Nhập đề bài hoặc mã nguồn cho câu này.'
      });
    } else if (content.length < 3 && !code_snippet) {
      issues.push({
        type: 'warning',
        code: 'SHORT_PROMPT',
        message: `Nội dung câu hỏi quá ngắn ('${content}').`,
        suggestion: 'Kiểm tra xem có bị thiếu chữ hay không.'
      });
    }

    // 2. Check Options Count
    if (!options || options.length === 0) {
      issues.push({
        type: 'error',
        code: 'NO_OPTIONS',
        message: 'Câu hỏi chưa có phương án lựa chọn nào.',
        suggestion: 'Thêm các phương án A, B, C, D (Phần I) hoặc a, b, c, d (Phần II).'
      });
    } else if (part_type === 'PART_I') {
      if (options.length < 4) {
        const existingLabels = options.map((opt: any) => opt.label || '?').join(', ');
        issues.push({
          type: 'error',
          code: 'PART_I_INCOMPLETE_OPTIONS',
          message: `Phần I chỉ có ${options.length}/4 phương án (${existingLabels}).`,
          suggestion: 'Bổ sung thêm để đủ 4 phương án A, B, C, D.'
        });
      }
    } else if (part_type === 'PART_II') {
      if (options.length < 4) {
        const existingLabels = options.map((opt: any) => opt.label || '?').join(', ');
        issues.push({
          type: 'error',
          code: 'PART_II_INCOMPLETE_SUBITEMS',
          message: `Phần II chỉ có ${options.length}/4 ý (${existingLabels}).`,
          suggestion: 'Bổ sung thêm để đủ 4 ý a, b, c, d.'
        });
      }
    }

    // 3. Check Option Content & Labels
    const labelsSeen = new Set<string>();
    options.forEach((opt: any, optIdx: number) => {
      const label = (opt.label || '').trim();
      const optContent = (opt.content || '').trim();

      if (!label) {
        issues.push({
          type: 'error',
          code: 'MISSING_OPTION_LABEL',
          message: `Phương án thứ ${optIdx + 1} chưa có nhãn.`,
          suggestion: 'Đặt nhãn chuẩn (A/B/C/D hoặc a/b/c/d).'
        });
      } else if (labelsSeen.has(label)) {
        issues.push({
          type: 'error',
          code: 'DUPLICATE_OPTION_LABELS',
          message: `Trùng lặp nhãn phương án '${label}'.`,
          suggestion: `Đổi tên nhãn '${label}' để không bị trùng.`
        });
      }
      labelsSeen.add(label);

      if (!optContent) {
        issues.push({
          type: 'error',
          code: 'EMPTY_OPTION_CONTENT',
          message: `Phương án ${label} đang bị rỗng nội dung.`,
          suggestion: `Nhập nội dung cho phương án ${label}.`
        });
      }
    });

    // 4. Check Multiple Correct Answers in Part I
    if (options && options.length > 0 && part_type === 'PART_I') {
      const correctCount = options.filter((opt: any) => opt.is_correct).length;
      if (correctCount > 1) {
        issues.push({
          type: 'error',
          code: 'PART_I_MULTIPLE_CORRECT',
          message: `Có tới ${correctCount} đáp án được đánh dấu đúng.`,
          suggestion: 'Chỉ chọn duy nhất 1 đáp án đúng cho Phần I.'
        });
      }
    }

    const has_error = issues.some((i) => i.type === 'error');
    const has_warning = issues.some((i) => i.type === 'warning');

    q.issues = issues;
    q.has_error = has_error;
    q.has_warning = has_warning;

    if (has_error) error_indices.push(idx);
    if (has_warning) warning_indices.push(idx);

    if (issues.length > 0) {
      detailed_issues.push({
        list_index: idx,
        order_index: q.order_index || idx + 1,
        part_type,
        branch: q.branch || 'COMMON',
        has_error,
        has_warning,
        issues
      });
    }
  });

  return {
    total_questions: total,
    valid_count: total - error_indices.length,
    error_count: error_indices.length,
    warning_count: warning_indices.length,
    error_question_indices: error_indices,
    warning_question_indices: warning_indices,
    detailed_issues
  };
};

export const ExamCreator: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');

  const [confirmConfig, setConfirmConfig] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void, isDestructive?: boolean}>({isOpen: false, title: '', message: '', onConfirm: () => {}});

  // Mode: 'paste' (Raw text / copy-paste) | 'form' (Manual Add)
  const [inputMode, setInputMode] = useState<'paste' | 'form'>('paste');
  const [rawText, setRawText] = useState<string>(AZOTA_SAMPLE_TEMPLATE);

  // Exam Type: 'HSG' (HSG THPT) | 'TN_THPT' (Thi Tốt Nghiệp THPT)
  const [examType, setExamType] = useState<'HSG' | 'TN_THPT'>('HSG');

  // Folder state
  const [folders, setFolders] = useState<ExamFolder[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string>(
    searchParams.get('folder') || ''
  );

  useEffect(() => {
    foldersApi.getFolders({ scope: 'all' }).then(setFolders).catch(console.error);
  }, []);

  // Exam Meta & Scoring
  const [title, setTitle] = useState<string>('ĐỀ THI KHẢO SÁT TIN HỌC 2025 - THPT QUẤT LÂM');
  const [duration, setDuration] = useState<number>(50);
  const [matrixPreset, setMatrixPreset] = useState<string>('HSG_QUAT_LAM');
  const [part1Total, setPart1Total] = useState<number>(12);
  const [part2Total, setPart2Total] = useState<number>(8);
  const [accessType, setAccessType] = useState<string>('PUBLIC');
  const [accessCode, setAccessCode] = useState<string>('');

  const totalPoints = Number((part1Total + part2Total).toFixed(2));

  // Questions state
  const [questions, setQuestions] = useState<any[]>([]);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState<string>('');

  // 2-Way Sync & Explanation states
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isSyncingFromUI = useRef<boolean>(false);
  const isLoadedEdit = useRef<boolean>(false);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number | null>(null);
  const [expandedExplanations, setExpandedExplanations] = useState<{ [qIdx: number]: boolean }>({});

  // Real-time Exam Quality Diagnostics
  const validationSummary = React.useMemo(() => {
    return validateQuestionsClient(questions);
  }, [questions]);

  const handleJumpToErrorQuestion = (listIdx: number) => {
    setActiveQuestionIndex(listIdx);
    const q = questions[listIdx];
    if (q) {
      jumpCursorToQuestionPart(q, 'prompt');
    }
    const element = document.getElementById(`preview-q-${listIdx}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.classList.add('ring-4', 'ring-red-500', 'animate-pulse');
      setTimeout(() => {
        element.classList.remove('ring-4', 'ring-red-500', 'animate-pulse');
      }, 2500);
    }
  };

  const toggleExplanation = (qIdx: number) => {
    setExpandedExplanations((prev) => ({
      ...prev,
      [qIdx]: !prev[qIdx],
    }));
  };

  const handleExplanationChange = (qIdx: number, newExplanation: string) => {
    isSyncingFromUI.current = true;
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIdx] = {
        ...updated[qIdx],
        explanation: newExplanation,
      };
      const syncedText = questionsToAzotaText(updated, title, duration, matrixPreset, part1Total, part2Total);
      setRawText(syncedText);
      return updated;
    });
  };

  // Point management handlers
  const handleQuestionPointChange = (qIdx: number, newPt: number) => {
    const validPt = Math.max(0, Number(newPt) || 0);
    isSyncingFromUI.current = true;
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIdx] = {
        ...updated[qIdx],
        point: validPt,
      };

      // Recalculate section totals
      const p1Sum = updated
        .filter((q) => q.part_type === 'PART_I')
        .reduce((sum, q) => sum + (q.point !== undefined ? Number(q.point) : 0.5), 0);

      const p2Common = updated
        .filter((q) => q.part_type === 'PART_II' && (q.branch === 'COMMON' || !q.branch))
        .reduce((sum, q) => sum + (q.point !== undefined ? Number(q.point) : 2.0), 0);
      const p2CS = updated
        .filter((q) => q.part_type === 'PART_II' && q.branch === 'CS')
        .reduce((sum, q) => sum + (q.point !== undefined ? Number(q.point) : 2.0), 0);
      const p2ICT = updated
        .filter((q) => q.part_type === 'PART_II' && q.branch === 'ICT')
        .reduce((sum, q) => sum + (q.point !== undefined ? Number(q.point) : 2.0), 0);
      const p2Sum = p2Common + Math.max(p2CS, p2ICT);

      const newP1 = Number(p1Sum.toFixed(2));
      const newP2 = Number(p2Sum.toFixed(2));
      setPart1Total(newP1);
      setPart2Total(newP2);

      const syncedText = questionsToAzotaText(updated, title, duration, matrixPreset, newP1, newP2);
      setRawText(syncedText);
      return updated;
    });
  };

  const handleDistributePart1Points = () => {
    const p1Indices: number[] = [];
    questions.forEach((q, idx) => {
      if (q.part_type === 'PART_I') p1Indices.push(idx);
    });

    if (p1Indices.length === 0) {
      toast.error('Chưa có câu hỏi Phần I nào để chia điểm.');
      return;
    }

    const eachPt = Number((part1Total / p1Indices.length).toFixed(2));
    isSyncingFromUI.current = true;
    setQuestions((prev) => {
      const updated = [...prev];
      p1Indices.forEach((idx) => {
        updated[idx] = { ...updated[idx], point: eachPt };
      });
      const syncedText = questionsToAzotaText(updated, title, duration, matrixPreset, part1Total, part2Total);
      setRawText(syncedText);
      return updated;
    });

    setStatusMsg(`✓ Đã chia đều ${part1Total}đ cho ${p1Indices.length} câu Phần I (${eachPt}đ/câu)!`);
    setTimeout(() => setStatusMsg(''), 3500);
  };

  const handleDistributePart2Points = () => {
    const p2CommonIndices: number[] = [];
    const p2CSIndices: number[] = [];
    const p2ICTIndices: number[] = [];

    questions.forEach((q, idx) => {
      if (q.part_type === 'PART_II') {
        if (q.branch === 'CS') p2CSIndices.push(idx);
        else if (q.branch === 'ICT') p2ICTIndices.push(idx);
        else p2CommonIndices.push(idx);
      }
    });

    const effectiveCount = p2CommonIndices.length + Math.max(p2CSIndices.length, p2ICTIndices.length);
    if (effectiveCount === 0) {
      toast.error('Chưa có câu hỏi Phần II nào để chia điểm.');
      return;
    }

    const eachPt = Number((part2Total / effectiveCount).toFixed(2));
    isSyncingFromUI.current = true;
    setQuestions((prev) => {
      const updated = [...prev];
      [...p2CommonIndices, ...p2CSIndices, ...p2ICTIndices].forEach((idx) => {
        updated[idx] = { ...updated[idx], point: eachPt };
      });
      const syncedText = questionsToAzotaText(updated, title, duration, matrixPreset, part1Total, part2Total);
      setRawText(syncedText);
      return updated;
    });

    setStatusMsg(`✓ Đã chia đều ${part2Total}đ cho các câu Phần II (${eachPt}đ/câu)!`);
    setTimeout(() => setStatusMsg(''), 3500);
  };

  // Change Question Branch (COMMON, CS, ICT) in Part 2
  const handleChangeBranch = (qIdx: number, newBranch: 'COMMON' | 'CS' | 'ICT') => {
    isSyncingFromUI.current = true;
    setQuestions((prev) => {
      const updated = [...prev];
      updated[qIdx] = {
        ...updated[qIdx],
        branch: newBranch,
      };

      // Recalculate section totals & effective count
      const p2Common = updated
        .filter((q) => q.part_type === 'PART_II' && (q.branch === 'COMMON' || !q.branch))
        .reduce((sum, q) => sum + (q.point !== undefined ? Number(q.point) : 2.0), 0);
      const p2CS = updated
        .filter((q) => q.part_type === 'PART_II' && q.branch === 'CS')
        .reduce((sum, q) => sum + (q.point !== undefined ? Number(q.point) : 2.0), 0);
      const p2ICT = updated
        .filter((q) => q.part_type === 'PART_II' && q.branch === 'ICT')
        .reduce((sum, q) => sum + (q.point !== undefined ? Number(q.point) : 2.0), 0);
      const newP2 = Number((p2Common + Math.max(p2CS, p2ICT)).toFixed(2));
      setPart2Total(newP2);

      const syncedText = questionsToAzotaText(updated, title, duration, matrixPreset, part1Total, newP2);
      setRawText(syncedText);
      return updated;
    });

    const branchLabel = newBranch === 'COMMON' ? 'Phần Chung' : newBranch === 'CS' ? 'Nhánh CS' : 'Nhánh ICT';
    setStatusMsg(`✓ Đã chuyển câu hỏi sang ${branchLabel}!`);
    setTimeout(() => setStatusMsg(''), 2500);
  };

  // Switch Matrix Preset (HSG Ninh Binh vs BGD 2025 vs Linear)
  const handleSwitchMatrixPreset = (newPreset: string) => {
    isSyncingFromUI.current = true;
    setMatrixPreset(newPreset);

    if (newPreset === 'HSG_NINHBINH' || newPreset === 'HSG_QUAT_LAM') {
      const p1Pt = 0.4;
      const p2Pt = 1.6;
      setPart1Total(12);
      setPart2Total(8);
      setQuestions((prev) => {
        const updated = prev.map((q) => ({
          ...q,
          point: q.part_type === 'PART_I' ? p1Pt : p2Pt,
        }));
        const synced = questionsToAzotaText(updated, title, duration, newPreset, 12, 8);
        setRawText(synced);
        return updated;
      });
      setStatusMsg('✓ Đã áp dụng Cấu trúc Đề thi HSG Ninh Bình (Thang 20đ: P1=0.4đ/câu • P2=1.6đ/câu)!');
    } else if (newPreset === 'BGD_2025') {
      const p1Pt = 0.25;
      const p2Pt = 1.0;
      setPart1Total(6);
      setPart2Total(4);
      setQuestions((prev) => {
        const updated = prev.map((q) => ({
          ...q,
          point: q.part_type === 'PART_I' ? p1Pt : p2Pt,
        }));
        const synced = questionsToAzotaText(updated, title, duration, newPreset, 6, 4);
        setRawText(synced);
        return updated;
      });
      setStatusMsg('✓ Đã áp dụng Cấu trúc Đề thi Tốt nghiệp THPT Bộ GD&ĐT (Thang 10đ: P1=0.25đ/câu • P2=1.0đ/câu)!');
    } else {
      const synced = questionsToAzotaText(questions, title, duration, newPreset, part1Total, part2Total);
      setRawText(synced);
    }
    setTimeout(() => setStatusMsg(''), 3500);
  };

  const handleSwitchExamType = (newType: 'HSG' | 'TN_THPT') => {
    setExamType(newType);
    if (newType === 'HSG') {
      handleSwitchMatrixPreset('HSG_QUAT_LAM');
    } else {
      handleSwitchMatrixPreset('BGD_2025');
    }
  };

  // Image & Docx Upload & Paste states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docxFileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [isUploadingDocx, setIsUploadingDocx] = useState<boolean>(false);

  // Handle uploading and parsing a Word (.docx) or PDF (.pdf) file with embedded image extraction
  const handleDocxFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.name.toLowerCase().endsWith('.pdf');
    setIsUploadingDocx(true);
    setStatusMsg(`📄 Đang đọc file ${isPdf ? 'PDF' : 'Word'} và tự động trích xuất toàn bộ câu hỏi & hình ảnh...`);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('action', 'preview');

      const data = await examsApi.importDocx(formData);

      if (data.questions && data.questions.length > 0) {
        setQuestions(data.questions);

        // If raw_text is provided by backend, use it; otherwise generate
        if (data.raw_text) {
          setRawText(data.raw_text);
        } else {
          const generated = questionsToAzotaText(
            data.questions,
            data.exam_metadata?.title || title,
            data.exam_metadata?.duration_minutes || duration,
            data.exam_metadata?.matrix_preset || matrixPreset,
            data.exam_metadata?.part1_total_points || part1Total,
            data.exam_metadata?.part2_total_points || part2Total
          );
          setRawText(generated);
        }

        if (data.exam_metadata) {
          if (data.exam_metadata.title) setTitle(data.exam_metadata.title);
          if (data.exam_metadata.duration_minutes) setDuration(data.exam_metadata.duration_minutes);
          if (data.exam_metadata.matrix_preset) setMatrixPreset(data.exam_metadata.matrix_preset);
          if (data.exam_metadata.part1_total_points) setPart1Total(data.exam_metadata.part1_total_points);
          if (data.exam_metadata.part2_total_points) setPart2Total(data.exam_metadata.part2_total_points);
        }

        setStatusMsg(`✓ Đã nạp thành công ${data.questions.length} câu hỏi từ file ${isPdf ? 'PDF' : 'Word'} và trích xuất toàn bộ hình ảnh!`);
        setTimeout(() => setStatusMsg(''), 6000);
      } else {
        setErrorMsg(`Không tìm thấy câu hỏi nào trong file ${isPdf ? 'PDF' : 'Word'}.`);
      }
    } catch (err: any) {
      console.error('Upload file error:', err);
      const msg = err.response?.data?.detail || `Không thể đọc file ${isPdf ? 'PDF' : 'Word'} này. Vui lòng kiểm tra lại định dạng.`;
      setErrorMsg(msg);
    } finally {
      setIsUploadingDocx(false);
      e.target.value = '';
    }
  };

  // Handle uploading and inserting an image into rawText at the current cursor position
  const insertImageFile = async (file: File) => {
    setIsUploadingImage(true);
    setStatusMsg('Đang tải ảnh chụp lên hệ thống...');
    try {
      const data = await examsApi.uploadImage(file);
      const imageUrl = data.url;
      const imageMarkdown = `\n![Hình ảnh](${imageUrl})\n`;

      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newText = rawText.substring(0, start) + imageMarkdown + rawText.substring(end);
        setRawText(newText);

        setTimeout(() => {
          textarea.focus();
          const newPos = start + imageMarkdown.length;
          textarea.setSelectionRange(newPos, newPos);
        }, 50);
      } else {
        setRawText((prev) => prev + imageMarkdown);
      }

      setStatusMsg('Đã dán ảnh thành công vào đề thi!');
      setTimeout(() => setStatusMsg(''), 3000);
    } catch (err: any) {
      console.error('Upload image error:', err);
      // Fallback to base64 Data URL if server upload fails
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        const imageMarkdown = `\n![Hình ảnh](${base64})\n`;
        const textarea = textareaRef.current;
        if (textarea) {
          const start = textarea.selectionStart;
          const end = textarea.selectionEnd;
          const newText = rawText.substring(0, start) + imageMarkdown + rawText.substring(end);
          setRawText(newText);
        } else {
          setRawText((prev) => prev + imageMarkdown);
        }
      };
      reader.readAsDataURL(file);
      setStatusMsg('Đã dán ảnh (dạng base64) vào đề thi!');
      setTimeout(() => setStatusMsg(''), 3000);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Handle Ctrl+V image clipboard paste inside textarea
  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    // 1. Direct Image Files in clipboard (e.g. Snipping tool, Copied image)
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await insertImageFile(file);
        }
        return;
      }
    }

    // 2. Check for HTML containing base64 images (e.g. Copied from rich web/office editors)
    const html = e.clipboardData.getData('text/html');
    if (html && html.includes('data:image/')) {
      const imgRegex = /<img[^>]+src=["'](data:image\/[^"']+)["'][^>]*>/gi;
      let match;
      const base64List: string[] = [];
      while ((match = imgRegex.exec(html)) !== null) {
        base64List.push(match[1]);
      }

      if (base64List.length > 0) {
        setTimeout(() => {
          base64List.forEach((b64) => {
            const imgMarkdown = `\n![Hình ảnh](${b64})\n`;
            setRawText((prev) => prev + imgMarkdown);
          });
          setStatusMsg(`✓ Đã nhận diện và chèn ${base64List.length} hình ảnh từ nội dung dán!`);
        }, 100);
      }
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await insertImageFile(e.target.files[0]);
      e.target.value = '';
    }
  };

  // Handle image paste directly inside an explanation box in Live Preview
  const handleExplanationPaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>, globalIdx: number) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) return;

        setStatusMsg('Đang tải ảnh vào lời giải...');
        try {
          const data = await examsApi.uploadImage(file);
          const imageUrl = data.url;
          const imageMarkdown = `\n![Hình ảnh](${imageUrl})\n`;

          const currentExp = questions[globalIdx]?.explanation || '';
          const target = e.currentTarget;
          const start = target.selectionStart;
          const end = target.selectionEnd;
          const newExp = currentExp.substring(0, start) + imageMarkdown + currentExp.substring(end);
          handleExplanationChange(globalIdx, newExp);
          setStatusMsg('Đã dán ảnh vào lời giải thành công!');
          setTimeout(() => setStatusMsg(''), 3000);
        } catch (err: any) {
          console.error('Explanation paste error:', err);
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            const imageMarkdown = `\n![Hình ảnh](${base64})\n`;
            const currentExp = questions[globalIdx]?.explanation || '';
            const target = e.currentTarget;
            const start = target.selectionStart;
            const end = target.selectionEnd;
            const newExp = currentExp.substring(0, start) + imageMarkdown + currentExp.substring(end);
            handleExplanationChange(globalIdx, newExp);
          };
          reader.readAsDataURL(file);
        }
        return;
      }
    }
  };

  // Wrap selected text or insert code block indicator (Python, C++, SQL, HTML, CSS, KaTeX, Explanation)
  const wrapSelectedTextWithCode = (lang: 'python' | 'cpp' | 'sql' | 'html' | 'css' | 'math' | 'explanation') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = rawText.substring(start, end);

    let replacement = '';
    let newCursorPos = start;

    if (lang === 'math') {
      if (selected.trim()) {
        replacement = `$${selected.trim()}$`;
      } else {
        replacement = `$x^2 + y^2$`;
      }
      newCursorPos = start + replacement.length;
    } else if (lang === 'explanation') {
      if (selected.trim()) {
        replacement = `\n[LOI_GIAI]\n${selected.trim()}\n`;
      } else {
        replacement = `\n[LOI_GIAI] Nhập hướng dẫn giải chi tiết tại đây...\n`;
      }
      newCursorPos = start + replacement.length;
    } else {
      const langTag = lang === 'cpp' ? 'cpp' : lang;
      if (selected.trim()) {
        replacement = `\n\`\`\`${langTag}\n${selected.trim()}\n\`\`\`\n`;
      } else {
        const sampleCode =
          lang === 'python'
            ? '# Đoạn mã Python\ndef solve():\n    pass'
            : lang === 'cpp'
            ? '// Đoạn mã C++\nint solve() {\n    return 0;\n}'
            : lang === 'sql'
            ? '-- Câu lệnh SQL\nSELECT * FROM hoc_sinh;'
            : lang === 'html'
            ? '<!-- Mã HTML -->\n<div class="container"></div>'
            : '/* Mã CSS */\n.container {\n    color: blue;\n    font-size: 14px;\n}';
        replacement = `\n\`\`\`${langTag}\n${sampleCode}\n\`\`\`\n`;
      }
      newCursorPos = start + replacement.length;
    }

    const newRawText = rawText.substring(0, start) + replacement + rawText.substring(end);
    setRawText(newRawText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  };

  // Helper to find exact section boundary indices in rawText
  const getSectionBoundaries = (text: string) => {
    const p1Match = text.match(/(?:^|\n)\s*(?:\[PHAN_I\]|(?:PHẦN|PHAN)\s*(?:1|I)\b)/i);
    const p1Index = p1Match ? p1Match.index! : 0;

    const p2Match = text.match(/(?:^|\n)\s*(?:\[PHAN_II\]|(?:PHẦN|PHAN)\s*(?:2|II)\b)/i);
    const p2Index = p2Match ? p2Match.index! : -1;

    let csIndex = -1;
    if (p2Index !== -1) {
      const textAfterP2 = text.substring(p2Index);
      const csMatch = textAfterP2.match(/(?:^|\n)\s*(?:\[PHAN_II_CS\]|\[PHAN_II_CHUYEN_DE_1\]|\[CS\]|(?:[A-C1-3]\.\s*)?(?:Chuyên\s*đề\s*Khoa\s*học\s*máy\s*tính|Khoa\s*học\s*máy\s*tính|.*(?:Khoa\s*học\s*máy\s*tính|định\s*hướng\s*CS|\bCS\b)))/i);
      if (csMatch) {
        csIndex = p2Index + csMatch.index!;
      }
    }

    let ictIndex = -1;
    if (p2Index !== -1) {
      const textAfterP2 = text.substring(p2Index);
      const ictMatch = textAfterP2.match(/(?:^|\n)\s*(?:\[PHAN_II_ICT\]|\[PHAN_II_CHUYEN_DE_2\]|\[ICT\]|(?:[A-C1-3]\.\s*)?(?:Chuyên\s*đề\s*Tin\s*học\s*ứng\s*dụng|Tin\s*học\s*ứng\s*dụng|.*(?:Tin\s*học\s*ứng\s*dụng|định\s*hướng\s*ICT|\bICT\b)))/i);
      if (ictMatch) {
        ictIndex = p2Index + ictMatch.index!;
      }
    }

    return { p1Index, p2Index, csIndex, ictIndex };
  };

  // Detect which question the cursor is inside in the textarea & scroll preview to that question
  const handleTextareaCursorChange = () => {
    if (!textareaRef.current) return;
    const cursorPos = textareaRef.current.selectionStart;
    const text = rawText;
    const { p2Index, csIndex, ictIndex } = getSectionBoundaries(text);

    let curSection: 'PART_I' | 'PART_II' = 'PART_I';
    let curBranch: 'COMMON' | 'CS' | 'ICT' = 'COMMON';

    if (p2Index !== -1 && cursorPos >= p2Index) {
      curSection = 'PART_II';
      const isAfterCS = csIndex !== -1 && cursorPos >= csIndex;
      const isAfterICT = ictIndex !== -1 && cursorPos >= ictIndex;

      if (isAfterCS && isAfterICT) {
        curBranch = csIndex > ictIndex ? 'CS' : 'ICT';
      } else if (isAfterCS) {
        curBranch = 'CS';
      } else if (isAfterICT) {
        curBranch = 'ICT';
      } else {
        curBranch = 'COMMON';
      }
    }

    const textBeforeCursor = text.substring(0, cursorPos + 10);
    const regex = /(?:^|\n)\s*Câu\s*(\d+)[\.\:]/gi;
    let match;
    let currentQNum: number | null = null;

    while ((match = regex.exec(textBeforeCursor)) !== null) {
      if (match.index <= cursorPos) {
        currentQNum = parseInt(match[1], 10);
      } else {
        break;
      }
    }

    if (currentQNum !== null) {
      let targetQIdx = questions.findIndex(
        (q) => q.order_index === currentQNum && q.part_type === curSection && (curSection === 'PART_I' || q.branch === curBranch)
      );

      if (targetQIdx === -1) {
        targetQIdx = questions.findIndex(
          (q) => q.order_index === currentQNum && q.part_type === curSection
        );
      }

      if (targetQIdx === -1) {
        targetQIdx = questions.findIndex((q) => q.order_index === currentQNum);
      }

      if (targetQIdx !== -1 && targetQIdx !== activeQuestionIndex) {
        setActiveQuestionIndex(targetQIdx);
        const el = document.getElementById(`preview-q-${targetQIdx}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  };

  // Jump cursor in the right textarea to a specific subpart of a question (prompt, code, option, explanation)
  const jumpCursorToQuestionPart = (
    q: any,
    targetType: 'header' | 'prompt' | 'code' | 'option' | 'explanation',
    targetKey?: string
  ) => {
    if (!textareaRef.current || !q) return;

    const text = rawText;
    const { p2Index, csIndex, ictIndex } = getSectionBoundaries(text);

    let secStart = 0;
    let secEnd = text.length;

    if (q.part_type === 'PART_I') {
      secStart = 0;
      secEnd = p2Index !== -1 ? p2Index : text.length;
    } else {
      // PART_II
      if (q.branch === 'CS' && csIndex !== -1) {
        secStart = csIndex;
        secEnd = ictIndex !== -1 && ictIndex > csIndex ? ictIndex : text.length;
      } else if (q.branch === 'ICT' && ictIndex !== -1) {
        secStart = ictIndex;
        secEnd = csIndex !== -1 && csIndex > ictIndex ? csIndex : text.length;
      } else {
        secStart = p2Index !== -1 ? p2Index : 0;
        const firstBranch = Math.min(
          csIndex !== -1 ? csIndex : text.length,
          ictIndex !== -1 ? ictIndex : text.length
        );
        secEnd = firstBranch < text.length ? firstBranch : text.length;
      }
    }

    const sectionText = text.substring(secStart, secEnd);
    const qNum = q.order_index;
    const qRegex = new RegExp(`(?:^|\\n)\\s*Câu\\s*${qNum}[\\.\\:]`, 'i');
    let match = qRegex.exec(sectionText);

    let qStartPosInSection = -1;
    if (match) {
      qStartPosInSection = match.index + (match[0].startsWith('\n') ? 1 : 0);
    } else if (q.content) {
      const snippet = q.content.trim().slice(0, 25).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (snippet) {
        const contentMatch = new RegExp(snippet, 'i').exec(sectionText);
        if (contentMatch) {
          const textBefore = sectionText.substring(0, contentMatch.index);
          const lastCau = textBefore.lastIndexOf('Câu');
          qStartPosInSection = lastCau !== -1 ? lastCau : contentMatch.index;
        }
      }
    }

    if (qStartPosInSection === -1) {
      match = qRegex.exec(text);
      if (!match) return;
      secStart = 0;
      qStartPosInSection = match.index + (match[0].startsWith('\n') ? 1 : 0);
    }

    const qStartPos = secStart + qStartPosInSection;

    const nextQRegex = new RegExp(`(?:^|\\n)\\s*Câu\\s*(?:${qNum + 1}|\\d+)[\\.\\:]`, 'i');
    const textAfterQ = sectionText.substring(qStartPosInSection + 5);
    const nextMatch = nextQRegex.exec(textAfterQ);
    const qEndPosInSection = nextMatch ? qStartPosInSection + 5 + nextMatch.index : sectionText.length;

    const qBlock = sectionText.substring(qStartPosInSection, qEndPosInSection);
    let relativePos = 0;

    if (targetType === 'header' || targetType === 'prompt') {
      const tagMatch = /^(?:[Cc][âa]u\s*\d+[\.\:]\s*(?:\[[^\]]+\]\s*)*)/i.exec(qBlock);
      if (tagMatch) {
        relativePos = tagMatch[0].length;
      } else {
        relativePos = 0;
      }
    } else if (targetType === 'code') {
      const codeMatch = /(?:```|\[CODE)/i.exec(qBlock);
      if (codeMatch) {
        relativePos = codeMatch.index;
      }
    } else if (targetType === 'option' && targetKey) {
      const escapedKey = targetKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const optRegex = new RegExp(`(?:^|\\n|\\s{2,}|\\t)\\*?${escapedKey}[\\.\\:\\)]`, 'i');
      const optMatch = optRegex.exec(qBlock);
      if (optMatch) {
        relativePos = optMatch.index + (optMatch[0].startsWith('\n') ? 1 : 0);
      }
    } else if (targetType === 'explanation') {
      const expRegex = /(?:^|\n)\s*(?:\[LOI_GIAI\]|\[HUONG_DAN\]|\[GIAI_THICH\]|Hướng dẫn giải|Lời giải)/i;
      const expMatch = expRegex.exec(qBlock);
      if (expMatch) {
        relativePos = expMatch.index + (expMatch[0].startsWith('\n') ? 1 : 0);
      } else {
        relativePos = Math.max(0, qBlock.trimEnd().length);
      }
    }

    const finalPos = qStartPos + relativePos;
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(finalPos, finalPos);

    // Smooth scroll textarea to the target line
    const linesBefore = text.substring(0, finalPos).split('\n').length;
    const lineHeight = 19;
    textareaRef.current.scrollTop = Math.max(0, (linesBefore - 3) * lineHeight);
  };

  // Click on a question in Live Preview to position cursor in textarea & scroll textarea to that line
  const handleCardClick = (q: any, globalIdx: number) => {
    setActiveQuestionIndex(globalIdx);
    jumpCursorToQuestionPart(q, 'prompt');
  };

  // Manual Form State
  const [manualPartType, setManualPartType] = useState<'PART_I' | 'PART_II'>('PART_I');
  const [manualBranch, setManualBranch] = useState<'COMMON' | 'CS' | 'ICT'>('COMMON');
  const [manualPoint, setManualPoint] = useState<number>(0.5);
  const [manualContent, setManualContent] = useState<string>('');
  const [manualCode, setManualCode] = useState<string>('');
  const [manualLanguage, setManualLanguage] = useState<string>('python');
  const [manualCategory, setManualCategory] = useState<string>('PROG_BASIC');
  const [manualDifficulty, setManualDifficulty] = useState<string>('TH');

  const [showBankPickerModal, setShowBankPickerModal] = useState(false);

  const handleImportFromBank = (selectedQs: any[]) => {
    let addText = '\n\n';
    selectedQs.forEach(q => {
      addText += `Câu X. [0.4đ] [${q.competency_category || 'PROG_BASIC'}] [${q.difficulty_level || 'TH'}] ${q.content}\n`;
      if (q.code_snippet) {
        addText += `\`\`\`${q.code_language || 'python'}\n${q.code_snippet}\n\`\`\`\n`;
      }
      if (q.options && q.options.length > 0) {
        q.options.forEach((opt: any) => {
          if (q.part_type === 'PART_II') {
            addText += `${opt.label}. ${opt.content}${opt.is_correct ? ' (Đúng)' : ' (Sai)'}\n`;
          } else {
            addText += `${opt.label}. ${opt.content}${opt.is_correct ? ' (*)' : ''}\n`;
          }
        });
      }
      if (q.explanation) {
        addText += `[LOI_GIAI] ${q.explanation}\n`;
      }
      addText += '\n';
    });
    
    setRawText(prev => prev + addText);
  };

  // AI Integration States & Handlers
  const [showAISettingsModal, setShowAISettingsModal] = useState<boolean>(false);
  const [showAISolveModal, setShowAISolveModal] = useState<boolean>(false);
  const [isAISolving, setIsAISolving] = useState<boolean>(false);
  const [solvingSingleIndex, setSolvingSingleIndex] = useState<number | null>(null);
  const [savingToBankIndex, setSavingToBankIndex] = useState<number | null>(null);
  const [aiSolveMode, setAISolveMode] = useState<'unanswered_only' | 'all' | 'selected_only'>('unanswered_only');
  const [selectedQuestionsToSolve, setSelectedQuestionsToSolve] = useState<number[]>([]);
  const [aiIncludeExplain, setAIIncludeExplain] = useState<boolean>(true);

  const handleStartAISolve = () => {
    if (selectedQuestionsToSolve.length === 0 && questions.length > 0) {
      const defaultIdx = activeQuestionIndex !== null && activeQuestionIndex >= 0 && activeQuestionIndex < questions.length ? activeQuestionIndex : 0;
      setSelectedQuestionsToSolve([defaultIdx]);
    }
    setShowAISolveModal(true);
  };

  const handleToggleSelectQuestionToSolve = (idx: number) => {
    setSelectedQuestionsToSolve((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const handleSelectAllQuestionsToSolve = () => {
    setSelectedQuestionsToSolve(questions.map((_, i) => i));
  };

  const handleDeselectAllQuestionsToSolve = () => {
    setSelectedQuestionsToSolve([]);
  };

    const handleSaveToBank = async (qIdx: number) => {
    try {
      setSavingToBankIndex(qIdx);
      const q = questions[qIdx];
      const res = await bankApi.aiSave(q);
      toast.success(res.message);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Lỗi khi lưu vào ngân hàng');
    } finally {
      setSavingToBankIndex(null);
    }
  };

  const handleSolveSingleQuestion = async (globalIdx: number) => {
    const aiConfig = getStoredAISettings();

    const targetQ = questions[globalIdx];
    if (!targetQ) return;

    setSolvingSingleIndex(globalIdx);
    const sourceLabel = aiConfig.useSharedAdminApi ? 'API Super Admin' : aiConfig.provider.toUpperCase();
    setStatusMsg(`🤖 Đang nhờ AI (${sourceLabel}) giải Câu ${targetQ.order_index}...`);

    try {
      const payload: any = {
        questions: questions,
        text: rawText,
        provider: aiConfig.provider,
        model: aiConfig.model,
        base_url: aiConfig.baseUrl?.trim() || undefined,
        use_shared_admin_api: aiConfig.useSharedAdminApi,
        solve_mode: 'selected_only' as const,
        selected_indices: [globalIdx],
        include_explanations: true,
      };

      const res = await aiApi.solveExam(payload);

      if (res.results && res.results.length > 0) {
        isSyncingFromUI.current = true;
        setQuestions((prev) => {
          const updated = [...prev];
          const r = res.results[0];
          const currentQ = { ...updated[globalIdx] };

          if (currentQ.part_type === 'PART_I' && r.correct_option) {
            currentQ.options = currentQ.options.map((opt: any) => ({
              ...opt,
              is_correct: opt.label.toUpperCase() === r.correct_option.toUpperCase(),
            }));
          } else if (currentQ.part_type === 'PART_II' && r.sub_answers) {
            currentQ.options = currentQ.options.map((opt: any) => {
              const lbl = opt.label.toLowerCase();
              const isCorrect = r.sub_answers[lbl] !== undefined ? Boolean(r.sub_answers[lbl]) : opt.is_correct;
              return {
                ...opt,
                is_correct: isCorrect,
              };
            });
          }

          if (r.explanation && r.explanation.trim()) {
            currentQ.explanation = r.explanation.trim();
            setExpandedExplanations((prevExp) => ({ ...prevExp, [globalIdx]: true }));
          }
          updated[globalIdx] = currentQ;

          const synced = questionsToAzotaText(updated, title, duration, matrixPreset, part1Total, part2Total);
          setRawText(synced);
          return updated;
        });

        if (res.fallback_used && res.model_used) {
          setStatusMsg(`✓ AI đã giải Câu ${targetQ.order_index} thành công (tự động chuyển sang '${res.model_used}')!`);
        } else {
          setStatusMsg(`✓ AI đã giải & điền đáp án thành công cho Câu ${targetQ.order_index}!`);
        }
      } else {
        setStatusMsg(res.message || 'AI không trả về kết quả cho câu này.');
      }
    } catch (err: any) {
      console.error('Single AI solve error:', err);
      const errMsg = err.response?.data?.detail || err.response?.data?.error || err.message || 'Giải câu hỏi bằng AI thất bại.';
      setErrorMsg(errMsg);
      if (err.response?.status === 403 || errMsg.includes('API Key') || errMsg.includes('chưa được')) {
        setShowAISettingsModal(true);
      }
      setTimeout(() => setErrorMsg(''), 6000);
    } finally {
      setSolvingSingleIndex(null);
      setTimeout(() => setStatusMsg(''), 5000);
    }
  };

  const handleExecuteAISolve = async () => {
    const aiConfig = getStoredAISettings();

    if (aiSolveMode === 'selected_only' && selectedQuestionsToSolve.length === 0) {
      toast.error('Vui lòng tích chọn ít nhất 1 câu hỏi cần giải.');
      return;
    }

    setShowAISolveModal(false);
    setIsAISolving(true);
    const sourceLabel = aiConfig.useSharedAdminApi ? 'API Super Admin' : `${aiConfig.provider.toUpperCase()} (${aiConfig.model})`;
    setStatusMsg(`🤖 Đang gửi đề thi cho AI (${sourceLabel}) để giải bài...`);

    try {
      const payload: any = {
        questions: questions,
        text: rawText,
        provider: aiConfig.provider,
        model: aiConfig.model,
        base_url: aiConfig.baseUrl?.trim() || undefined,
        use_shared_admin_api: aiConfig.useSharedAdminApi,
        solve_mode: aiSolveMode,
        selected_indices: aiSolveMode === 'selected_only' ? selectedQuestionsToSolve : undefined,
        include_explanations: aiIncludeExplain,
      };

      const res = await aiApi.solveExam(payload);

      if (res.results && res.results.length > 0) {
        isSyncingFromUI.current = true;
        setQuestions((prev) => {
          const updated = [...prev];
          res.results.forEach((r: any) => {
            let targetIdx = r.list_index !== undefined && r.list_index < updated.length ? r.list_index : -1;
            if (targetIdx === -1 || updated[targetIdx].order_index !== r.order_index) {
              targetIdx = updated.findIndex((q) => q.order_index === r.order_index && q.part_type === r.part_type);
            }

            if (targetIdx !== -1) {
              const currentQ = { ...updated[targetIdx] };
              if (currentQ.part_type === 'PART_I' && r.correct_option) {
                currentQ.options = currentQ.options.map((opt: any) => ({
                  ...opt,
                  is_correct: opt.label.toUpperCase() === r.correct_option.toUpperCase(),
                }));
              } else if (currentQ.part_type === 'PART_II' && r.sub_answers) {
                currentQ.options = currentQ.options.map((opt: any) => {
                  const lbl = opt.label.toLowerCase();
                  const isCorrect = r.sub_answers[lbl] !== undefined ? Boolean(r.sub_answers[lbl]) : opt.is_correct;
                  return {
                    ...opt,
                    is_correct: isCorrect,
                  };
                });
              }

              if (r.explanation && r.explanation.trim()) {
                currentQ.explanation = r.explanation.trim();
                setExpandedExplanations((prevExp) => ({ ...prevExp, [targetIdx]: true }));
              }
              updated[targetIdx] = currentQ;
            }
          });

          const synced = questionsToAzotaText(updated, title, duration, matrixPreset, part1Total, part2Total);
          setRawText(synced);
          return updated;
        });

        if (res.fallback_used && res.model_used) {
          setStatusMsg(`✓ AI đã giải & điền đáp án thành công cho ${res.solved_count || res.results.length} câu (đã tự động chuyển sang mô hình '${res.model_used}' do máy chủ quá tải)!`);
        } else {
          setStatusMsg(`✓ AI đã giải và điền đáp án thành công cho ${res.solved_count || res.results.length} câu hỏi!`);
        }
      } else {
        setStatusMsg(res.message || 'Không có câu hỏi nào cần giải.');
      }
    } catch (err: any) {
      console.error('AI solve error:', err);
      const errMsg = err.response?.data?.detail || err.response?.data?.error || err.message || 'Giải đề bằng AI thất bại.';
      setErrorMsg(errMsg);
      if (err.response?.status === 403 || errMsg.includes('API Key') || errMsg.includes('chưa được')) {
        setShowAISettingsModal(true);
      }
      setTimeout(() => setErrorMsg(''), 6000);
    } finally {
      setIsAISolving(false);
      setTimeout(() => setStatusMsg(''), 5000);
    }
  };

  // Trigger live parsing from rawText
  const handleLiveParse = useCallback(async (textToParse: string) => {
    if (!textToParse || !textToParse.trim()) {
      setQuestions([]);
      return;
    }

    setIsParsing(true);
    setErrorMsg('');

    try {
      // Send as pure JSON payload to /api/exams/import-docx/
      const data = await examsApi.importDocx({
        action: 'preview',
        text: textToParse,
      });

      if (data && data.questions) {
        setQuestions(data.questions);

        if (data.exam_metadata?.title && data.exam_metadata.title !== 'ĐỀ THI TIN HỌC HSG THPT QUẤT LÂM') {
          setTitle(data.exam_metadata.title);
        }
        if (data.exam_metadata?.duration_minutes) {
          setDuration(data.exam_metadata.duration_minutes);
        }

        // Auto-detect matrix preset if not explicitly declared
        const p1List = data.questions.filter((q: any) => q.part_type === 'PART_I');
        const p2Common = data.questions.filter((q: any) => q.part_type === 'PART_II' && (q.branch === 'COMMON' || !q.branch));
        const p2CS = data.questions.filter((q: any) => q.part_type === 'PART_II' && q.branch === 'CS');
        const p2ICT = data.questions.filter((q: any) => q.part_type === 'PART_II' && q.branch === 'ICT');
        const p2Eff = p2Common.length + Math.max(p2CS.length, p2ICT.length);

        let detectedMatrix = data.exam_metadata?.matrix_preset;
        if (!detectedMatrix) {
          if (p1List.length >= 28 || p2Eff >= 5) {
            detectedMatrix = 'HSG_NINHBINH';
          } else if (p1List.length > 0 && p1List.length <= 26) {
            detectedMatrix = 'BGD_2025';
          } else {
            detectedMatrix = 'HSG_NINHBINH';
          }
        }
        setMatrixPreset(detectedMatrix);

        // Section Totals: use parsed metadata if available, otherwise calculate from question points or preset standard
        if (data.exam_metadata?.part1_total_points !== undefined && data.exam_metadata?.part1_total_points !== null) {
          setPart1Total(Number(data.exam_metadata.part1_total_points));
        } else {
          const defaultP1Pt = detectedMatrix === 'BGD_2025' ? 0.25 : 0.4;
          const p1Sum = p1List.reduce((sum: number, q: any) => sum + (q.point !== undefined && q.point !== null ? Number(q.point) : defaultP1Pt), 0);
          if (p1Sum > 0) setPart1Total(Number(p1Sum.toFixed(2)));
          else setPart1Total(detectedMatrix === 'BGD_2025' ? 6 : 12);
        }

        if (data.exam_metadata?.part2_total_points !== undefined && data.exam_metadata?.part2_total_points !== null) {
          setPart2Total(Number(data.exam_metadata.part2_total_points));
        } else {
          const defaultP2Pt = detectedMatrix === 'BGD_2025' ? 1.0 : 1.6;
          const p2CommonSum = p2Common.reduce((sum: number, q: any) => sum + (q.point !== undefined && q.point !== null ? Number(q.point) : defaultP2Pt), 0);
          const p2CSSum = p2CS.reduce((sum: number, q: any) => sum + (q.point !== undefined && q.point !== null ? Number(q.point) : defaultP2Pt), 0);
          const p2ICTSum = p2ICT.reduce((sum: number, q: any) => sum + (q.point !== undefined && q.point !== null ? Number(q.point) : defaultP2Pt), 0);
          const p2Sum = p2CommonSum + Math.max(p2CSSum, p2ICTSum);
          if (p2Sum > 0) setPart2Total(Number(p2Sum.toFixed(2)));
          else setPart2Total(detectedMatrix === 'BGD_2025' ? 4 : 8);
        }
      }
    } catch (err: any) {
      console.error('Parse preview error:', err);
      setErrorMsg(err.response?.data?.detail || 'Không thể kết nối máy chủ phân tích đề thi.');
    } finally {
      setIsParsing(false);
    }
  }, []);

  // Load existing exam if in Edit Mode, otherwise initial parse
  useEffect(() => {
    if (editId) {
      const loadExamToEdit = async () => {
        setIsParsing(true);
        try {
          const examData = await examsApi.getExamDetail(Number(editId));
          if (examData) {
            setTitle(examData.title || '');
            setDuration(examData.duration_minutes || 50);
            if (examData.matrix_preset) setMatrixPreset(examData.matrix_preset);
            if (examData.access_type) setAccessType(examData.access_type);
            if (examData.access_code) setAccessCode(examData.access_code);
            if (examData.part1_total_points !== undefined) setPart1Total(Number(examData.part1_total_points));
            if (examData.part2_total_points !== undefined) setPart2Total(Number(examData.part2_total_points));
            if (examData.folder) setSelectedFolderId(String(examData.folder));

            if (examData.questions && examData.questions.length > 0) {
              setQuestions(examData.questions);
              const syncedText = questionsToAzotaText(
                examData.questions,
                examData.title || title,
                examData.duration_minutes || duration,
                examData.matrix_preset || matrixPreset,
                examData.part1_total_points !== undefined ? Number(examData.part1_total_points) : part1Total,
                examData.part2_total_points !== undefined ? Number(examData.part2_total_points) : part2Total
              );
              setRawText(syncedText);
            }
          }
        } catch (err: any) {
          console.error(err);
          setErrorMsg('Không thể tải thông tin đề thi cần chỉnh sửa.');
        } finally {
          setIsParsing(false);
          isLoadedEdit.current = true;
        }
      };
      loadExamToEdit();
    } else {
      handleLiveParse(rawText);
    }
  }, [editId, handleLiveParse]);

  // Update on rawText change (debounced 400ms) - works in BOTH create & edit modes
  useEffect(() => {
    if (editId && !isLoadedEdit.current) return;
    if (isSyncingFromUI.current) {
      isSyncingFromUI.current = false;
      return;
    }
    const timer = setTimeout(() => {
      if (inputMode === 'paste') {
        handleLiveParse(rawText);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [rawText, inputMode, handleLiveParse, editId]);

  // Handle Option Click in Live Preview (Azota Style)
  const handleTogglePart1Option = (qIdx: number, optIdx: number) => {
    const q = questions[qIdx];
    if (!q) return;
    const targetOpt = q.options ? q.options[optIdx] : null;

    isSyncingFromUI.current = true;
    setQuestions((prev) => {
      const updated = [...prev];
      const currentQ = { ...updated[qIdx] };
      currentQ.options = currentQ.options.map((opt: any, i: number) => ({
        ...opt,
        is_correct: i === optIdx,
      }));
      updated[qIdx] = currentQ;
      const syncedText = questionsToAzotaText(updated, title, duration, matrixPreset, part1Total, part2Total);
      setRawText(syncedText);
      return updated;
    });

    setActiveQuestionIndex(qIdx);
    if (targetOpt) {
      jumpCursorToQuestionPart(q, 'option', targetOpt.label);
    }
  };

  const handleTogglePart2Subitem = (qIdx: number, optIdx: number) => {
    const q = questions[qIdx];
    if (!q) return;
    const targetOpt = q.options ? q.options[optIdx] : null;

    isSyncingFromUI.current = true;
    setQuestions((prev) => {
      const updated = [...prev];
      const currentQ = { ...updated[qIdx] };
      const opts = [...currentQ.options];
      opts[optIdx] = {
        ...opts[optIdx],
        is_correct: !opts[optIdx].is_correct,
      };
      currentQ.options = opts;
      updated[qIdx] = currentQ;
      const syncedText = questionsToAzotaText(updated, title, duration, matrixPreset, part1Total, part2Total);
      setRawText(syncedText);
      return updated;
    });

    setActiveQuestionIndex(qIdx);
    if (targetOpt) {
      jumpCursorToQuestionPart(q, 'option', targetOpt.label);
    }
  };

  const handleChangeDifficulty = (qIdx: number, optIdx: number, diff: string) => {
    isSyncingFromUI.current = true;
    setQuestions((prev) => {
      const updated = [...prev];
      const q = { ...updated[qIdx] };
      const opts = [...q.options];
      opts[optIdx] = {
        ...opts[optIdx],
        difficulty_level: diff,
      };
      q.options = opts;
      updated[qIdx] = q;
      return updated;
    });
  };

  const handleDeleteQuestion = (qIdx: number) => {
    isSyncingFromUI.current = true;
    setQuestions((prev) => {
      const updated = prev.filter((_, idx) => idx !== qIdx);
      const syncedText = questionsToAzotaText(updated, title, duration, matrixPreset, part1Total, part2Total);
      setRawText(syncedText);
      return updated;
    });
  };

  // Add question via manual form
  const handleAddManualQuestion = () => {
    if (!manualContent.trim()) {
      toast.error('Vui lòng nhập nội dung câu hỏi.');
      return;
    }

    const nextOrderIdx = questions.length + 1;
    let newQ: any;

    if (manualPartType === 'PART_I') {
      newQ = {
        order_index: nextOrderIdx,
        part_type: 'PART_I',
        branch: 'COMMON',
        point: manualPoint || 0.5,
        content: manualContent,
        code_snippet: manualCode,
        code_language: manualLanguage,
        competency_category: manualCategory,
        difficulty_level: manualDifficulty,
        options: [
          { label: 'A', content: 'Phương án A', is_correct: true, order_index: 1 },
          { label: 'B', content: 'Phương án B', is_correct: false, order_index: 2 },
          { label: 'C', content: 'Phương án C', is_correct: false, order_index: 3 },
          { label: 'D', content: 'Phương án D', is_correct: false, order_index: 4 },
        ],
      };
    } else {
      newQ = {
        order_index: nextOrderIdx,
        part_type: 'PART_II',
        branch: manualBranch,
        point: manualPoint || 2.0,
        content: manualContent,
        code_snippet: manualCode,
        code_language: manualLanguage,
        competency_category: manualCategory,
        difficulty_level: manualDifficulty,
        options: [
          { label: 'a', content: 'Mệnh đề a', is_correct: true, difficulty_level: 'NB', order_index: 1 },
          { label: 'b', content: 'Mệnh đề b', is_correct: false, difficulty_level: 'TH', order_index: 2 },
          { label: 'c', content: 'Mệnh đề c', is_correct: true, difficulty_level: 'TH', order_index: 3 },
          { label: 'd', content: 'Mệnh đề d', is_correct: false, difficulty_level: 'VD', order_index: 4 },
        ],
      };
    }

    const updatedQuestions = [...questions, newQ];
    setQuestions(updatedQuestions);

    // Also immediately regenerate complete Azota text so both modes stay 100% unified
    const syncedText = questionsToAzotaText(updatedQuestions, title, duration, matrixPreset, part1Total, part2Total);
    setRawText(syncedText);

    setManualContent('');
    setManualCode('');
    setStatusMsg('Đã thêm câu hỏi vào đề thi và đồng bộ sang khung soạn thảo nhanh!');
    setTimeout(() => setStatusMsg(''), 3000);
  };

  // Switch tabs and ensure rawText is fully synchronized with questions
  const handleSwitchTab = (mode: 'paste' | 'form') => {
    if (mode === 'paste') {
      if (questions.length > 0) {
        const syncedText = questionsToAzotaText(questions, title, duration, matrixPreset, part1Total, part2Total);
        setRawText(syncedText);
      }
    }
    setInputMode(mode);
  };

  const executeSaveExam = async () => {
    setIsSaving(true);
    setErrorMsg('');

    try {
      await examsApi.importDocx({
        action: 'save',
        exam_id: editId ? Number(editId) : undefined,
        title: title,
        exam_type: examType,
        duration_minutes: duration,
        matrix_preset: matrixPreset,
        access_type: accessType,
        access_code: accessCode,
        part1_total_points: part1Total,
        part2_total_points: part2Total,
        total_points: totalPoints,
        folder_id: selectedFolderId ? Number(selectedFolderId) : null,
        text: rawText,
        questions: questions,
      });

      toast.success(editId ? 'Cập nhật đề thi thành công!' : 'Tạo và xuất bản đề thi thành công!');
      navigate('/teacher');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.detail || 'Lỗi khi lưu đề thi vào hệ thống.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveExam = async () => {
    if (questions.length === 0) {
      toast.error('Chưa có câu hỏi nào trong đề thi!');
      return;
    }

    // Validate complete exam diagnostics
    if (validationSummary.error_count > 0) {
      const errorList = validationSummary.detailed_issues
        .filter((d) => d.has_error)
        .map((d) => `• Câu ${d.order_index} (${d.part_type === 'PART_I' ? 'Phần I' : 'Phần II'}): ${d.issues.find((i) => i.type === 'error')?.message}`)
        .slice(0, 8)
        .join('\n');
      const moreCount = validationSummary.error_count > 8 ? `\n...và ${validationSummary.error_count - 8} lỗi khác.` : '';

      setConfirmConfig({
        isOpen: true,
        title: 'Cảnh báo định dạng đề thi',
        message: `Đề thi hiện có ${validationSummary.error_count} câu hỏi có lỗi chưa hoàn chỉnh:\n${errorList}${moreCount}\n\nThầy có chắc chắn muốn tiếp tục lưu vào hệ thống không?`,
        onConfirm: executeSaveExam
      });
      return;
    }

    executeSaveExam();
  };

  const part1List = questions.filter((q) => q.part_type === 'PART_I');
  const part2CommonList = questions.filter((q) => q.part_type === 'PART_II' && (q.branch === 'COMMON' || !q.branch));
  const part2CSList = questions.filter((q) => q.part_type === 'PART_II' && q.branch === 'CS');
  const part2ICTList = questions.filter((q) => q.part_type === 'PART_II' && q.branch === 'ICT');
  const p2EffectiveCount = part2CommonList.length + Math.max(part2CSList.length, part2ICTList.length);

  return (
    <div className="h-screen bg-slate-900 text-slate-100 flex flex-col overflow-hidden">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-950/90 backdrop-blur-md shrink-0 px-4 sm:px-6 py-2.5 z-40">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex h-9 items-center gap-1.5 px-3 rounded-xl bg-blue-950/60 border border-blue-500/40 text-blue-300 hover:bg-blue-600 hover:text-white transition-all text-xs font-bold shadow-sm"
              title="Về Trang Chủ hệ thống"
            >
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Trang Chủ</span>
            </Link>
            <button
              onClick={() => {
                const target = user?.role === 'STUDENT' ? '/dashboard' : '/teacher';
                navigate(target);
              }}
              className="flex h-9 items-center gap-1.5 px-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white transition-colors text-xs font-medium"
              title="Quay lại Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
            <div>
              <h1 className="font-bold text-sm sm:text-base text-white flex items-center gap-2">
                {editId ? 'CHỈNH SỬA ĐỀ THI' : 'TRÌNH SOẠN THẢO & TẠO ĐỀ THI'}
                <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold border ${
                  editId ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                }`}>
                  {editId ? `Mã đề: #${editId}` : 'Chuẩn Azota'}
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {editId ? 'Chỉnh sửa cấu hình, câu hỏi và đáp án của đề thi' : 'Nhập đề trực tiếp hoặc dán văn bản kèm Live Preview thời gian thực'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live Exam Health Diagnostic Badge */}
            {questions.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (validationSummary.error_question_indices.length > 0) {
                    handleJumpToErrorQuestion(validationSummary.error_question_indices[0]);
                  } else if (validationSummary.warning_question_indices.length > 0) {
                    handleJumpToErrorQuestion(validationSummary.warning_question_indices[0]);
                  }
                }}
                className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all shadow-sm ${
                  validationSummary.error_count > 0
                    ? 'bg-red-950/70 border-red-600 text-red-300 hover:bg-red-900/80 animate-pulse'
                    : validationSummary.warning_count > 0
                    ? 'bg-amber-950/60 border-amber-600/80 text-amber-300 hover:bg-amber-900/80'
                    : 'bg-emerald-950/60 border-emerald-600/80 text-emerald-300'
                }`}
                title={
                  validationSummary.error_count > 0
                    ? `Phát hiện ${validationSummary.error_count} câu có lỗi. Bấm để chuyển đến câu lỗi.`
                    : validationSummary.warning_count > 0
                    ? `Có ${validationSummary.warning_count} lưu ý cần hoàn thiện.`
                    : 'Đề thi chuẩn 100%, không có lỗi!'
                }
              >
                {validationSummary.error_count > 0 ? (
                  <>
                    <AlertTriangle className="h-3.5 w-3.5 text-red-400" />
                    <span>{validationSummary.error_count} lỗi cần sửa</span>
                  </>
                ) : validationSummary.warning_count > 0 ? (
                  <>
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
                    <span>{validationSummary.warning_count} lưu ý</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Đề chuẩn 100%</span>
                  </>
                )}
              </button>
            )}

            <ThemeToggle />

            <button
              type="button"
              onClick={() => setShowAISettingsModal(true)}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-950/60 px-3.5 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-900/60 hover:text-white transition-all shadow-sm"
              title="Cài đặt API Key và mô hình AI (Gemini, ChatGPT, DeepSeek, Claude, Grok)"
            >
              <Bot className="h-4 w-4 text-indigo-400" />
              <span className="hidden sm:inline">Cài đặt AI</span>
            </button>

            <button
              type="button"
              onClick={() => examsApi.downloadDocxTemplate()}
              className="hidden md:flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Tải file Word mẫu</span>
            </button>

            <button
              type="button"
              onClick={handleSaveExam}
              disabled={isSaving || questions.length === 0}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 hover:bg-emerald-500 transition-all disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{isSaving ? 'Đang lưu...' : editId ? 'Cập Nhật Đề Thi' : 'Lưu & Xuất Bản Đề'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout (Full-Width 2 Independent Scrolling Columns) */}
      <div className="w-full px-3 sm:px-6 py-3 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 xl:gap-5 overflow-hidden min-h-0">
        {/* LEFT COLUMN: Live Visual Preview (6 cols on lg - Cuộn độc lập) */}
        <div className="lg:col-span-6 xl:col-span-6 h-full flex flex-col overflow-hidden min-h-0 space-y-2.5">
          {/* Live Preview Header Bar */}
          <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 shadow-lg shrink-0">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-emerald-400" />
              <h3 className="font-bold text-sm text-white uppercase">
                Bản Xem Trước Trực Quan (Live Preview)
              </h3>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="rounded-lg bg-blue-500/20 px-2.5 py-1 text-blue-300 border border-blue-500/30">
                P1: {part1List.length} câu ({part1Total}đ)
              </span>
              <span className="rounded-lg bg-indigo-500/20 px-2.5 py-1 text-indigo-300 border border-indigo-500/30">
                P2: {part2Total}đ
              </span>
              <span className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-emerald-300 border border-emerald-500/30 font-bold">
                Tổng: {totalPoints}đ
              </span>
            </div>
          </div>

          {questions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 p-16 text-center text-xs text-slate-500 space-y-3 flex-1 flex flex-col items-center justify-center min-h-0">
              <FileText className="h-10 w-10 text-slate-600" />
              <p className="text-sm font-semibold text-slate-400">Chưa có câu hỏi nào trong đề thi.</p>
              <p>Hãy dán văn bản đề hoặc bấm nút "✨ Mẫu Azota" ở khung soạn thảo bên phải.</p>
            </div>
          ) : (
            <div className="space-y-4 flex-1 overflow-y-auto pr-2 min-h-0 rounded-2xl border border-slate-800/80 bg-slate-950/40 p-3 exam-preview-container">
              {/* EXAM QUALITY & ERROR INSPECTOR BANNER */}
              {questions.length > 0 && (
                <div className={`p-4 rounded-2xl border transition-all shadow-md ${
                  validationSummary.error_count > 0
                    ? 'bg-red-950/40 border-red-800/80 text-red-200 ring-1 ring-red-500/30'
                    : validationSummary.warning_count > 0
                    ? 'bg-amber-950/30 border-amber-800/60 text-amber-200'
                    : 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
                }`}>
                  <div className="flex items-center justify-between flex-wrap gap-2.5 pb-2.5 border-b border-white/10">
                    <div className="flex items-center gap-2.5">
                      {validationSummary.error_count > 0 ? (
                        <div className="h-8 w-8 rounded-xl bg-red-600/30 border border-red-500/50 flex items-center justify-center text-red-400 shrink-0">
                          <AlertTriangle className="h-4 w-4 animate-bounce" />
                        </div>
                      ) : validationSummary.warning_count > 0 ? (
                        <div className="h-8 w-8 rounded-xl bg-amber-600/30 border border-amber-500/50 flex items-center justify-center text-amber-400 shrink-0">
                          <AlertTriangle className="h-4 w-4" />
                        </div>
                      ) : (
                        <div className="h-8 w-8 rounded-xl bg-emerald-600/30 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                      )}
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
                          {validationSummary.error_count > 0
                            ? `⚠️ Phát hiện ${validationSummary.error_count} câu có lỗi định dạng cần sửa`
                            : validationSummary.warning_count > 0
                            ? `🟡 Đề thi có ${validationSummary.warning_count} lưu ý cần hoàn thiện`
                            : `✓ Đề thi đạt chuẩn 100% (Không có lỗi)`}
                          <span className="text-[10px] font-mono font-normal opacity-75">
                            ({validationSummary.valid_count}/{validationSummary.total_questions} câu chuẩn)
                          </span>
                        </h4>
                        <p className="text-[11px] opacity-80 mt-0.5">
                          {validationSummary.error_count > 0
                            ? 'Bấm vào từng thẻ câu hỏi bên dưới để cuộn nhanh đến vị trí câu đó và sửa, hoặc nhấn nút bên cạnh để AI tự động điền.'
                            : 'Tất cả câu hỏi đều có đầy đủ phương án và đáp án chính xác.'}
                        </p>
                      </div>
                    </div>

                    {validationSummary.error_count > 0 && (
                      <button
                        type="button"
                        onClick={handleStartAISolve}
                        className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5 hover:scale-105"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-amber-200" />
                        <span>⚡ Nhờ AI sửa lỗi & điền đáp án</span>
                      </button>
                    )}
                  </div>

                  {/* Quick-Jump Error Tags */}
                  {validationSummary.detailed_issues.length > 0 && (
                    <div className="pt-2.5 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">Câu cần sửa:</span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {validationSummary.detailed_issues.map((item) => {
                          const firstErr = item.issues.find(i => i.type === 'error') || item.issues[0];
                          const isErr = item.has_error;
                          return (
                            <button
                              key={item.list_index}
                              type="button"
                              onClick={() => handleJumpToErrorQuestion(item.list_index)}
                              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold shrink-0 transition-all flex items-center gap-1 shadow-sm ${
                                isErr
                                  ? 'bg-red-900/70 hover:bg-red-800 text-red-200 border border-red-500/80 hover:scale-105'
                                  : 'bg-amber-900/50 hover:bg-amber-800 text-amber-200 border border-amber-500/60 hover:scale-105'
                              }`}
                              title={`${firstErr?.message} (Nhấn để chuyển đến câu này)`}
                            >
                              <span>{isErr ? '🔴' : '🟡'} Câu {item.order_index}</span>
                              <span className="text-[10px] font-normal opacity-90 max-w-[130px] truncate hidden sm:inline">
                                : {firstErr?.message}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* GROUP 1: PHẦN 1. TRẮC NGHIỆM (Azota Style) */}
              {part1List.length > 0 && (
                <div className="space-y-4">
                  {/* Group Title Bar */}
                  <div className="flex items-center justify-between flex-wrap gap-2.5 rounded-xl bg-slate-950 border border-slate-800 p-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="h-4 w-1.5 rounded-full bg-blue-500"></span>
                      <div>
                        <span className="font-bold text-xs uppercase text-slate-200">
                          PHẦN 1. TRẮC NGHIỆM
                        </span>
                        <span className="text-[11px] text-slate-400 font-semibold ml-1.5">
                          ({part1List.length} câu)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Inline Total Points Input */}
                      <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-blue-700/60" title="Nhập tổng điểm của Phần I">
                        <span className="text-[11px] font-bold text-blue-400">Tổng điểm P1:</span>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={part1Total}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setPart1Total(val);
                            isSyncingFromUI.current = true;
                            const synced = questionsToAzotaText(questions, title, duration, matrixPreset, val, part2Total);
                            setRawText(synced);
                          }}
                          className="w-14 text-center font-mono font-bold text-xs bg-slate-950 border border-blue-500/50 rounded text-blue-300 py-0.5 focus:border-blue-400 focus:outline-none"
                        />
                        <span className="text-[11px] font-bold text-blue-300">đ</span>
                      </div>

                      {/* Distribute Button */}
                      <button
                        type="button"
                        onClick={handleDistributePart1Points}
                        className="text-[11px] font-bold text-blue-200 hover:text-white bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/60 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
                        title={`Chia đều ${part1Total} điểm cho ${part1List.length} câu hỏi (${part1List.length > 0 ? (part1Total / part1List.length).toFixed(2) : 0}đ/câu)`}
                      >
                        <span>⚡ Chia đều cho {part1List.length} câu</span>
                        {part1List.length > 0 && (
                          <span className="text-[10px] font-mono text-blue-300 font-normal">
                            ({(part1Total / part1List.length).toFixed(2)}đ/câu)
                          </span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Question Cards */}
                  <div className="space-y-4">
                    {part1List.map((q, qIdx) => {
                      const globalIdx = questions.findIndex((item) => item === q);
                      const isActive = activeQuestionIndex === globalIdx;
                      const currentPt = q.point !== undefined && q.point !== null ? q.point : 0.5;
                      const correctOpt = q.options?.find((opt: any) => opt.is_correct);
                      const hasCorrectAnswer = !!correctOpt;
                      const questionIssues = q.issues || [];
                      const hasError = q.has_error || (q.options?.length || 0) < 4;
                      const hasWarning = q.has_warning;

                      return (
                        <div
                          id={`preview-q-${globalIdx}`}
                          key={qIdx}
                          onClick={() => handleCardClick(q, globalIdx)}
                          className={`rounded-2xl border p-5 space-y-3.5 transition-all cursor-pointer ${
                            hasError
                              ? 'border-red-500/80 bg-slate-900/95 ring-2 ring-red-500/50 shadow-lg shadow-red-500/10'
                              : hasWarning
                              ? 'border-amber-500/70 bg-slate-900/90 ring-1 ring-amber-500/40 shadow-md'
                              : isActive
                              ? 'border-blue-500/80 bg-slate-900/95 ring-2 ring-blue-500 shadow-lg shadow-blue-500/20'
                              : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                          }`}
                        >
                          {/* Card Header */}
                          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`rounded-lg px-2.5 py-1 font-bold text-xs border ${
                                hasError
                                  ? 'bg-red-600 text-white border-red-400'
                                  : hasWarning
                                  ? 'bg-amber-600/30 text-amber-300 border-amber-500/50'
                                  : isActive
                                  ? 'bg-blue-600 text-white border-blue-400'
                                  : 'bg-blue-600/20 text-blue-400 border-blue-500/30'
                              }`}>
                                Câu {q.order_index}.
                              </span>
                              <span className="text-xs font-semibold text-slate-400">
                                Trắc nghiệm 4 lựa chọn
                              </span>
                              {hasError && (
                                <span className="rounded-lg bg-red-500/20 px-2 py-0.5 text-[11px] font-bold text-red-300 border border-red-500/40 flex items-center gap-1 animate-pulse">
                                  <AlertTriangle className="h-3 w-3 text-red-400" />
                                  {questionIssues.find((i: any) => i.type === 'error')?.message || 'Có lỗi cần sửa'}
                                </span>
                              )}
                              {!hasError && hasWarning && (
                                <span className="rounded-lg bg-amber-500/20 px-2 py-0.5 text-[11px] font-bold text-amber-300 border border-amber-500/40 flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3 text-amber-400" />
                                  {questionIssues.find((i: any) => i.type === 'warning')?.message || 'Cần lưu ý'}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap justify-end">
                              {/* Smart Point Editor for Part 1 */}
                              <div
                                className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-xl border border-slate-700 shadow-sm"
                                onClick={(e) => e.stopPropagation()}
                                title="Tùy chỉnh điểm cho câu hỏi này"
                              >
                                <span className="text-[10px] font-bold uppercase text-slate-400">Điểm:</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuestionPointChange(globalIdx, Math.max(0, Number((currentPt - 0.1).toFixed(2))));
                                  }}
                                  className="h-5 w-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center transition-colors"
                                  title="Giảm 0.1đ"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  step="0.05"
                                  min="0"
                                  value={currentPt}
                                  onChange={(e) => handleQuestionPointChange(globalIdx, parseFloat(e.target.value) || 0)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-12 text-center font-mono font-bold text-xs bg-slate-950 border-x border-slate-700 text-emerald-400 focus:outline-none py-0.5 mx-0.5"
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuestionPointChange(globalIdx, Number((currentPt + 0.1).toFixed(2)));
                                  }}
                                  className="h-5 w-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center transition-colors"
                                  title="Tăng 0.1đ"
                                >
                                  +
                                </button>
                                <span className="text-[10px] font-bold text-emerald-400">đ</span>
                              </div>

                              {/* Quick Presets for Part 1 */}
                              <div className="hidden sm:flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                {[0.25, 0.4, 0.5, 0.75, 1.0].map((preset) => (
                                  <button
                                    key={preset}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleQuestionPointChange(globalIdx, preset);
                                    }}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                                      currentPt === preset
                                        ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-400'
                                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-600 hover:text-slate-200'
                                    }`}
                                    title={`Đặt nhanh ${preset} điểm`}
                                  >
                                    {preset}đ
                                  </button>
                                ))}
                              </div>

                              <span className="rounded bg-slate-900 px-2 py-0.5 text-[11px] text-slate-400 border border-slate-800">
                                {q.competency_category} • {q.difficulty_level}
                              </span>

                              {/* Quick AI Solve Single Question Button */}
                                                            <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSaveToBank(globalIdx);
                                }}
                                disabled={savingToBankIndex === globalIdx}
                                className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 px-2 py-1 rounded-lg transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                                title="Lưu câu hỏi này vào Ngân hàng (AI sẽ tự động nhận diện Chủ đề và Mức độ)"
                              >
                                {savingToBankIndex === globalIdx ? (
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Save className="h-3 w-3" />
                                )}
                                <span>{savingToBankIndex === globalIdx ? 'AI đang phân tích...' : '⭐ Lưu vào Ngân hàng'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSolveSingleQuestion(globalIdx);
                                }}
                                disabled={isAISolving || solvingSingleIndex !== null}
                                className="flex items-center gap-1 text-[10px] font-bold text-indigo-300 hover:text-white bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 px-2 py-1 rounded-lg transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                                title="Nhờ AI tự động giải và điền đáp án riêng cho câu hỏi này"
                              >
                                <Sparkles className={`h-3 w-3 text-amber-300 ${solvingSingleIndex === globalIdx ? 'animate-spin' : ''}`} />
                                <span>{solvingSingleIndex === globalIdx ? 'Đang giải...' : '✨ AI Giải câu này'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteQuestion(globalIdx);
                                }}
                                className="text-slate-500 hover:text-red-400 p-1"
                                title="Xóa câu này"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Card Issues & Suggestions List if any */}
                          {questionIssues.length > 0 && (
                            <div className="space-y-1.5 pt-0.5" onClick={(e) => e.stopPropagation()}>
                              {questionIssues.map((issue: any, iIdx: number) => (
                                <div
                                  key={iIdx}
                                  className={`p-2 rounded-xl text-xs flex items-start gap-2 ${
                                    issue.type === 'error'
                                      ? 'bg-red-950/70 border border-red-800/80 text-red-200'
                                      : 'bg-amber-950/50 border border-amber-800/60 text-amber-200'
                                  }`}
                                >
                                  <AlertTriangle className={`h-4 w-4 shrink-0 mt-0.5 ${issue.type === 'error' ? 'text-red-400' : 'text-amber-400'}`} />
                                  <div className="flex-1">
                                    <div className="font-bold flex items-center gap-1.5">
                                      <span>{issue.message}</span>
                                      <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-normal uppercase bg-black/40 border border-white/10">
                                        {issue.code}
                                      </span>
                                    </div>
                                    <span className="text-[11px] block opacity-85 mt-0.5">
                                      👉 {issue.suggestion}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Prompt */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveQuestionIndex(globalIdx);
                              jumpCursorToQuestionPart(q, 'prompt');
                            }}
                            className="text-xs text-slate-900 dark:text-slate-200 leading-relaxed font-semibold cursor-pointer hover:text-teal-700 dark:hover:text-blue-300 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900/60"
                            title="Click để di chuyển con trỏ chuột đến đề bài"
                          >
                            <MathFormula text={q.content} />
                          </div>

                          {q.code_snippet && (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveQuestionIndex(globalIdx);
                                jumpCursorToQuestionPart(q, 'code');
                              }}
                              className="cursor-pointer"
                              title="Click để di chuyển con trỏ chuột đến đoạn mã code"
                            >
                              <CodeViewer code={q.code_snippet} language={q.code_language} className="!my-2 !p-2 text-xs" />
                            </div>
                          )}

                          {/* Options Grid (Azota Style) */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                            {q.options.map((opt: any, optIdx: number) => (
                              <button
                                key={optIdx}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTogglePart1Option(globalIdx, optIdx);
                                }}
                                className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition-all ${
                                  opt.is_correct
                                    ? 'border-blue-500 bg-blue-500/15 text-blue-200 ring-1 ring-blue-500/40 shadow-sm'
                                    : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                                }`}
                              >
                                <span
                                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg font-bold text-xs ${
                                    opt.is_correct
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                                  }`}
                                >
                                  {opt.label}
                                </span>
                                <div className="flex-1 pt-0.5 text-xs font-medium">
                                  <MathFormula text={opt.content} />
                                </div>
                                {opt.is_correct && (
                                  <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0 self-center" />
                                )}
                              </button>
                            ))}
                          </div>

                          {/* Explanation & Correct Answer Selector Section */}
                          <div className="pt-2.5 border-t border-slate-800/80 space-y-2">
                            <div className="flex items-center justify-between flex-wrap gap-2.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleExplanation(globalIdx);
                                  setActiveQuestionIndex(globalIdx);
                                  jumpCursorToQuestionPart(q, 'explanation');
                                }}
                                className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 py-1 transition-colors"
                              >
                                <HelpCircle className="h-4 w-4" />
                                <span>{expandedExplanations[globalIdx] ? 'Ẩn hướng dẫn giải' : '💡 Giải thích [Hướng dẫn chi tiết]'}</span>
                                {q.explanation && q.explanation.trim() ? (
                                  <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                                    Đã có lời giải
                                  </span>
                                ) : (
                                  <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] text-slate-400 border border-slate-800">
                                    + Thêm lời giải
                                  </span>
                                )}
                              </button>

                              {/* Correct Answer Combobox Selector */}
                              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                                  {hasCorrectAnswer ? (
                                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                                      Đáp án:
                                    </span>
                                  ) : (
                                    <span>Đáp án (Tùy chọn):</span>
                                  )}
                                </span>
                                <select
                                  value={correctOpt ? correctOpt.label : ''}
                                  onChange={(e) => {
                                    const selectedLabel = e.target.value;
                                    if (!selectedLabel) return;
                                    const optIdx = q.options.findIndex((o: any) => o.label === selectedLabel);
                                    if (optIdx !== -1) {
                                      handleTogglePart1Option(globalIdx, optIdx);
                                    }
                                  }}
                                  className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-bold font-mono text-slate-200 focus:border-blue-500 focus:outline-none transition-all shadow-sm cursor-pointer"
                                >
                                  <option value="" className="bg-slate-900 text-slate-400">
                                    -- Chưa chọn đáp án --
                                  </option>
                                  {q.options?.map((opt: any) => (
                                    <option key={opt.label} value={opt.label} className="bg-slate-900 text-white font-bold">
                                      Phương án {opt.label} {opt.is_correct ? '✓ (Đúng)' : ''}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {expandedExplanations[globalIdx] && (
                              <div
                                className="mt-2.5 space-y-2.5 rounded-xl bg-slate-900/90 border border-amber-500/30 p-3.5 shadow-inner"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <label className="block text-[11px] font-bold text-amber-300">
                                  Nội dung Lời giải / Hướng dẫn giải chi tiết (Hỗ trợ LaTeX $...$ & Code):
                                </label>
                                <textarea
                                  rows={3}
                                  value={q.explanation || ''}
                                  onFocus={() => {
                                    setActiveQuestionIndex(globalIdx);
                                    jumpCursorToQuestionPart(q, 'explanation');
                                  }}
                                  onChange={(e) => handleExplanationChange(globalIdx, e.target.value)}
                                  onPaste={(e) => handleExplanationPaste(e, globalIdx)}
                                  placeholder="Nhập hướng dẫn giải, phân tích thuật toán hoặc dán ảnh chụp (Ctrl+V)..."
                                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-amber-500 focus:outline-none leading-relaxed"
                                />
                                {q.explanation && q.explanation.trim() && (
                                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                                    <span className="text-[10px] font-bold uppercase text-amber-400 block mb-1">Xem trước lời giải:</span>
                                    <MathFormula text={q.explanation} />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* GROUP 2: PHẦN II. ĐÚNG SAI (Azota Style) */}
              {(part2CommonList.length > 0 || part2CSList.length > 0 || part2ICTList.length > 0) && (
                <div className="space-y-4 pt-4">
                  {/* Group Title Bar */}
                  <div className="flex items-center justify-between flex-wrap gap-2.5 rounded-xl bg-slate-950 border border-slate-800 p-3 shadow-sm">
                    <div className="flex items-center gap-2">
                      <span className="h-4 w-1.5 rounded-full bg-indigo-500"></span>
                      <div>
                        <span className="font-bold text-xs uppercase text-slate-200">
                          PHẦN II. CÂU TRẮC NGHIỆM ĐÚNG SAI
                        </span>
                        <span className="text-[11px] text-slate-400 font-semibold ml-1.5">
                          ({part2CommonList.length > 0 ? `${part2CommonList.length} chung` : ''}
                          {part2CSList.length > 0 || part2ICTList.length > 0 ? ` + ${part2CSList.length} CS / ${part2ICTList.length} ICT` : ''}
                          {' • '}mỗi thí sinh làm {p2EffectiveCount} câu)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Inline Total Points Input */}
                      <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-indigo-700/60" title="Nhập tổng điểm của Phần II">
                        <span className="text-[11px] font-bold text-indigo-400">Tổng điểm P2:</span>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={part2Total}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setPart2Total(val);
                            isSyncingFromUI.current = true;
                            const synced = questionsToAzotaText(questions, title, duration, matrixPreset, part1Total, val);
                            setRawText(synced);
                          }}
                          className="w-14 text-center font-mono font-bold text-xs bg-slate-950 border border-indigo-500/50 rounded text-indigo-300 py-0.5 focus:border-indigo-400 focus:outline-none"
                        />
                        <span className="text-[11px] font-bold text-indigo-300">đ</span>
                      </div>

                      {/* Distribute Button */}
                      <button
                        type="button"
                        onClick={handleDistributePart2Points}
                        className="text-[11px] font-bold text-indigo-200 hover:text-white bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/60 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
                        title={`Chia đều ${part2Total} điểm cho ${p2EffectiveCount} câu hỏi (${p2EffectiveCount > 0 ? (part2Total / p2EffectiveCount).toFixed(2) : 0}đ/câu)`}
                      >
                        <span>⚡ Chia đều cho {p2EffectiveCount} câu</span>
                        {p2EffectiveCount > 0 && (
                          <span className="text-[10px] font-mono text-indigo-300 font-normal">
                            ({(part2Total / p2EffectiveCount).toFixed(2)}đ/câu)
                          </span>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Part 2 Cards */}
                  <div className="space-y-4">
                    {questions
                      .filter((q) => q.part_type === 'PART_II')
                      .map((q, qIdx) => {
                        const globalIdx = questions.findIndex((item) => item === q);
                        const isActive = activeQuestionIndex === globalIdx;
                        const currentPt = q.point !== undefined && q.point !== null ? q.point : 2.0;
                        const questionIssues = q.issues || [];
                        const hasError = q.has_error || (q.options?.length || 0) < 4;
                        const hasWarning = q.has_warning;

                        return (
                          <div
                            id={`preview-q-${globalIdx}`}
                            key={qIdx}
                            onClick={() => handleCardClick(q, globalIdx)}
                            className={`rounded-2xl border p-5 space-y-3.5 transition-all cursor-pointer ${
                              hasError
                                ? 'border-red-500/80 bg-slate-900/95 ring-2 ring-red-500/50 shadow-lg shadow-red-500/10'
                                : hasWarning
                                ? 'border-amber-500/70 bg-slate-900/90 ring-1 ring-amber-500/40 shadow-md'
                                : isActive
                                ? 'border-indigo-500/80 bg-slate-900/95 ring-2 ring-indigo-500 shadow-lg shadow-indigo-500/20'
                                : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                            }`}
                          >
                            {/* Card Header */}
                            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                              <div className="flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                                <span className={`rounded-lg px-2.5 py-1 font-bold text-xs border ${
                                  hasError
                                    ? 'bg-red-600 text-white border-red-400'
                                    : hasWarning
                                    ? 'bg-amber-600/30 text-amber-300 border-amber-500/50'
                                    : isActive
                                    ? 'bg-indigo-600 text-white border-indigo-400'
                                    : 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30'
                                }`}>
                                  Câu {q.order_index}.
                                </span>

                                {hasError && (
                                  <span className="rounded-lg bg-red-500/20 px-2 py-0.5 text-[11px] font-bold text-red-300 border border-red-500/40 flex items-center gap-1 animate-pulse">
                                    <AlertTriangle className="h-3 w-3 text-red-400" />
                                    {questionIssues.find((i: any) => i.type === 'error')?.message || 'Có lỗi cần sửa'}
                                  </span>
                                )}
                                {!hasError && hasWarning && (
                                  <span className="rounded-lg bg-amber-500/20 px-2 py-0.5 text-[11px] font-bold text-amber-300 border border-amber-500/40 flex items-center gap-1">
                                    <AlertTriangle className="h-3 w-3 text-amber-400" />
                                    {questionIssues.find((i: any) => i.type === 'warning')?.message || 'Cần lưu ý'}
                                  </span>
                                )}

                                {/* Branch Selector Combobox */}
                                <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-0.5 rounded-lg border border-slate-700 shadow-sm" title="Chỉ định loại câu: Phần Chung (bắt buộc) hay Nhánh chuyên đề (CS / ICT)">
                                  <span className="text-[10px] font-bold text-slate-400">Loại:</span>
                                  <select
                                    value={q.branch || 'COMMON'}
                                    onChange={(e) => {
                                      const newBranch = e.target.value as 'COMMON' | 'CS' | 'ICT';
                                      handleChangeBranch(globalIdx, newBranch);
                                    }}
                                    className={`rounded px-2 py-0.5 text-xs font-bold font-mono focus:outline-none transition-all cursor-pointer ${
                                      q.branch === 'CS'
                                        ? 'bg-sky-950 text-sky-300 border border-sky-600/80'
                                        : q.branch === 'ICT'
                                        ? 'bg-amber-950 text-amber-300 border border-amber-600/80'
                                        : 'bg-indigo-950 text-indigo-300 border border-indigo-600/80'
                                    }`}
                                  >
                                    <option value="COMMON" className="bg-slate-900 text-indigo-300 font-bold">🌐 Phần Chung</option>
                                    <option value="CS" className="bg-slate-900 text-sky-300 font-bold">💻 Nhánh CS</option>
                                    <option value="ICT" className="bg-slate-900 text-amber-300 font-bold">📱 Nhánh ICT</option>
                                  </select>
                                </div>
                              </div>
                            <div className="flex items-center gap-2 flex-wrap justify-end">
                              {/* Smart Point Editor for Part 2 */}
                              <div
                                className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-xl border border-slate-700 shadow-sm"
                                onClick={(e) => e.stopPropagation()}
                                title="Tùy chỉnh điểm tối đa khi đúng cả 4 ý"
                              >
                                <span className="text-[10px] font-bold uppercase text-slate-400">Điểm tối đa:</span>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuestionPointChange(globalIdx, Math.max(0, Number((currentPt - 0.25).toFixed(2))));
                                  }}
                                  className="h-5 w-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center transition-colors"
                                  title="Giảm 0.25đ"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  step="0.25"
                                  min="0"
                                  value={currentPt}
                                  onChange={(e) => handleQuestionPointChange(globalIdx, parseFloat(e.target.value) || 0)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-14 text-center font-mono font-bold text-xs bg-slate-950 border-x border-slate-700 text-indigo-400 focus:outline-none py-0.5 mx-0.5"
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuestionPointChange(globalIdx, Number((currentPt + 0.25).toFixed(2)));
                                  }}
                                  className="h-5 w-5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center transition-colors"
                                  title="Tăng 0.25đ"
                                >
                                  +
                                </button>
                                <span className="text-[10px] font-bold text-indigo-400">đ</span>
                              </div>

                              {/* Quick Presets for Part 2 */}
                              <div className="hidden sm:flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                {[1.0, 1.5, 1.6, 2.0, 2.5].map((preset) => (
                                  <button
                                    key={preset}
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleQuestionPointChange(globalIdx, preset);
                                    }}
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                                      currentPt === preset
                                        ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-600 hover:text-slate-200'
                                    }`}
                                    title={`Đặt nhanh ${preset} điểm`}
                                  >
                                    {preset}đ
                                  </button>
                                ))}
                              </div>

                              <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/80 px-2 py-0.5 rounded border border-indigo-800/60 hidden lg:inline">
                                {matrixPreset === 'HSG_NINHBINH' || matrixPreset === 'HSG_QUAT_LAM'
                                  ? `1ý=0.3đ | 2ý=0.6đ | 3ý=1.0đ | 4ý=${currentPt}đ`
                                  : matrixPreset === 'BGD_2025'
                                  ? `1ý=0.1đ | 2ý=0.25đ | 3ý=0.5đ | 4ý=${currentPt}đ`
                                  : `1ý=${(currentPt * 0.25).toFixed(2)}đ | 2ý=${(currentPt * 0.5).toFixed(2)}đ | 3ý=${(currentPt * 0.75).toFixed(2)}đ | 4ý=${currentPt}đ`}
                              </span>

                              {/* Quick AI Solve Single Question Button */}
                                                            <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSaveToBank(globalIdx);
                                }}
                                disabled={savingToBankIndex === globalIdx}
                                className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 px-2 py-1 rounded-lg transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                                title="Lưu câu hỏi này vào Ngân hàng (AI sẽ tự động nhận diện Chủ đề và Mức độ)"
                              >
                                {savingToBankIndex === globalIdx ? (
                                  <RefreshCw className="h-3 w-3 animate-spin" />
                                ) : (
                                  <Save className="h-3 w-3" />
                                )}
                                <span>{savingToBankIndex === globalIdx ? 'AI đang phân tích...' : '⭐ Lưu vào Ngân hàng'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSolveSingleQuestion(globalIdx);
                                }}
                                disabled={isAISolving || solvingSingleIndex !== null}
                                className="flex items-center gap-1 text-[10px] font-bold text-indigo-300 hover:text-white bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 px-2 py-1 rounded-lg transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                                title="Nhờ AI tự động giải và điền đáp án riêng cho câu hỏi này"
                              >
                                <Sparkles className={`h-3 w-3 text-amber-300 ${solvingSingleIndex === globalIdx ? 'animate-spin' : ''}`} />
                                <span>{solvingSingleIndex === globalIdx ? 'Đang giải...' : '✨ AI Giải câu này'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteQuestion(globalIdx);
                                }}
                                className="text-slate-500 hover:text-red-400 p-1"
                                title="Xóa câu này"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Card Issues & Suggestions List if any */}
                          {questionIssues.length > 0 && (
                            <div className="space-y-1.5 pt-0.5" onClick={(e) => e.stopPropagation()}>
                              {questionIssues.map((issue: any, iIdx: number) => (
                                <div
                                  key={iIdx}
                                  className={`p-2 rounded-xl text-xs flex items-start gap-2 ${
                                    issue.type === 'error'
                                      ? 'bg-red-950/70 border border-red-800/80 text-red-200'
                                      : 'bg-amber-950/50 border border-amber-800/60 text-amber-200'
                                  }`}
                                >
                                  <AlertTriangle className={`h-4 w-4 shrink-0 mt-0.5 ${issue.type === 'error' ? 'text-red-400' : 'text-amber-400'}`} />
                                  <div className="flex-1">
                                    <div className="font-bold flex items-center gap-1.5">
                                      <span>{issue.message}</span>
                                      <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-normal uppercase bg-black/40 border border-white/10">
                                        {issue.code}
                                      </span>
                                    </div>
                                    <span className="text-[11px] block opacity-85 mt-0.5">
                                      👉 {issue.suggestion}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Prompt */}
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveQuestionIndex(globalIdx);
                                jumpCursorToQuestionPart(q, 'prompt');
                              }}
                              className="text-xs text-slate-900 dark:text-slate-200 leading-relaxed font-semibold cursor-pointer hover:text-teal-700 dark:hover:text-indigo-300 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900/60"
                              title="Click để di chuyển con trỏ chuột đến đề bài"
                            >
                              <MathFormula text={q.content} />
                            </div>

                            {q.code_snippet && (
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveQuestionIndex(globalIdx);
                                  jumpCursorToQuestionPart(q, 'code');
                                }}
                                className="cursor-pointer"
                                title="Click để di chuyển con trỏ chuột đến đoạn mã code"
                              >
                                <CodeViewer code={q.code_snippet} language={q.code_language} className="!my-2 !p-2 text-xs" />
                              </div>
                            )}

                            {/* Subitems (Azota Style) */}
                            <div className="space-y-2 pt-1">
                              {q.options.map((opt: any, optIdx: number) => (
                                <div
                                  key={optIdx}
                                  className={`flex items-center justify-between gap-3 rounded-xl border p-3 transition-all ${
                                    opt.is_correct
                                      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200'
                                      : 'border-slate-800 bg-slate-900/60 text-slate-400'
                                  }`}
                                >
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleTogglePart2Subitem(globalIdx, optIdx);
                                    }}
                                    className="flex items-center gap-3 text-left flex-1"
                                  >
                                    <span
                                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg font-bold text-xs ${
                                        opt.is_correct
                                          ? 'bg-emerald-600 text-white'
                                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                                      }`}
                                    >
                                      {opt.label})
                                    </span>
                                    <div className="text-xs font-medium flex-1">
                                      <MathFormula text={opt.content} />
                                    </div>
                                    <span
                                      className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                        opt.is_correct
                                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                          : 'bg-red-500/20 text-red-300 border border-red-500/40'
                                      }`}
                                    >
                                      {opt.is_correct ? 'ĐÚNG' : 'SAI'}
                                    </span>
                                  </button>

                                  {/* Difficulty Badge (Azota style tag: NB, TH, VD, VDC) */}
                                  <select
                                    value={opt.difficulty_level || 'TH'}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => handleChangeDifficulty(globalIdx, optIdx, e.target.value)}
                                    className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-[11px] font-mono font-bold text-slate-300 focus:border-blue-500 focus:outline-none"
                                  >
                                    <option value="NB">NB</option>
                                    <option value="TH">TH</option>
                                    <option value="VD">VD</option>
                                    <option value="VDC">VDC</option>
                                  </select>
                                </div>
                              ))}
                            </div>

                            {/* Explanation / Guide Section */}
                            <div className="pt-2 border-t border-slate-800/80">
                              <div className="flex items-center justify-between">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleExplanation(globalIdx);
                                    setActiveQuestionIndex(globalIdx);
                                    jumpCursorToQuestionPart(q, 'explanation');
                                  }}
                                  className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 hover:text-amber-300 py-1 transition-colors"
                                >
                                  <HelpCircle className="h-4 w-4" />
                                  <span>{expandedExplanations[globalIdx] ? 'Ẩn hướng dẫn giải' : '💡 Giải thích [Hướng dẫn chi tiết]'}</span>
                                  {q.explanation && q.explanation.trim() ? (
                                    <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                                      Đã có lời giải
                                    </span>
                                  ) : (
                                    <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] text-slate-400 border border-slate-800">
                                      + Thêm lời giải
                                    </span>
                                  )}
                                </button>
                              </div>

                              {expandedExplanations[globalIdx] && (
                                <div
                                  className="mt-2.5 space-y-2.5 rounded-xl bg-slate-900/90 border border-amber-500/30 p-3.5 shadow-inner"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <label className="block text-[11px] font-bold text-amber-300">
                                    Nội dung Lời giải / Hướng dẫn giải chi tiết (Hỗ trợ LaTeX $...$ & Code):
                                  </label>
                                  <textarea
                                    rows={3}
                                    value={q.explanation || ''}
                                    onFocus={() => {
                                      setActiveQuestionIndex(globalIdx);
                                      jumpCursorToQuestionPart(q, 'explanation');
                                    }}
                                    onChange={(e) => handleExplanationChange(globalIdx, e.target.value)}
                                    onPaste={(e) => handleExplanationPaste(e, globalIdx)}
                                    placeholder="Nhập hướng dẫn giải, phân tích thuật toán hoặc dán ảnh chụp (Ctrl+V)..."
                                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-amber-500 focus:outline-none leading-relaxed"
                                  />
                                  {q.explanation && q.explanation.trim() && (
                                    <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                                      <span className="text-[10px] font-bold uppercase text-amber-400 block mb-1">Xem trước lời giải:</span>
                                      <MathFormula text={q.explanation} />
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Input & Editor (6 cols on lg - Cuộn độc lập) */}
        <div className="lg:col-span-6 xl:col-span-6 h-full flex flex-col overflow-hidden min-h-0 space-y-2.5">
          {/* Exam Metadata & Scoring Card */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3 space-y-2.5 shadow-lg shrink-0">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Layers className="h-4 w-4 text-blue-400" />
                Cấu hình Thông tin & Điểm Đề thi
              </h3>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-0.5 rounded-lg">
                Tổng điểm: {totalPoints}đ
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Phân loại Đề thi *</label>
                  <select
                    value={examType}
                    onChange={(e) => handleSwitchExamType(e.target.value as 'HSG' | 'TN_THPT')}
                    className="w-full rounded-xl border border-indigo-500/50 bg-slate-900 px-3 py-1.5 text-white focus:border-indigo-400 focus:outline-none text-xs font-bold"
                  >
                    <option value="HSG">🏆 Học sinh giỏi (HSG)</option>
                    <option value="TN_THPT">🎓 Ôn thi Tốt nghiệp</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Cấu trúc Ma trận Đề thi</label>
                  <select
                    value={matrixPreset}
                    onChange={(e) => handleSwitchMatrixPreset(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-white focus:border-blue-500 focus:outline-none text-xs font-semibold"
                  >
                    <option value="HSG_QUAT_LAM">🏆 HSG Quất Lâm (20đ)</option>
                    <option value="HSG_NINHBINH">🏆 HSG Ninh Bình (20đ)</option>
                    <option value="BGD_2025">🎓 TN Bộ GD&ĐT (10đ)</option>
                    <option value="LINEAR_EQUAL">⚖️ Tuyến tính đều</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Thư mục lưu trữ</label>
                  <select
                    value={selectedFolderId}
                    onChange={(e) => setSelectedFolderId(e.target.value)}
                    className="w-full rounded-xl border border-blue-500/50 bg-slate-900 px-3 py-1.5 text-white focus:border-blue-400 focus:outline-none text-xs font-semibold"
                  >
                    <option value="">📁 Chưa phân loại (Gốc)</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.is_shared ? '🌐' : '🔒'} {f.path_display || f.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-400 font-semibold mb-1">Tên đề thi *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Thời gian (phút)</label>
                  <input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Point Allocation Config */}
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <span className="text-[11px] font-bold text-slate-300 block uppercase tracking-wide">
                  ⚡ Cấu hình Tổng Điểm Từng Phần & Nút Phân Bổ:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Part 1 Points Block */}
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-blue-400">Tổng điểm Phần I:</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={part1Total}
                        onChange={(e) => setPart1Total(parseFloat(e.target.value) || 0)}
                        className="w-16 text-center font-mono font-bold text-xs bg-slate-900 border border-blue-500/50 rounded text-blue-300 py-0.5 focus:border-blue-400 focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleDistributePart1Points}
                      className="w-full py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-[10px] font-bold transition-colors flex items-center justify-center gap-1"
                    >
                      <span>⚡ Chia đều cho {part1List.length} câu Phần I</span>
                    </button>
                  </div>

                  {/* Part 2 Points Block */}
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-indigo-400">Tổng điểm Phần II:</label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        value={part2Total}
                        onChange={(e) => setPart2Total(parseFloat(e.target.value) || 0)}
                        className="w-16 text-center font-mono font-bold text-xs bg-slate-900 border border-indigo-500/50 rounded text-indigo-300 py-0.5 focus:border-indigo-400 focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleDistributePart2Points}
                      className="w-full py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold transition-colors flex items-center justify-center gap-1"
                    >
                      <span>⚡ Chia đều cho các câu Phần II</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Input Method Tabs & Textarea */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3.5 space-y-2.5 flex-1 flex flex-col shadow-lg overflow-hidden min-h-0">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 shrink-0">
              <div className="flex gap-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => handleSwitchTab('paste')}
                  className={`px-3.5 py-1.5 rounded-lg transition-all ${
                    inputMode === 'paste'
                      ? 'bg-blue-600 text-white font-bold shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  📋 Dán văn bản nhanh
                </button>
                <button
                  type="button"
                  onClick={() => handleSwitchTab('form')}
                  className={`px-3.5 py-1.5 rounded-lg transition-all ${
                    inputMode === 'form'
                      ? 'bg-blue-600 text-white font-bold shadow-md'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  ➕ Thêm từng câu thủ công
                </button>
              </div>

              {inputMode === 'paste' && (
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Upload Word .docx Button */}
                  {/* Upload Word / PDF Button */}
                  <input
                    type="file"
                    ref={docxFileInputRef}
                    onChange={handleDocxFileChange}
                    accept=".docx,.doc,.pdf,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => docxFileInputRef.current?.click()}
                    disabled={isUploadingDocx}
                    className="text-[11px] font-bold text-white flex items-center gap-1.5 bg-blue-700 hover:bg-blue-600 border border-blue-400/50 px-3 py-1 rounded-lg transition-all shadow-md hover:shadow-blue-500/25 disabled:opacity-50 cursor-pointer"
                    title="Tải lên file Word (.docx) hoặc PDF (.pdf) để tự động trích xuất toàn bộ câu hỏi, đáp án và 100% HÌNH ẢNH bên trong"
                  >
                    <Download className={`h-3.5 w-3.5 text-blue-200 ${isUploadingDocx ? 'animate-bounce' : ''}`} />
                    <span>{isUploadingDocx ? 'Đang đọc file...' : '📥 Tải file Word / PDF'}</span>
                  </button>

                  {/* AI Auto Solve Button */}
                  <button
                    type="button"
                    onClick={handleStartAISolve}
                    disabled={isAISolving || questions.length === 0}
                    className="text-[11px] font-bold text-white flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 px-3 py-1 rounded-lg transition-all shadow-md hover:shadow-indigo-500/25 disabled:opacity-50 border border-indigo-400/30 ring-1 ring-white/20 cursor-pointer"
                    title="Tự động phân tích thuật toán, giải bài và chọn đáp án chính xác bằng AI (Gemini, ChatGPT, DeepSeek, Claude, Grok)"
                  >
                    <Sparkles className={`h-3.5 w-3.5 text-yellow-300 ${isAISolving ? 'animate-spin' : 'animate-pulse'}`} />
                    <span>{isAISolving ? 'AI Đang giải bài...' : '✨ AI Giải đề & Điền đáp án'}</span>
                  </button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileInputChange}
                    accept="image/*"
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 bg-amber-950/60 border border-amber-800/60 px-2.5 py-1 rounded-lg transition-all disabled:opacity-50"
                    title="Chèn hoặc tải lên hình ảnh từ máy tính (hoặc nhấn Ctrl+V trực tiếp)"
                  >
                    <ImageIcon className={`h-3 w-3 ${isUploadingImage ? 'animate-spin' : ''}`} />
                    <span>{isUploadingImage ? 'Đang tải...' : '🖼️ Chèn ảnh'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLiveParse(rawText)}
                    className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-lg transition-all"
                    title="Cập nhật lại xem trước"
                  >
                    <RefreshCw className={`h-3 w-3 ${isParsing ? 'animate-spin' : ''}`} />
                    <span>Xem lại</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRawText(NINHBINH_HSG_TEMPLATE);
                      handleLiveParse(NINHBINH_HSG_TEMPLATE);
                    }}
                    className="text-[11px] font-bold text-amber-300 hover:text-white flex items-center gap-1 bg-amber-950/80 border border-amber-600/70 px-2.5 py-1 rounded-lg transition-all shadow-sm"
                    title="Nạp mẫu đề thi HSG Tỉnh Ninh Bình (30 câu P1 + 7 câu P2 • Thang 20đ)"
                  >
                    <Sparkles className="h-3 w-3 text-amber-400" />
                    <span>🏆 Mẫu HSG Ninh Bình (20đ)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRawText(BGD_GRADUATION_TEMPLATE);
                      handleLiveParse(BGD_GRADUATION_TEMPLATE);
                    }}
                    className="text-[11px] font-bold text-sky-300 hover:text-white flex items-center gap-1 bg-sky-950/80 border border-sky-600/70 px-2.5 py-1 rounded-lg transition-all shadow-sm"
                    title="Nạp mẫu đề thi Tốt nghiệp THPT Bộ GD&ĐT (24 câu P1 + 6 câu P2 • Thang 10đ)"
                  >
                    <Sparkles className="h-3 w-3 text-sky-400" />
                    <span>🎓 Mẫu Tốt nghiệp (10đ)</span>
                  </button>
                </div>
              )}
            </div>

            {/* Paste Mode Textarea */}
            {inputMode === 'paste' ? (
              <div className="flex-1 flex flex-col space-y-2 min-h-0 overflow-hidden">
                {/* Word & PDF Image Guidance Alert */}
                <div className="px-3 py-2 rounded-xl bg-slate-900/90 border border-blue-500/30 text-[11px] text-slate-300 flex items-start gap-2 shrink-0">
                  <Lightbulb className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <span className="font-semibold text-blue-300">Mẹo giữ trọn vẹn hình ảnh từ Word & PDF:</span>{' '}
                    <span>
                      Khi copy-paste văn bản từ Word/PDF, trình duyệt không tự lấy được ảnh do bảo mật. Thầy/cô hãy bấm nút{' '}
                      <button
                        type="button"
                        onClick={() => docxFileInputRef.current?.click()}
                        className="text-amber-300 font-bold underline hover:text-amber-200 inline-flex items-center gap-0.5 cursor-pointer"
                      >
                        📥 Tải file Word / PDF
                      </button>{' '}
                      ở trên để hệ thống tự động bóc tách 100% hình ảnh, hoặc chụp/sao chép ảnh ➔ Nhấn <strong>Ctrl+V</strong> vào ô soạn thảo!
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center justify-between shrink-0">
                  <span>Tự động nhận diện code & <strong>hỗ trợ dán ảnh chụp màn hình (Ctrl+V)</strong></span>
                  {isParsing ? (
                    <span className="text-blue-400 font-semibold animate-pulse flex items-center gap-1">
                      <RefreshCw className="h-3 w-3 animate-spin" /> Đang bóc tách...
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-semibold">✓ Đã cập nhật ({questions.length} câu)</span>
                  )}
                </div>

                {errorMsg && (
                  <div className="p-2.5 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2 shrink-0">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-red-400" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Quick Code & Formula Toolbar */}
                <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0 text-xs shadow-inner">
                  <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
                    <Code className="h-3.5 w-3.5 text-blue-400" /> Bọc mã:
                  </span>

                  <button
                    type="button"
                    onClick={() => wrapSelectedTextWithCode('python')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-950/70 border border-emerald-700/60 text-emerald-300 hover:bg-emerald-900 hover:text-emerald-200 font-bold text-[11px] transition-all shadow-sm"
                    title="Bôi đen đoạn mã và bấm để đánh dấu là code Python (```python)"
                  >
                    <span>🐍 Python</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => wrapSelectedTextWithCode('cpp')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-950/70 border border-sky-700/60 text-sky-300 hover:bg-sky-900 hover:text-sky-200 font-bold text-[11px] transition-all shadow-sm"
                    title="Bôi đen đoạn mã và bấm để đánh dấu là code C++ (```cpp)"
                  >
                    <span>⚡ C++</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => wrapSelectedTextWithCode('sql')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-950/70 border border-amber-700/60 text-amber-300 hover:bg-amber-900 hover:text-amber-200 font-bold text-[11px] transition-all shadow-sm"
                    title="Bôi đen đoạn mã và bấm để đánh dấu là câu lệnh SQL (```sql)"
                  >
                    <span>🗄️ SQL</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => wrapSelectedTextWithCode('html')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-950/70 border border-purple-700/60 text-purple-300 hover:bg-purple-900 hover:text-purple-200 font-bold text-[11px] transition-all shadow-sm"
                    title="Bôi đen đoạn mã và bấm để đánh dấu là mã HTML (```html)"
                  >
                    <span>🌐 HTML</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => wrapSelectedTextWithCode('css')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-pink-950/70 border border-pink-700/60 text-pink-300 hover:bg-pink-900 hover:text-pink-200 font-bold text-[11px] transition-all shadow-sm"
                    title="Bôi đen đoạn mã và bấm để đánh dấu là mã CSS (```css)"
                  >
                    <span>🎨 CSS</span>
                  </button>

                  <div className="h-4 w-px bg-slate-700 mx-1"></div>

                  <button
                    type="button"
                    onClick={() => wrapSelectedTextWithCode('math')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-950/70 border border-indigo-700/60 text-indigo-300 hover:bg-indigo-900 hover:text-indigo-200 font-bold text-[11px] transition-all shadow-sm"
                    title="Bôi đen và bọc công thức Toán học $...$"
                  >
                    <span>💲 KaTeX</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => wrapSelectedTextWithCode('explanation')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-yellow-950/70 border border-yellow-700/60 text-yellow-300 hover:bg-yellow-900 hover:text-yellow-200 font-bold text-[11px] transition-all shadow-sm"
                    title="Thêm thẻ [LOI_GIAI] hướng dẫn giải chi tiết"
                  >
                    <span>💡 Lời giải</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowBankPickerModal(true)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/80 border border-indigo-500/60 text-white hover:bg-indigo-500 font-bold text-[11px] transition-all shadow-sm ml-auto"
                    title="Chọn câu hỏi từ thư viện cá nhân hoặc công khai"
                  >
                    <Layers size={12} />
                    <span>Thư Viện Câu Hỏi</span>
                  </button>
                </div>

                <textarea
                  ref={textareaRef}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  onPaste={handlePaste}
                  onClick={handleTextareaCursorChange}
                  onKeyUp={handleTextareaCursorChange}
                  onSelect={handleTextareaCursorChange}
                  className="w-full flex-1 rounded-xl border border-slate-700 bg-slate-900 p-3.5 font-mono text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none leading-relaxed resize-none h-full overflow-y-auto min-h-0"
                  placeholder="Dán nội dung đề thi hoặc dán ảnh chụp (Ctrl+V) vào đây..."
                />
              </div>
            ) : (
              /* Manual Form Mode */
              <div className="flex-1 overflow-y-auto pr-2 space-y-3.5 text-xs min-h-0">
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Loại câu hỏi</label>
                    <select
                      value={manualPartType}
                      onChange={(e) => {
                        const newType = e.target.value as any;
                        setManualPartType(newType);
                        setManualPoint(newType === 'PART_I' ? 0.5 : 2.0);
                      }}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="PART_I">Phần I: Trắc nghiệm 4 lựa chọn</option>
                      <option value="PART_II">Phần II: Đúng / Sai</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Điểm câu hỏi</label>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      value={manualPoint}
                      onChange={(e) => setManualPoint(parseFloat(e.target.value) || 0)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white font-mono font-bold focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  {manualPartType === 'PART_II' ? (
                    <div>
                      <label className="block text-slate-400 font-semibold mb-1">Phân nhánh</label>
                      <select
                        value={manualBranch}
                        onChange={(e) => setManualBranch(e.target.value as any)}
                        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                      >
                        <option value="COMMON">Phần Chung</option>
                        <option value="CS">Nhánh CS (Khoa học máy tính)</option>
                        <option value="ICT">Nhánh ICT (Tin học ứng dụng)</option>
                      </select>
                    </div>
                  ) : (
                    <div></div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Nội dung câu hỏi *</label>
                  <textarea
                    rows={3}
                    value={manualContent}
                    onChange={(e) => setManualContent(e.target.value)}
                    placeholder="Nhập nội dung đề bài..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-400 font-semibold flex items-center gap-1.5">
                      <Code className="h-3.5 w-3.5 text-blue-400" />
                      <span>Mã Code Snippet (nếu có)</span>
                    </label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setManualLanguage('python')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${manualLanguage === 'python' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                      >
                        🐍 Python
                      </button>
                      <button
                        type="button"
                        onClick={() => setManualLanguage('cpp')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${manualLanguage === 'cpp' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                      >
                        ⚡ C++
                      </button>
                      <button
                        type="button"
                        onClick={() => setManualLanguage('sql')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${manualLanguage === 'sql' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                      >
                        🗄️ SQL
                      </button>
                      <button
                        type="button"
                        onClick={() => setManualLanguage('html')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${manualLanguage === 'html' ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                      >
                        🌐 HTML
                      </button>
                      <button
                        type="button"
                        onClick={() => setManualLanguage('css')}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${manualLanguage === 'css' ? 'bg-pink-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                      >
                        🎨 CSS
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={4}
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="// Nhập mã code C++, Python, SQL, HTML hoặc CSS..."
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 font-mono text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Nhóm năng lực</label>
                    <select
                      value={manualCategory}
                      onChange={(e) => setManualCategory(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="PROG_BASIC">Lập trình cơ bản</option>
                      <option value="ALGO_DS">Thuật toán & CTDL</option>
                      <option value="OPTIMIZATION">Tối ưu hóa</option>
                      <option value="DB_NETWORK">CSDL & Mạng</option>
                      <option value="ICT_APP">Ứng dụng Tin học</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Mức độ tư duy</label>
                    <select
                      value={manualDifficulty}
                      onChange={(e) => setManualDifficulty(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                    >
                      <option value="NB">Nhận biết (NB)</option>
                      <option value="TH">Thông hiểu (TH)</option>
                      <option value="VD">Vận dụng (VD)</option>
                      <option value="VDC">Vận dụng cao (VDC)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddManualQuestion}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 font-bold text-white hover:bg-blue-500 shadow-md transition-all"
                >
                  <Plus className="h-4 w-4" />
                  Thêm Câu Hỏi Này
                </button>

                {statusMsg && (
                  <p className="text-center text-xs font-semibold text-emerald-400 animate-in fade-in">
                    {statusMsg}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Solve Confirmation Modal */}
      {showAISolveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-2xl border border-indigo-500/40 bg-slate-950 p-6 shadow-2xl space-y-5 text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500 to-pink-500 shadow-md">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">AI Tự Động Giải Đề & Điền Đáp Án</h3>
                  <p className="text-[11px] text-slate-400">
                    Sử dụng {AI_PROVIDERS.find((p) => p.id === getStoredAISettings().provider)?.name || 'AI'} ({getStoredAISettings().model})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAISolveModal(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  Phạm vi giải câu hỏi:
                </label>
                <div className="space-y-2.5">
                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      aiSolveMode === 'unanswered_only'
                        ? 'border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500/50'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="aiSolveMode"
                      checked={aiSolveMode === 'unanswered_only'}
                      onChange={() => setAISolveMode('unanswered_only')}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Chỉ giải các câu CHƯA CÓ ĐÁP ÁN (Khuyên dùng)
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Giữ nguyên các câu bạn đã chọn đáp án trước đó, chỉ nhờ AI giải các câu còn thiếu.
                      </span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      aiSolveMode === 'selected_only'
                        ? 'border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500/50'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="aiSolveMode"
                      checked={aiSolveMode === 'selected_only'}
                      onChange={() => setAISolveMode('selected_only')}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white block">
                          Chỉ giải CÁC CÂU ĐANG ĐƯỢC CHỌN ({selectedQuestionsToSolve.length}/{questions.length} câu)
                        </span>
                        {selectedQuestionsToSolve.length > 0 && (
                          <span className="text-[10px] font-bold text-indigo-300 bg-indigo-900/80 px-2 py-0.5 rounded border border-indigo-700">
                            Đã chọn {selectedQuestionsToSolve.length} câu
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        Chỉ định một hoặc nhiều câu hỏi cụ thể cần AI phân tích và giải.
                      </span>

                      {aiSolveMode === 'selected_only' && (
                        <div className="mt-3 space-y-2 border-t border-slate-800/80 pt-2.5" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-indigo-300">Tích chọn các câu cần giải:</span>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={handleSelectAllQuestionsToSolve}
                                className="text-[10px] text-blue-400 hover:underline font-bold"
                              >
                                Chọn tất cả
                              </button>
                              <span className="text-slate-600">•</span>
                              <button
                                type="button"
                                onClick={handleDeselectAllQuestionsToSolve}
                                className="text-[10px] text-slate-400 hover:underline font-bold"
                              >
                                Bỏ chọn
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 rounded-xl bg-slate-950/90 border border-slate-800">
                            {questions.map((q, idx) => {
                              const isChecked = selectedQuestionsToSolve.includes(idx);
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => handleToggleSelectQuestionToSolve(idx)}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all flex items-center gap-1 ${
                                    isChecked
                                      ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                                      : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-200'
                                  }`}
                                >
                                  <span>{isChecked ? '✓' : ''} Câu {q.order_index} ({q.part_type === 'PART_I' ? 'P1' : q.branch === 'CS' ? 'CS' : q.branch === 'ICT' ? 'ICT' : 'P2'})</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      aiSolveMode === 'all'
                        ? 'border-indigo-500 bg-indigo-950/40 ring-1 ring-indigo-500/50'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="aiSolveMode"
                      checked={aiSolveMode === 'all'}
                      onChange={() => setAISolveMode('all')}
                      className="mt-0.5 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Giải lại TOÀN BỘ câu hỏi trong đề ({questions.length} câu)
                      </span>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        AI sẽ giải lại từ đầu và cập nhật toàn bộ đáp án của Phần I & Phần II.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Tạo Lời giải / Hướng dẫn giải</span>
                  <span className="text-[11px] text-slate-400 block">
                    AI sẽ phân tích chi tiết mã nguồn, thuật toán cho từng câu hỏi
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={aiIncludeExplain}
                  onChange={(e) => setAIIncludeExplain(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span>
                  Đang dùng:{' '}
                  <strong className="text-indigo-300">
                    {getStoredAISettings().provider.toUpperCase()} ({getStoredAISettings().model})
                  </strong>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowAISolveModal(false);
                    setShowAISettingsModal(true);
                  }}
                  className="text-blue-400 hover:text-blue-300 font-semibold hover:underline"
                >
                  Đổi cấu hình AI ⚙️
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAISolveModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-semibold"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleExecuteAISolve}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                <span>🚀 Bắt đầu AI Giải đề</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Settings Modal */}
      <AISettingsModal
        isOpen={showAISettingsModal}
        onClose={() => setShowAISettingsModal(false)}
      />

      {/* Bank Question Picker Modal */}
      <BankQuestionPickerModal
        isOpen={showBankPickerModal}
        onClose={() => setShowBankPickerModal(false)}
        onImport={handleImportFromBank}
      />
    </div>
  );
};
