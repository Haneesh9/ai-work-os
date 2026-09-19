from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.workspaces import router as workspaces_router
from app.api.v1.projects import router as projects_router
from app.api.v1.tasks import router as tasks_router
from app.api.v1.documents import router as documents_router
from app.api.v1.ai import router as ai_router

api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(workspaces_router, prefix="/workspaces", tags=["workspaces"])
api_router.include_router(projects_router, prefix="/projects", tags=["projects"])
api_router.include_router(tasks_router, prefix="/tasks", tags=["tasks"])
api_router.include_router(documents_router, prefix="/documents", tags=["documents"])
api_router.include_router(ai_router, prefix="/ai", tags=["ai"])
