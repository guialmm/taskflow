import pytest

from tests.conftest import register_user


@pytest.fixture
def owner(client):
    data = register_user(client, "owner@test.com", "owner")
    client.headers.update({"Authorization": f"Bearer {data['access_token']}"})
    return client, data["user"]


def test_create_project(owner):
    client, user = owner
    resp = client.post("/projects/", json={"name": "My Project", "color": "#6366f1"})
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "My Project"
    assert data["owner_id"] == user["id"]
    assert data["tasks_total"] == 0


def test_list_projects_returns_only_members_projects(owner):
    client, _ = owner
    client.post("/projects/", json={"name": "P1", "color": "#fff"})
    client.post("/projects/", json={"name": "P2", "color": "#000"})
    resp = client.get("/projects/")
    assert resp.status_code == 200
    assert len(resp.json()) == 2


def test_get_project(owner):
    client, _ = owner
    project_id = client.post("/projects/", json={"name": "Solo", "color": "#fff"}).json()["id"]
    resp = client.get(f"/projects/{project_id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == project_id


def test_get_project_not_found_returns_404(owner):
    client, _ = owner
    assert client.get("/projects/9999").status_code == 404


def test_non_member_get_project_returns_403(client):
    owner_data = register_user(client, "owner2@test.com", "owner2")
    client.headers.update({"Authorization": f"Bearer {owner_data['access_token']}"})
    project_id = client.post("/projects/", json={"name": "Private", "color": "#fff"}).json()["id"]

    other_data = register_user(client, "other@test.com", "other")
    client.headers.update({"Authorization": f"Bearer {other_data['access_token']}"})
    assert client.get(f"/projects/{project_id}").status_code == 403


def test_update_project(owner):
    client, _ = owner
    project_id = client.post("/projects/", json={"name": "Old Name", "color": "#fff"}).json()["id"]
    resp = client.patch(f"/projects/{project_id}", json={"name": "New Name"})
    assert resp.status_code == 200
    assert resp.json()["name"] == "New Name"


def test_non_owner_cannot_update_project(client):
    owner_data = register_user(client, "own3@test.com", "own3")
    client.headers.update({"Authorization": f"Bearer {owner_data['access_token']}"})
    project_id = client.post("/projects/", json={"name": "P", "color": "#fff"}).json()["id"]

    member_data = register_user(client, "mem@test.com", "memuser")
    client.post(f"/projects/{project_id}/members", json={"username": "memuser"})

    client.headers.update({"Authorization": f"Bearer {member_data['access_token']}"})
    assert client.patch(f"/projects/{project_id}", json={"name": "Hacked"}).status_code == 403


def test_delete_project(owner):
    client, _ = owner
    project_id = client.post("/projects/", json={"name": "Delete Me", "color": "#fff"}).json()["id"]
    assert client.delete(f"/projects/{project_id}").status_code == 204
    assert client.get(f"/projects/{project_id}").status_code == 404


def test_invite_member(client):
    owner_data = register_user(client, "inv_own@test.com", "inv_own")
    register_user(client, "newmember@test.com", "newmember")
    client.headers.update({"Authorization": f"Bearer {owner_data['access_token']}"})
    project_id = client.post("/projects/", json={"name": "Team", "color": "#fff"}).json()["id"]

    resp = client.post(f"/projects/{project_id}/members", json={"username": "newmember"})
    assert resp.status_code == 201
    assert resp.json()["user"]["username"] == "newmember"


def test_invite_nonexistent_user_returns_404(owner):
    client, _ = owner
    project_id = client.post("/projects/", json={"name": "T", "color": "#fff"}).json()["id"]
    assert client.post(f"/projects/{project_id}/members", json={"username": "ghost"}).status_code == 404


def test_invite_duplicate_member_returns_400(client):
    owner_data = register_user(client, "dup_own@test.com", "dup_own")
    register_user(client, "dup_mem@test.com", "dup_mem")
    client.headers.update({"Authorization": f"Bearer {owner_data['access_token']}"})
    project_id = client.post("/projects/", json={"name": "T", "color": "#fff"}).json()["id"]
    client.post(f"/projects/{project_id}/members", json={"username": "dup_mem"})
    resp = client.post(f"/projects/{project_id}/members", json={"username": "dup_mem"})
    assert resp.status_code == 400


def test_remove_member(client):
    owner_data = register_user(client, "rm_own@test.com", "rm_own")
    member_data = register_user(client, "rm_mem@test.com", "rm_mem")
    client.headers.update({"Authorization": f"Bearer {owner_data['access_token']}"})
    project_id = client.post("/projects/", json={"name": "T", "color": "#fff"}).json()["id"]
    client.post(f"/projects/{project_id}/members", json={"username": "rm_mem"})

    member_id = member_data["user"]["id"]
    assert client.delete(f"/projects/{project_id}/members/{member_id}").status_code == 204


def test_owner_cannot_remove_themselves(owner):
    client, user = owner
    project_id = client.post("/projects/", json={"name": "Solo", "color": "#fff"}).json()["id"]
    resp = client.delete(f"/projects/{project_id}/members/{user['id']}")
    assert resp.status_code == 400
    assert "Owner cannot remove themselves" in resp.json()["detail"]
