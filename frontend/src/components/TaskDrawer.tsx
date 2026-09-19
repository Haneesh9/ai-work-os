'use client';

import React from 'react';
import { X, CheckCircle2, AlertTriangle, Clock, Trash2, Calendar, User, Tag } from 'lucide-react';

interface TaskDrawerProps {
  task: any | null;
  onClose: () => void;
  onUpdateStatus: (taskId: string, status: string) => void;
  onUpdatePriority: (taskId: string, priority: string) => void;
  onDeleteTask: (taskId: string) => void;
}

export const TaskDrawer: React.FC<TaskDrawerProps> = ({
  task,
  onClose,
  onUpdateStatus,
  onUpdatePriority,
  onDeleteTask
}) => {
  if (!task) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-surface-light dark:bg-surface-dark h-full border-l border-border-light dark:border-border-dark flex flex-col shadow-2xl overflow-hidden">
        {/* Drawer Header */}
        <div className="p-4 border-b border-border-light dark:border-border-dark flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-secondaryText-light dark:text-secondaryText-dark uppercase tracking-wider">
              Task Details
            </span>
            {task.project_name && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-surface-subtleLight dark:bg-surface-subtleDark text-accent font-semibold">
                {task.project_name}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-subtleLight dark:hover:bg-surface-subtleDark text-secondaryText-light dark:text-secondaryText-dark"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          {/* Title */}
          <div>
            <h2 className="text-xl font-bold text-primaryText-light dark:text-primaryText-dark">
              {task.title}
            </h2>
            <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark mt-1">
              Created {new Date(task.created_at).toLocaleString()}
            </p>
          </div>

          {/* Quick Status Bar */}
          <div>
            <label className="block text-xs font-semibold text-secondaryText-light dark:text-secondaryText-dark mb-2">
              STATUS
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'TODO', label: 'To Do' },
                { id: 'IN_PROGRESS', label: 'In Progress' },
                { id: 'BLOCKED', label: 'Blocked' },
                { id: 'COMPLETED', label: 'Completed' },
              ].map(s => (
                <button
                  key={s.id}
                  onClick={() => onUpdateStatus(task.id, s.id)}
                  className={`px-2 py-1.5 rounded text-xs font-medium text-center border transition-colors ${
                    task.status === s.id
                      ? 'bg-accent text-white border-accent font-semibold'
                      : 'border-border-light dark:border-border-dark text-secondaryText-light dark:text-secondaryText-dark hover:bg-surface-subtleLight dark:hover:bg-surface-subtleDark'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-semibold text-secondaryText-light dark:text-secondaryText-dark mb-2">
              PRIORITY
            </label>
            <div className="flex gap-2">
              {['LOW', 'MEDIUM', 'HIGH', 'URGENT'].map(p => (
                <button
                  key={p}
                  onClick={() => onUpdatePriority(task.id, p)}
                  className={`px-3 py-1 rounded text-xs font-semibold border transition-colors ${
                    task.priority === p
                      ? 'bg-surface-subtleLight dark:bg-surface-subtleDark text-accent border-accent'
                      : 'border-border-light dark:border-border-dark text-secondaryText-light dark:text-secondaryText-dark'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-secondaryText-light dark:text-secondaryText-dark mb-2">
              DESCRIPTION
            </label>
            <div className="p-3 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-xs text-primaryText-light dark:text-primaryText-dark whitespace-pre-wrap leading-relaxed">
              {task.description || 'No detailed description provided.'}
            </div>
          </div>

          {/* Assignee */}
          <div className="flex items-center gap-3 text-xs">
            <User size={16} className="text-secondaryText-light dark:text-secondaryText-dark" />
            <span className="text-secondaryText-light dark:text-secondaryText-dark">Assignee:</span>
            <span className="font-medium text-primaryText-light dark:text-primaryText-dark">
              {task.assignee_name || 'Unassigned'}
            </span>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark flex items-center justify-between">
          <button
            onClick={() => onDeleteTask(task.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
          >
            <Trash2 size={14} />
            <span>Delete Task</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded text-xs font-medium bg-surface-subtleLight dark:bg-surface-subtleDark text-primaryText-light dark:text-primaryText-dark hover:bg-border-light transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
