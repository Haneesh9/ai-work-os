from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any, Dict
from datetime import datetime

# --- Auth & User ---
class UserCreate(BaseModel):
    email: str
    full_name: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    avatar_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

# --- Workspace ---
class WorkspaceCreate(BaseModel):
    name: str

class WorkspaceOut(BaseModel):
    id: str
    name: str
    slug: str
    owner_id: str
    role: Optional[str] = "OWNER"
    created_at: datetime

    class Config:
        from_attributes = True

# --- Project ---
class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None
    status: Optional[str] = "ACTIVE"

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    progress: Optional[int] = None

class ProjectOut(BaseModel):
    id: str
    workspace_id: str
    name: str
    description: Optional[str] = None
    status: str
    progress: int
    blocker_count: int
    created_at: datetime
    task_count: Optional[int] = 0

    class Config:
        from_attributes = True

# --- Task ---
class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    project_id: Optional[str] = None
    status: Optional[str] = "TODO"
    priority: Optional[str] = "MEDIUM"
    assignee_id: Optional[str] = None
    due_date: Optional[datetime] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    project_id: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assignee_id: Optional[str] = None
    due_date: Optional[datetime] = None

class TaskOut(BaseModel):
    id: str
    workspace_id: str
    project_id: Optional[str] = None
    project_name: Optional[str] = None
    title: str
    description: Optional[str] = None
    status: str
    priority: str
    assignee_id: Optional[str] = None
    assignee_name: Optional[str] = None
    creator_id: str
    due_date: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# --- Document ---
class DocumentOut(BaseModel):
    id: str
    workspace_id: str
    filename: str
    file_size: int
    mime_type: str
    chunk_count: int
    created_at: datetime

    class Config:
        from_attributes = True

# --- AI & Tool Approval ---
class AIChatRequest(BaseModel):
    workspace_id: str
    conversation_id: Optional[str] = None
    message: str
    document_id: Optional[str] = None

class AIApprovalAction(BaseModel):
    approval: bool  # True to approve, False to deny

class MessageOut(BaseModel):
    id: str
    role: str
    content: str
    tool_calls: Optional[List[Dict[str, Any]]] = []
    sources: Optional[List[Dict[str, Any]]] = []
    created_at: datetime

class ConversationOut(BaseModel):
    id: str
    workspace_id: str
    title: str
    created_at: datetime
    updated_at: datetime
    messages: Optional[List[MessageOut]] = []

    class Config:
        from_attributes = True

class ToolCallOut(BaseModel):
    id: str
    conversation_id: str
    tool_name: str
    arguments: Dict[str, Any]
    status: str
    requires_approval: bool
    created_at: datetime
