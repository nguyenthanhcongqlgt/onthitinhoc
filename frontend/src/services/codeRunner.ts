/**
 * Code Runner Service
 * Executes code for HTML/CSS (Live Preview), SQL (SQLite WASM / sql.js),
 * Python, and C++ (via Judge0 Public CE API).
 */

import { SCHOOL_NAME } from '../config/constants';

export type PlaygroundLanguage = 'html-css' | 'sql' | 'python' | 'cpp';

export interface ExecutionResult {
  success: boolean;
  stdout?: string;
  stderr?: string;
  compileOutput?: string;
  time?: string;
  memory?: number;
  tableData?: {
    columns: string[];
    rows: any[][];
    rowCount: number;
  };
  error?: string;
  notice?: string;
}

// SQL Schema Presets for High School Practice
export const SQL_PRESETS: Record<string, { name: string; description: string; sql: string }> = {
  empty: {
    name: '➕ CSDL Trống (Tự tạo từ đầu theo SGK KNTT)',
    description: 'Cơ sở dữ liệu trắng tinh 100%, thích hợp thực hành lệnh CREATE DATABASE & CREATE TABLE',
    sql: '',
  },
  hoc_sinh: {
    name: 'Quản lý Học sinh & Điểm số (SGK Tin 12 - KNTT)',
    description: 'Bảng HOC_SINH và LOP chuẩn SGK Tin học 12 Kết nối tri thức',
    sql: `DROP TABLE IF EXISTS HOC_SINH;
DROP TABLE IF EXISTS LOP;

CREATE TABLE LOP (
    MaLop VARCHAR(10) PRIMARY KEY,
    TenLop VARCHAR(50),
    GVCN VARCHAR(50),
    PhongHoc VARCHAR(20)
);

INSERT INTO LOP VALUES
('12A1', 'Lớp 12A1 Tự nhiên', 'Thầy Nguyễn Văn An', 'P.201'),
('12A2', 'Lớp 12A2 Tin học', 'Cô Trần Thị Mai', 'P.202'),
('12A3', 'Lớp 12A3 Ứng dụng', 'Thầy Lê Hoàng Nam', 'P.203'),
('12A4', 'Lớp 12A4 Chuyên Anh', 'Cô Đỗ Thu Hà', 'P.204');

CREATE TABLE HOC_SINH (
    MaHS VARCHAR(10) PRIMARY KEY,
    HoTen VARCHAR(50),
    GioiTinh VARCHAR(5),
    NgaySinh DATE,
    MaLop VARCHAR(10),
    DiemToan REAL,
    DiemTin REAL,
    DiemAnh REAL,
    FOREIGN KEY (MaLop) REFERENCES LOP(MaLop)
);

INSERT INTO HOC_SINH VALUES
('HS01', 'Nguyễn Đức Anh', 'Nam', '2008-03-15', '12A1', 8.5, 9.5, 8.0),
('HS02', 'Trần Phương Linh', 'Nữ', '2008-07-22', '12A1', 9.0, 9.0, 9.5),
('HS03', 'Lê Tuấn Hưng', 'Nam', '2008-11-05', '12A2', 7.5, 8.5, 7.0),
('HS04', 'Phạm Quỳnh Nga', 'Nữ', '2008-01-19', '12A2', 9.5, 10.0, 9.0),
('HS05', 'Hoàng Gia Bảo', 'Nam', '2008-09-30', '12A3', 6.5, 8.0, 7.5),
('HS06', 'Vũ Thùy Dương', 'Nữ', '2008-05-12', '12A3', 8.0, 8.5, 8.5),
('HS07', 'Lê Khánh Huyền', 'Nữ', '2008-12-01', NULL, 9.0, 9.5, 9.0);`,
  },
  thu_vien: {
    name: 'Thư viện Trường học (SGK Tin 12)',
    description: 'Bảng SACH và PHIEU_MUON quản lý mượn trả sách',
    sql: `DROP TABLE IF EXISTS PHIEU_MUON;
DROP TABLE IF EXISTS SACH;

CREATE TABLE SACH (
    MaSach VARCHAR(10) PRIMARY KEY,
    TenSach VARCHAR(100),
    TacGia VARCHAR(50),
    TheLoai VARCHAR(30),
    NamXB INT,
    SoLuong INT
);

INSERT INTO SACH VALUES
('S01', 'Tin học 12 - Định hướng KHMT', 'Bộ GD&ĐT', 'Sách giáo khoa', 2024, 50),
('S02', 'Tin học 12 - Định hướng ICT', 'Bộ GD&ĐT', 'Sách giáo khoa', 2024, 45),
('S03', 'Cấu trúc dữ liệu và Giải thuật', 'Đỗ Xuân Lôi', 'Tin học', 2022, 20),
('S04', 'Nhập môn Lập trình Web với HTML/CSS', 'Phạm Hữu Cường', 'Lập trình', 2023, 30),
('S05', 'Lập trình Python cơ bản & nâng cao', 'Bùi Việt Hà', 'Lập trình', 2023, 35);

CREATE TABLE PHIEU_MUON (
    MaPhieu VARCHAR(10) PRIMARY KEY,
    MaHS VARCHAR(10),
    MaSach VARCHAR(10),
    NgayMuon DATE,
    NgayHenTra DATE,
    DaTra BOOLEAN
);

INSERT INTO PHIEU_MUON VALUES
('PM01', 'HS01', 'S01', '2025-02-10', '2025-02-24', 1),
('PM02', 'HS02', 'S03', '2025-02-12', '2025-02-26', 0),
('PM03', 'HS04', 'S04', '2025-02-15', '2025-03-01', 0);`,
  },
};

