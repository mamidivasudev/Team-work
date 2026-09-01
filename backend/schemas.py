from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    name: str
    role: str
    username: Optional[str] = None

class UserCreate(UserBase):
    password: Optional[str] = None

class User(UserBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True

class TaskCommentBase(BaseModel):
    content: str

class TaskCommentCreate(TaskCommentBase):
    user_id: int

class TaskComment(TaskCommentBase):
    id: int
    task_id: int
    user_id: int
    created_at: datetime
    user: Optional[User] = None

    class Config:
        orm_mode = True

class TaskAttachment(BaseModel):
    id: int
    task_id: int
    filename: str
    original_name: str
    file_size: Optional[int] = None
    uploaded_by: Optional[int] = None
    created_at: datetime

    class Config:
        orm_mode = True

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "MEDIUM"
    status: str = "TODO"
    due_date: Optional[datetime] = None
    assignee_ids: Optional[List[int]] = []
    project_id: int
    task_type: str = "STANDARD"
    dev_status: str = "PENDING"
    qa_status: str = "PENDING"
    support_status: str = "PENDING"

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[datetime] = None
    assignee_ids: Optional[List[int]] = None
    task_type: Optional[str] = None
    dev_status: Optional[str] = None
    qa_status: Optional[str] = None
    support_status: Optional[str] = None

class Task(TaskBase):
    id: int
    created_at: datetime
    updated_at: datetime
    assignees: List[User] = []
    comments: List[TaskComment] = []

    class Config:
        orm_mode = True

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    status: str = "ACTIVE"
    progress: int = 0

class ProjectCreate(ProjectBase):
    member_ids: Optional[List[int]] = []

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    progress: Optional[int] = None
    member_ids: Optional[List[int]] = None

class Project(ProjectBase):
    id: int
    created_at: datetime
    tasks: List[Task] = []
    members: List[User] = []

    class Config:
        orm_mode = True

class ActivityBase(BaseModel):
    action: str
    description: str

class ActivityCreate(ActivityBase):
    pass

class Activity(ActivityBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True
