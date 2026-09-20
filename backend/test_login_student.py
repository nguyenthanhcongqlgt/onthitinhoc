import requests
import json

url = "https://onthitinhoc.onrender.com/api/auth/login/"
data = {
    "username": "hsg_dung",
    "password": "password" # just a guess
}
try:
    res = requests.post(url, json=data)
    print(f"Status: {res.status_code}")
    print(f"Response: {res.text}")
except Exception as e:
    print(e)
