from typing import Dict, Any, List, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.models import Task, Project, Document, User
from app.agent.rag_service import rag_service

# Tools that require explicit human approval before execution
APPROVAL_REQUIRED_TOOLS = {"create_task", "update_task"}

TOOL_SCHEMAS = [
    {
        "type": "function",
        "function": {
            "name": "search_documents",
            "description": "Search workspace documents for grounding information and evidence.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "The search query term"}
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_tasks",
            "description": "Search or filter tasks in the active workspace.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Keyword to search in task title or description"},
                    "status": {"type": "string", "enum": ["TODO", "IN_PROGRESS", "BLOCKED", "COMPLETED"]},
                    "priority": {"type": "string", "enum": ["LOW", "MEDIUM", "HIGH", "URGENT"]},
                    "project_id": {"type": "string", "description": "Filter by project ID"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_task",
            "description": "Retrieve full details of a specific task by ID.",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id": {"type": "string", "description": "The task ID"}
                },
                "required": ["task_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_task",
            "description": "Create a new task in the active workspace (Requires approval).",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {"type": "string", "description": "Task title"},
                    "description": {"type": "string", "description": "Task description"},
                    "project_id": {"type": "string", "description": "Optional project ID"},
                    "priority": {"type": "string", "enum": ["LOW", "MEDIUM", "HIGH", "URGENT"]},
                    "status": {"type": "string", "enum": ["TODO", "IN_PROGRESS", "BLOCKED", "COMPLETED"]}
                },
                "required": ["title"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "update_task",
            "description": "Update an existing task in the workspace (Requires approval).",
            "parameters": {
                "type": "object",
                "properties": {
                    "task_id": {"type": "string", "description": "The ID of the task to update"},
                    "title": {"type": "string"},
                    "description": {"type": "string"},
                    "status": {"type": "string", "enum": ["TODO", "IN_PROGRESS", "BLOCKED", "COMPLETED"]},
                    "priority": {"type": "string", "enum": ["LOW", "MEDIUM", "HIGH", "URGENT"]}
                },
                "required": ["task_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_projects",
            "description": "Search projects in the workspace.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Project title or search query"}
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_project",
            "description": "Retrieve project overview, tasks and status.",
            "parameters": {
                "type": "object",
                "properties": {
                    "project_id": {"type": "string", "description": "The project ID"}
                },
                "required": ["project_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "summarize_project",
            "description": "Get a summary of project status, open tasks and blockers.",
            "parameters": {
                "type": "object",
                "properties": {
                    "project_id": {"type": "string", "description": "Project ID"}
                },
                "required": ["project_id"]
            }
        }
    }
]

class ToolExecutor:
    """Executes validated tool calls against database with workspace scoping."""

    @staticmethod
    async def execute_tool(
        tool_name: str,
        arguments: Dict[str, Any],
        workspace_id: str,
        user_id: str,
        db: AsyncSession
    ) -> Dict[str, Any]:
        
        if tool_name == "search_documents":
            query = arguments.get("query", "")
            results = await rag_service.search_workspace_documents(db, workspace_id, query)
            return {"query": query, "found_count": len(results), "documents": results}

        elif tool_name == "search_tasks":
            stmt = select(Task).where(Task.workspace_id == workspace_id)
            query_str = arguments.get("query")
            if query_str:
                stmt = stmt.where(or_(Task.title.ilike(f"%{query_str}%"), Task.description.ilike(f"%{query_str}%")))
            if arguments.get("status"):
                stmt = stmt.where(Task.status == arguments["status"])
            if arguments.get("priority"):
                stmt = stmt.where(Task.priority == arguments["priority"])
            if arguments.get("project_id"):
                stmt = stmt.where(Task.project_id == arguments["project_id"])

            res = await db.execute(stmt)
            tasks = res.scalars().all()
            return {
                "count": len(tasks),
                "tasks": [
                    {
                        "id": t.id,
                        "title": t.title,
                        "status": t.status,
                        "priority": t.priority,
                        "description": t.description,
                        "project_id": t.project_id
                    } for t in tasks
                ]
            }

        elif tool_name == "get_task":
            task_id = arguments.get("task_id")
            stmt = select(Task).where(Task.id == task_id, Task.workspace_id == workspace_id)
            res = await db.execute(stmt)
            task = res.scalar_one_or_none()
            if not task:
                return {"error": f"Task {task_id} not found in this workspace."}
            return {
                "id": task.id,
                "title": task.title,
                "description": task.description,
                "status": task.status,
                "priority": task.priority,
                "project_id": task.project_id,
                "assignee_id": task.assignee_id
            }

        elif tool_name == "create_task":
            new_task = Task(
                workspace_id=workspace_id,
                creator_id=user_id,
                title=arguments.get("title"),
                description=arguments.get("description", ""),
                project_id=arguments.get("project_id"),
                status=arguments.get("status", "TODO"),
                priority=arguments.get("priority", "MEDIUM")
            )
            db.add(new_task)
            await db.commit()
            await db.refresh(new_task)

            # If task status is BLOCKED, update project blocker count if project linked
            if new_task.project_id and new_task.status == "BLOCKED":
                p_stmt = select(Project).where(Project.id == new_task.project_id)
                p_res = await db.execute(p_stmt)
                p = p_res.scalar_one_or_none()
                if p:
                    p.blocker_count += 1
                    await db.commit()

            return {
                "success": True,
                "task_id": new_task.id,
                "title": new_task.title,
                "status": new_task.status,
                "priority": new_task.priority,
                "message": f"Task '{new_task.title}' created successfully."
            }

        elif tool_name == "update_task":
            task_id = arguments.get("task_id")
            stmt = select(Task).where(Task.id == task_id, Task.workspace_id == workspace_id)
            res = await db.execute(stmt)
            task = res.scalar_one_or_none()
            if not task:
                return {"error": f"Task {task_id} not found."}

            if "title" in arguments:
                task.title = arguments["title"]
            if "description" in arguments:
                task.description = arguments["description"]
            if "status" in arguments:
                task.status = arguments["status"]
            if "priority" in arguments:
                task.priority = arguments["priority"]

            await db.commit()
            await db.refresh(task)
            return {
                "success": True,
                "task_id": task.id,
                "title": task.title,
                "status": task.status,
                "priority": task.priority,
                "message": f"Task '{task.title}' updated successfully."
            }

        elif tool_name == "search_projects":
            stmt = select(Project).where(Project.workspace_id == workspace_id)
            q = arguments.get("query")
            if q:
                stmt = stmt.where(Project.name.ilike(f"%{q}%"))
            res = await db.execute(stmt)
            projects = res.scalars().all()
            return {
                "count": len(projects),
                "projects": [
                    {
                        "id": p.id,
                        "name": p.name,
                        "status": p.status,
                        "progress": p.progress,
                        "blocker_count": p.blocker_count
                    } for p in projects
                ]
            }

        elif tool_name == "get_project" or tool_name == "summarize_project":
            project_id = arguments.get("project_id")
            stmt = select(Project).where(Project.id == project_id, Project.workspace_id == workspace_id)
            res = await db.execute(stmt)
            project = res.scalar_one_or_none()
            if not project:
                return {"error": f"Project {project_id} not found."}

            # Fetch tasks for project
            t_stmt = select(Task).where(Task.project_id == project_id)
            t_res = await db.execute(t_stmt)
            tasks = t_res.scalars().all()

            blocked_tasks = [t for t in tasks if t.status == "BLOCKED"]
            completed_tasks = [t for t in tasks if t.status == "COMPLETED"]

            return {
                "id": project.id,
                "name": project.name,
                "description": project.description,
                "status": project.status,
                "progress": project.progress,
                "total_tasks": len(tasks),
                "completed_tasks": len(completed_tasks),
                "blocked_tasks": len(blocked_tasks),
                "blocker_list": [{"id": t.id, "title": t.title} for t in blocked_tasks]
            }

        else:
            return {"error": f"Unknown tool name: {tool_name}"}

tool_executor = ToolExecutor()
