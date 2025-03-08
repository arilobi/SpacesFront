import pytest
from flask import json
from app import create_app, db  # Assuming an app factory pattern
from models import Payment
from datetime import datetime
import uuid

def setup_test_payment():
    """Helper function to create a test payment."""
    payment = Payment(
        booking_id=1,
        user_id=1,
        amount=1000,
        mpesa_transaction_id=str(uuid.uuid4())[:10],
        phone_number="+254700123456",
        status="Processing"
    )
    db.session.add(payment)
    db.session.commit()
    return payment.id

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

# ✅ TEST CREATE PAYMENT
def test_create_payment(client):
    response = client.post("/payments", json={
        "booking_id": 1,
        "user_id": 1,
        "amount": 1000,
        "phone_number": "+254700123456"
    })
    data = response.get_json()
    assert response.status_code == 201
    assert "mpesa_transaction_id" in data

# ❌ TEST CREATE PAYMENT WITH MISSING FIELDS
def test_create_payment_missing_fields(client):
    response = client.post("/payments", json={
        "user_id": 1
    })
    assert response.status_code == 400
    assert "Missing required fields" in response.get_json()["error"]

# ✅ TEST FETCH SINGLE PAYMENT
def test_fetch_single_payment(client):
    payment_id = setup_test_payment()
    response = client.get(f"/payments/{payment_id}")
    assert response.status_code == 200
    assert response.get_json()["id"] == payment_id

# ❌ TEST FETCH SINGLE PAYMENT NOT FOUND
def test_fetch_single_payment_not_found(client):
    response = client.get("/payments/999")
    assert response.status_code == 404
    assert "Payment not found" in response.get_json()["error"]

# ✅ TEST FETCH ALL PAYMENTS
def test_fetch_all_payments(client):
    setup_test_payment()
    response = client.get("/payments")
    assert response.status_code == 200
    assert len(response.get_json()["payments"]) > 0

# ✅ TEST UPDATE PAYMENT
def test_update_payment(client):
    payment_id = setup_test_payment()
    response = client.patch(f"/payments/{payment_id}", json={"status": "Completed"})
    assert response.status_code == 200
    assert response.get_json()["status"] == "Completed"

# ❌ TEST UPDATE PAYMENT NOT FOUND
def test_update_payment_not_found(client):
    response = client.patch("/payments/999", json={"status": "Completed"})
    assert response.status_code == 404
    assert "Payment not found" in response.get_json()["error"]

# ✅ TEST DELETE PAYMENT
def test_delete_payment(client):
    payment_id = setup_test_payment()
    response = client.delete(f"/payments/{payment_id}")
    assert response.status_code == 200
    assert "Payment deleted successfully" in response.get_json()["message"]

# ❌ TEST DELETE PAYMENT NOT FOUND
def test_delete_payment_not_found(client):
    response = client.delete("/payments/999")
    assert response.status_code == 404
    assert "Payment not found" in response.get_json()["error"]

if __name__ == "__main__":
    pytest.main()