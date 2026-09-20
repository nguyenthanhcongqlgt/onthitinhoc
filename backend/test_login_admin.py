import requests

url = "https://onthitinhoc.onrender.com/api/auth/login/"
data = {
    "username": "admin",
    "password": "123456"
}
try:
    res = requests.post(url, json=data)
    print(f"Status: {res.status_code}")
    print(f"Response: {res.text}")
except Exception as e:
    print(e)
