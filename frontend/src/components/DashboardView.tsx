'use client';

import React from 'react';
import { AlertTriangle, CheckSquare, FolderKanban, Sparkles, Clock, ArrowUpRight } from 'lucide-react';

interface DashboardViewProps {
  user: any;
  tasks: any[];
  projects: any[];
  pendingApprovalsCount: number;
  onNavigateTab: (tab: string) => void;
  onSelectTask: (task: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  tasks,
  projects,
  pendingApprovalsCount,
  onNavigateTab,
  onSelectTask
}) => {
  const blockedTasks = tasks.filter(t => t.status === 'BLOCKED');
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS');

  return (
    <div className="flex-1 p-6 bg-background-light dark:bg-background-dark overflow-y-auto space-y-6">
      {/* Greeting Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-accent/90 to-purple-900 text-white shadow-lg flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">
            Welcome back, {user?.full_name || 'Product Specialist'} 👋
          </h2>
          <p className="text-xs text-purple-200 mt-1">
            Here is what needs attention in your workspace today.
          </p>
        </div>
        <button
          onClick={() => onNavigateTab('inbox')}
          className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <span>Open Action Inbox</span>
          <ArrowUpRight size={14} />
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark flex items-center justify-between">
          <div>
            <span className="text-xs text-secondaryText-light dark:text-secondaryText-dark font-medium">
              Items Needing Attention
            </span>
            <h3 className="text-xl font-bold text-primaryText-light dark:text-primaryText-dark mt-1">
              {blockedTasks.length + pendingApprovalsCount}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
            <AlertTriangle size={20} />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark flex items-center justify-between">
          <div>
            <span className="text-xs text-secondaryText-light dark:text-secondaryText-dark font-medium">
              Active Tasks
            </span>
            <h3 className="text-xl font-bold text-primaryText-light dark:text-primaryText-dark mt-1">
              {inProgressTasks.length}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
            <Clock size={20} />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark flex items-center justify-between">
          <div>
            <span className="text-xs text-secondaryText-light dark:text-secondaryText-dark font-medium">
              Active Projects
            </span>
            <h3 className="text-xl font-bold text-primaryText-light dark:text-primaryText-dark mt-1">
              {projects.length}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
            <FolderKanban size={20} />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark flex items-center justify-between">
          <div>
            <span className="text-xs text-secondaryText-light dark:text-secondaryText-dark font-medium">
              Pending AI Approvals
            </span>
            <h3 className="text-xl font-bold text-primaryText-light dark:text-primaryText-dark mt-1">
              {pendingApprovalsCount}
            </h3>
          </div>
          <div className="w-10 h-10 rounded-xl bg-aiAccent-subtle text-accent flex items-center justify-center font-bold">
            <Sparkles size={20} />
          </div>
        </div>
      </div>

      {/* Blockers & Priority Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Blockers Column */}
        <div className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark space-y-3">
          <div className="flex items-center justify-between border-b border-border-light dark:border-border-dark pb-2">
            <h3 className="text-sm font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
              <AlertTriangle size={16} /> Blocked Tasks ({blockedTasks.length})
            </h3>
            <button
              onClick={() => onNavigateTab('inbox')}
              className="text-xs font-semibold text-accent hover:underline"
            >
              View Inbox
            </button>
          </div>

          {blockedTasks.length === 0 ? (
            <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark py-4 text-center">
              No blocked tasks! All workspace pipelines healthy.
            </p>
          ) : (
            blockedTasks.map(t => (
              <div
                key={t.id}
                onClick={() => onSelectTask(t)}
                className="p-3 rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50/50 dark:bg-red-950/20 hover:border-red-400 cursor-pointer transition-all flex items-center justify-between"
              >
                <div>
                  <h4 className="text-xs font-semibold text-primaryText-light dark:text-primaryText-dark">
                    {t.title}
                  </h4>
                  <p className="text-[11px] text-secondaryText-light dark:text-secondaryText-dark">
                    {t.project_name || 'General'}
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300">
                  BLOCKED
                </span>
              </div>
            ))
          )}
        </div>

        {/* Project Health Column */}
        <div className="p-5 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark space-y-3">
          <div className="flex items-center justify-between border-b border-border-light dark:border-border-dark pb-2">
            <h3 className="text-sm font-bold text-primaryText-light dark:text-primaryText-dark flex items-center gap-1.5">
              <FolderKanban size={16} /> Project Health Overview
            </h3>
            <button
              onClick={() => onNavigateTab('projects')}
              className="text-xs font-semibold text-accent hover:underline"
            >
              View All
            </button>
          </div>

          <div className="space-y-3">
            {projects.map(p => (
              <div key={p.id} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-primaryText-light dark:text-primaryText-dark">{p.name}</span>
                  <span className="text-accent">{p.progress}%</span>
                </div>
                <div className="w-full bg-surface-subtleLight dark:bg-surface-subtleDark h-2 rounded-full overflow-hidden">
                  <div className="bg-accent h-full transition-all" style={{ width: `${p.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
