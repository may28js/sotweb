import urllib.request
import urllib.error
import json

url = "https://shiguanggushi.xyz/api/Auth/login"
data = {
    "username": "admin",
    "password": "123456"
}
json_data = json.dumps(data).encode('utf-8')

req = urllib.request.Request(url, data=json_data, method='POST')
req.add_header('Content-Type', 'application/json')
req.add_header('User-Agent', 'Mozilla/5.0')

print(f"Sending POST to {url}...")

try:
    with urllib.request.urlopen(req) as response:
        print(f"Status Code: {response.status}")
        print(f"Response: {response.read().decode('utf-8')}")
        print("Login SUCCESS!")
except urllib.error.HTTPError as e:
    print(f"HTTP Error: {e.code} {e.reason}")
    print(f"Response: {e.read().decode('utf-8')}")
except Exception as e:
    print(f"Error: {e}")
