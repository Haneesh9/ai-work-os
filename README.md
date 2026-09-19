# AI Work OS — Operating System of the Workspace

**AI Work OS** is an AI-native workspace and operating system that combines an **Action Inbox**, **Project Management**, **Grounded Document Vector RAG**, and an autonomous **Local AI Agent** with explicit tool-calling capabilities and interactive **Human Approval Workflows**.

---

## 🏗️ Architecture & Monorepo Structure

```
ai work os/
├── frontend/                 # Next.js (App Router, Tailwind CSS, TypeScript, Lucide Icons)
├── backend/                  # FastAPI (Python 3.11+, SQLAlchemy 2.0 async, PostgreSQL + pgvector, Pydantic v2)
│   ├── app/
│   │   ├── api/v1/           # Versioned REST & SSE APIs (Auth, Workspaces, Projects, Tasks, Documents, AI)
│   │   ├── core/             # JWT Security, Password hashing, Config settings
│   │   ├── db/               # Async SQLAlchemy session & pgvector init
│   │   ├── models/           # DB Models (Users, Workspaces, Projects, Tasks, Documents, Chunks, ToolCalls)
│   │   ├── agent/            # Custom Python Agent Loop, Tool Registry, Approval Engine & RAG Service
│   │   └── main.py           # FastAPI entrypoint
│   └── tests/                # Pytest unit & integration test suite
├── evals/                    # Evaluation suite for retrieval, tools & answer accuracy
├── docker/                   # Dockerfiles for Backend & Frontend
├── docker-compose.yml        # Docker composition (Postgres + pgvector, Ollama, Backend, Frontend)
├── .env.example              # Environment variables template
└── README.md
```

---

## ✨ Key Features

1. **3-Pane Split View Layout**:
   - **Zone 1: Navigation Sidebar**: Workspace selector, Action Inbox, My Tasks, Projects, Documents, Settings, Theme toggle.
   - **Zone 2: Action Inbox & Operating System**: Email-style scannable rows with tabs (`All`, `Assigned to me`, `Blocked`, `AI Actions`), priority tags (`URGENT`, `HIGH`, `MEDIUM`, `LOW`), and Task Drawer overlay.
   - **Zone 3: Collapsible AI Assistant Panel**: Real-time SSE streaming, safe user-facing status indicators (`"Searching workspace tasks..."`), grounded citations, and interactive **Human Approval Cards**.

2. **Autonomous Local Agent with Tool Execution**:
   - Read-only tools (`search_documents`, `search_tasks`, `get_task`, `search_projects`, `get_project`, `summarize_project`) execute automatically with safe status badges.
   - Consequential write tools (`create_task`, `update_task`) require explicit **Human Approval** (`Approve` / `Cancel`) before executing.

3. **Workspace-Isolated Vector RAG**:
   - Document upload, automatic text chunking, and embedding generation.
   - All vector semantic searches enforce strict `workspace_id` filtering prior to ranking, guaranteeing zero cross-tenant data leakage.

4. **Command Palette (`Cmd+K` / `Ctrl+K`)**:
   - Global modal search across workspace tasks, projects, documents, and rapid AI prompt generation.

---

## 🚀 Quick Start Guide

### 1. Running Backend (FastAPI)
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
- Interactive API Docs: `http://localhost:8000/docs`

### 2. Running Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
- Open Web Application: `http://localhost:3000`

### 3. Running with Docker Compose
```bash
docker-compose up --build
```

---

## 🧪 Running Tests & Evaluation Suite

### Backend Pytest Suite
```bash
cd backend
python3 -m pytest tests/
```

### Retrieval & Tool Evals
```bash
PYTHONPATH=backend python3 -m pytest evals/
```

---

## 🎨 Design Tokens & Palette

- **Light Mode**: Background `#F6F7F7`, Surface `#FFFFFF`, Border `#DDE2E3`, Text `#0E161A`, Accent `#65749E`, AI Accent `#BDB2CE`
- **Dark Mode**: Background `#0E161A`, Surface `#151D21`, Border `#29343A`, Text `#E7EAEA`
