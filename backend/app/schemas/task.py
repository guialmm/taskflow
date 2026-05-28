from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel

from app.schemas.user import UserPublic


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    status: Literal["todo", "in_progress", "done"] = "todo"
    priority: Literal["low", "medium", "high"] = "medium"
    deadline: Optional[date] = None
    assignee_id: Optional[int] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[Literal["todo", "in_progress", "done"]] = None
    priority: Optional[Literal["low", "medium", "high"]] = None
    deadline: Optional[date] = None
    assignee_id: Optional[int] = None
    position: Optional[int] = None


class TaskOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    status: str
    priority: str
    position: int
    deadline: Optional[date]
    project_id: int
    assignee: Optional[UserPublic]
    created_by: UserPublic
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
