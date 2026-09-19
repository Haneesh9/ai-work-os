'use client';

import React, { useState } from 'react';
import { Plus, LayoutGrid, List as ListIcon, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';

interface MyTasksViewProps {
  tasks: any[];
  onSelectTask: (task: any) => void;
  onCreateTaskModal: () => void;
  onUpdateStatus: (taskId: string, newStatus: string) => void;
}

export const MyTasksView: React.FC<MyTasksViewProps> = ({
  tasks,
  onSelectTask,
  onCreateTaskModal,
  onUpdateStatus
}) => {
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');

  const columns = [
    { id: 'TODO', label: 'To Do', color: 'border-blue-400' },
    { id: 'IN_PROGRESS', label: 'In Progress', color: 'border-amber-400' },
    { id: 'BLOCKED', label: 'Blocked', color: 'border-red-400' },
    { id: 'COMPLETED', label: 'Completed', color: 'border-emerald-400' },
  ];

  return (
    <div className="flex-1 flex flex-col h-full bg-background-light dark:bg-background-dark overflow-hidden">
      {/* View Toolbar */}
      <div className="p-4 border-b border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('board')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              viewMode === 'board'
                ? 'bg-surface-subtleLight dark:bg-surface-subtleDark text-accent font-semibold'
                : 'text-secondaryText-light dark:text-secondaryText-dark'
            }`}
          >
            <LayoutGrid size={14} />
            <span>Kanban Board</span>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-surface-subtleLight dark:bg-surface-subtleDark text-accent font-semibold'
                : 'text-secondaryText-light dark:text-secondaryText-dark'
            }`}
          >
            <ListIcon size={14} />
            <span>List View</span>
          </button>
        </div>

        <button
          onClick={onCreateTaskModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-medium shadow-sm hover:bg-accent-hover transition-colors"
        >
          <Plus size={14} />
          <span>New Task</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-6 overflow-y-auto">
        {viewMode === 'board' ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 h-full min-h-[500px]">
            {columns.map(col => {
              const colTasks = tasks.filter(t => t.status === col.id);
              return (
                <div
                  key={col.id}
                  className="bg-surface-light dark:bg-surface-dark p-3.5 rounded-xl border border-border-light dark:border-border-dark flex flex-col h-full"
                >
                  <div className={`flex items-center justify-between pb-3 mb-3 border-b-2 ${col.color}`}>
                    <span className="text-xs font-bold text-primaryText-light dark:text-primaryText-dark">
                      {col.label}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-subtleLight dark:bg-surface-subtleDark text-secondaryText-light dark:text-secondaryText-dark">
                      {colTasks.length}
                    </span>
                  </div>

                  <div className="space-y-3 overflow-y-auto flex-1 pr-1">
                    {colTasks.map(task => (
                      <div
                        key={task.id}
                        onClick={() => onSelectTask(task)}
                        className="p-3 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark hover:border-accent cursor-pointer transition-all shadow-sm group"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold text-primaryText-light dark:text-primaryText-dark line-clamp-1 group-hover:text-accent">
                            {task.title}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-[11px] text-secondaryText-light dark:text-secondaryText-dark line-clamp-2 mb-2">
                            {task.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-semibold text-accent">
                            {task.project_name || 'General'}
                          </span>
                          <span className="px-1.5 py-0.5 rounded font-mono bg-surface-subtleLight dark:bg-surface-subtleDark text-secondaryText-light dark:text-secondaryText-dark">
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark divide-y divide-border-light dark:divide-border-dark">
            {tasks.map(task => (
              <div
                key={task.id}
                onClick={() => onSelectTask(task)}
                className="p-3.5 flex items-center justify-between hover:bg-surface-subtleLight dark:hover:bg-surface-subtleDark cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold text-primaryText-light dark:text-primaryText-dark">
                    {task.title}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-surface-subtleLight dark:bg-surface-subtleDark text-secondaryText-light dark:text-secondaryText-dark">
                    {task.status}
                  </span>
                </div>
                <span className="text-xs font-mono text-accent">{task.priority}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
