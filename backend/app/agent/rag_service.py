import json
import math
import re
from typing import List, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import Document, DocumentChunk

class RAGService:
    """Document text extraction, chunking, embedding & workspace-isolated vector search."""

    @staticmethod
    def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
        """Split text into overlapping chunks."""
        words = text.split()
        if not words:
            return []
        
        chunks = []
        i = 0
        while i < len(words):
            chunk = " ".join(words[i:i + chunk_size])
            chunks.append(chunk)
            i += (chunk_size - overlap)
        return chunks

    @staticmethod
    def generate_embedding(text: str, dim: int = 128) -> List[float]:
        """Generate a normalized pseudo-embedding vector for text (fallback when live embedding model is offline)."""
        vec = [0.0] * dim
        tokens = re.findall(r'\w+', text.lower())
        for token in tokens:
            idx = hash(token) % dim
            vec[idx] += 1.0
        
        # Normalize
        norm = math.sqrt(sum(x * x for x in vec))
        if norm > 0:
            vec = [x / norm for x in vec]
        return vec

    @staticmethod
    def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
        if not vec1 or not vec2 or len(vec1) != len(vec2):
            return 0.0
        dot = sum(a * b for a, b in zip(vec1, vec2))
        return dot

    async def search_workspace_documents(
        self,
        db: AsyncSession,
        workspace_id: str,
        query: str,
        top_k: int = 4
    ) -> List[Dict[str, Any]]:
        """Perform workspace-filtered semantic search over document chunks."""
        # STAGE 1: Strict workspace filtering query
        stmt = (
            select(DocumentChunk, Document.filename)
            .join(Document, DocumentChunk.document_id == Document.id)
            .where(DocumentChunk.workspace_id == workspace_id)
        )
        result = await db.execute(stmt)
        rows = result.all()

        query_vec = self.generate_embedding(query)
        scored_chunks = []

        query_keywords = set(re.findall(r'\w+', query.lower()))

        for chunk, filename in rows:
            chunk_vec = json.loads(chunk.embedding_json) if chunk.embedding_json else []
            sim = self.cosine_similarity(query_vec, chunk_vec)
            
            # Keyword match boost
            chunk_keywords = set(re.findall(r'\w+', chunk.content.lower()))
            overlap = len(query_keywords.intersection(chunk_keywords))
            if overlap > 0:
                sim += 0.2 * (overlap / max(len(query_keywords), 1))

            scored_chunks.append({
                "chunk_id": chunk.id,
                "document_id": chunk.document_id,
                "filename": filename,
                "content": chunk.content,
                "score": round(sim, 4)
            })

        # Sort by similarity score descending
        scored_chunks.sort(key=lambda x: x["score"], reverse=True)
        return scored_chunks[:top_k]

rag_service = RAGService()
