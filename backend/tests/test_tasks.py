import pytest

from tests.conftest import register_user


@pytest.fixture
def project_ctx(client):
    """Returns (client, project) with the client authenticated as the project owner."""
    owner_data = register_user(client, "taskowner@test.com", "taskowner")
    client.headers.update({"Authorization": f"Bearer {owner_data['access_token']}"})
    project = client.post("/projects/", json={"name": "Task Project", "color": "#6366f1"}).json()
    return client, project, owner_data["user"]


def test_create_task_success(project_ctx):
    client, project, _ = project_ctx
    resp = client.post(
        f"/projects/{project['id']}/tasks/",
        json={"title": "First Task", "status": "todo", "priority": "medium"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["title"] == "First Task"
    assert data["status"] == "todo"
    assert data["priority"] == "medium"
    assert data["position"] == 0


def test_create_task_positions_increment(project_ctx):
    client, project, _ = project_ctx
    base = f"/projects/{project['id']}/tasks/"
    client.post(base, json={"title": "A", "status": "todo", "priority": "low"})
    resp = client.post(base, json={"title": "B", "status": "todo", "priority": "low"})
    assert resp.json()["position"] == 1


def test_list_tasks_returns_all(project_ctx):
    client, project, _ = project_ctx
    base = f"/projects/{project['id']}/tasks/"
    client.post(base, json={"title": "A", "status": "todo", "priority": "low"})
    client.post(base, json={"title": "B", "status": "done", "priority": "high"})
    resp = client.get(base)
    assert resp.status_code == 200
    assert len(resp.json()) == 2


def test_list_tasks_filter_by_status(project_ctx):
    client, project, _ = project_ctx
    base = f"/projects/{project['id']}/tasks/"
    client.post(base, json={"title": "Todo", "status": "todo", "priority": "low"})
    client.post(base, json={"title": "Done", "status": "done", "priority": "low"})
    tasks = client.get(f"{base}?status=done").json()
    assert len(tasks) == 1
    assert tasks[0]["status"] == "done"


def test_list_tasks_filter_by_priority(project_ctx):
    client, project, _ = project_ctx
    base = f"/projects/{project['id']}/tasks/"
    client.post(base, json={"title": "Low", "status": "todo", "priority": "low"})
    client.post(base, json={"title": "High", "status": "todo", "priority": "high"})
    tasks = client.get(f"{base}?priority=high").json()
    assert all(t["priority"] == "high" for t in tasks)
    assert len(tasks) == 1


def test_update_task(project_ctx):
    client, project, _ = project_ctx
    base = f"/projects/{project['id']}/tasks/"
    task_id = client.post(base, json={"title": "Original", "status": "todo", "priority": "low"}).json()["id"]
    resp = client.patch(f"{base}{task_id}", json={"title": "Updated", "status": "in_progress"})
    assert resp.status_code == 200
    assert resp.json()["title"] == "Updated"
    assert resp.json()["status"] == "in_progress"


def test_update_task_not_found_returns_404(project_ctx):
    client, project, _ = project_ctx
    resp = client.patch(f"/projects/{project['id']}/tasks/9999", json={"title": "x"})
    assert resp.status_code == 404


def test_delete_task(project_ctx):
    client, project, _ = project_ctx
    base = f"/projects/{project['id']}/tasks/"
    task_id = client.post(base, json={"title": "Bye", "status": "todo", "priority": "medium"}).json()["id"]
    assert client.delete(f"{base}{task_id}").status_code == 204


def test_delete_task_not_found_returns_404(project_ctx):
    client, project, _ = project_ctx
    assert client.delete(f"/projects/{project['id']}/tasks/9999").status_code == 404


def test_non_member_cannot_create_task(client):
    owner_data = register_user(client, "own2@test.com", "own2")
    client.headers.update({"Authorization": f"Bearer {owner_data['access_token']}"})
    project_id = client.post("/projects/", json={"name": "Private", "color": "#fff"}).json()["id"]

    other_data = register_user(client, "intruder@test.com", "intruder")
    client.headers.update({"Authorization": f"Bearer {other_data['access_token']}"})
    resp = client.post(
        f"/projects/{project_id}/tasks/",
        json={"title": "Hack", "status": "todo", "priority": "low"},
    )
    assert resp.status_code == 403


def test_assignee_must_be_project_member(project_ctx):
    client, project, _ = project_ctx
    # Register a user that is NOT a member of the project
    non_member = register_user(client, "nomember@test.com", "nomember")
    non_member_id = non_member["user"]["id"]

    # Re-set owner token (register_user POST doesn't change headers, owner token still active)
    resp = client.post(
        f"/projects/{project['id']}/tasks/",
        json={"title": "Assigned", "status": "todo", "priority": "low", "assignee_id": non_member_id},
    )
    assert resp.status_code == 400
    assert "Assignee must be a project member" in resp.json()["detail"]
