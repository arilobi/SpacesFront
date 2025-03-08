import pytest
from flask import json
from app import create_app, db  # Assuming an app factory pattern
from models import Space

def setup_test_space():
    """Helper function to create a test space."""
    space = Space(
        name="Test Space",
        description="A beautiful space for events",
        location="123 Test Street",
        price_per_hour=50,
        price_per_day=400,
        availability=json.dumps({"Monday": "9AM-5PM"}),
        images="image1.jpg,image2.jpg"
    )
    db.session.add(space)
    db.session.commit()
    return space.id

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

# ✅ TEST CREATE SPACE
def test_create_space(client):
    response = client.post("/spaces", json={
        "name": "New Event Hall",
        "description": "Spacious and well-lit event space",
        "location": "456 Event Avenue",
        "price_per_hour": 100,
        "price_per_day": 800,
        "availability": json.dumps({"Tuesday": "10AM-6PM"}),
        "images": "image3.jpg,image4.jpg"
    })
    data = response.get_json()
    assert response.status_code == 201
    assert data["name"] == "New Event Hall"

# ❌ TEST CREATE SPACE WITH MISSING FIELDS
def test_create_space_missing_fields(client):
    response = client.post("/spaces", json={
        "name": "Incomplete Space"
    })
    assert response.status_code == 400
    assert "Missing required fields" in response.get_json()["error"]

# ❌ TEST CREATE SPACE WITH DUPLICATE NAME
def test_create_space_duplicate_name(client):
    client.post("/spaces", json={
        "name": "Duplicate Space",
        "description": "Nice place",
        "location": "123 Some Street",
        "price_per_hour": 60,
        "price_per_day": 500,
        "availability": json.dumps({"Wednesday": "9AM-5PM"}),
        "images": "image5.jpg"
    })
    response = client.post("/spaces", json={
        "name": "Duplicate Space",
        "description": "Another nice place",
        "location": "456 Another Street",
        "price_per_hour": 70,
        "price_per_day": 600,
        "availability": json.dumps({"Thursday": "9AM-5PM"}),
        "images": "image6.jpg"
    })
    assert response.status_code == 400
    assert "Space with this name already exists" in response.get_json()["error"]

# ✅ TEST FETCH ALL SPACES
def test_fetch_all_spaces(client):
    setup_test_space()
    response = client.get("/spaces")
    assert response.status_code == 200
    assert len(response.get_json()["spaces"]) > 0

# ✅ TEST FETCH SINGLE SPACE
def test_fetch_single_space(client):
    space_id = setup_test_space()
    response = client.get(f"/spaces/{space_id}")
    assert response.status_code == 200
    assert response.get_json()["id"] == space_id

# ❌ TEST FETCH SINGLE SPACE NOT FOUND
def test_fetch_single_space_not_found(client):
    response = client.get("/spaces/999")
    assert response.status_code == 404
    assert "Space not found" in response.get_json()["error"]

# ✅ TEST UPDATE SPACE
def test_update_space(client):
    space_id = setup_test_space()
    response = client.patch(f"/spaces/{space_id}", json={"name": "Updated Space"})
    assert response.status_code == 200
    assert "Space updated successfully" in response.get_json()["message"]

# ❌ TEST UPDATE SPACE NOT FOUND
def test_update_space_not_found(client):
    response = client.patch("/spaces/999", json={"name": "Non-existent Space"})
    assert response.status_code == 404
    assert "Space not found" in response.get_json()["error"]

# ✅ TEST DELETE SPACE
def test_delete_space(client):
    space_id = setup_test_space()
    response = client.delete(f"/spaces/{space_id}")
    assert response.status_code == 200
    assert "Space deleted successfully" in response.get_json()["message"]

# ❌ TEST DELETE SPACE NOT FOUND
def test_delete_space_not_found(client):
    response = client.delete("/spaces/999")
    assert response.status_code == 404
    assert "Space not found" in response.get_json()["error"]

if __name__ == "__main__":
    pytest.main()