// Default Code Samples
export const CODE_SAMPLES: Record<
  PlaygroundLanguage,
  Array<{ title: string; code: string; secondaryCode?: string; description: string; stdin?: string }>
> = {
  'html-css': [
    {
      title: 'Thẻ Thông tin Học sinh (Profile Card)',
      description: 'Ví dụ bài tập thiết kế thẻ Card đẹp mắt với CSS Flexbox & Bo góc',
      code: `<div class="card">
  <div class="avatar">👨‍🎓</div>
  <h2>Nguyễn Đức Anh</h2>
  <p class="role">Học sinh Lớp 12A1 • ${SCHOOL_NAME}</p>
  <div class="stats">
    <div class="stat-item">
      <span class="label">Điểm Tin:</span>
      <span class="val">9.5</span>
    </div>
    <div class="stat-item">
      <span class="label">Xếp loại:</span>
      <span class="val badge">Xuất sắc</span>
    </div>
  </div>
  <button class="btn" onclick="alert('Chào bạn Đức Anh!')">Xem học bạ số</button>
</div>`,
      secondaryCode: `body {
  font-family: system-ui, -apple-system, sans-serif;
  background: linear-gradient(135deg, #1e293b, #0f172a);
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  margin: 0;
}

.card {
  background: #ffffff;
  border-radius: 20px;
  padding: 30px;
  max-width: 320px;
  text-align: center;
  box-shadow: 0 20px 30px -10px rgba(0,0,0,0.3);
}

.avatar {
  font-size: 56px;
  margin-bottom: 10px;
}

h2 {
  margin: 0 0 5px 0;
  color: #0f172a;
}

.role {
  color: #64748b;
  font-size: 13px;
  margin-bottom: 20px;
}

.stats {
  display: flex;
  justify-content: space-around;
  background: #f8fafc;
  padding: 12px;
  border-radius: 12px;
  margin-bottom: 20px;
}

.stat-item .label {
  display: block;
  font-size: 11px;
  color: #64748b;
}

.stat-item .val {
  font-size: 16px;
  font-weight: bold;
  color: #2563eb;
}

.badge {
  color: #16a34a !important;
}

.btn {
  background: #2563eb;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: bold;
  cursor: pointer;
  width: 100%;
  transition: background 0.2s;
}

.btn:hover {
  background: #1d4ed8;
}`,
    },
    {
      title: 'Bảng Thời khóa biểu (HTML Table)',
      description: 'Định dạng bảng thời khóa biểu với màu xen kẽ',
      code: `<div class="container">
  <h2>THỜI KHÓA BIỂU HỌC TẬP</h2>
  <table>
    <thead>
      <tr>
        <th>Tiết</th>
        <th>Thứ 2</th>
        <th>Thứ 3</th>
        <th>Thứ 4</th>
        <th>Thứ 5</th>
        <th>Thứ 6</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>1</td>
        <td>Chào cờ</td>
        <td>Toán</td>
        <td>Tin học</td>
        <td>Vật lí</td>
        <td>Hóa học</td>
      </tr>
      <tr>
        <td>2</td>
        <td>Toán</td>
        <td>Toán</td>
        <td>Tin học</td>
        <td>Ngữ văn</td>
        <td>Sinh học</td>
      </tr>
      <tr>
        <td>3</td>
        <td>Ngữ văn</td>
        <td>Tiếng Anh</td>
        <td>Toán</td>
        <td>Lịch sử</td>
        <td>Tiếng Anh</td>
      </tr>
    </tbody>
  </table>
</div>`,
      secondaryCode: `body {
  font-family: Arial, sans-serif;
  background-color: #f1f5f9;
  padding: 20px;
}

.container {
  max-width: 600px;
  margin: 0 auto;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
}

h2 {
  text-align: center;
  color: #1e3a8a;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}

th, td {
  border: 1px solid #cbd5e1;
  padding: 10px;
  text-align: center;
  font-size: 13px;
}

th {
  background-color: #3b82f6;
  color: white;
}

tr:nth-child(even) {
  background-color: #f8fafc;
}`,
    },
  ],
  sql: [
    {
      title: '[DDL] Tạo CSDL & Bảng mới (HeidiSQL / KNTT 12)',
      description: 'Mẫu lệnh CREATE DATABASE, USE và CREATE TABLE theo SGK Tin học 12',
      code: `# Bài thực hành tạo CSDL và Bảng (SGK Tin học 12 - Kết nối tri thức)
CREATE DATABASE IF NOT EXISTS QuanLyHocSinh;
USE QuanLyHocSinh;

-- Tạo bảng mới MON_HOC
CREATE TABLE IF NOT EXISTS MON_HOC (
    MaMH VARCHAR(10) PRIMARY KEY,
    TenMH VARCHAR(50) NOT NULL,
    SoTiet INT DEFAULT 35
);

-- Thêm các môn học mẫu
INSERT INTO MON_HOC (MaMH, TenMH, SoTiet) VALUES
('TIN12', 'Tin học 12 - KNTT', 70),
('TOAN12', 'Toán học 12', 105),
('VAN12', 'Ngữ văn 12', 105);

-- Hiển thị dữ liệu vừa tạo
SELECT * FROM MON_HOC;`,
    },
    {
      title: '[DDL] Khám phá CSDL & Bảng (SHOW TABLES & DESCRIBE)',
      description: 'Lệnh đặc trưng của HeidiSQL/MySQL để kiểm tra danh sách bảng và cấu trúc trường',
      code: `# 1. Xem danh sách tất cả các bảng trong CSDL (HeidiSQL)
SHOW TABLES;

-- 2. Xem cấu trúc chi tiết các trường của bảng HOC_SINH
DESCRIBE HOC_SINH;`,
    },
    {
      title: '[DML] Thao tác dữ liệu: Thêm, Sửa, Xóa (INSERT, UPDATE, DELETE)',
      description: 'Chèn học sinh mới, sửa điểm và kiểm tra kết quả ngay lập tức',
      code: `# 1. Thêm một học sinh mới vào bảng HOC_SINH
INSERT INTO HOC_SINH (MaHS, HoTen, GioiTinh, NgaySinh, MaLop, DiemToan, DiemTin, DiemAnh)
VALUES ('HS07', 'Nguyễn Thị Minh Thư', 'Nữ', '2008-06-18', '12A1', 9.0, 9.8, 8.5);

-- 2. Cập nhật sửa điểm Tin học cho học sinh HS07
UPDATE HOC_SINH 
SET DiemTin = 10.0 
WHERE MaHS = 'HS07';

-- 3. Xem bản ghi vừa cập nhật
SELECT MaHS, HoTen, MaLop, DiemToan, DiemTin 
FROM HOC_SINH 
WHERE MaHS = 'HS07';`,
    },
    {
      title: '[DQL] Truy vấn điều kiện & Sắp xếp (SELECT, WHERE, ORDER BY)',
      description: 'Lọc danh sách học sinh có điểm Tin >= 8.5 và xếp hạng theo điểm',
      code: `-- Lọc học sinh có điểm môn Tin từ 8.5 trở lên, xếp giảm dần
SELECT MaHS, HoTen, MaLop, DiemToan, DiemTin 
FROM HOC_SINH 
WHERE DiemTin >= 8.5 
ORDER BY DiemTin DESC;`,
    },
    {
      title: '[DQL] Thống kê, Gom nhóm (COUNT, AVG, GROUP BY, HAVING)',
      description: 'Tính sĩ số, điểm trung bình môn Tin theo từng Lớp',
      code: `-- Thống kê số lượng học sinh và điểm trung bình Tin của từng lớp
SELECT MaLop, 
       COUNT(MaHS) AS SiSo, 
       ROUND(AVG(DiemTin), 2) AS DiemTB_Tin, 
       MAX(DiemTin) AS DiemCaoNhat
FROM HOC_SINH
GROUP BY MaLop
HAVING COUNT(MaHS) >= 2
ORDER BY DiemTB_Tin DESC;`,
    },
    {
      title: '[DQL] Phép nối trong (INNER JOIN)',
      description: 'Chỉ lấy những học sinh đã được xếp vào lớp (khóa ngoại khớp cả 2 bảng)',
      code: `-- INNER JOIN: Chỉ lấy học sinh đã được phân lớp
-- (Học sinh chưa có lớp hoặc Lớp chưa có học sinh sẽ không xuất hiện)
SELECT HOC_SINH.MaHS,
       HOC_SINH.HoTen, 
       LOP.TenLop, 
       LOP.GVCN, 
       HOC_SINH.DiemTin
FROM HOC_SINH
INNER JOIN LOP ON HOC_SINH.MaLop = LOP.MaLop
ORDER BY LOP.TenLop, HOC_SINH.HoTen;`,
    },
    {
      title: '[DQL] Phép nối ngoài bên trái (LEFT JOIN)',
      description: 'Giữ toàn bộ học sinh (kể cả học sinh chưa có lớp, cột lớp sẽ là NULL)',
      code: `-- LEFT JOIN: Giữ lại toàn bộ học sinh ở bảng bên trái (HOC_SINH)
-- Học sinh HS07 chưa được phân lớp (MaLop NULL), các cột TenLop, GVCN sẽ hiển thị NULL
SELECT HOC_SINH.MaHS,
       HOC_SINH.HoTen,
       HOC_SINH.MaLop,
       LOP.TenLop,
       LOP.GVCN
FROM HOC_SINH
LEFT JOIN LOP ON HOC_SINH.MaLop = LOP.MaLop
ORDER BY HOC_SINH.MaHS;`,
    },
    {
      title: '[DQL] Phép nối ngoài bên phải (RIGHT JOIN)',
      description: 'Giữ toàn bộ danh sách lớp (kể cả lớp 12A4 chưa có học sinh, cột học sinh sẽ là NULL)',
      code: `-- RIGHT JOIN: Giữ lại toàn bộ danh sách lớp ở bảng bên phải (LOP)
-- Lớp 12A4 hiện chưa có học sinh nào, các cột MaHS, HoTen sẽ hiển thị NULL
SELECT LOP.MaLop,
       LOP.TenLop,
       LOP.GVCN,
       HOC_SINH.MaHS,
       HOC_SINH.HoTen
FROM HOC_SINH
RIGHT JOIN LOP ON HOC_SINH.MaLop = LOP.MaLop
ORDER BY LOP.MaLop;`,
    },
    {
      title: '[TCL] Quản lý Giao dịch & Hoàn tác an toàn (TRANSACTION, ROLLBACK)',
      description: 'Minh họa an toàn dữ liệu khi có sự cố thao tác nhầm',
      code: `-- Bắt đầu khối giao dịch
BEGIN TRANSACTION;

-- Thao tác xóa thử học sinh HS01
DELETE FROM HOC_SINH WHERE MaHS = 'HS01';

-- Nhận ra thao tác xóa nhầm, lập tức hoàn tác lại (ROLLBACK)!
ROLLBACK;

-- Kiểm tra lại: Bản ghi HS01 vẫn còn nguyên vẹn trong CSDL
SELECT MaHS, HoTen, MaLop FROM HOC_SINH WHERE MaHS = 'HS01';`,
    },
  ],
  python: [
    {
      title: 'Tính tổng các số chẵn trong mảng',
      description: 'Duyệt danh sách và tính tổng phần tử thỏa điều kiện chia hết cho 2',
      code: `# Cho danh sách điểm số / phần tử
a = [12, 7, 18, 5, 24, 9, 30]

# Cách 1: Dùng vòng lặp for
tong_chan = 0
for x in a:
    if x % 2 == 0:
        tong_chan += x

print("Danh sách:", a)
print("Tổng các số chẵn là:", tong_chan)

# Cách 2: List comprehension ngắn gọn
res = [x for x in a if x % 2 == 0]
print("Các số chẵn:", res)
print("Tổng =", sum(res))`,
    },
    {
      title: 'Kiểm tra Số nguyên tố',
      description: 'Định nghĩa hàm kiểm tra số nguyên tố và liệt kê từ 1 đến N',
      code: `def is_prime(n):
    if n < 2:
        return False
    for i in range(2, int(n**0.5) + 1):
        if n % i == 0:
            return False
    return True

n = 50
primes = [x for x in range(2, n + 1) if is_prime(x)]
print(f"Các số nguyên tố từ 2 đến {n}:")
print(primes)
print(f"Tổng cộng có {len(primes)} số nguyên tố.")`,
    },
    {
      title: 'Thuật toán Sắp xếp nổi bọt (Bubble Sort)',
      description: 'Sắp xếp danh sách tăng dần từng bước',
      code: `def bubble_sort(arr):
    n = len(arr)
    a = arr.copy()
    for i in range(n):
        for j in range(0, n - i - 1):
            if a[j] > a[j + 1]:
                a[j], a[j + 1] = a[j + 1], a[j]
    return a

arr = [64, 34, 25, 12, 22, 11, 90]
print("Mảng ban đầu:", arr)
sorted_arr = bubble_sort(arr)
print("Mảng sau khi sắp xếp:", sorted_arr)`,
    },
  ],
  cpp: [
    {
      title: 'Tính tổng số chẵn trong mảng (C++)',
      description: 'Nhập vector và duyệt tính tổng các số chẵn',
      code: `#include <iostream>
#include <vector>

using namespace std;

int main() {
    vector<int> a = {12, 7, 18, 5, 24, 9, 30};
    int tong_chan = 0;

    cout << "Cac so chan trong mang: ";
    for (int x : a) {
        if (x % 2 == 0) {
            cout << x << " ";
            tong_chan += x;
        }
    }
    cout << endl;
    cout << "Tong cac so chan = " << tong_chan << endl;

    return 0;
}`,
    },
    {
      title: 'Đệ quy tính số Fibonacci',
      description: 'Hàm đệ quy in ra dãy Fibonacci',
      code: `#include <iostream>

using namespace std;

long long fibonacci(int n) {
    if (n <= 1) return n;
    long long a = 0, b = 1, c = 0;
    for (int i = 2; i <= n; i++) {
        c = a + b;
        a = b;
        b = c;
    }
    return b;
}

int main() {
    int n = 15;
    cout << "Day " << n << " so Fibonacci dau tien: " << endl;
    for (int i = 0; i < n; i++) {
        cout << fibonacci(i) << " ";
    }
    cout << endl;
    return 0;
}`,
    },
    {
      title: 'Thuật toán Tìm kiếm nhị phân (Binary Search)',
      description: 'Tìm kiếm phần tử trong mảng đã sắp xếp với O(log N)',
      code: `#include <iostream>
#include <vector>

using namespace std;

int binarySearch(const vector<int>& arr, int target) {
    int left = 0, right = arr.size() - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (arr[mid] == target) return mid;
        if (arr[mid] < target) left = mid + 1;
        else right = mid - 1;
    }
    return -1;
}

int main() {
    vector<int> a = {2, 5, 8, 12, 16, 23, 38, 56, 72, 91};
    int target = 23;

    int idx = binarySearch(a, target);
    if (idx != -1) {
        cout << "Tim thay phan tu " << target << " tai vi tri index: " << idx << endl;
    } else {
        cout << "Khong tim thay " << target << " trong mang." << endl;
    }

    return 0;
}`,
    },
  ],
};

