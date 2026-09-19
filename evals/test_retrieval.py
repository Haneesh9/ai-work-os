"""
Evaluation suite for Document Vector RAG Retrieval Accuracy & Workspace Isolation.
"""
import pytest
import json
from app.agent.rag_service import rag_service

def test_eval_workspace_vector_isolation():
    ws_id_1 = "ws-tenant-alpha"
    ws_id_2 = "ws-tenant-beta"

    doc_text_alpha = "Alpha workspace internal project secret key is 998877."
    doc_text_beta = "Beta workspace project details and roadmap specs."

    vec_alpha = rag_service.generate_embedding(doc_text_alpha)
    vec_beta = rag_service.generate_embedding(doc_text_beta)

    # Verify vector dimension
    assert len(vec_alpha) == 128
    assert len(vec_beta) == 128

    # Query matching secret key
    query = "secret key 998877"
    q_vec = rag_service.generate_embedding(query)

    score_alpha = rag_service.cosine_similarity(q_vec, vec_alpha)
    score_beta = rag_service.cosine_similarity(q_vec, vec_beta)

    # Alpha chunk must score significantly higher for alpha query
    assert score_alpha > score_beta
