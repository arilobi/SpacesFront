from flask import Blueprint, request, jsonify
from models import Booking, db, Space, User
from datetime import datetime
import logging
from flask_jwt_extended import jwt_required, get_jwt_identity

booking_bp = Blueprint("booking_bp", __name__)

# Configure logging
logging.basicConfig(level=logging.INFO)

#! ✅ CREATE BOOKING FIRST, THEN INITIATE PAYMENT
@booking_bp.route("/bookings", methods=['POST'])
def create_booking():
    data = request.get_json()
    required_fields = ["user_id", "space_id", "start_time", "end_time", "total_amount"]
    
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    # ✅ Ensure space is still available
    space = Space.query.get(data["space_id"])
    if not space:
        return jsonify({"error": "Space not found"}), 404

    if space.availability is False:
        return jsonify({"error": "Space is already booked"}), 400

    # ✅ Convert start_time and end_time to datetime objects
    try:
        start_time = datetime.fromisoformat(data["start_time"])  # Converts ISO 8601 string to datetime
        end_time = datetime.fromisoformat(data["end_time"])  # Converts ISO 8601 string to datetime
    except ValueError as e:
        return jsonify({"error": f"Invalid date format. Expected format is 'YYYY-MM-DDTHH:MM:SS'. Error: {e}"}), 400

    # ✅ Create a new booking
    new_booking = Booking(
        user_id=data["user_id"],
        space_id=data["space_id"],
        start_time=start_time,
        end_time=end_time,
        total_amount=data["total_amount"],
        status="Pending Payment"  # ✅ Only becomes "Booked" after payment
    )

    db.session.add(new_booking)
    db.session.commit()

    return jsonify({"message": "Booking created successfully. Proceed to payment.", "booking_id": new_booking.id}), 201


# @booking_bp.route("/bookings", methods=['GET'])
# @jwt_required()  # Ensure the user is authenticated
# def fetch_user_bookings():
#     try:
#         current_user_id = get_jwt_identity()  # Get the user ID from the token

#         bookings = Booking.query.filter_by(user_id=current_user_id).all()  # Filter bookings by user

#         bookings_list = [booking.to_dict() for booking in bookings]

#         return jsonify(bookings_list), 200
    
#     except Exception as e:
#         logging.error(f"🚨 Error fetching bookings for user {current_user_id}: {e}")
#         return jsonify({"error": "An error occurred while fetching your bookings"}), 500

#! ✅ FETCH ALL BOOKINGS
@booking_bp.route("/bookings", methods=['GET'])
def fetch_all_bookings():
    try:
        # Fetch all bookings from the database
        bookings = Booking.query.all()
        
        # Convert each booking to a dictionary using the to_dict method
        bookings_list = [booking.to_dict() for booking in bookings]
        
        # Return the list of bookings as a JSON response
        return jsonify(bookings_list), 200
    
    except Exception as e:
        # Log the error for debugging
        logging.error(f"🚨 Error fetching all bookings: {e}")
        
        # Return a 500 Internal Server Error with a user-friendly message
        return jsonify({"error": "An error occurred while fetching bookings"}), 500

@booking_bp.route("/my-bookings", methods=['GET'])
@jwt_required()
def fetch_user_bookings():
    try:
        current_user_id = get_jwt_identity()  # Get the user ID from the token

        # Fetch bookings for the current user
        bookings = Booking.query.filter_by(user_id=current_user_id).all()

        # Convert bookings to a list of dictionaries
        bookings_list = []
        for booking in bookings:
            # Get user and space details for each booking
            user = User.query.get(booking.user_id)  # Assuming User is the model for users
            space = Space.query.get(booking.space_id)  # Assuming Space is the model for spaces

            # Prepare the booking dictionary
            booking_dict = booking.to_dict()

            # Add user name and space name to the dictionary
            booking_dict['user_name'] = user.name if user else "No name available"
            booking_dict['space_name'] = space.name if space else "No space name available"

            bookings_list.append(booking_dict)

        return jsonify({"bookings": bookings_list}), 200
    
    except Exception as e:
        logging.error(f"🚨 Error fetching bookings for user {current_user_id}: {e}")
        return jsonify({"error": "An error occurred while fetching your bookings"}), 500
    
#! ✅ FETCH SINGLE BOOKING
@booking_bp.route("/bookings/<int:booking_id>", methods=['GET'])
def get_booking(booking_id):
    try:
        # Fetch the booking by its ID
        booking = Booking.query.get(booking_id)
        
        # If the booking doesn't exist, return a 404 Not Found error
        if not booking:
            return jsonify({"error": "Booking not found"}), 404
        
        # Convert the booking to a dictionary using the to_dict method
        booking_dict = booking.to_dict()
        
        # Return the booking details as a JSON response
        return jsonify(booking_dict), 200
    
    except Exception as e:
        # Log the error for debugging
        logging.error(f"🚨 Error fetching booking with ID {booking_id}: {e}")
        
        # Return a 500 Internal Server Error with a user-friendly message
        return jsonify({"error": "An error occurred while fetching the booking"}), 500


#! ✅ UPDATE BOOKING STATUS
@booking_bp.route("/bookings/<int:booking_id>/status", methods=['PATCH'])
def update_booking_status(booking_id):
    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({"error": "Booking not found"}), 404

    data = request.get_json()
    if "status" not in data:
        return jsonify({"error": "Missing status field"}), 400

    booking.status = data["status"]
    db.session.commit()

    return jsonify({"message": "Booking status updated successfully"}), 200


#! ✅ DELETE BOOKING
@booking_bp.route("/bookings/<int:booking_id>", methods=['DELETE'])
def delete_booking(booking_id):
    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({"error": "Booking not found"}), 404

    db.session.delete(booking)
    db.session.commit()

    return jsonify({"message": "Booking deleted successfully"}), 200
