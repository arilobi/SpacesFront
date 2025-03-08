from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import random
import string

db = SQLAlchemy()  #! Initialize DB

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False, index=True)
    password = db.Column(db.String(200), nullable=False)
    role = db.Column(db.String(50), nullable=False, default="Client")  
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    image = db.Column(db.String(200), nullable=True, default="default.jpg")
    reset_token = db.Column(db.String(8), unique=True, nullable=True)

    def generate_reset_token(self):
        """Generate a unique 8-character reset token and update it in the database."""
        self.reset_token = ''.join(random.choices(string.ascii_letters + string.digits, k=8))
        db.session.commit()


    bookings = db.relationship('Booking', backref='user', lazy=True)
    payments = db.relationship('Payment', backref='user', lazy=True)
    agreements = db.relationship('Agreement', backref='user', lazy=True)

class Space(db.Model):
    __tablename__ = 'spaces'  

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    location = db.Column(db.String(200), nullable=False, index=True)
    price_per_hour = db.Column(db.Float, nullable=False)
    price_per_day = db.Column(db.Float, nullable=False)
    availability = db.Column(db.String(500), nullable=False)  #! JSON String of availability slots
    images = db.Column(db.String(500), nullable=True)  #! Comma-separated image URLs

    #! Relationships
    bookings = db.relationship('Booking', backref='space', lazy=True)  #! Multiple bookings allowed


class Booking(db.Model):
    __tablename__ = 'bookings'

    id = db.Column(db.Integer, primary_key=True)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    total_amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(50), default="Pending Payment")  # Default status

    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    space_id = db.Column(db.Integer, db.ForeignKey('spaces.id'), nullable=False)

    payment = db.relationship('Payment', backref='booking', uselist=False)

    def to_dict(self):
        """Converts the Booking object into a dictionary."""
        return {
            "id": self.id,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "total_amount": self.total_amount,
            "status": self.status,
            "user_id": self.user_id,
            "space_id": self.space_id,
            "payment": self.payment.to_dict() if self.payment else None,  # Handle missing payment
        }
    
class Agreement(db.Model):
    __tablename__ = 'agreements'

    id = db.Column(db.Integer, primary_key=True)
    terms = db.Column(db.Text, nullable=False)
    accepted = db.Column(db.Boolean, default=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    space_id = db.Column(db.Integer, db.ForeignKey('spaces.id'), nullable=False)

class Payment(db.Model):
    __tablename__ = 'payments'

    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    status = db.Column(db.String(50), default="Processing")
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    mpesa_transaction_id = db.Column(db.String(100), unique=True, nullable=False, index=True)
    phone_number = db.Column(db.String(20), nullable=False)

    def __init__(self, booking_id, user_id, amount, mpesa_transaction_id, phone_number, status="Processing"):
        self.booking_id = booking_id
        self.user_id = user_id
        self.amount = amount
        self.mpesa_transaction_id = mpesa_transaction_id
        self.phone_number = phone_number
        self.status = status  

    def to_dict(self):
        return {
            "id": self.id,
            "amount": self.amount,
            "status": self.status,
            "timestamp": self.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "booking_id": self.booking_id,
            "user_id": self.user_id,
            "mpesa_transaction_id": self.mpesa_transaction_id,
            "phone_number": self.phone_number
        }
 


class TokenBlockList(db.Model):
    __tablename__ = 'token_blocklist'  #! ✅ Ensured table name is correct

    id = db.Column(db.Integer, primary_key=True)
    jti = db.Column(db.String(36), nullable=False, unique=True)  #! JWT ID (jti)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def __repr__(self):
        return f"<TokenBlocklist id={self.id}, jti={self.jti}, created_at={self.created_at}>"

