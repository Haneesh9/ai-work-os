'use client';

import React, { useState, useEffect } from 'react';
import { Search, CheckSquare, FolderKanban, FileText, Sparkles, X } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: any[];
  projects: any[];
  documents: any[];
  onSelectTask: (task: any) => void;
  onSelectProject: (proj: any) => void;
  onSelectDoc: (doc: any) => void;
  onAskAI: (prompt: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  tasks,
  projects,
  documents,
  onSelectTask,
  onSelectProject,
  onSelectDoc,
  onAskAI
}) => {
  const [query, setQuery] = useState<string>('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase();
  const filteredTasks = tasks.filter(t => t.title.toLowerCase().includes(q));
  const filteredProjects = projects.filter(p => p.name.toLowerCase().includes(q));
  const filteredDocs = documents.filter(d => d.filename.toLowerCase().includes(q));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
      <div className="w-full max-w-xl bg-surface-light dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Input Bar */}
        <div className="p-3 border-b border-border-light dark:border-border-dark flex items-center gap-2">
          <Search size={18} className="text-secondaryText-light dark:text-secondaryText-dark" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command or search workspace items..."
            className="flex-1 bg-transparent text-sm text-primaryText-light dark:text-primaryText-dark focus:outline-none"
          />
          <button onClick={onClose} className="p-1 rounded text-secondaryText-light hover:bg-surface-subtleLight">
            <X size={16} />
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-2 space-y-4 text-xs">
          {query && (
            <div>
              <div className="px-2 py-1 text-[10px] font-bold text-secondaryText-light dark:text-secondaryText-dark uppercase tracking-wider">
                AI COMMAND
              </div>
              <button
                onClick={() => {
                  onAskAI(query);
                  onClose();
                }}
                className="w-full text-left p-2.5 rounded-lg hover:bg-aiAccent-subtle flex items-center gap-2 text-accent font-semibold transition-colors"
              >
                <Sparkles size={16} className="text-aiAccent" />
                <span>Ask AI: "{query}"</span>
              </button>
            </div>
          )}

          {/* Tasks */}
          {filteredTasks.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-bold text-secondaryText-light dark:text-secondaryText-dark uppercase tracking-wider">
                TASKS ({filteredTasks.length})
              </div>
              {filteredTasks.slice(0, 5).map(t => (
                <button
                  key={t.id}
                  onClick={() => {
                    onSelectTask(t);
                    onClose();
                  }}
                  className="w-full text-left p-2 rounded hover:bg-surface-subtleLight dark:hover:bg-surface-subtleDark flex items-center justify-between text-primaryText-light dark:text-primaryText-dark transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <CheckSquare size={14} className="text-accent" />
                    <span>{t.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-secondaryText-light">{t.status}</span>
                </button>
              ))}
            </div>
          )}

          {/* Projects */}
          {filteredProjects.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-bold text-secondaryText-light dark:text-secondaryText-dark uppercase tracking-wider">
                PROJECTS ({filteredProjects.length})
              </div>
              {filteredProjects.slice(0, 4).map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    onSelectProject(p);
                    onClose();
                  }}
                  className="w-full text-left p-2 rounded hover:bg-surface-subtleLight dark:hover:bg-surface-subtleDark flex items-center justify-between text-primaryText-light dark:text-primaryText-dark transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FolderKanban size={14} className="text-accent" />
                    <span>{p.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-secondaryText-light">{p.progress}%</span>
                </button>
              ))}
            </div>
          )}

          {/* Documents */}
          {filteredDocs.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] font-bold text-secondaryText-light dark:text-secondaryText-dark uppercase tracking-wider">
                DOCUMENTS ({filteredDocs.length})
              </div>
              {filteredDocs.slice(0, 4).map(d => (
                <button
                  key={d.id}
                  onClick={() => {
                    onSelectDoc(d);
                    onClose();
                  }}
                  className="w-full text-left p-2 rounded hover:bg-surface-subtleLight dark:hover:bg-surface-subtleDark flex items-center gap-2 text-primaryText-light dark:text-primaryText-dark transition-colors"
                >
                  <FileText size={14} className="text-accent" />
                  <span>{d.filename}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
