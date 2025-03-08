from flask import Blueprint, request, jsonify
from models import Payment, Booking, db, Space
from datetime import datetime
import uuid
from utils.mpesa_helper import stk_push
import logging
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_cors import cross_origin


payment_bp = Blueprint("payment_bp", __name__)



# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

#! CREATE PAYMENT
@payment_bp.route("/payments", methods=['POST'])
def create_payment():
    # Generate a unique MPESA transaction ID
    unique_mpesa_id = str(uuid.uuid4())[:10]
    data = request.get_json()

    required_fields = ["booking_id", "user_id", "amount", "phone_number"]  
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    new_payment = Payment(
        booking_id=data["booking_id"],
        user_id=data["user_id"],
        amount=data["amount"],
        mpesa_transaction_id=unique_mpesa_id,  # Use generated id
        phone_number=data["phone_number"],
        status=data.get("status", "Processing")  # Default status is processing 
    )

    db.session.add(new_payment)
    db.session.commit()

    return jsonify({"message": "Payment created successfully", "mpesa_transaction_id": unique_mpesa_id}), 201

# Utility function to generate unique transaction ID
def generate_transaction_id():
    return str(uuid.uuid4())  # Generate a unique transaction ID

# @payment_bp.route("/stkpush", methods=["POST"])
# def initiate_stk_push():
#     data = request.get_json()

#     # Log the incoming payload
#     print("Received STK Push Payload:", data)

#     # Ensure required fields exist
#     required_fields = ["phone_number", "amount", "order_id"]
#     if not all(field in data for field in required_fields):
#         return jsonify({"error": "Missing required fields"}), 400

#     phone_number = data["phone_number"]
#     amount = data["amount"]
#     order_id = data["order_id"]

#     # Generate a unique transaction ID
#     transaction_id = generate_transaction_id()

#     try:
#         # Call stk_push function from mpesa_helper.py
#         response = stk_push(phone_number, amount, order_id)
#         return jsonify(response), 200
#     except Exception as e:
#         print("STK Push Error:", str(e))  # Log the error
#         return jsonify({"error": str(e)}), 500

@payment_bp.route("/stkpush", methods=["POST"])
def initiate_stk_push():
    data = request.get_json()
    logger.info("📩 Received STK Push Payload: %s", data)

    if not data or not all(field in data for field in ["phone_number", "amount", "order_id"]):
        logger.error("❌ Missing required fields in STK push request")
        return jsonify({"error": "Missing required fields"}), 400

    phone_number = data["phone_number"]
    amount = data["amount"]
    order_id = data["order_id"]

    try:
        # ✅ Call STK Push function
        response = stk_push(phone_number, amount, order_id)
        logger.info("✅ STK Push Response: %s", response)  # Log full response

        # ✅ If response is missing transaction ID, return CheckoutRequestID instead
        if not response or "CheckoutRequestID" not in response:
            logger.error("❌ STK Push Response missing CheckoutRequestID: %s", response)
            return jsonify({"error": "Invalid STK Push response. No CheckoutRequestID received."}), 500

        return jsonify({
            "message": "STK Push request sent successfully",
            "checkout_request_id": response["CheckoutRequestID"]  # ✅ Return CheckoutRequestID
        }), 200
    except Exception as e:
        logger.error("❌ STK Push Error: %s", str(e))
        return jsonify({"error": str(e)}), 500


    
# # !M-pesa Callback route
# @payment_bp.route('/callback', methods=['POST'])
# def handle_callback():
#     callback_data = request.json

#     # Log the callback data for debugging
#     logger.info("Received M-Pesa Callback Data: %s", callback_data)

#     # Validate callback data
#     if not callback_data or 'Body' not in callback_data or 'stkCallback' not in callback_data['Body']:
#         logger.error("Invalid callback data received")
#         return jsonify({"ResultCode": 1, "ResultDesc": "Invalid callback data"}), 400

#     # Extract relevant data
#     stk_callback = callback_data['Body']['stkCallback']
#     result_code = stk_callback.get('ResultCode')
#     checkout_request_id = stk_callback.get('CheckoutRequestID')  # Use CheckoutRequestID as order_id

#     if result_code != 0:
#         # If the result code is not 0, there was an error
#         error_message = stk_callback.get('ResultDesc', 'Payment failed')
#         logger.error(f"Payment failed for order {checkout_request_id}: {error_message}")
#         return jsonify({"ResultCode": result_code, "ResultDesc": error_message})

#     # If the result code is 0, the transaction was successful
#     callback_metadata = stk_callback.get('CallbackMetadata', {})
#     amount = None
#     phone_number = None

#     if 'Item' in callback_metadata:
#         for item in callback_metadata['Item']:
#             if item.get('Name') == 'Amount':
#                 amount = item.get('Value')
#             elif item.get('Name') == 'PhoneNumber':
#                 phone_number = item.get('Value')

#     # Log successful payment
#     logger.info(f"✅ Payment successful for order {checkout_request_id}. Amount: {amount}, Phone: {phone_number}")

#     # ✅ Find the payment record using the M-Pesa transaction ID
#     payment = Payment.query.filter_by(mpesa_transaction_id=checkout_request_id).first()
#     if not payment:
#         logger.error(f"🚨 No payment found with transaction ID {checkout_request_id}")
#         return jsonify({"ResultCode": 1, "ResultDesc": "Payment record not found"}), 404

