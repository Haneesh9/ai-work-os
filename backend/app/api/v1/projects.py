from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List, Optional
from app.db.session import get_db
from app.models import User, Project, Task
from app.schemas import ProjectCreate, ProjectUpdate, ProjectOut
from app.api.v1.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[ProjectOut])
async def list_projects(
    workspace_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Project).where(Project.workspace_id == workspace_id).order_by(Project.created_at.desc())
    res = await db.execute(stmt)
    projects = res.scalars().all()

    result = []
    for p in projects:
        t_stmt = select(func.count(Task.id)).where(Task.project_id == p.id)
        t_res = await db.execute(t_stmt)
        task_count = t_res.scalar() or 0
        
        p_out = ProjectOut.model_validate(p)
        p_out.task_count = task_count
        result.append(p_out)

    return result

@router.post("/", response_model=ProjectOut)
async def create_project(
    workspace_id: str = Query(...),
    proj_in: ProjectCreate = ...,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    project = Project(
        workspace_id=workspace_id,
        name=proj_in.name,
        description=proj_in.description,
        status=proj_in.status or "ACTIVE",
        progress=0,
        blocker_count=0
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)
    
    p_out = ProjectOut.model_validate(project)
    p_out.task_count = 0
    return p_out

@router.get("/{project_id}", response_model=ProjectOut)
async def get_project(
    project_id: str,
    workspace_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Project).where(Project.id == project_id, Project.workspace_id == workspace_id)
    res = await db.execute(stmt)
    project = res.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    t_stmt = select(func.count(Task.id)).where(Task.project_id == project_id)
    t_res = await db.execute(t_stmt)
    task_count = t_res.scalar() or 0

    p_out = ProjectOut.model_validate(project)
    p_out.task_count = task_count
    return p_out

@router.patch("/{project_id}", response_model=ProjectOut)
async def update_project(
    project_id: str,
    proj_in: ProjectUpdate,
    workspace_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Project).where(Project.id == project_id, Project.workspace_id == workspace_id)
    res = await db.execute(stmt)
    project = res.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if proj_in.name is not None:
        project.name = proj_in.name
    if proj_in.description is not None:
        project.description = proj_in.description
    if proj_in.status is not None:
        project.status = proj_in.status
    if proj_in.progress is not None:
        project.progress = proj_in.progress

    await db.commit()
    await db.refresh(project)

    t_stmt = select(func.count(Task.id)).where(Task.project_id == project_id)
    t_res = await db.execute(t_stmt)
    task_count = t_res.scalar() or 0

    p_out = ProjectOut.model_validate(project)
    p_out.task_count = task_count
    return p_out
