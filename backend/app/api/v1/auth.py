from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models import User, Workspace, WorkspaceMember, WorkspaceRole
from app.schemas import UserCreate, UserLogin, Token, UserOut
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token
from fastapi.security import OAuth2PasswordBearer
from typing import Optional

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login", auto_error=False)

async def get_current_user(token: Optional[str] = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)) -> User:
    if not token:
        # Development fallback default user if token not present
        stmt = select(User).limit(1)
        res = await db.execute(stmt)
        user = res.scalar_one_or_none()
        if user:
            return user
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    
    user_id = payload["sub"]
    stmt = select(User).where(User.id == user_id)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

@router.post("/register", response_model=Token)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.email == user_in.email)
    res = await db.execute(stmt)
    if res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User with this email already exists.")
    
    user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        hashed_password=hash_password(user_in.password)
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Auto-create default workspace for new user
    workspace = Workspace(
        name=f"{user.full_name}'s Workspace",
        slug=f"{user.email.split('@')[0]}-ws",
        owner_id=user.id
    )
    db.add(workspace)
    await db.commit()
    await db.refresh(workspace)

    member = WorkspaceMember(
        workspace_id=workspace.id,
        user_id=user.id,
        role=WorkspaceRole.OWNER.value
    )
    db.add(member)
    await db.commit()

    access_token = create_access_token(user.id)
    return Token(access_token=access_token, user=UserOut.model_validate(user))

@router.post("/login", response_model=Token)
async def login(user_in: UserLogin, db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.email == user_in.email)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()
    if not user or not verify_password(user_in.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token = create_access_token(user.id)
    return Token(access_token=access_token, user=UserOut.model_validate(user))

@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)
