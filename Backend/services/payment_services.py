import requests
import base64
import datetime
import re
from utils.mpesa_helper import stk_push

# Validate Phone Number (Safaricom Format)
def validate_phone_number(phone_number):
    return re.match(r"^2547[0-9]{8}$", phone_number)

# Validate National ID (Basic Check)
def validate_id_number(id_number):
    return id_number.isdigit() and len(id_number) in [7, 8]

# Process Payment
def process_payment(phone_number, id_number, amount, order_id):
    if not validate_phone_number(phone_number):
        return {"error": "Invalid phone number. Use 2541XXXXXXXX format."}
    if not validate_id_number(id_number):
        return {"error": "Invalid ID number."}
    
    response = stk_push(phone_number, amount, order_id)
    return response
