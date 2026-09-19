import pytest
import asyncio

def test_config():
    from app.core.config import settings
    assert settings.PROJECT_NAME == "AI Work OS"

def test_rag_embedding_and_chunking():
    from app.agent.rag_service import rag_service
    text = "AI Work OS provides an Action Inbox and RAG vector search for workspace items."
    chunks = rag_service.chunk_text(text, chunk_size=5, overlap=1)
    assert len(chunks) > 0
    
    vec = rag_service.generate_embedding(text)
    assert len(vec) == 128
    
    sim = rag_service.cosine_similarity(vec, vec)
    assert sim > 0.99

def test_tool_registry():
    from app.agent.tool_registry import TOOL_SCHEMAS, APPROVAL_REQUIRED_TOOLS
    tool_names = [t["function"]["name"] for t in TOOL_SCHEMAS]
    assert "search_documents" in tool_names
    assert "create_task" in tool_names
    assert "create_task" in APPROVAL_REQUIRED_TOOLS
    assert "update_task" in APPROVAL_REQUIRED_TOOLS
