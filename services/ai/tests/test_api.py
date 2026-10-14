from fastapi.testclient import TestClient
from services.ai.app.config import settings
from services.ai.app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["version"] == "1.0.0"
    assert "whisper_available" in data
    assert "ollama_available" in data


def test_internal_auth_required():
    # Without header -> 401
    resp = client.post("/api/analyze/path", json={"video_path": "/tmp/dummy.mp4"})
    assert resp.status_code == 401

    # With invalid key -> 403
    resp = client.post(
        "/api/analyze/path",
        json={"video_path": "/tmp/dummy.mp4"},
        headers={"X-Simmory-Internal-Key": "wrong_key_123"}
    )
    assert resp.status_code == 403


def test_analyze_path_not_found():
    resp = client.post(
        "/api/analyze/path",
        json={"video_path": "/nonexistent/path/video.mp4"},
        headers={"X-Simmory-Internal-Key": settings.INTERNAL_API_KEY}
    )
    assert resp.status_code == 404
