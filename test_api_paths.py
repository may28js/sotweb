import requests

base_url = "https://shiguanggushi.xyz"

paths_to_test = [
    "/community-api/Community/channels",
    "/community-api/channels",
    "/api/Community/channels",
    "/community-api/api/Community/channels"
]

print(f"Testing API accessibility on {base_url}...")

for path in paths_to_test:
    url = f"{base_url}{path}"
    try:
        response = requests.get(url, timeout=5)
        print(f"GET {url} -> Status: {response.status_code}")
        if response.status_code == 200:
            print("  [SUCCESS] Found valid endpoint!")
        elif response.status_code == 401:
            print("  [AUTH REQUIRED] Endpoint exists but requires auth (Good sign)")
        elif response.status_code == 404:
            print("  [NOT FOUND] Invalid path")
        else:
            print(f"  [OTHER] {response.text[:100]}")
    except Exception as e:
        print(f"GET {url} -> Error: {e}")
