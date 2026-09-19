"""
Live verification script for AI Work OS RAG, tool calling, and human approval flow.
"""
import asyncio
import json
from app.db.session import AsyncSessionLocal, init_db
from app.models import User, Workspace, Task, Document
from app.agent.agent_loop import agent_loop
from app.agent.tool_registry import tool_executor
from app.agent.rag_service import rag_service
from app.api.v1.workspaces import seed_sample_data_if_needed

async def run_live_verification():
    await init_db()
    async with AsyncSessionLocal() as db:
        # 1. Fetch test workspace
        from sqlalchemy import select
        res = await db.execute(select(Workspace).limit(1))
        ws = res.scalar_one_or_none()
        
        user_res = await db.execute(select(User).limit(1))
        user = user_res.scalar_one_or_none()

        if not ws or not user:
            user = User(email="test@aiworkos.com", full_name="Test Specialist", hashed_password="pwd")
            db.add(user)
            await db.commit()
            await db.refresh(user)

            ws = Workspace(name="Test Workspace", slug="test-ws", owner_id=user.id)
            db.add(ws)
            await db.commit()
            await db.refresh(ws)

        await seed_sample_data_if_needed(db, ws, user)

        print("\n==================================================")
        print("1. VERIFYING RAG DOCUMENT VECTOR SEARCH")
        print("==================================================")
        docs = await rag_service.search_workspace_documents(db, ws.id, "vector security multi tenant")
        print(f"RAG search returned {len(docs)} document chunks:")
        for d in docs:
            print(f" - [{d['filename']}] Score: {d['score']} | Snippet: {d['content'][:80]}...")

        print("\n==================================================")
        print("2. VERIFYING AI AGENT TOOL CALLING & APPROVAL CARD GENERATION")
        print("==================================================")
        prompts = [
            "What are the blocked tasks in this workspace?",
            "Create a high priority task to audit pgvector indexes"
        ]

        for p in prompts:
            print(f"\nUser Prompt: '{p}'")
            async for sse_event in agent_loop.run(
                db=db,
                workspace_id=ws.id,
                user_id=user.id,
                conversation_id=f"test-conv-{ws.id[:6]}",
                user_message=p
            ):
                event_data = json.loads(sse_event)
                print(f" -> SSE Event Type: {event_data.get('type')}")
                if event_data.get("type") == "tool_approval_required":
                    print(f"    [APPROVAL CARD GENERATED] Tool: {event_data.get('tool_name')}")
                    print(f"    [ARGUMENTS] {event_data.get('arguments')}")
                    
                    # Test execution of tool approval
                    exec_res = await tool_executor.execute_tool(
                        event_data.get('tool_name'),
                        event_data.get('arguments'),
                        ws.id,
                        user.id,
                        db
                    )
                    print(f"    [TOOL EXECUTED RESULT] {exec_res.get('message')}")
                elif event_data.get("type") == "message":
                    print(f"    [AI RESPONSE] {event_data.get('content')[:120]}...")

        print("\n==================================================")
        print("3. VERIFYING TASK PERSISTENCE IN DATABASE")
        print("==================================================")
        t_res = await db.execute(select(Task).where(Task.workspace_id == ws.id))
        all_tasks = t_res.scalars().all()
        print(f"Total tasks in workspace: {len(all_tasks)}")
        for t in all_tasks:
            print(f" - [{t.status}] [{t.priority}] {t.title}")

if __name__ == "__main__":
    asyncio.run(run_live_verification())
