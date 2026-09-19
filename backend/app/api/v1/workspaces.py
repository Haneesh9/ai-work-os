from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.db.session import get_db
from app.models import User, Workspace, WorkspaceMember, WorkspaceRole, Project, Task, Document, DocumentChunk
from app.schemas import WorkspaceCreate, WorkspaceOut
from app.api.v1.auth import get_current_user
from app.agent.rag_service import rag_service
import json

router = APIRouter()

async def seed_sample_data_if_needed(db: AsyncSession, workspace: Workspace, user: User):
    """Seed rich workspace data (projects, tasks, documents) for immediate WOW UX demonstration."""
    p_check = await db.execute(select(Project).where(Project.workspace_id == workspace.id))
    if p_check.scalars().all():
        return

    # 1. Sample Projects
    proj1 = Project(
        workspace_id=workspace.id,
        name="AI Work OS v1.0 Launch",
        description="Core architecture, design system and local RAG agent integration.",
        status="ACTIVE",
        progress=65,
        blocker_count=1
    )
    proj2 = Project(
        workspace_id=workspace.id,
        name="Mobile Native App",
        description="iOS and Android client components with responsive UI.",
        status="ACTIVE",
        progress=30,
        blocker_count=0
    )
    db.add_all([proj1, proj2])
    await db.commit()
    await db.refresh(proj1)
    await db.refresh(proj2)

    # 2. Sample Tasks (Action Inbox items)
    task1 = Task(
        workspace_id=workspace.id,
        project_id=proj1.id,
        creator_id=user.id,
        assignee_id=user.id,
        title="Resolve pgvector index setup for multi-tenant isolation",
        description="Verify that vector similarity search strictly filters by workspace_id before ranking.",
        status="BLOCKED",
        priority="URGENT"
    )
    task2 = Task(
        workspace_id=workspace.id,
        project_id=proj1.id,
        creator_id=user.id,
        assignee_id=user.id,
        title="Design 3-pane split-view Action Inbox component",
        description="Implement navigation, inbox email-style rows, and collapsible AI panel.",
        status="IN_PROGRESS",
        priority="HIGH"
    )
    task3 = Task(
        workspace_id=workspace.id,
        project_id=proj1.id,
        creator_id=user.id,
        assignee_id=user.id,
        title="Implement human approval card for create_task tool",
        description="Show proposed action card with explicit Approve / Cancel actions.",
        status="TODO",
        priority="MEDIUM"
    )
    task4 = Task(
        workspace_id=workspace.id,
        project_id=proj2.id,
        creator_id=user.id,
        assignee_id=user.id,
        title="Configure SSE streaming for AI response status badges",
        description="Ensure user sees real-time progress indicators like 'Searching tasks...'.",
        status="COMPLETED",
        priority="LOW"
    )
    db.add_all([task1, task2, task3, task4])
    await db.commit()

    # 3. Sample Document & Chunks for RAG
    sample_doc_content = (
        "AI Work OS Architecture Specification.\n\n"
        "1. Overview: AI Work OS combines an Action Inbox, Project Management, and RAG-enabled AI Agent.\n"
        "2. Vector Security: Every vector query must filter by workspace_id first to prevent cross-tenant data leakage.\n"
        "3. Tool Approval: High-impact actions such as creating or updating tasks require explicit human approval via UI cards.\n"
        "4. Design System: Color tokens include Light (#F6F7F7) and Dark (#0E161A) modes with Inter typography."
    )

    doc = Document(
        workspace_id=workspace.id,
        filename="Architecture_Specification.txt",
        file_path="/uploads/Architecture_Specification.txt",
        file_size=len(sample_doc_content.encode('utf-8')),
        mime_type="text/plain",
        chunk_count=2
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    chunks = rag_service.chunk_text(sample_doc_content)
    for idx, c_text in enumerate(chunks):
        vec = rag_service.generate_embedding(c_text)
        chunk = DocumentChunk(
            document_id=doc.id,
            workspace_id=workspace.id,
            chunk_index=idx,
            content=c_text,
            embedding_json=json.dumps(vec)
        )
        db.add(chunk)
    await db.commit()

@router.get("/", response_model=List[WorkspaceOut])
async def list_workspaces(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Workspace, WorkspaceMember.role)
        .join(WorkspaceMember, Workspace.id == WorkspaceMember.workspace_id)
        .where(WorkspaceMember.user_id == current_user.id)
    )
    res = await db.execute(stmt)
    rows = res.all()

    workspaces_out = []
    for ws, role in rows:
        await seed_sample_data_if_needed(db, ws, current_user)
        ws_out = WorkspaceOut.model_validate(ws)
        ws_out.role = role
        workspaces_out.append(ws_out)

    if not workspaces_out:
        # Create default workspace if none
        ws = Workspace(
            name=f"{current_user.full_name}'s Workspace",
            slug=f"ws-{current_user.id[:8]}",
            owner_id=current_user.id
        )
        db.add(ws)
        await db.commit()
        await db.refresh(ws)

        member = WorkspaceMember(workspace_id=ws.id, user_id=current_user.id, role=WorkspaceRole.OWNER.value)
        db.add(member)
        await db.commit()

        await seed_sample_data_if_needed(db, ws, current_user)
        ws_out = WorkspaceOut.model_validate(ws)
        ws_out.role = WorkspaceRole.OWNER.value
        workspaces_out.append(ws_out)

    return workspaces_out

@router.post("/", response_model=WorkspaceOut)
async def create_workspace(ws_in: WorkspaceCreate, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    slug = ws_in.name.lower().replace(" ", "-")[:30]
    ws = Workspace(
        name=ws_in.name,
        slug=slug,
        owner_id=current_user.id
    )
    db.add(ws)
    await db.commit()
    await db.refresh(ws)

    member = WorkspaceMember(
        workspace_id=ws.id,
        user_id=current_user.id,
        role=WorkspaceRole.OWNER.value
    )
    db.add(member)
    await db.commit()

    await seed_sample_data_if_needed(db, ws, current_user)
    ws_out = WorkspaceOut.model_validate(ws)
    ws_out.role = WorkspaceRole.OWNER.value
    return ws_out
