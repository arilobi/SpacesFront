# mpesa_helper.py
import requests
import base64
import datetime
from requests.auth import HTTPBasicAuth


#! MPESA Credentials
BUSINESS_SHORTCODE = "174379"
LIPA_NA_MPESA_PASSKEY = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919"
CONSUMER_KEY = "ZGhl8xB3h1GEfUrBUAtjwFGwvNcN7oYn5habGrLy2wXtlY9I"
CONSUMER_SECRET = "KZE6a2ED7ZHionldN0N3YDAAkaIwpq7Y1pAi0blzGJx0rqsZy4G502hsPiB1AH7a"
CALLBACK_URL = "https://ec35-102-0-8-22.ngrok-free.app/callback"

# Function to get access token from M-Pesa API
def get_access_token():
    auth_url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
    try:
        response = requests.get(auth_url, auth=(CONSUMER_KEY, CONSUMER_SECRET), timeout=10)
        response_json = response.json()
        return response_json.get("access_token") if response.status_code == 200 else None
    except requests.exceptions.RequestException as e:
        print("Request failed:", str(e))
        return None

# Function to generate password for STK Push
def generate_password():
    timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    password = f"{BUSINESS_SHORTCODE}{LIPA_NA_MPESA_PASSKEY}{timestamp}"
    return base64.b64encode(password.encode()).decode()

# Function to make STK Push request
def stk_push(phone_number, amount, order_id):
    access_token = get_access_token()
    
    if not access_token:
        return {"error": "Unable to retrieve access token"}

    url = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
    headers = {"Authorization": f"Bearer {access_token}", "Content-Type": "application/json"}

    payload = {
        "BusinessShortCode": BUSINESS_SHORTCODE,
        "Password": generate_password(),
        "Timestamp": datetime.datetime.now().strftime("%Y%m%d%H%M%S"),
        "TransactionType": "CustomerPayBillOnline",
        "Amount": amount,
        "PartyA": phone_number,
        "PartyB": BUSINESS_SHORTCODE,
        "PhoneNumber": phone_number,
        "CallBackURL": CALLBACK_URL,
        "AccountReference": str(order_id),
        "TransactionDesc": "Payment for service"
    }

    response = requests.post(url, json=payload, headers=headers)

    if response.status_code == 200:
        return response.json()
    else:
        return {"error": "STK Push request failed", "details": response.text}


