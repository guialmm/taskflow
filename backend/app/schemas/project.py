from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel

from app.schemas.user import UserPublic


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    color: Optional[str] = "#6366f1"


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None


class MemberOut(BaseModel):
    id: int
    user: UserPublic
    role: str
    joined_at: datetime

    model_config = {"from_attributes": True}


class ProjectOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    color: str
    owner_id: int
    created_at: datetime
    members: List[MemberOut] = []
    tasks_done: int = 0
    tasks_total: int = 0

    model_config = {"from_attributes": True}


class InviteMember(BaseModel):
    username: str
