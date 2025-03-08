import pytest
from flask import json
from app import create_app, db  # Assuming an app factory pattern
from models import User, TokenBlockList
from werkzeug.security import generate_password_hash
from flask_jwt_extended import create_access_token
from datetime import datetime, timedelta, timezone

def setup_test_user():
    """Helper function to create a test user."""
    user = User(
        name="Test User",
        email="testuser@example.com",
        password=generate_password_hash("Test@123"),
        role="Client"
    )
    db.session.add(user)
    db.session.commit()
    return user.id

@pytest.fixture
def client():
    app = create_app("testing")
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            yield client
        db.session.remove()
        db.drop_all()

# ✅ TEST USER LOGIN
def test_login(client):
    user_id = setup_test_user()
    response = client.post("/login", json={
        "email": "testuser@example.com",
        "password": "Test@123"
    })
    assert response.status_code == 200
    assert "access_token" in response.get_json()

# ❌ TEST LOGIN WITH INVALID CREDENTIALS
def test_login_invalid_credentials(client):
    response = client.post("/login", json={
        "email": "wrong@example.com",
        "password": "WrongPass@123"
    })
    assert response.status_code == 401
    assert "Invalid email or password" in response.get_json()["error"]

# ✅ TEST GET CURRENT USER
def test_current_user(client):
    user_id = setup_test_user()
    token = create_access_token(identity=user_id)
    response = client.get("/current_user", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.get_json()["id"] == user_id

# ❌ TEST GET CURRENT USER (UNAUTHORIZED)
def test_current_user_unauthorized(client):
    response = client.get("/current_user")
    assert response.status_code == 401

# ✅ TEST LOGOUT
def test_logout(client):
    user_id = setup_test_user()
    token = create_access_token(identity=user_id)
    response = client.delete("/logout", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert "Logged out successfully" in response.get_json()["success"]

# ✅ TEST REGISTER USER
def test_register_user(client):
    response = client.post("/users", json={
        "name": "New User",
        "email": "newuser@example.com",
        "password": "Test@123"
    })
    assert response.status_code == 201
    assert "User registered successfully" in response.get_json()["msg"]

# ❌ TEST REGISTER USER WITH EXISTING EMAIL
def test_register_user_existing_email(client):
    setup_test_user()
    response = client.post("/users", json={
        "name": "Test User",
        "email": "testuser@example.com",
        "password": "Test@123"
    })
    assert response.status_code == 409
    assert "Email already in use" in response.get_json()["error"]

# ✅ TEST REQUEST PASSWORD RESET
def test_request_password_reset(client):
    setup_test_user()
    response = client.post("/request_password_reset", json={"email": "testuser@example.com"})
    assert response.status_code == 200
    assert "A new password reset email has been sent" in response.get_json()["msg"]

# ❌ TEST REQUEST PASSWORD RESET FOR NON-EXISTENT EMAIL
def test_request_password_reset_nonexistent_email(client):
    response = client.post("/request_password_reset", json={"email": "nonexistent@example.com"})
    assert response.status_code == 404
    assert "No user found with this email" in response.get_json()["error"]

# ✅ TEST RESET PASSWORD
def test_reset_password(client):
    user_id = setup_test_user()
    user = User.query.get(user_id)
    user.reset_token = "RESET123"
    db.session.commit()
    response = client.post("/reset_password", json={
        "reset_token": "RESET123",
        "new_password": "NewPass@123"
    })
    assert response.status_code == 200
    assert "Password reset successfully" in response.get_json()["msg"]

# ❌ TEST RESET PASSWORD WITH INVALID TOKEN
def test_reset_password_invalid_token(client):
    response = client.post("/reset_password", json={
        "reset_token": "INVALIDTOKEN",
        "new_password": "NewPass@123"
    })
    assert response.status_code == 401
    assert "Invalid or expired reset token" in response.get_json()["error"]

if __name__ == "__main__":
    pytest.main()