import httpx
import json
import logging
from typing import AsyncGenerator, Dict, Any, List, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class LLMProvider:
    """Ollama client with fallback mock simulator for development without live Ollama instance."""
    
    def __init__(self):
        self.ollama_url = settings.OLLAMA_URL
        self.model = settings.OLLAMA_MODEL

    async def generate_response(self, messages: List[Dict[str, str]], tools: Optional[List[Dict[str, Any]]] = None) -> Dict[str, Any]:
        """Call Ollama API or fallback simulator."""
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                payload = {
                    "model": self.model,
                    "messages": messages,
                    "stream": False
                }
                if tools:
                    payload["tools"] = tools

                response = await client.post(f"{self.ollama_url}/api/chat", json=payload)
                if response.status_code == 200:
                    data = response.json()
                    message = data.get("message", {})
                    return {
                        "content": message.get("content", ""),
                        "tool_calls": message.get("tool_calls", [])
                    }
        except Exception as e:
            logger.info(f"Ollama API not available ({e}), using fallback agent logic.")

        # Smart fallback agent logic if Ollama is unreachable
        last_user_msg = ""
        for m in reversed(messages):
            if m.get("role") == "user":
                last_user_msg = m.get("content", "").lower()
                break

        # Check for tool triggers based on user prompt intent
        if "create task" in last_user_msg or "add task" in last_user_msg or "new task" in last_user_msg:
            # Extract possible title
            title = "Follow up on workspace items"
            if "task for" in last_user_msg:
                title = last_user_msg.split("task for")[-1].strip().capitalize()
            elif "task to" in last_user_msg:
                title = last_user_msg.split("task to")[-1].strip().capitalize()

            return {
                "content": "I can help you create that task. I have prepared the task creation tool call below for your approval.",
                "tool_calls": [
                    {
                        "function": {
                            "name": "create_task",
                            "arguments": {
                                "title": title,
                                "description": f"Created via AI Assistant based on user prompt: '{last_user_msg}'",
                                "priority": "HIGH" if "urgent" in last_user_msg else "MEDIUM"
                            }
                        }
                    }
                ]
            }

        elif "search document" in last_user_msg or "doc" in last_user_msg or "file" in last_user_msg or "read" in last_user_msg or "what does" in last_user_msg or "explain" in last_user_msg:
            query = last_user_msg.replace("search document", "").replace("search", "").strip() or "project details"
            return {
                "content": f"Searching workspace documents for relevant information on '{query}'...",
                "tool_calls": [
                    {
                        "function": {
                            "name": "search_documents",
                            "arguments": {"query": query}
                        }
                    }
                ]
            }

        elif "blocked" in last_user_msg or "search task" in last_user_msg or "find task" in last_user_msg or "my task" in last_user_msg:
            status = "BLOCKED" if "blocked" in last_user_msg else None
            return {
                "content": "Checking workspace tasks to inspect task status and details...",
                "tool_calls": [
                    {
                        "function": {
                            "name": "search_tasks",
                            "arguments": {
                                "query": last_user_msg,
                                "status": status
                            }
                        }
                    }
                ]
            }

        elif "project" in last_user_msg or "summarize" in last_user_msg:
            return {
                "content": "Checking workspace projects...",
                "tool_calls": [
                    {
                        "function": {
                            "name": "search_projects",
                            "arguments": {"query": last_user_msg}
                        }
                    }
                ]
            }

        else:
            return {
                "content": f"I analyzed your request in this workspace. How can I assist you with your tasks, projects, or documents today?",
                "tool_calls": []
            }

llm_provider = LLMProvider()
