from utils.mpesa_helper import stk_push

print("Starting STK Push Test...")  # appear

phone = "254707645624"
amount = 10
order_id = "ORDER123"

print(f"Calling stk_push() with {phone}, {amount}, {order_id}...")  # Debug print

response = stk_push(phone, amount, order_id)  # Calling STK Push

print("Response from MPesa:", response)  # Should print API response
