from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import case, func
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.project import Project, ProjectMember
from app.models.task import Task as TaskModel
from app.models.user import User
from app.schemas.project import InviteMember, MemberOut, ProjectCreate, ProjectOut, ProjectUpdate

router = APIRouter(prefix="/projects", tags=["projects"])


def get_project_or_404(project_id: int, db: Session) -> Project:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def require_member(project: Project, user: User) -> ProjectMember:
    membership = next((m for m in project.members if m.user_id == user.id), None)
    if not membership:
        raise HTTPException(status_code=403, detail="Not a project member")
    return membership


def require_owner(project: Project, user: User):
    if project.owner_id != user.id:
        raise HTTPException(status_code=403, detail="Only the project owner can do this")


def _add_task_counts(projects: list[Project], project_ids: list[int], db: Session) -> list[ProjectOut]:
    if not project_ids:
        return [ProjectOut.model_validate(p) for p in projects]

    rows = db.query(
        TaskModel.project_id,
        func.count(TaskModel.id).label("total"),
        func.sum(case((TaskModel.status == "done", 1), else_=0)).label("done"),
    ).filter(TaskModel.project_id.in_(project_ids)).group_by(TaskModel.project_id).all()

    counts = {r.project_id: (int(r.total or 0), int(r.done or 0)) for r in rows}

    result = []
    for p in projects:
        total, done = counts.get(p.id, (0, 0))
        out = ProjectOut.model_validate(p)
        result.append(out.model_copy(update={"tasks_total": total, "tasks_done": done}))
    return result


@router.get("/", response_model=List[ProjectOut])
def list_projects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    memberships = db.query(ProjectMember).filter(ProjectMember.user_id == current_user.id).all()
    project_ids = [m.project_id for m in memberships]
    projects = db.query(Project).filter(Project.id.in_(project_ids)).all()
    return _add_task_counts(projects, project_ids, db)


@router.post("/", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = Project(**payload.model_dump(), owner_id=current_user.id)
    db.add(project)
    db.flush()

    membership = ProjectMember(project_id=project.id, user_id=current_user.id, role="owner")
    db.add(membership)
    db.commit()
    db.refresh(project)
    return project


@router.get("/{project_id}", response_model=ProjectOut)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = get_project_or_404(project_id, db)
    require_member(project, current_user)
    result = _add_task_counts([project], [project_id], db)
    return result[0]


@router.patch("/{project_id}", response_model=ProjectOut)
def update_project(
    project_id: int,
    payload: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = get_project_or_404(project_id, db)
    require_owner(project, current_user)

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(project, field, value)
    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = get_project_or_404(project_id, db)
    require_owner(project, current_user)
    db.delete(project)
    db.commit()


@router.post("/{project_id}/members", response_model=MemberOut, status_code=status.HTTP_201_CREATED)
def invite_member(
    project_id: int,
    payload: InviteMember,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = get_project_or_404(project_id, db)
    require_owner(project, current_user)

    target = db.query(User).filter(User.username == payload.username).first()
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    already = next((m for m in project.members if m.user_id == target.id), None)
    if already:
        raise HTTPException(status_code=400, detail="User is already a member")

    membership = ProjectMember(project_id=project_id, user_id=target.id, role="member")
    db.add(membership)
    db.commit()
    db.refresh(membership)
    return membership


@router.delete("/{project_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(
    project_id: int,
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = get_project_or_404(project_id, db)
    require_owner(project, current_user)

    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Owner cannot remove themselves")

    membership = next((m for m in project.members if m.user_id == user_id), None)
    if not membership:
        raise HTTPException(status_code=404, detail="Member not found")

    db.delete(membership)
    db.commit()
