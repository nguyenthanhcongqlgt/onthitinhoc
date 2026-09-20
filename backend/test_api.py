import requests

url = "https://onthitinhoc.onrender.com/api/auth/register/"
data = {
    "username": "admin",
    "password": "somepassword123",
    "email": "admin@example.com",
    "full_name": "Admin",
    "role": "STUDENT"
}

res = requests.post(url, json=data)
print(f"Status Code: {res.status_code}")
print(f"Response: {res.content}")
