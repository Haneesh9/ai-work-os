from datetime import datetime, timezone
import uuid
import json
from sqlalchemy import Column, String, Text, Integer, Float, DateTime, ForeignKey, Boolean, Enum
from sqlalchemy.orm import relationship
from app.db.session import Base
import enum

class WorkspaceRole(str, enum.Enum):
    OWNER = "OWNER"
    MEMBER = "MEMBER"

class TaskStatus(str, enum.Enum):
    TODO = "TODO"
    IN_PROGRESS = "IN_PROGRESS"
    BLOCKED = "BLOCKED"
    COMPLETED = "COMPLETED"

class TaskPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    URGENT = "URGENT"

class ProjectStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    ARCHIVED = "ARCHIVED"

class ToolStatus(str, enum.Enum):
    PENDING_APPROVAL = "PENDING_APPROVAL"
    APPROVED = "APPROVED"
    EXECUTED = "EXECUTED"
    DENIED = "DENIED"
    FAILED = "FAILED"

def generate_uuid():
    return str(uuid.uuid4())

def utc_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    
    memberships = relationship("WorkspaceMember", back_populates="user", cascade="all, delete-orphan")

class Workspace(Base):
    __tablename__ = "workspaces"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    slug = Column(String, unique=True, index=True, nullable=False)
    owner_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=utc_now)
    
    members = relationship("WorkspaceMember", back_populates="workspace", cascade="all, delete-orphan")
    projects = relationship("Project", back_populates="workspace", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="workspace", cascade="all, delete-orphan")
    documents = relationship("Document", back_populates="workspace", cascade="all, delete-orphan")

class WorkspaceMember(Base):
    __tablename__ = "workspace_members"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    workspace_id = Column(String, ForeignKey("workspaces.id"), nullable=False)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    role = Column(String, default=WorkspaceRole.MEMBER.value)
    joined_at = Column(DateTime, default=utc_now)
    
    workspace = relationship("Workspace", back_populates="members")
    user = relationship("User", back_populates="memberships")

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    workspace_id = Column(String, ForeignKey("workspaces.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default=ProjectStatus.ACTIVE.value)
    progress = Column(Integer, default=0)
    blocker_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=utc_now)
    
    workspace = relationship("Workspace", back_populates="projects")
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    workspace_id = Column(String, ForeignKey("workspaces.id"), nullable=False, index=True)
    project_id = Column(String, ForeignKey("projects.id"), nullable=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    status = Column(String, default=TaskStatus.TODO.value, index=True)
    priority = Column(String, default=TaskPriority.MEDIUM.value, index=True)
    assignee_id = Column(String, ForeignKey("users.id"), nullable=True)
    creator_id = Column(String, ForeignKey("users.id"), nullable=False)
    due_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)
    
    workspace = relationship("Workspace", back_populates="tasks")
    project = relationship("Project", back_populates="tasks")

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    workspace_id = Column(String, ForeignKey("workspaces.id"), nullable=False, index=True)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    file_size = Column(Integer, default=0)
    mime_type = Column(String, default="text/plain")
    chunk_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=utc_now)
    
    workspace = relationship("Workspace", back_populates="documents")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    document_id = Column(String, ForeignKey("documents.id"), nullable=False, index=True)
    workspace_id = Column(String, ForeignKey("workspaces.id"), nullable=False, index=True)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    metadata_json = Column(Text, default="{}")
    embedding_json = Column(Text, default="[]")
    
    document = relationship("Document", back_populates="chunks")

class Conversation(Base):
    __tablename__ = "conversations"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    workspace_id = Column(String, ForeignKey("workspaces.id"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String, default="New Conversation")
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)
    
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=False, index=True)
    role = Column(String, nullable=False) # user, assistant, system, tool
    content = Column(Text, nullable=False)
    tool_calls_json = Column(Text, default="[]")
    sources_json = Column(Text, default="[]")
    created_at = Column(DateTime, default=utc_now)
    
    conversation = relationship("Conversation", back_populates="messages")

class ToolCall(Base):
    __tablename__ = "tool_calls"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    conversation_id = Column(String, ForeignKey("conversations.id"), nullable=False, index=True)
    message_id = Column(String, ForeignKey("messages.id"), nullable=True)
    tool_name = Column(String, nullable=False)
    arguments_json = Column(Text, nullable=False)
    result_json = Column(Text, nullable=True)
    status = Column(String, default=ToolStatus.PENDING_APPROVAL.value)
    requires_approval = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    workspace_id = Column(String, ForeignKey("workspaces.id"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    action = Column(String, nullable=False)
    target_type = Column(String, nullable=False)
    target_id = Column(String, nullable=True)
    details_json = Column(Text, default="{}")
    created_at = Column(DateTime, default=utc_now)
