import requests
import json

url = "https://shiguanggushi.xyz/api/Auth/login"
headers = {
    "Content-Type": "application/json"
}
data = {
    "username": "admin",
    "password": "123456"
}

try:
    print(f"Sending POST to {url}...")
    response = requests.post(url, json=data, headers=headers)
    
    print(f"Status Code: {response.status_code}")
    print(f"Response Headers: {response.headers}")
    print(f"Response Body: {response.text}")
    
    if response.status_code == 200:
        print("Login SUCCESS!")
    else:
        print("Login FAILED!")

except Exception as e:
    print(f"Error: {e}")
