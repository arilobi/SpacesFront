import pytest
from flask import json
from app import create_app, db  # Assuming an app factory pattern
from models import Booking
from datetime import datetime

def setup_test_booking():
    """Helper function to create a test booking."""
    booking = Booking(
        user_id=1,
        space_id=1,
        start_time=datetime.strptime("2025-03-10T10:00:00", "%Y-%m-%dT%H:%M:%S"),
        end_time=datetime.strptime("2025-03-10T12:00:00", "%Y-%m-%dT%H:%M:%S"),
        total_amount=200.0,
        status="Pending Payment"
    )
    db.session.add(booking)
    db.session.commit()
    return booking.id

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

# ✅ TEST CREATE BOOKING
def test_create_booking(client):
    response = client.post("/bookings", json={
        "user_id": 1,
        "space_id": 1,
        "start_time": "2025-03-10T10:00:00",
        "end_time": "2025-03-10T12:00:00",
        "total_amount": 200.0
    })
    data = response.get_json()
    assert response.status_code == 201
    assert "id" in data

# ❌ TEST CREATE BOOKING WITH MISSING FIELDS
def test_create_booking_missing_fields(client):
    response = client.post("/bookings", json={
        "user_id": 1
    })
    assert response.status_code == 400
    assert "Missing required fields" in response.get_json()["error"]

# ✅ TEST FETCH SINGLE BOOKING
def test_fetch_single_booking(client):
    booking_id = setup_test_booking()
    response = client.get(f"/bookings/{booking_id}")
    assert response.status_code == 200
    assert response.get_json()["id"] == booking_id

# ❌ TEST FETCH SINGLE BOOKING NOT FOUND
def test_fetch_single_booking_not_found(client):
    response = client.get("/bookings/999")
    assert response.status_code == 404
    assert "Booking not found" in response.get_json()["error"]

# ✅ TEST FETCH ALL BOOKINGS
def test_fetch_all_bookings(client):
    setup_test_booking()
    response = client.get("/bookings")
    assert response.status_code == 200
    assert len(response.get_json()["bookings"]) > 0

# ✅ TEST UPDATE BOOKING STATUS
def test_update_booking_status(client):
    booking_id = setup_test_booking()
    response = client.patch(f"/bookings/{booking_id}/status", json={"status": "Confirmed"})
    assert response.status_code == 200
    assert response.get_json()["status"] == "Confirmed"

# ❌ TEST UPDATE BOOKING STATUS NOT FOUND
def test_update_booking_status_not_found(client):
    response = client.patch("/bookings/999/status", json={"status": "Confirmed"})
    assert response.status_code == 404
    assert "Booking not found" in response.get_json()["error"]

# ✅ TEST DELETE BOOKING
def test_delete_booking(client):
    booking_id = setup_test_booking()
    response = client.delete(f"/bookings/{booking_id}")
    assert response.status_code == 200
    assert "Booking deleted successfully" in response.get_json()["message"]

# ❌ TEST DELETE BOOKING NOT FOUND
def test_delete_booking_not_found(client):
    response = client.delete("/bookings/999")
    assert response.status_code == 404
    assert "Booking not found" in response.get_json()["error"]

if __name__ == "__main__":
    pytest.main()