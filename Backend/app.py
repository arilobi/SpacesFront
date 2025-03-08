import os
import json
import pathlib
import random
import string
import logging
import cloudinary
import cloudinary.uploader
from flask import Flask, redirect, url_for, jsonify, request, session
from flask_migrate import Migrate
from werkzeug.security import generate_password_hash
from flask_jwt_extended import JWTManager, jwt_required, get_jwt_identity
from flask_cors import CORS
from flask_mail import Mail, Message
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from google_auth_oauthlib.flow import Flow
from googleapiclient.discovery import build
from dotenv import load_dotenv
from models import db, User, Space, Booking, Payment, Agreement, TokenBlockList  
from redis import Redis
from utils.cloudinary_images import upload_image



# ✅ Load environment variables
load_dotenv()

# ✅ Initialize Flask App
app = Flask(__name__)

# ✅ Enable CORS
CORS(app)

# ✅ Security Configurations
app.secret_key = os.getenv("SECRET_KEY", "supersecretkey")
os.environ["OAUTHLIB_INSECURE_TRANSPORT"] = "1"  # Allow HTTP for development

# ✅ Database Configuration
app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv("DATABASE_URL", "sqlite:///rental.db")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# ✅ JWT Configuration
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "supersecretkey")
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 900  # 15 minutes
jwt = JWTManager(app)

# ✅ Initialize Database
db.init_app(app)
migrate = Migrate(app, db)

# ✅ Initialize Flask-Mail (For Password Resets)
app.config["MAIL_SERVER"] = os.getenv("MAIL_SERVER", "smtp.gmail.com")
app.config["MAIL_PORT"] = int(os.getenv("MAIL_PORT", 587))
app.config["MAIL_USE_TLS"] = True
app.config["MAIL_USERNAME"] = os.getenv("MAIL_USERNAME")
app.config["MAIL_PASSWORD"] = os.getenv("MAIL_PASSWORD")
app.config["MAIL_DEFAULT_SENDER"] = os.getenv("MAIL_DEFAULT_SENDER", "noreply@yourapp.com")

mail = Mail(app)

# ✅ Initialize Rate Limiter (Prevents brute force attacks)
limiter = Limiter(
    get_remote_address, 
    app=app, 
    default_limits=["100 per hour", "10 per minute"]
)

# ✅ Configure Logging
logging.basicConfig(level=logging.INFO)

# ✅ Function to generate a strong random password
def generate_random_password(length=12):
    characters = string.ascii_letters + string.digits + "!@#$%^&*()"
    return ''.join(random.choice(characters) for _ in range(length))

# ✅ Ensure `client_secret.json` Exists and is Valid
client_secrets_file = os.path.join(pathlib.Path(__file__).parent, "client_secret.json")

if not os.path.exists(client_secrets_file):
    raise FileNotFoundError("❌ Error: Google OAuth client_secret.json is missing! Please add it to your project folder.")

try:
    with open(client_secrets_file, "r") as f:
        json.load(f)  # Test JSON format
except json.JSONDecodeError:
    raise ValueError("❌ Error: client_secret.json is not a valid JSON file!")

@app.route("/upload-image", methods=["POST"])
@jwt_required()
def upload_image():
    try:
        print("🟢 Received image upload request")
        print(f"🟢 Request Headers: {request.headers}")  # Debugging
        print(f"🟢 Request Files: {request.files}")  # Debugging
        
        if "file" not in request.files:
            print("⛔ No file provided in request")
            return jsonify({"error": "No file provided"}), 400

        file = request.files["file"]
        print(f"📂 File Received: {file.filename}")

        # Upload to Cloudinary
        upload_result = cloudinary.uploader.upload(file, folder="profile_pictures")
        image_url = upload_result["secure_url"]
        print(f"✅ Cloudinary Upload Success: {image_url}")

        # Get the current user ID from JWT
        current_user_id = get_jwt_identity()
        print(f"🔍 Current User ID: {current_user_id}")

        user = User.query.get(current_user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        user.image = image_url
        db.session.commit()
        print(f"✅ User {user.id} profile image updated in DB")

        return jsonify({"image_url": image_url, "message": "Image uploaded and saved successfully!"}), 200
    except Exception as e:
        print(f"❌ Error Uploading Image: {e}")
        return jsonify({"error": str(e)}), 500



# ✅ Google Login Authorization Route
@app.route("/authorize_google")
def authorize_google():
    """Initiates Google OAuth login."""
    flow = Flow.from_client_secrets_file(
        client_secrets_file=client_secrets_file,
        scopes=[
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/userinfo.email",
            "openid"
        ],
        redirect_uri="http://127.0.0.1:5000/google_login/callback"
    )
    
    authorization_url, state = flow.authorization_url()
    session["state"] = state
    return redirect(authorization_url)

@app.route("/google_login/callback")
def google_callback():
    """Handles Google OAuth login and user creation."""
    flow = Flow.from_client_secrets_file(
        client_secrets_file=client_secrets_file,
        scopes=[
            "https://www.googleapis.com/auth/userinfo.profile",
            "https://www.googleapis.com/auth/userinfo.email",
            "openid"
        ],
        redirect_uri="http://127.0.0.1:5000/google_login/callback"
    )

    flow.fetch_token(authorization_response=request.url)
    credentials = flow.credentials
    session["credentials"] = credentials_to_dict(credentials)

    user_info = get_user_info(credentials)

    user = User.query.filter_by(email=user_info["email"]).first()
    if not user:
        # Generate random secure password
        hashed_password = generate_password_hash(generate_random_password())

        user = User(
            name=user_info["name"], 
            email=user_info["email"], 
            password=hashed_password
        )
        db.session.add(user)
        db.session.commit()

    session["user_info"] = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role
    }

    return redirect(f"http://localhost:5174/login")

def credentials_to_dict(credentials):
    """Converts credentials to a dictionary."""
    return {
        "token": credentials.token,
        "refresh_token": credentials.refresh_token,
        "token_uri": credentials.token_uri,
        "client_id": credentials.client_id,
        "client_secret": credentials.client_secret,
        "scopes": credentials.scopes
    }

def get_user_info(credentials):
    """Fetches user info from Google API."""
    service = build("oauth2", "v2", credentials=credentials)
    user_info = service.userinfo().get().execute()
    return {
        "email": user_info["email"],
        "name": user_info["name"],
        "picture": user_info["picture"]
      
    }

#  End of google auth

# ✅ Mpesa Payment Callback Route (Debugging)
@app.route("/callback", methods=["POST"])
def mpesa_callback():
  """Handles Mpesa payment callbacks."""
  data = request.get_json()
  logging.info(f"📩 Received Mpesa Callback: {data}")
  return jsonify({"message": "Callback received"}), 200



# ✅ Register Blueprints
from views.user_routes import user_bp
from views.space_routes import space_bp
from views.bookings import booking_bp
from views.payments_routes import payment_bp
from views.agreement_routes import agreement_bp
from views.auths import auth_bp

app.register_blueprint(user_bp)
app.register_blueprint(space_bp)
app.register_blueprint(booking_bp)
app.register_blueprint(payment_bp)
app.register_blueprint(agreement_bp)
app.register_blueprint(auth_bp)

# ✅ Create Database Tables
with app.app_context():
    db.create_all()

# ✅ Run Flask App
if __name__ == "__main__":
    app.run(debug=True)
