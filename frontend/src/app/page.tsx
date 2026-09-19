'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { ActionInbox } from '@/components/ActionInbox';
import { MyTasksView } from '@/components/MyTasksView';
import { ProjectsView } from '@/components/ProjectsView';
import { DocumentsView } from '@/components/DocumentsView';
import { DashboardView } from '@/components/DashboardView';
import { AIAssistantPanel } from '@/components/AIAssistantPanel';
import { TaskDrawer } from '@/components/TaskDrawer';
import { CommandPalette } from '@/components/CommandPalette';
import { api } from '@/lib/api';

export default function Home() {
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('inbox');
  const [aiPanelOpen, setAiPanelOpen] = useState<boolean>(true);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState<boolean>(false);

  const [user, setUser] = useState<any>({ full_name: 'Product Lead', email: 'user@aiworkos.com' });
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<any>(null);

  const [tasks, setTasks] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);

  const [selectedTask, setSelectedTask] = useState<any | null>(null);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState<boolean>(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState<boolean>(false);

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState('MEDIUM');
  const [newTaskProjectId, setNewTaskProjectId] = useState('');

  // New project form state
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');

  // 1. Initial Load & Workspace Sync
  useEffect(() => {
    async function init() {
      try {
        const wsList = await api.getWorkspaces();
        setWorkspaces(wsList);
        if (wsList.length > 0) {
          setCurrentWorkspace(wsList[0]);
        }
      } catch (err) {
        console.warn('Backend loading using local state fallback');
      }
    }
    init();
  }, []);

  // 2. Fetch workspace data when workspace changes
  useEffect(() => {
    if (!currentWorkspace?.id) return;
    refreshWorkspaceData();
  }, [currentWorkspace]);

  const refreshWorkspaceData = async () => {
    if (!currentWorkspace?.id) return;
    try {
      const [tList, pList, dList, appList] = await Promise.all([
        api.getTasks(currentWorkspace.id),
        api.getProjects(currentWorkspace.id),
        api.getDocuments(currentWorkspace.id),
        api.getPendingApprovals(currentWorkspace.id)
      ]);
      setTasks(tList);
      setProjects(pList);
      setDocuments(dList);
      setPendingApprovals(appList);
    } catch (err) {
      console.warn('Workspace refresh error');
    }
  };

  // 3. Task Status & Priority Updates
  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    setTasks((prev: any[]) => prev.map((t: any) => t.id === taskId ? { ...t, status: newStatus } : t));
    if (selectedTask?.id === taskId) {
      setSelectedTask((prev: any) => prev ? { ...prev, status: newStatus } : null);
    }
    try {
      await api.updateTask(taskId, currentWorkspace.id, { status: newStatus });
      refreshWorkspaceData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTaskPriority = async (taskId: string, newPriority: string) => {
    setTasks((prev: any[]) => prev.map((t: any) => t.id === taskId ? { ...t, priority: newPriority } : t));
    if (selectedTask?.id === taskId) {
      setSelectedTask((prev: any) => prev ? { ...prev, priority: newPriority } : null);
    }
    try {
      await api.updateTask(taskId, currentWorkspace.id, { priority: newPriority });
      refreshWorkspaceData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    setTasks((prev: any[]) => prev.filter((t: any) => t.id !== taskId));
    setSelectedTask(null);
    try {
      await api.deleteTask(taskId, currentWorkspace.id);
      refreshWorkspaceData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !currentWorkspace?.id) return;
    try {
      await api.createTask(currentWorkspace.id, {
        title: newTaskTitle,
        description: newTaskDesc,
        priority: newTaskPriority,
        project_id: newTaskProjectId || undefined
      });
      setNewTaskTitle('');
      setNewTaskDesc('');
      setIsNewTaskModalOpen(false);
      refreshWorkspaceData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim() || !currentWorkspace?.id) return;
    try {
      await api.createProject(currentWorkspace.id, {
        name: newProjName,
        description: newProjDesc
      });
      setNewProjName('');
      setNewProjDesc('');
      setIsNewProjectModalOpen(false);
      refreshWorkspaceData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUploadDocument = async (file: File) => {
    if (!currentWorkspace?.id) return;
    try {
      await api.uploadDocument(currentWorkspace.id, file);
      refreshWorkspaceData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleActionApproval = async (toolCallId: string, approval: boolean) => {
    if (!currentWorkspace?.id) return;
    try {
      await api.actionApproval(toolCallId, currentWorkspace.id, approval);
      refreshWorkspaceData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={`${darkMode ? 'dark' : ''} h-screen w-screen overflow-hidden flex bg-background-light dark:bg-background-dark`}>
      {/* Zone 1: Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        workspaces={workspaces}
        currentWorkspace={currentWorkspace}
        setCurrentWorkspace={setCurrentWorkspace}
        projects={projects}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        toggleAIPanel={() => setAiPanelOpen(!aiPanelOpen)}
        aiPanelOpen={aiPanelOpen}
        pendingApprovalsCount={pendingApprovals.length}
      />

      {/* Zone 2: Main Operating System Pane */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        <Header
          title={
            activeTab === 'inbox' ? 'Action Inbox' :
            activeTab === 'tasks' ? 'My Tasks' :
            activeTab === 'projects' ? 'Projects' :
            activeTab === 'documents' ? 'Documents & Vector Search' : 'Settings'
          }
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          toggleAIPanel={() => setAiPanelOpen(!aiPanelOpen)}
          aiPanelOpen={aiPanelOpen}
          user={user}
        />

        <main className="flex-1 overflow-hidden relative flex flex-col">
          {activeTab === 'inbox' && (
            <ActionInbox
              tasks={tasks}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              onSelectTask={(task) => setSelectedTask(task)}
              onCreateTaskModal={() => setIsNewTaskModalOpen(true)}
              onUpdateStatus={handleUpdateTaskStatus}
            />
          )}

          {activeTab === 'tasks' && (
            <MyTasksView
              tasks={tasks}
              onSelectTask={(task) => setSelectedTask(task)}
              onCreateTaskModal={() => setIsNewTaskModalOpen(true)}
              onUpdateStatus={handleUpdateTaskStatus}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectsView
              projects={projects}
              onCreateProjectModal={() => setIsNewProjectModalOpen(true)}
              onSelectProject={(proj) => setActiveTab('tasks')}
            />
          )}

          {activeTab === 'documents' && (
            <DocumentsView
              documents={documents}
              onUploadFile={handleUploadDocument}
              onAskAIAboutDoc={(doc) => {
                setAiPanelOpen(true);
              }}
            />
          )}

          {activeTab === 'settings' && (
            <div className="p-6">
              <h2 className="text-lg font-bold text-primaryText-light dark:text-primaryText-dark">
                Workspace Settings
              </h2>
              <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark mt-1">
                Configure local LLM provider endpoint, vector RAG parameters, and roles.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Zone 3: AI Assistant Panel */}
      <AIAssistantPanel
        isOpen={aiPanelOpen}
        onClose={() => setAiPanelOpen(false)}
        currentWorkspace={currentWorkspace}
        pendingApprovals={pendingApprovals}
        onActionApproval={handleActionApproval}
      />

      {/* Task Details Side Drawer */}
      <TaskDrawer
        task={selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdateStatus={handleUpdateTaskStatus}
        onUpdatePriority={handleUpdateTaskPriority}
        onDeleteTask={handleDeleteTask}
      />

      {/* Cmd+K Command Palette Modal */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        tasks={tasks}
        projects={projects}
        documents={documents}
        onSelectTask={(task) => setSelectedTask(task)}
        onSelectProject={() => setActiveTab('projects')}
        onSelectDoc={() => setActiveTab('documents')}
        onAskAI={() => setAiPanelOpen(true)}
      />

      {/* Create Task Modal */}
      {isNewTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-primaryText-light dark:text-primaryText-dark">
              Create New Task
            </h3>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-secondaryText-light dark:text-secondaryText-dark mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="e.g. Resolve pgvector index isolation"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-primaryText-light dark:text-primaryText-dark focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-secondaryText-light dark:text-secondaryText-dark mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                  placeholder="Provide context for team..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-primaryText-light dark:text-primaryText-dark focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-secondaryText-light dark:text-secondaryText-dark mb-1">
                    Priority
                  </label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-primaryText-light dark:text-primaryText-dark focus:outline-none"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="URGENT">URGENT</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-secondaryText-light dark:text-secondaryText-dark mb-1">
                    Project
                  </label>
                  <select
                    value={newTaskProjectId}
                    onChange={(e) => setNewTaskProjectId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-primaryText-light dark:text-primaryText-dark focus:outline-none"
                  >
                    <option value="">No Project</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewTaskModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-secondaryText-light hover:bg-surface-subtleLight"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-accent text-white text-xs font-bold shadow hover:bg-accent-hover transition-colors"
                >
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-primaryText-light dark:text-primaryText-dark">
              Create New Project
            </h3>
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-secondaryText-light dark:text-secondaryText-dark mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  placeholder="e.g. AI Native Search Service"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-primaryText-light dark:text-primaryText-dark focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-secondaryText-light dark:text-secondaryText-dark mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  placeholder="Goals and targets..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-primaryText-light dark:text-primaryText-dark focus:outline-none focus:border-accent"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-secondaryText-light hover:bg-surface-subtleLight"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-accent text-white text-xs font-bold shadow hover:bg-accent-hover transition-colors"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
