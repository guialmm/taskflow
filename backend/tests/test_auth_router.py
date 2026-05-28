from tests.conftest import register_user


def test_register_success(client):
    resp = client.post("/auth/register", json={
        "email": "user@test.com", "username": "user1", "password": "pass123"
    })
    assert resp.status_code == 201
    data = resp.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "user@test.com"
    assert data["user"]["username"] == "user1"
    assert "hashed_password" not in data["user"]


def test_register_assigns_avatar_color(client):
    resp = client.post("/auth/register", json={
        "email": "u@test.com", "username": "u1", "password": "pass123"
    })
    assert resp.status_code == 201
    assert resp.json()["user"]["avatar_color"].startswith("#")


def test_register_duplicate_email_returns_400(client):
    client.post("/auth/register", json={"email": "dup@test.com", "username": "user1", "password": "pass123"})
    resp = client.post("/auth/register", json={"email": "dup@test.com", "username": "user2", "password": "pass123"})
    assert resp.status_code == 400
    assert "Email already registered" in resp.json()["detail"]


def test_register_duplicate_username_returns_400(client):
    client.post("/auth/register", json={"email": "a@test.com", "username": "taken", "password": "pass123"})
    resp = client.post("/auth/register", json={"email": "b@test.com", "username": "taken", "password": "pass123"})
    assert resp.status_code == 400
    assert "Username already taken" in resp.json()["detail"]


def test_login_success(client):
    register_user(client, "login@test.com", "loginuser")
    resp = client.post("/auth/login", json={"email": "login@test.com", "password": "pass123"})
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == "login@test.com"


def test_login_wrong_password_returns_401(client):
    register_user(client, "user@test.com", "user1")
    resp = client.post("/auth/login", json={"email": "user@test.com", "password": "wrongpass"})
    assert resp.status_code == 401


def test_login_nonexistent_email_returns_401(client):
    resp = client.post("/auth/login", json={"email": "ghost@test.com", "password": "pass123"})
    assert resp.status_code == 401


def test_login_missing_password_returns_error(client):
    register_user(client, "user@test.com", "user1")
    resp = client.post("/auth/login", json={"email": "user@test.com"})
    assert resp.status_code in (400, 401, 422)


def test_protected_route_without_token_returns_401(client):
    resp = client.get("/users/me")
    assert resp.status_code == 401


def test_protected_route_invalid_token_returns_401(client):
    resp = client.get("/users/me", headers={"Authorization": "Bearer bad.token.here"})
    assert resp.status_code == 401
