from flask import Blueprint, request, jsonify, current_app
from models import User, db
from werkzeug.security import generate_password_hash
import re  
from flask_jwt_extended import jwt_required, get_jwt_identity  
from utils.cloudinary_images import upload_image
import logging
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address


user_bp = Blueprint("user_bp", __name__)

PASSWORD_REGEX = r"^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$"
EMAIL_REGEX = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"

logging.basicConfig(level=logging.INFO)

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100 per minute"]  # ⬆️ Global limit for all endpoints
)

def init_limiter(app):
    limiter.init_app(app)

def is_admin():
    """Check if the current user is an admin (cached result)."""
    current_user_id = get_jwt_identity()
    user = db.session.get(User, current_user_id)  # ✅ More efficient query
    return user and user.role.lower() == 'admin'

#! ✅ CREATE USER
@user_bp.route("/users", methods=['POST'])
def create_user():
    try:
        data = request.get_json()

        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        role = data.get('role', 'Client').capitalize()

        if role not in ["Client", "Admin"]:
            return jsonify({"error": "Invalid role. Allowed roles: 'Client', 'Admin'"}), 400

        if not all([name, email, password]):
            return jsonify({"error": "Name, email, and password are required"}), 400

        if not re.match(EMAIL_REGEX, email) or not re.match(PASSWORD_REGEX, password):
            return jsonify({
                "error": "Invalid email or password format. Password must be at least 6 characters long, contain one uppercase letter, one number, and one special character (@$!%*?&)"
            }), 400

        if User.query.filter_by(email=email).first():
            return jsonify({"error": "Email already in use"}), 409

        image = upload_image(data.get('image')) if data.get('image') else "default.jpg"
        hashed_password = generate_password_hash(password)

        new_user = User(
            name=name,
            email=email,
            password=hashed_password,
            image=image,
            role=role
        )

        db.session.add(new_user)
        db.session.commit()

        return jsonify({
            "message": "User created successfully",
            "user": {
                "id": new_user.id,
                "name": new_user.name,
                "email": new_user.email,
                "role": new_user.role,
                "image": new_user.image,
                "created_at": new_user.created_at
            }
        }), 201

    except Exception as e:
        logging.error(f"❌ Error creating user: {e}")
        return jsonify({"error": str(e)}), 500

# fetch user by ID
@user_bp.route("/users/<int:id>", methods=['GET'])
def fetch_user(id):
    # Fetch the user from the database
    user = User.query.get(id)

    # Check if the user exists
    if not user:
        return jsonify({"error": "User with ID not found"}), 404

    # Prepare the response data
    user_data = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "image": user.image,
        "created_at": user.created_at,
        "updated_at": user.updated_at,  # Include updated_at if available
        "bookings": [
            {
                "id": booking.id,
                "space_id": booking.space_id,
                "start_time": booking.start_time,
                "end_time": booking.end_time,
                "total_amount": booking.total_amount,
                "status": booking.status,
                "space_details": {
                    "id": booking.space.id,
                    "name": booking.space.name,
                    "location": booking.space.location,
                    "price_per_hour": booking.space.price_per_hour,
                    "price_per_day": booking.space.price_per_day,
                    "availability": booking.space.availability,
                    "images": booking.space.images,
                } if booking.space else None,
            }
            for booking in user.bookings
        ],
    }

    return jsonify(user_data), 200 

#! ✅ FETCH ALL USERS (Admin Only) with Pagination
@user_bp.route("/users", methods=['GET'])
@limiter.limit("50 per minute")  # ✅ Rate limit per user/IP
@jwt_required()
def fetch_all_users():
    if not is_admin():
        return jsonify({"error": "Only admins can access this resource"}), 403

    # ✅ Prevent too large values for pagination
    page = request.args.get('page', 1, type=int)
    per_page = min(request.args.get('per_page', 10, type=int), 50)  # ⬇️ Limit max per_page to 50

    paginated_users = User.query.paginate(page=page, per_page=per_page, error_out=False)

    users_list = [{
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "image": user.image,
        "created_at": user.created_at
    } for user in paginated_users.items]

    return jsonify({
        "users": users_list,
        "total_users": paginated_users.total,
        "total_pages": paginated_users.pages,
        "current_page": paginated_users.page,
        "per_page": paginated_users.per_page,
        "next_page": paginated_users.next_num if paginated_users.has_next else None,
        "prev_page": paginated_users.prev_num if paginated_users.has_prev else None
    }), 200

#! ✅ UPDATE USER (Self or Admin Only)
@user_bp.route("/users/<int:id>", methods=['PATCH'])  
def update_user(id):
    try:
        user = User.query.get(id)

        if not user:
            return jsonify({"error": "User not found"}), 404

        # Remove token-based checks (previously checking for logged-in user)
        # If the backend requires some form of session management, you may need to adjust the logic accordingly.

        data = request.get_json()
        name = data.get("name")
        email = data.get("email")
        password = data.get("password")

        if name:
            if len(name) < 3:
                return jsonify({"error": "Name must be at least 3 characters long"}), 400
            user.name = name.strip()

        if email:
            if not re.match(EMAIL_REGEX, email):
                return jsonify({"error": "Invalid email format"}), 400

            existing_user = User.query.filter_by(email=email).filter(User.id != id).first()
            if existing_user:
                return jsonify({"error": "Email already in use"}), 409

            user.email = email.strip()

        if password:
            if not re.match(PASSWORD_REGEX, password):
                return jsonify({
                    "error": "Password must be at least 6 characters long, contain one uppercase letter, one number, and one special character (@$!%*?&)"
                }), 400
            
            user.password = generate_password_hash(password)

        db.session.commit()

        return jsonify({
            "message": "User updated successfully",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email
            }
        }), 200

    except Exception as e:
        logging.error(f"❌ Error updating user {id}: {e}")
        return jsonify({"error": str(e)}), 500

#! ✅ DELETE USER (Admin Only)
@user_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    try:
        user = User.query.get(user_id)

        if not user:
            return jsonify({"error": "User not found"}), 404

        if not is_admin():
            return jsonify({"error": "Only admins can delete users"}), 403

        db.session.delete(user)
        db.session.commit()

        return jsonify({"message": "User deleted successfully"}), 200

    except Exception as e:
        logging.error(f"❌ Error deleting user {user_id}: {e}")
        return jsonify({"error": str(e)}), 500
