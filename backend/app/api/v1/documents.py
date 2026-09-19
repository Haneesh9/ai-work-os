import os
import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.db.session import get_db
from app.models import User, Document, DocumentChunk
from app.schemas import DocumentOut
from app.api.v1.auth import get_current_user
from app.agent.rag_service import rag_service
from app.core.config import settings

router = APIRouter()

@router.get("/", response_model=List[DocumentOut])
async def list_documents(
    workspace_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Document).where(Document.workspace_id == workspace_id).order_by(Document.created_at.desc())
    res = await db.execute(stmt)
    docs = res.scalars().all()
    return [DocumentOut.model_validate(d) for d in docs]

@router.post("/upload", response_model=DocumentOut)
async def upload_document(
    workspace_id: str = Query(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    save_path = os.path.join(settings.UPLOAD_DIR, f"{workspace_id}_{file.filename}")
    
    content_bytes = await file.read()
    with open(save_path, "wb") as f:
        f.write(content_bytes)

    try:
        text_content = content_bytes.decode("utf-8")
    except Exception:
        text_content = f"File content of {file.filename} (Binary / Raw file)"

    chunks = rag_service.chunk_text(text_content)
    
    doc = Document(
        workspace_id=workspace_id,
        filename=file.filename,
        file_path=save_path,
        file_size=len(content_bytes),
        mime_type=file.content_type or "text/plain",
        chunk_count=len(chunks)
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)

    # Generate embeddings and save document chunks for workspace RAG
    for idx, c_text in enumerate(chunks):
        vec = rag_service.generate_embedding(c_text)
        chunk = DocumentChunk(
            document_id=doc.id,
            workspace_id=workspace_id,
            chunk_index=idx,
            content=c_text,
            embedding_json=json.dumps(vec)
        )
        db.add(chunk)

    await db.commit()
    return DocumentOut.model_validate(doc)

@router.get("/{document_id}", response_model=DocumentOut)
async def get_document(
    document_id: str,
    workspace_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Document).where(Document.id == document_id, Document.workspace_id == workspace_id)
    res = await db.execute(stmt)
    doc = res.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return DocumentOut.model_validate(doc)

@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    workspace_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Document).where(Document.id == document_id, Document.workspace_id == workspace_id)
    res = await db.execute(stmt)
    doc = res.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    await db.delete(doc)
    await db.commit()
    return {"success": True, "message": "Document deleted"}
