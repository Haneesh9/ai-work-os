import json
import logging
from typing import AsyncGenerator, Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models import Conversation, Message, ToolCall, ToolStatus
from app.agent.llm_provider import llm_provider
from app.agent.tool_registry import TOOL_SCHEMAS, APPROVAL_REQUIRED_TOOLS, tool_executor

logger = logging.getLogger(__name__)

class AgentLoop:
    """Orchestrates AI Agent loop, context assembly, tool calling & human approval flow."""

    async def run(
        self,
        db: AsyncSession,
        workspace_id: str,
        user_id: str,
        conversation_id: str,
        user_message: str,
        document_id: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        
        # 1. Fetch conversation history
        conv_stmt = select(Conversation).where(Conversation.id == conversation_id, Conversation.workspace_id == workspace_id)
        conv_res = await db.execute(conv_stmt)
        conversation = conv_res.scalar_one_or_none()
        
        if not conversation:
            conversation = Conversation(
                id=conversation_id,
                workspace_id=workspace_id,
                user_id=user_id,
                title=user_message[:30] if user_message else "New Conversation"
            )
            db.add(conversation)
            await db.commit()

        # Save user message to database
        user_msg_db = Message(
            conversation_id=conversation_id,
            role="user",
            content=user_message
        )
        db.add(user_msg_db)
        await db.commit()

        # Fetch recent messages for LLM context window
        msgs_stmt = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
        )
        msgs_res = await db.execute(msgs_stmt)
        history_msgs = msgs_res.scalars().all()

        formatted_messages = [
            {
                "role": "system",
                "content": (
                    "You are AI Work OS Assistant, an intelligent productivity agent embedded in a workspace. "
                    "You have direct access to tools for workspace tasks, projects, and document retrieval. "
                    "Always provide concise, grounded answers. Use tools when needed to query workspace data."
                )
            }
        ]

        # If document context is specified, append hint
        if document_id:
            formatted_messages[0]["content"] += f" User is currently viewing document ID: {document_id}."

        for m in history_msgs:
            formatted_messages.append({"role": m.role, "content": m.content})

        # Yield status: Thinking
        yield json.dumps({"type": "status", "content": "Analyzing request..."}) + "\n"

        # 2. Invoke LLM with tools
        llm_resp = await llm_provider.generate_response(formatted_messages, tools=TOOL_SCHEMAS)
        content = llm_resp.get("content", "")
        tool_calls = llm_resp.get("tool_calls", [])

        # 3. Check if tool calls were requested
        if tool_calls:
            for tc in tool_calls:
                func = tc.get("function", {})
                tool_name = func.get("name")
                arguments = func.get("arguments", {})

                # If arguments is string, parse json
                if isinstance(arguments, str):
                    try:
                        arguments = json.loads(arguments)
                    except Exception:
                        arguments = {}

                yield json.dumps({"type": "status", "content": f"Executing tool: {tool_name}..."}) + "\n"

                # Check if human approval is required
                if tool_name in APPROVAL_REQUIRED_TOOLS:
                    # Create ToolCall record in DB with PENDING_APPROVAL
                    tool_call_record = ToolCall(
                        conversation_id=conversation_id,
                        tool_name=tool_name,
                        arguments_json=json.dumps(arguments),
                        status=ToolStatus.PENDING_APPROVAL.value,
                        requires_approval=True
                    )
                    db.add(tool_call_record)
                    await db.commit()
                    await db.refresh(tool_call_record)

                    # Save Assistant Message with Approval Card reference
                    asst_msg = Message(
                        conversation_id=conversation_id,
                        role="assistant",
                        content=content or f"I need your approval to execute `{tool_name}`.",
                        tool_calls_json=json.dumps([{
                            "id": tool_call_record.id,
                            "tool_name": tool_name,
                            "arguments": arguments,
                            "status": "PENDING_APPROVAL",
                            "requires_approval": True
                        }])
                    )
                    db.add(asst_msg)
                    await db.commit()

                    # Stream tool approval request event to frontend UI
                    yield json.dumps({
                        "type": "tool_approval_required",
                        "tool_call_id": tool_call_record.id,
                        "tool_name": tool_name,
                        "arguments": arguments,
                        "message": content or f"Prepared {tool_name} for approval."
                    }) + "\n"
                    return

                else:
                    # Execute read-only tool immediately
                    tool_result = await tool_executor.execute_tool(
                        tool_name, arguments, workspace_id, user_id, db
                    )

                    sources = []
                    if tool_name == "search_documents":
                        docs = tool_result.get("documents", [])
                        sources = [{"type": "document", "id": d["document_id"], "title": d["filename"], "snippet": d["content"][:100]} for d in docs]

                    # Append tool result to context and re-query LLM for final answer
                    formatted_messages.append({"role": "assistant", "content": f"Used tool {tool_name}"})
                    formatted_messages.append({"role": "user", "content": f"Tool {tool_name} output: {json.dumps(tool_result)}"})

                    final_resp = await llm_provider.generate_response(formatted_messages)
                    final_text = final_resp.get("content", f"Retrieved results: {json.dumps(tool_result)}")

                    # Save assistant message
                    asst_msg = Message(
                        conversation_id=conversation_id,
                        role="assistant",
                        content=final_text,
                        tool_calls_json=json.dumps([{
                            "tool_name": tool_name,
                            "arguments": arguments,
                            "result": tool_result,
                            "status": "EXECUTED"
                        }]),
                        sources_json=json.dumps(sources)
                    )
                    db.add(asst_msg)
                    await db.commit()

                    yield json.dumps({
                        "type": "message",
                        "content": final_text,
                        "sources": sources,
                        "tool_calls": [{
                            "tool_name": tool_name,
                            "arguments": arguments,
                            "status": "EXECUTED"
                        }]
                    }) + "\n"
                    return

        # 4. Standard conversational response
        asst_msg = Message(
            conversation_id=conversation_id,
            role="assistant",
            content=content
        )
        db.add(asst_msg)
        await db.commit()

        yield json.dumps({"type": "message", "content": content}) + "\n"

agent_loop = AgentLoop()