#     # ✅ Update payment status to "Confirmed"
#     payment.status = "Confirmed"
#     db.session.commit()

#     # ✅ Find the associated booking and update its status
#     booking = Booking.query.get(payment.booking_id)
#     if booking:
#         booking.status = "Booked"
#         db.session.commit()
#         logger.info(f"✅ Booking ID {booking.id} marked as Booked!")

#         # ✅ Find the associated space and update availability
#         space = Space.query.get(booking.space_id)
#         if space:
#             space.availability = False  # Mark space as unavailable (Booked)
#             db.session.commit()
#             logger.info(f"🚀 Space ID {space.id} marked as Booked!")

#     return jsonify({"ResultCode": 0, "ResultDesc": "Payment received, booking confirmed, and space marked as booked."}), 200

# ! ✅ HANDLE MPESA CALLBACK
@payment_bp.route('/callback', methods=['POST'])
def handle_callback():
    callback_data = request.json
    logger.info(f"Received M-Pesa Callback Data: {callback_data}")

    if not callback_data or 'Body' not in callback_data or 'stkCallback' not in callback_data['Body']:
        logger.error("Invalid callback data received")
        return jsonify({"ResultCode": 1, "ResultDesc": "Invalid callback data"}), 400

    stk_callback = callback_data['Body']['stkCallback']
    result_code = stk_callback.get('ResultCode')
    checkout_request_id = stk_callback.get('CheckoutRequestID')

    if result_code != 0:
        error_message = stk_callback.get('ResultDesc', 'Payment failed')
        logger.error(f"Payment failed for Order {checkout_request_id}: {error_message}")
        return jsonify({"ResultCode": result_code, "ResultDesc": error_message})

    callback_metadata = stk_callback.get('CallbackMetadata', {})
    transaction_id = None

    for item in callback_metadata.get('Item', []):
        if item.get('Name') == 'MpesaReceiptNumber':
            transaction_id = item.get('Value')

    if not transaction_id:
        logger.error(f"🚨 No MpesaReceiptNumber found in callback for Order {checkout_request_id}")
        return jsonify({"ResultCode": 1, "ResultDesc": "No transaction ID received"}), 400

    logger.info(f"✅ Payment successful. Order {checkout_request_id}, Transaction ID: {transaction_id}")

    # ✅ Find and update the payment record
    payment = Payment.query.filter_by(mpesa_transaction_id=checkout_request_id).first()
    if not payment:
        logger.error(f"🚨 No payment record found with transaction ID {checkout_request_id}")
        return jsonify({"ResultCode": 1, "ResultDesc": "Payment record not found"}), 404

    payment.status = "Confirmed"
    payment.mpesa_transaction_id = transaction_id
    db.session.commit()

    # ✅ Find and update booking & space
    booking = Booking.query.get(payment.booking_id)
    if booking:
        booking.status = "Booked"  # ✅ Change status after payment
        db.session.commit()

        space = Space.query.get(booking.space_id)
        if space:
            space.availability = False  # ✅ Mark as booked only after payment
            db.session.commit()

    return jsonify({"ResultCode": 0, "ResultDesc": "Payment received, booking confirmed, and space marked as booked."}), 200
#! FETCH SINGLE PAYMENT
@payment_bp.route("/payments/<int:id>", methods=['GET'])
def fetch_payment(id):
    payment = Payment.query.get(id)
    if not payment:
        return jsonify({"error": "Payment not found"}), 404
    return jsonify(payment.to_dict()), 200

#! FETCH ALL PAYMENTS
@payment_bp.route("/payments", methods=['GET'])
def fetch_all_payments():
    payments = Payment.query.all()
    payments_list = [payment.to_dict() for payment in payments]
    return jsonify({"payments": payments_list}), 200

#! UPDATE PAYMENT
@payment_bp.route("/payments/<int:id>", methods=['PATCH'])
def update_payment(id):
    payment = Payment.query.get(id)
    if not payment:
        return jsonify({"error": "Payment not found"}), 404

    data = request.get_json()
    for key, value in data.items():
        if hasattr(payment, key):
            setattr(payment, key, value)

    payment.timestamp = datetime.utcnow()  # Update timestamp on edit
    db.session.commit()

    return jsonify(payment.to_dict()), 200

#! DELETE PAYMENT
@payment_bp.route('/payments/<int:id>', methods=['DELETE'])
@jwt_required()  # Require authentication
def delete_payment(id):
    try:
        # Debugging: Log token received
        auth_header = request.headers.get("Authorization")
        print("Received Authorization Header:", auth_header)

        current_user_id = get_jwt_identity()
        print("Decoded JWT User ID:", current_user_id)

        # Fetch payment
        payment = Payment.query.get(id)

        if not payment:
            return jsonify({"error": "Payment not found"}), 404

        # Ensure the user owns the payment OR is an admin
        if payment.user_id != current_user_id:
            return jsonify({"error": "Unauthorized to delete this payment"}), 403

        # Delete the payment
        db.session.delete(payment)
        db.session.commit()

        return jsonify({"message": "Payment deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to delete payment", "details": str(e)}), 500