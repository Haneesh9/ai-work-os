from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from typing import List, Optional
from app.db.session import get_db
from app.models import User, Task, Project
from app.schemas import TaskCreate, TaskUpdate, TaskOut
from app.api.v1.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[TaskOut])
async def list_tasks(
    workspace_id: str = Query(...),
    tab: Optional[str] = Query(None, description="All, assigned_to_me, mentioned, blocked, ai"),
    project_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Task, Project.name.label("project_name"))
        .outerjoin(Project, Task.project_id == Project.id)
        .where(Task.workspace_id == workspace_id)
        .order_by(Task.updated_at.desc())
    )

    if project_id:
        stmt = stmt.where(Task.project_id == project_id)
    if status:
        stmt = stmt.where(Task.status == status)
    if priority:
        stmt = stmt.where(Task.priority == priority)

    # Inbox Tab filtering logic matching PRD/Design doc section 7
    if tab == "assigned_to_me":
        stmt = stmt.where(Task.assignee_id == current_user.id)
    elif tab == "blocked":
        stmt = stmt.where(Task.status == "BLOCKED")
    elif tab == "ai":
        stmt = stmt.where(Task.description.ilike("%AI Assistant%"))

    res = await db.execute(stmt)
    rows = res.all()

    tasks_out = []
    for t, p_name in rows:
        to = TaskOut.model_validate(t)
        to.project_name = p_name
        to.assignee_name = current_user.full_name if t.assignee_id == current_user.id else "Teammate"
        tasks_out.append(to)

    return tasks_out

@router.post("/", response_model=TaskOut)
async def create_task(
    workspace_id: str = Query(...),
    task_in: TaskCreate = ...,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    task = Task(
        workspace_id=workspace_id,
        creator_id=current_user.id,
        title=task_in.title,
        description=task_in.description,
        project_id=task_in.project_id,
        status=task_in.status or "TODO",
        priority=task_in.priority or "MEDIUM",
        assignee_id=task_in.assignee_id or current_user.id,
        due_date=task_in.due_date
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)

    # Update blocker count if task is created as BLOCKED
    if task.project_id and task.status == "BLOCKED":
        p_stmt = select(Project).where(Project.id == task.project_id)
        p_res = await db.execute(p_stmt)
        p = p_res.scalar_one_or_none()
        if p:
            p.blocker_count += 1
            await db.commit()

    p_name = None
    if task.project_id:
        p_res = await db.execute(select(Project.name).where(Project.id == task.project_id))
        p_name = p_res.scalar()

    to = TaskOut.model_validate(task)
    to.project_name = p_name
    to.assignee_name = current_user.full_name
    return to

@router.get("/{task_id}", response_model=TaskOut)
async def get_task(
    task_id: str,
    workspace_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Task, Project.name.label("project_name"))
        .outerjoin(Project, Task.project_id == Project.id)
        .where(Task.id == task_id, Task.workspace_id == workspace_id)
    )
    res = await db.execute(stmt)
    row = res.first()
    if not row:
        raise HTTPException(status_code=404, detail="Task not found")

    t, p_name = row
    to = TaskOut.model_validate(t)
    to.project_name = p_name
    to.assignee_name = current_user.full_name if t.assignee_id == current_user.id else "Teammate"
    return to

@router.patch("/{task_id}", response_model=TaskOut)
async def update_task(
    task_id: str,
    task_in: TaskUpdate,
    workspace_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Task).where(Task.id == task_id, Task.workspace_id == workspace_id)
    res = await db.execute(stmt)
    task = res.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    old_status = task.status

    if task_in.title is not None:
        task.title = task_in.title
    if task_in.description is not None:
        task.description = task_in.description
    if task_in.project_id is not None:
        task.project_id = task_in.project_id
    if task_in.status is not None:
        task.status = task_in.status
    if task_in.priority is not None:
        task.priority = task_in.priority
    if task_in.assignee_id is not None:
        task.assignee_id = task_in.assignee_id
    if task_in.due_date is not None:
        task.due_date = task_in.due_date

    await db.commit()
    await db.refresh(task)

    # Sync blocker count if status changed to/from BLOCKED
    if task.project_id and old_status != task.status:
        p_res = await db.execute(select(Project).where(Project.id == task.project_id))
        p = p_res.scalar_one_or_none()
        if p:
            if old_status == "BLOCKED" and task.status != "BLOCKED":
                p.blocker_count = max(0, p.blocker_count - 1)
            elif old_status != "BLOCKED" and task.status == "BLOCKED":
                p.blocker_count += 1
            await db.commit()

    p_name = None
    if task.project_id:
        p_res = await db.execute(select(Project.name).where(Project.id == task.project_id))
        p_name = p_res.scalar()

    to = TaskOut.model_validate(task)
    to.project_name = p_name
    to.assignee_name = current_user.full_name if task.assignee_id == current_user.id else "Teammate"
    return to

@router.delete("/{task_id}")
async def delete_task(
    task_id: str,
    workspace_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Task).where(Task.id == task_id, Task.workspace_id == workspace_id)
    res = await db.execute(stmt)
    task = res.scalar_one_or_none()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")

    await db.delete(task)
    await db.commit()
    return {"success": True, "message": "Task deleted"}
