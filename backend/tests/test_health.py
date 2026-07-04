from fastapi.testclient import TestClient

def test_root_info_endpoint(client: TestClient) -> None:
    """Verifies that GET / returns the correct service information."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "app" in data
    assert "version" in data
    assert "environment" in data
    assert data["status"] == "running"

def test_health_check_endpoint(client: TestClient) -> None:
    """Verifies that GET /health returns standard status information."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data == {
        "status": "healthy",
        "version": "2.0"
    }