// SQL.js in-memory database instance & metadata
let sqlDbInstance: any = null;
let currentDbName: string = 'QuanLyHocSinh';
let currentPresetKey: string = 'hoc_sinh';

export function getActiveDbName(): string {
  return currentDbName;
}

export async function initSqlEngine(presetKey: string = 'hoc_sinh'): Promise<any> {
  // Load sql-wasm.js from CDN if not already loaded
  if (!(window as any).initSqlJs) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Không thể tải thư viện SQL WebAssembly từ CDN'));
      document.body.appendChild(script);
    });
  }

  const initSqlJs = (window as any).initSqlJs;
  const SQL = await initSqlJs({
    locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`,
  });

  sqlDbInstance = new SQL.Database();
  currentPresetKey = presetKey;
  if (presetKey === 'empty') {
    currentDbName = 'CSDL_Moi';
  } else if (presetKey === 'thu_vien') {
    currentDbName = 'ThuVienTruongHoc';
  } else {
    currentDbName = 'QuanLyHocSinh';
  }

  // Populate preset tables
  const preset = SQL_PRESETS[presetKey];
  if (preset && preset.sql && preset.sql.trim()) {
    sqlDbInstance.run(preset.sql);
  }

  return sqlDbInstance;
}

export async function executeSql(query: string, presetKey: string = 'hoc_sinh'): Promise<ExecutionResult> {
  const startTime = performance.now();
  try {
    if (!sqlDbInstance) {
      await initSqlEngine(presetKey);
    }

    const trimmed = query.trim();
    if (!trimmed) {
      return { success: false, error: 'Câu lệnh SQL trống.' };
    }

    // --- HeidiSQL / MySQL Compatibility Preprocessor ---
    // 1. Support MySQL comments starting with '#'
    let processed = trimmed.replace(/(^|\n)\s*#(.*)/g, '$1--$2');

    let notice: string | undefined = undefined;

    // 2. Intercept CREATE DATABASE [IF NOT EXISTS] <name>;
    const createDbRegex = /CREATE\s+(?:DATABASE|SCHEMA)\s+(?:IF\s+NOT\s+EXISTS\s+)?([`"']?[\w]+[`"']?)\s*;?/gi;
    const createDbMatch = createDbRegex.exec(processed);
    if (createDbMatch) {
      const dbName = createDbMatch[1].replace(/[`"']/g, '');
      currentDbName = dbName;
      // Initialize a clean database instance in memory for this database
      const initSqlJs = (window as any).initSqlJs;
      if (initSqlJs) {
        const SQL = await initSqlJs({
          locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`,
        });
        sqlDbInstance = new SQL.Database();
      }
      notice = `⚡ [HeidiSQL / SGK Kết nối tri thức]: Đã khởi tạo cơ sở dữ liệu '${dbName}' thành công trong bộ nhớ tạm (In-Memory). Dữ liệu sẽ tự giải phóng khi bạn đóng trình duyệt.`;
      processed = processed.replace(createDbRegex, '');
    }

    // 3. Intercept USE <name>;
    const useDbRegex = /USE\s+([`"']?[\w]+[`"']?)\s*;?/gi;
    const useDbMatch = useDbRegex.exec(processed);
    if (useDbMatch) {
      const dbName = useDbMatch[1].replace(/[`"']/g, '');
      currentDbName = dbName;
      if (!notice) {
        notice = `ℹ️ [HeidiSQL]: Đang làm việc trên cơ sở dữ liệu '${dbName}'.`;
      }
      processed = processed.replace(useDbRegex, '');
    }

    // 4. Intercept SHOW DATABASES;
    processed = processed.replace(/\bSHOW\s+DATABASES\s*;?/gi, `SELECT '${currentDbName}' AS 'Database';`);

    // 5. Intercept SHOW TABLES;
    processed = processed.replace(
      /\bSHOW\s+TABLES\s*;?/gi,
      `SELECT name AS Tables_in_${currentDbName || 'database'} FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';`
    );

    // 6. Intercept DESCRIBE <table>; or DESC <table>;
    let isDescribe = false;
    let describeTable = '';
    const descRegex = /\b(?:DESCRIBE|DESC)\s+([`"']?[\w]+[`"']?)\s*;?/gi;
    const descMatch = descRegex.exec(processed);
    if (descMatch) {
      isDescribe = true;
      describeTable = descMatch[1].replace(/[`"']/g, '');
      processed = processed.replace(descRegex, `PRAGMA table_info(${describeTable});`);
    }

    // 7. Normalize MySQL AUTO_INCREMENT to SQLite AUTOINCREMENT
    processed = processed.replace(/\bINT(?:EGER)?\s+AUTO_INCREMENT\s+PRIMARY\s+KEY\b/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT');
    processed = processed.replace(/\bINT(?:EGER)?\s+PRIMARY\s+KEY\s+AUTO_INCREMENT\b/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT');
    processed = processed.replace(/\bAUTO_INCREMENT\b/gi, 'AUTOINCREMENT');

    const cleanSql = processed.trim();
    const duration = (performance.now() - startTime).toFixed(1);

    // If query only contained CREATE DATABASE or USE, without additional statements
    if (!cleanSql) {
      return {
        success: true,
        notice,
        stdout: notice
          ? `${notice}\n\n✓ Bạn có thể tiếp tục nhập lệnh CREATE TABLE để tạo các bảng dữ liệu theo bài thực hành.`
          : `Thực thi thành công trong ${duration}ms.`,
        time: `${duration}ms`,
        tableData: { columns: [], rows: [], rowCount: 0 },
      };
    }

    const results = sqlDbInstance.exec(cleanSql);
    const totalDuration = (performance.now() - startTime).toFixed(1);

    if (!results || results.length === 0) {
      return {
        success: true,
        notice,
        stdout: notice
          ? `${notice}\n\n✓ Lệnh DDL/DML đã thực thi thành công trong ${totalDuration}ms.`
          : `Thực thi thành công trong ${totalDuration}ms. (Câu lệnh DDL/DML đã hoàn tất. Bạn có thể dùng SELECT để xem dữ liệu).`,
        time: `${totalDuration}ms`,
        tableData: { columns: [], rows: [], rowCount: 0 },
      };
    }

    // Choose the last result that returned data (usually the final SELECT or DESCRIBE)
    const activeResult = results[results.length - 1];

    // Format DESCRIBE results like HeidiSQL
    if (isDescribe && activeResult.columns.includes('cid') && activeResult.columns.includes('name')) {
      const nameIdx = activeResult.columns.indexOf('name');
      const typeIdx = activeResult.columns.indexOf('type');
      const notnullIdx = activeResult.columns.indexOf('notnull');
      const dfltIdx = activeResult.columns.indexOf('dflt_value');
      const pkIdx = activeResult.columns.indexOf('pk');

      const formattedColumns = ['Field', 'Type', 'Null', 'Key', 'Default'];
      const formattedRows = activeResult.values.map((row: any[]) => [
        row[nameIdx],
        row[typeIdx] || 'TEXT',
        row[notnullIdx] === 1 ? 'NO' : 'YES',
        row[pkIdx] >= 1 ? 'PRI' : '',
        row[dfltIdx] !== null && row[dfltIdx] !== undefined ? String(row[dfltIdx]) : 'NULL',
      ]);

      return {
        success: true,
        notice,
        stdout: notice
          ? `${notice}\n\n✓ Cấu trúc bảng '${describeTable}' (chuẩn HeidiSQL):`
          : `Cấu trúc bảng '${describeTable}' (chuẩn HeidiSQL) - ${totalDuration}ms`,
        time: `${totalDuration}ms`,
        tableData: {
          columns: formattedColumns,
          rows: formattedRows,
          rowCount: formattedRows.length,
        },
      };
    }

    return {
      success: true,
      notice,
      stdout: notice
        ? `${notice}\n\n✓ Trả về ${activeResult.values.length} hàng kết quả trong ${totalDuration}ms.`
        : `Trả về ${activeResult.values.length} hàng trong ${totalDuration}ms.`,
      time: `${totalDuration}ms`,
      tableData: {
        columns: activeResult.columns,
        rows: activeResult.values,
        rowCount: activeResult.values.length,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Lỗi thực thi câu lệnh SQL.',
      time: `${(performance.now() - startTime).toFixed(1)}ms`,
    };
  }
}

// Helpers to safely convert UTF-8 <-> Base64 (supporting Vietnamese & non-ASCII)
function utf8ToBase64(str: string): string {
  try {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } catch {
    return btoa(unescape(encodeURIComponent(str)));
  }
}

function base64ToUtf8(str?: string | null): string {
  if (!str) return '';
  try {
    const binary = atob(str.trim());
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    try {
      return decodeURIComponent(escape(atob(str.trim())));
    } catch {
      return str;
    }
  }
}

// Judge0 Public CE API for C++ and Python (Using Base64 encoding for full Unicode/Vietnamese support)
export async function executeJudge0(
  sourceCode: string,
  language: 'cpp' | 'python',
  stdin: string = ''
): Promise<ExecutionResult> {
  // Judge0 CE language IDs:
  // 54: C++ (GCC 9.2.0)
  // 71: Python (3.8.1)
  const languageId = language === 'cpp' ? 54 : 71;

  try {
    const b64Code = utf8ToBase64(sourceCode);
    const b64Stdin = stdin && stdin.trim() ? utf8ToBase64(stdin) : undefined;

    const response = await fetch('https://ce.judge0.com/submissions?base64_encoded=true&wait=true', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        source_code: b64Code,
        language_id: languageId,
        stdin: b64Stdin,
        cpu_time_limit: 5.0,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      let parsedErr = errText;
      try {
        const jsonErr = JSON.parse(errText);
        parsedErr = jsonErr.error || jsonErr.message || errText;
      } catch {}
      return {
        success: false,
        error: `Lỗi kết nối máy chủ biên dịch: HTTP ${response.status} - ${parsedErr}`,
      };
    }

    let data = await response.json();

    // If Judge0 queued the job, poll up to 10 times (every 600ms) until completion
    let retries = 0;
    while ((data.status?.id === 1 || data.status?.id === 2) && data.token && retries < 12) {
      await new Promise((r) => setTimeout(r, 600));
      try {
        const pollRes = await fetch(`https://ce.judge0.com/submissions/${data.token}?base64_encoded=true`);
        if (pollRes.ok) {
          data = await pollRes.json();
        }
      } catch {}
      retries++;
    }

    // Judge0 status IDs:
    // 3: Accepted
    // 4: Wrong Answer
    // 5: Time Limit Exceeded
    // 6: Compilation Error
    // 7-12: Runtime Error, etc.
    const isSuccess = data.status?.id === 3;
    const compileErr = base64ToUtf8(data.compile_output);
    const stdout = base64ToUtf8(data.stdout);
    const stderr = base64ToUtf8(data.stderr);
    const message = base64ToUtf8(data.message);

    let errorDesc = !isSuccess ? data.status?.description || 'Chạy không thành công' : undefined;
    if (message && errorDesc) {
      errorDesc = `${errorDesc}: ${message}`;
    }

    return {
      success: isSuccess,
      stdout: stdout,
      stderr: stderr,
      compileOutput: compileErr,
      time: data.time ? `${data.time}s` : undefined,
      memory: data.memory,
      error: errorDesc,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Không thể kết nối đến máy chủ thực thi code.',
    };
  }
}

// HTML / CSS Live Preview Helper
export function buildHtmlPreviewDocument(html: string, css: string): string {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <style>
    /* Reset default margin */
    * { box-sizing: border-box; }
    body { margin: 0; padding: 12px; font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; }
    ${css}
  </style>
</head>
<body>
  ${html}
</body>
</html>`;
}
