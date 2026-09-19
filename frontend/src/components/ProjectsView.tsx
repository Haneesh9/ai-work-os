'use client';

import React, { useState } from 'react';
import { FolderKanban, Plus, AlertTriangle, CheckCircle2, BarChart2 } from 'lucide-react';

interface ProjectsViewProps {
  projects: any[];
  onCreateProjectModal: () => void;
  onSelectProject: (proj: any) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  onCreateProjectModal,
  onSelectProject
}) => {
  return (
    <div className="flex-1 p-6 bg-background-light dark:bg-background-dark overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-primaryText-light dark:text-primaryText-dark">
            Workspace Projects
          </h2>
          <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark">
            Compact project overviews, progress metrics, and blocker status.
          </p>
        </div>
        <button
          onClick={onCreateProjectModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-medium shadow-sm hover:bg-accent-hover transition-colors"
        >
          <Plus size={14} />
          <span>New Project</span>
        </button>
      </div>

      <div className="space-y-3">
        {projects.length === 0 ? (
          <div className="p-12 text-center text-secondaryText-light dark:text-secondaryText-dark bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark">
            <FolderKanban size={36} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">No projects created yet</p>
          </div>
        ) : (
          projects.map(proj => (
            <div
              key={proj.id}
              onClick={() => onSelectProject(proj)}
              className="p-4 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark hover:border-accent cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface-subtleLight dark:bg-surface-subtleDark flex items-center justify-center text-accent font-bold text-sm shrink-0">
                  {proj.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-primaryText-light dark:text-primaryText-dark group-hover:text-accent transition-colors">
                    {proj.name}
                  </h3>
                  <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark line-clamp-1">
                    {proj.description || 'No description.'}
                  </p>
                </div>
              </div>

              {/* Progress & Stats */}
              <div className="flex items-center gap-6 shrink-0">
                {/* Progress Bar */}
                <div className="w-36">
                  <div className="flex items-center justify-between text-[11px] mb-1 font-medium">
                    <span className="text-secondaryText-light dark:text-secondaryText-dark">Progress</span>
                    <span className="text-primaryText-light dark:text-primaryText-dark">{proj.progress}%</span>
                  </div>
                  <div className="w-full bg-surface-subtleLight dark:bg-surface-subtleDark h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-accent h-full transition-all duration-300"
                      style={{ width: `${proj.progress}%` }}
                    />
                  </div>
                </div>

                {/* Blockers */}
                {proj.blocker_count > 0 ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 px-2 py-1 rounded border border-red-200 dark:border-red-900">
                    <AlertTriangle size={13} /> {proj.blocker_count} Blocker
                  </span>
                ) : (
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded border border-emerald-200 dark:border-emerald-900">
                    Healthy
                  </span>
                )}

                <span className="text-xs text-secondaryText-light dark:text-secondaryText-dark font-mono">
                  {proj.task_count || 0} Tasks
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
