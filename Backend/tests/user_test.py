import pytest
from flask import json
from app import create_app, db  # Assuming you have an app factory
from models import User
from werkzeug.security import check_password_hash, generate_password_hash
from flask_jwt_extended import create_access_token

def setup_test_user(client, admin=False):
    """Helper function to create a test user and return their access token."""
    user = User(
        name="Test User",
        email="testuser@example.com" if not admin else "admin@example.com",
        password=generate_password_hash("Test@123"),
        role="Admin" if admin else "Client",
        image="default.jpg"
    )
    db.session.add(user)
    db.session.commit()
    return create_access_token(identity=user.id)

@pytest.fixture
def client():
    app = create_app("testing")  # Ensure testing config
    app.config['TESTING'] = True
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
    with app.test_client() as client:
        with app.app_context():
            db.create_all()
            yield client
        db.session.remove()
        db.drop_all()

# ✅ TEST CREATE USER
def test_create_user(client):
    response = client.post("/users", json={
        "name": "John Doe",
        "email": "johndoe@example.com",
        "password": "Test@123"
    })
    data = response.get_json()
    assert response.status_code == 201
    assert data["message"] == "User created successfully"
    assert "id" in data["user"]

# ❌ TEST CREATE USER WITH EXISTING EMAIL
def test_create_user_existing_email(client):
    client.post("/users", json={
        "name": "John Doe",
        "email": "johndoe@example.com",
        "password": "Test@123"
    })
    response = client.post("/users", json={
        "name": "Jane Doe",
        "email": "johndoe@example.com",
        "password": "Test@123"
    })
    assert response.status_code == 409
    assert "Email already in use" in response.get_json()["error"]

# ✅ TEST FETCH SINGLE USER
def test_fetch_user(client):
    token = setup_test_user(client)
    response = client.get("/users/1", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert "name" in response.get_json()

# ❌ TEST FETCH USER NOT FOUND
def test_fetch_user_not_found(client):
    response = client.get("/users/999")
    assert response.status_code == 404
    assert "User with ID not found" in response.get_json()["error"]

# ✅ TEST FETCH ALL USERS (ADMIN ONLY)
def test_fetch_all_users_admin_only(client):
    admin_token = setup_test_user(client, admin=True)
    response = client.get("/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200
    assert "users" in response.get_json()

# ❌ TEST FETCH ALL USERS (CLIENT ACCESS DENIED)
def test_fetch_all_users_client_access_denied(client):
    client_token = setup_test_user(client, admin=False)
    response = client.get("/users", headers={"Authorization": f"Bearer {client_token}"})
    assert response.status_code == 403
    assert "Only admins can access this resource" in response.get_json()["error"]

# ✅ TEST UPDATE USER
def test_update_user(client):
    token = setup_test_user(client)
    response = client.patch("/users/1", json={"name": "Updated Name"}, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.get_json()["user"]["name"] == "Updated Name"

# ❌ TEST UPDATE USER (UNAUTHORIZED)
def test_update_user_unauthorized(client):
    setup_test_user(client)  # Create a user
    token = setup_test_user(client, admin=False)  # Different user
    response = client.patch("/users/1", json={"name": "Hacker"}, headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 403
    assert "Unauthorized" in response.get_json()["error"]

# ✅ TEST DELETE USER (ADMIN ONLY)
def test_delete_user_admin(client):
    admin_token = setup_test_user(client, admin=True)
    client.post("/users", json={
        "name": "Delete Me",
        "email": "delete@example.com",
        "password": "Test@123"
    })
    response = client.delete("/users/2", headers={"Authorization": f"Bearer {admin_token}"})
    assert response.status_code == 200
    assert "User deleted successfully" in response.get_json()["message"]

# ❌ TEST DELETE USER (CLIENT ACCESS DENIED)
def test_delete_user_client_access_denied(client):
    client_token = setup_test_user(client, admin=False)
    response = client.delete("/users/1", headers={"Authorization": f"Bearer {client_token}"})
    assert response.status_code == 403
    assert "Only admins can delete users" in response.get_json()["error"]

if __name__ == "__main__":
    pytest.main()
