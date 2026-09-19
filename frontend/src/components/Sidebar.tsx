'use client';

import React from 'react';
import { 
  Inbox, 
  CheckSquare, 
  FolderKanban, 
  FileText, 
  Settings, 
  Moon, 
  Sun, 
  Plus, 
  Sparkles,
  ChevronDown
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  workspaces: any[];
  currentWorkspace: any;
  setCurrentWorkspace: (ws: any) => void;
  projects: any[];
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  toggleAIPanel: () => void;
  aiPanelOpen: boolean;
  pendingApprovalsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  workspaces,
  currentWorkspace,
  setCurrentWorkspace,
  projects,
  darkMode,
  setDarkMode,
  toggleAIPanel,
  aiPanelOpen,
  pendingApprovalsCount
}) => {
  return (
    <aside className="w-64 border-r border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark flex flex-col justify-between h-screen select-none shrink-0 transition-colors duration-150">
      <div>
        {/* Workspace Identity Header */}
        <div className="p-4 border-b border-border-light dark:border-border-dark flex items-center justify-between">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center font-bold text-sm shadow-sm">
              {currentWorkspace?.name ? currentWorkspace.name.substring(0, 2).toUpperCase() : 'WS'}
            </div>
            <div className="truncate">
              <h2 className="text-sm font-semibold truncate text-primaryText-light dark:text-primaryText-dark">
                {currentWorkspace?.name || 'My Workspace'}
              </h2>
              <span className="text-[11px] text-secondaryText-light dark:text-secondaryText-dark capitalize">
                {currentWorkspace?.role || 'Owner'}
              </span>
            </div>
          </div>
          <button 
            onClick={() => setDarkMode(!darkMode)}
            className="p-1.5 rounded-md hover:bg-surface-subtleLight dark:hover:bg-surface-subtleDark text-secondaryText-light dark:text-secondaryText-dark transition-colors"
            title="Toggle theme"
          >
            {darkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>

        {/* Primary Navigation Menu */}
        <div className="p-3 space-y-1">
          <button
            onClick={() => setActiveTab('inbox')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'inbox'
                ? 'bg-surface-subtleLight dark:bg-surface-subtleDark text-accent dark:text-white font-semibold'
                : 'text-secondaryText-light dark:text-secondaryText-dark hover:bg-surface-subtleLight dark:hover:bg-surface-subtleDark'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Inbox size={18} />
              <span>Action Inbox</span>
            </div>
            {pendingApprovalsCount > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                {pendingApprovalsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'tasks'
                ? 'bg-surface-subtleLight dark:bg-surface-subtleDark text-accent dark:text-white font-semibold'
                : 'text-secondaryText-light dark:text-secondaryText-dark hover:bg-surface-subtleLight dark:hover:bg-surface-subtleDark'
            }`}
          >
            <CheckSquare size={18} />
            <span>My Tasks</span>
          </button>

          <button
            onClick={() => setActiveTab('projects')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'projects'
                ? 'bg-surface-subtleLight dark:bg-surface-subtleDark text-accent dark:text-white font-semibold'
                : 'text-secondaryText-light dark:text-secondaryText-dark hover:bg-surface-subtleLight dark:hover:bg-surface-subtleDark'
            }`}
          >
            <FolderKanban size={18} />
            <span>Projects</span>
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'documents'
                ? 'bg-surface-subtleLight dark:bg-surface-subtleDark text-accent dark:text-white font-semibold'
                : 'text-secondaryText-light dark:text-secondaryText-dark hover:bg-surface-subtleLight dark:hover:bg-surface-subtleDark'
            }`}
          >
            <FileText size={18} />
            <span>Documents & RAG</span>
          </button>
        </div>

        {/* Projects Sub-list */}
        <div className="px-4 py-2 mt-2">
          <div className="flex items-center justify-between text-xs font-semibold text-secondaryText-light dark:text-secondaryText-dark uppercase tracking-wider mb-2">
            <span>Workspace Projects</span>
            <span className="text-[10px] bg-surface-subtleLight dark:bg-surface-subtleDark px-1.5 py-0.5 rounded">
              {projects.length}
            </span>
          </div>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {projects.map((proj) => (
              <button
                key={proj.id}
                onClick={() => setActiveTab('projects')}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-secondaryText-light dark:text-secondaryText-dark hover:text-primaryText-light dark:hover:text-primaryText-dark hover:bg-surface-subtleLight dark:hover:bg-surface-subtleDark truncate transition-colors"
              >
                <div className={`w-2 h-2 rounded-full ${proj.blocker_count > 0 ? 'bg-red-500' : 'bg-emerald-500'}`} />
                <span className="truncate">{proj.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="p-3 border-t border-border-light dark:border-border-dark space-y-1">
        <button
          onClick={toggleAIPanel}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-all ${
            aiPanelOpen 
              ? 'bg-aiAccent-subtle text-accent dark:text-purple-300 font-semibold border border-aiAccent/40'
              : 'text-secondaryText-light dark:text-secondaryText-dark hover:bg-surface-subtleLight dark:hover:bg-surface-subtleDark'
          }`}
        >
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-aiAccent" />
            <span>AI Assistant</span>
          </div>
          <span className="text-[10px] bg-accent/10 text-accent dark:text-purple-300 px-1.5 py-0.5 rounded font-mono">
            Local RAG
          </span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'settings'
              ? 'bg-surface-subtleLight dark:bg-surface-subtleDark text-accent dark:text-white font-semibold'
              : 'text-secondaryText-light dark:text-secondaryText-dark hover:bg-surface-subtleLight dark:hover:bg-surface-subtleDark'
          }`}
        >
          <Settings size={18} />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
};
