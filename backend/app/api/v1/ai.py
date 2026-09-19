import json
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from app.db.session import get_db
from app.models import User, Conversation, Message, ToolCall, ToolStatus
from app.schemas import AIChatRequest, AIApprovalAction, ConversationOut, MessageOut, ToolCallOut
from app.api.v1.auth import get_current_user
from app.agent.agent_loop import agent_loop
from app.agent.tool_registry import tool_executor

router = APIRouter()

@router.post("/chat/stream")
async def chat_stream(
    req: AIChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    conv_id = req.conversation_id or f"conv-{current_user.id[:8]}"

    async def event_generator():
        async for chunk in agent_loop.run(
            db=db,
            workspace_id=req.workspace_id,
            user_id=current_user.id,
            conversation_id=conv_id,
            user_message=req.message,
            document_id=req.document_id
        ):
            yield f"data: {chunk}\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.get("/conversations", response_model=List[ConversationOut])
async def list_conversations(
    workspace_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Conversation).where(Conversation.workspace_id == workspace_id, Conversation.user_id == current_user.id).order_by(Conversation.updated_at.desc())
    res = await db.execute(stmt)
    convs = res.scalars().all()
    return [ConversationOut.model_validate(c) for c in convs]

@router.get("/conversations/{conversation_id}", response_model=ConversationOut)
async def get_conversation(
    conversation_id: str,
    workspace_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Conversation).where(Conversation.id == conversation_id, Conversation.workspace_id == workspace_id)
    res = await db.execute(stmt)
    conv = res.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    m_stmt = select(Message).where(Message.conversation_id == conversation_id).order_by(Message.created_at.asc())
    m_res = await db.execute(m_stmt)
    msgs = m_res.scalars().all()

    msgs_out = []
    for m in msgs:
        mo = MessageOut(
            id=m.id,
            role=m.role,
            content=m.content,
            tool_calls=json.loads(m.tool_calls_json) if m.tool_calls_json else [],
            sources=json.loads(m.sources_json) if m.sources_json else [],
            created_at=m.created_at
        )
        msgs_out.append(mo)

    co = ConversationOut.model_validate(conv)
    co.messages = msgs_out
    return co

@router.get("/approvals", response_model=List[ToolCallOut])
async def list_pending_approvals(
    workspace_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(ToolCall)
        .join(Conversation, ToolCall.conversation_id == Conversation.id)
        .where(Conversation.workspace_id == workspace_id, ToolCall.status == ToolStatus.PENDING_APPROVAL.value)
        .order_by(ToolCall.created_at.desc())
    )
    res = await db.execute(stmt)
    tool_calls = res.scalars().all()

    results = []
    for tc in tool_calls:
        results.append(ToolCallOut(
            id=tc.id,
            conversation_id=tc.conversation_id,
            tool_name=tc.tool_name,
            arguments=json.loads(tc.arguments_json) if tc.arguments_json else {},
            status=tc.status,
            requires_approval=tc.requires_approval,
            created_at=tc.created_at
        ))
    return results

@router.post("/approvals/{tool_call_id}/action")
async def action_pending_approval(
    tool_call_id: str,
    action: AIApprovalAction,
    workspace_id: str = Query(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(ToolCall).where(ToolCall.id == tool_call_id)
    res = await db.execute(stmt)
    tc = res.scalar_one_or_none()
    if not tc:
        raise HTTPException(status_code=404, detail="Tool call not found")

    args = json.loads(tc.arguments_json) if tc.arguments_json else {}

    if action.approval:
        # Execute tool call
        result = await tool_executor.execute_tool(
            tc.tool_name, args, workspace_id, current_user.id, db
        )
        tc.status = ToolStatus.EXECUTED.value
        tc.result_json = json.dumps(result)
        await db.commit()

        # Save result message to conversation
        asst_msg = Message(
            conversation_id=tc.conversation_id,
            role="assistant",
            content=f"Approved and executed `{tc.tool_name}`: {result.get('message', json.dumps(result))}",
            tool_calls_json=json.dumps([{
                "id": tc.id,
                "tool_name": tc.tool_name,
                "arguments": args,
                "result": result,
                "status": "EXECUTED"
            }])
        )
        db.add(asst_msg)
        await db.commit()

        return {"success": True, "status": "APPROVED", "result": result}
    else:
        tc.status = ToolStatus.DENIED.value
        tc.result_json = json.dumps({"message": "User denied action"})
        await db.commit()

        asst_msg = Message(
            conversation_id=tc.conversation_id,
            role="assistant",
            content=f"Action `{tc.tool_name}` was cancelled by user.",
            tool_calls_json=json.dumps([{
                "id": tc.id,
                "tool_name": tc.tool_name,
                "arguments": args,
                "status": "DENIED"
            }])
        )
        db.add(asst_msg)
        await db.commit()

        return {"success": True, "status": "DENIED"}
