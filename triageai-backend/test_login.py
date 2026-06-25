import requests

# Test clinic login
url = "http://localhost:8080/api/auth/clinic/login"
data = {
    "username": "shreenh11",
    "password": "clinic123"
}
try:
    r = requests.post(url, json=data)
    print("Clinic Login status code:", r.status_code)
    print("Clinic Login response:", r.json())
    token = r.json().get("token")
    
    # Fetch history
    h_url = "http://localhost:8080/api/clinic/history"
    headers = {
        "Authorization": f"Bearer {token}"
    }
    hr = requests.get(h_url, headers=headers)
    print("Clinic History status code:", hr.status_code)
    print("Clinic History response length:", len(hr.json()))
    
    # Let's print the entry for DOC1003
    doc3_entries = [e for e in hr.json() if e.get("doctorId") == "DOC1003"]
    print("Entries for DOC1003:", doc3_entries)
except Exception as e:
    print("Error:", e)
