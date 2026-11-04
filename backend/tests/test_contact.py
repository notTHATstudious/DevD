import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch

from app.core.security import RATE_LIMITS, GLOBAL_LIMIT
from app.main import app
from app.services import contact_service
from app.services.contact_service import ContactStore

URL = "/api/v1/contact"


@pytest.fixture()
def client(tmp_path):
    RATE_LIMITS[URL]._hits.clear()
    GLOBAL_LIMIT._hits.clear()
    store = ContactStore(str(tmp_path / "messages.db"))
    with patch.object(contact_service, "contact_store", store):
        yield TestClient(app), store


def test_saves_message_without_exposing_owner_email(client):
    c, store = client
    r = c.post(URL, json={"category": "feedback", "message": "Love the app, thanks!", "name": "Asha"})
    assert r.status_code == 200
    assert "@" not in r.text  # no address leaks back to the browser
    saved = store.latest()
    assert len(saved) == 1 and saved[0].name == "Asha" and saved[0].category == "feedback"


def test_validation(client):
    c, store = client
    assert c.post(URL, json={"message": "short"}).status_code == 422
    assert c.post(URL, json={"message": "long enough message", "email": "not-an-email"}).status_code == 422
    assert c.post(URL, json={"message": "long enough message", "category": "spam"}).status_code == 422
    assert c.post(URL, json={"message": "x" * 2001}).status_code == 422
    assert store.latest() == []


def test_honeypot_is_silently_dropped(client):
    c, store = client
    r = c.post(URL, json={"message": "buy cheap things now", "website": "http://spam"})
    assert r.status_code == 200
    assert store.latest() == []


def test_name_is_single_line(client):
    c, store = client
    c.post(URL, json={"message": "hello there friend", "name": "Bob\r\nBcc: evil@example.com"})
    assert "\n" not in store.latest()[0].name


def test_rate_limited_per_ip(client):
    c, _ = client
    codes = [c.post(URL, json={"message": f"message number {i}"}).status_code for i in range(7)]
    assert codes[:5] == [200] * 5
    assert codes[5] == 429


def test_daily_cap(client):
    c, store = client
    with patch("app.api.v1.endpoints.contact.settings.CONTACT_DAILY_LIMIT", 0):
        assert c.post(URL, json={"message": "hello there friend"}).status_code == 503


def test_security_headers_and_body_limit(client):
    c, _ = client
    r = c.get("/health")
    assert r.headers["x-content-type-options"] == "nosniff"
    assert r.headers["x-frame-options"] == "DENY"
    big = c.post(URL, content=b"{" + b" " * 20000 + b"}", headers={"Content-Type": "application/json"})
    assert big.status_code == 413


def test_api_docs_hidden_by_default(client):
    c, _ = client
    assert c.get("/docs").status_code == 404
    assert c.get("/openapi.json").status_code == 404
