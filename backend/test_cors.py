import requests

url = "https://onthitinhoc.onrender.com/api/auth/login/"
headers = {
    "Origin": "http://localhost:5173",
    "Access-Control-Request-Method": "POST"
}

res = requests.options(url, headers=headers)
print(f"Status Code: {res.status_code}")
print(f"CORS Headers: {res.headers.get('Access-Control-Allow-Origin')}")
