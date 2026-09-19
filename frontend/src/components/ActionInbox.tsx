'use client';

import React, { useState } from 'react';
import { 
  Inbox, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Sparkles, 
  Filter, 
  Plus, 
  ChevronRight,
  UserCheck,
  AtSign
} from 'lucide-react';

interface ActionInboxProps {
  tasks: any[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSelectTask: (task: any) => void;
  onCreateTaskModal: () => void;
  onUpdateStatus: (taskId: string, newStatus: string) => void;
}

export const ActionInbox: React.FC<ActionInboxProps> = ({
  tasks,
  activeTab,
  setActiveTab,
  onSelectTask,
  onCreateTaskModal,
  onUpdateStatus
}) => {
  const [filterTab, setFilterTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredTasks = tasks.filter(task => {
    // Search query filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title?.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      if (!matchTitle && !matchDesc) return false;
    }

    // Filter tab logic
    if (filterTab === 'assigned_to_me') return true; // Handled in API or local
    if (filterTab === 'blocked') return task.status === 'BLOCKED';
    if (filterTab === 'ai') return task.description?.toLowerCase().includes('ai');
    return true;
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400 border border-red-200 dark:border-red-900">URGENT</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-900">HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-900">MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">LOW</span>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />;
      case 'BLOCKED':
        return <AlertTriangle size={16} className="text-red-500 shrink-0 animate-pulse" />;
      case 'IN_PROGRESS':
        return <Clock size={16} className="text-amber-500 shrink-0" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-border-light dark:border-border-dark shrink-0" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-background-light dark:bg-background-dark overflow-hidden">
      {/* Inbox Control Bar & Filter Tabs */}
      <div className="p-4 border-b border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
          {[
            { id: 'all', label: 'All Items', icon: Inbox },
            { id: 'assigned_to_me', label: 'Assigned to me', icon: UserCheck },
            { id: 'blocked', label: 'Blocked', icon: AlertTriangle },
            { id: 'ai', label: 'AI Actions', icon: Sparkles },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = filterTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-surface-subtleLight dark:bg-surface-subtleDark text-accent dark:text-white font-semibold'
                    : 'text-secondaryText-light dark:text-secondaryText-dark hover:bg-surface-subtleLight dark:hover:bg-surface-subtleDark'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Action Button */}
        <button
          onClick={onCreateTaskModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-medium shadow-sm hover:bg-accent-hover transition-colors shrink-0"
        >
          <Plus size={14} />
          <span>New Task</span>
        </button>
      </div>

      {/* Scannable Email-Style Task List */}
      <div className="flex-1 overflow-y-auto divide-y divide-border-light dark:divide-border-dark">
        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-secondaryText-light dark:text-secondaryText-dark">
            <Inbox size={36} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">No items found in this inbox view</p>
            <p className="text-xs opacity-75 mt-1">Create a task or ask the AI Assistant to search workspace items.</p>
          </div>
        ) : (
          filteredTasks.map(task => (
            <div
              key={task.id}
              onClick={() => onSelectTask(task)}
              className="p-3.5 hover:bg-surface-light dark:hover:bg-surface-dark transition-colors cursor-pointer flex items-center justify-between gap-4 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const nextStatus = task.status === 'COMPLETED' ? 'TODO' : 'COMPLETED';
                    onUpdateStatus(task.id, nextStatus);
                  }}
                  className="hover:scale-110 transition-transform"
                >
                  {getStatusIcon(task.status)}
                </button>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold text-primaryText-light dark:text-primaryText-dark truncate group-hover:text-accent transition-colors">
                      {task.title}
                    </span>
                    {task.project_name && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-surface-subtleLight dark:bg-surface-subtleDark text-secondaryText-light dark:text-secondaryText-dark shrink-0">
                        {task.project_name}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark truncate max-w-xl">
                    {task.description || 'No additional details.'}
                  </p>
                </div>
              </div>

              {/* Badges & Meta info */}
              <div className="flex items-center gap-3 shrink-0">
                {getPriorityBadge(task.priority)}
                <span className="text-[11px] text-secondaryText-light dark:text-secondaryText-dark hidden sm:inline">
                  {new Date(task.updated_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
                <ChevronRight size={16} className="text-secondaryText-light dark:text-secondaryText-dark opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
