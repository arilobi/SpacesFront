from flask import jsonify, request, Blueprint, current_app  # ✅ Import current_app
from models import db, User, TokenBlockList  # ✅ Correct import from models
from werkzeug.security import check_password_hash, generate_password_hash
from datetime import datetime, timedelta, timezone
from flask_jwt_extended import (
    create_access_token, jwt_required, get_jwt_identity, get_jwt, decode_token
)
import re
from flask_mail import Message
from app import mail  # ✅ Ensure Flask-Mail is initialized correctly
from app import limiter  # ✅ Import limiter from app.py (Avoid NameError)

auth_bp = Blueprint("auth_bp", __name__)

@auth_bp.route("/googlelogin", methods=["POST"])
def googlelogin():
    data = request.get_json()
    email = data.get("email")
    
    if not email:
        return jsonify({"error": "Email is required"}), 400

    user = User.query.filter_by(email=email).first()

    if not user:
        return jsonify({"error": "No user found with this email"}), 401

    access_token = create_access_token(identity=str(user.id), expires_delta=timedelta(hours=1))

    return jsonify({
        "access_token": access_token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "is_admin": user.role.lower() == "admin"
        }
    }), 200

# ✅ LOGIN ROUTE
@auth_bp.route("/login", methods=["POST"])
def login():
    """Authenticate user and return JWT token."""
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({"error": "Invalid email or password"}), 401

    access_token = create_access_token(identity=str(user.id), expires_delta=timedelta(hours=1))

    return jsonify({
        "access_token": access_token,
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "image": user.image,
            "is_admin": user.role.lower() == "admin"
        }
    }), 200


# ✅ GET CURRENT USER
@auth_bp.route("/current_user", methods=["GET"])
@jwt_required()
def current_user():
    """Get details of the logged-in user."""
    user = User.query.get(get_jwt_identity())
    if not user:
        return jsonify({"error": "User not found"}), 404

    return jsonify({
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "image": user.image,
        "is_admin": user.role.lower() == "admin"
    }), 200


# ✅ LOGOUT ROUTE
@auth_bp.route("/logout", methods=["DELETE"])
@jwt_required()
def logout():
    """Blacklist a token on logout."""
    jti = get_jwt()["jti"]
    db.session.add(TokenBlockList(jti=jti, created_at=datetime.now(timezone.utc)))
    db.session.commit()
    return jsonify({"success": "Logged out successfully"}), 200


# ✅ REGISTER NEW USER
@auth_bp.route("/users", methods=["POST"])
def register_user():
    """Registers a new user."""
    data = request.get_json()
    required_fields = ["name", "email", "password"]
    
    for field in required_fields:
        if not data.get(field):
            return jsonify({"error": f"Missing required field: {field}"}), 400

    name = data["name"].strip()
    email = data["email"].strip().lower()
    password = data["password"]
    role = data.get("role", "Client").strip().capitalize()

    if role not in ["Client", "Admin"]:
        return jsonify({"error": "Invalid role. Allowed roles: Client, Admin"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "Email already in use"}), 409

    new_user = User(name=name, email=email, password=generate_password_hash(password), role=role)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({
        "msg": "User registered successfully.",
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "email": new_user.email,
            "role": new_user.role
        }
    }), 201


# ✅ REQUEST PASSWORD RESET
@auth_bp.route("/request_password_reset", methods=["POST"])
def request_password_reset():
    """Generate a new short password reset token and email it to the user."""
    data = request.get_json()
    email = data.get("email")

    if not email:
        return jsonify({"error": "Email is required"}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"error": "No user found with this email"}), 404

    # ✅ Always generate a new reset token
    user.generate_reset_token()
    db.session.commit()

    try:
        msg = Message(
            subject="Password Reset Request",
            sender=current_app.config["MAIL_DEFAULT_SENDER"],  # ✅ Automatic sender
            recipients=[user.email],  # ✅ The user receives the email
        )
        msg.body = f"""
        Hi {user.name},

        You requested a password reset. Use the following reset code to reset your password:

        🔑 Reset Code: {user.reset_token}

        If you did not request this, please ignore this email.

        Regards,  
        YourApp Team
        """

        from app import mail  # ✅ Import mail inside function to avoid circular imports
        mail.send(msg)
        return jsonify({"msg": "A new password reset email has been sent."}), 200
    except Exception as e:
        print(f"❌ Email sending error: {e}")  # ✅ Debugging
        return jsonify({"error": "Failed to send email", "details": str(e)}), 500


# ✅ RESET PASSWORD (With Token)
@auth_bp.route("/reset_password", methods=["POST"])
@limiter.limit("3 per minute")  # ✅ Prevent brute force attacks
def reset_password():
    """Reset the user's password using the short reset token."""
    
    data = request.get_json()
    reset_token = data.get("reset_token")
    new_password = data.get("new_password")

    if not reset_token or not new_password:
        return jsonify({"error": "Reset token and new password are required"}), 400

    user = User.query.filter_by(reset_token=reset_token).first()
    if not user:
        return jsonify({"error": "Invalid or expired reset token"}), 401

    # ✅ Validate password strength
    if not re.match(r"^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$", new_password):
        return jsonify({"error": "Password must be at least 6 characters long, "
                                 "contain one uppercase letter, one number, and one special character (@$!%*?&)."}), 400

    # ✅ Hash the new password
    user.password = generate_password_hash(new_password, method="pbkdf2:sha256")
    
    # ✅ Clear the reset token after successful reset
    user.reset_token = None

    db.session.commit()

    return jsonify({"msg": "Password reset successfully. You can now log in with your new password."}), 200