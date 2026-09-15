import requests

def test_api():
    login_res = requests.post('http://127.0.0.1:8000/api/auth/login/', json={'username': 'admin', 'password': 'admin123'})
    token = login_res.json().get('access')
    assert token, "Could not log in"

    sample_text = """[DE_THI] DE THI TIN HOC HSG THPT QUAT LAM
Phan 1. TRAC NGHIEM
Cau 1. Cho doan chuong trinh Python:
*A. 20   B. 22   C. 18   D. 15

PHAN II. Cau trac nghiem dung sai.
Cau 2. Xet menh de:
*a)[0,NB] Dung
b)[1,TH] Sai
"""

    preview_res = requests.post(
        'http://127.0.0.1:8000/api/exams/import-docx/',
        json={'action': 'preview', 'text': sample_text},
        headers={'Authorization': f'Bearer {token}'}
    )

    print("HTTP Status:", preview_res.status_code)
    data = preview_res.json()
    print("Parsed Questions:", len(data.get('questions', [])))
    assert preview_res.status_code == 200, f"Expected 200, got {preview_res.status_code}"
    print("[SUCCESS] API Live Preview Backend hoat dong hoan hao 100%!")

if __name__ == '__main__':
    test_api()
