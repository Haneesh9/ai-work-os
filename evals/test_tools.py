"""
Evaluation suite for AI Tool Selection & Human Approval Classification.
"""
from app.agent.tool_registry import TOOL_SCHEMAS, APPROVAL_REQUIRED_TOOLS

def test_eval_tool_schemas_validity():
    tool_names = set(t["function"]["name"] for t in TOOL_SCHEMAS)
    expected_tools = {
        "search_documents",
        "search_tasks",
        "get_task",
        "create_task",
        "update_task",
        "search_projects",
        "get_project",
        "summarize_project"
    }
    assert expected_tools.issubset(tool_names)

def test_eval_human_approval_classification():
    # Write actions MUST require approval
    assert "create_task" in APPROVAL_REQUIRED_TOOLS
    assert "update_task" in APPROVAL_REQUIRED_TOOLS

    # Read-only actions MUST NOT require approval
    assert "search_documents" not in APPROVAL_REQUIRED_TOOLS
    assert "search_tasks" not in APPROVAL_REQUIRED_TOOLS
    assert "get_project" not in APPROVAL_REQUIRED_TOOLS
