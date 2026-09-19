'use client';

import React from 'react';
import { Search, Sparkles, Command, User, Bell } from 'lucide-react';

interface HeaderProps {
  title: string;
  onOpenCommandPalette: () => void;
  toggleAIPanel: () => void;
  aiPanelOpen: boolean;
  user: any;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onOpenCommandPalette,
  toggleAIPanel,
  aiPanelOpen,
  user
}) => {
  return (
    <header className="h-14 border-b border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark px-6 flex items-center justify-between shrink-0 transition-colors duration-150">
      {/* Title */}
      <h1 className="text-base font-semibold text-primaryText-light dark:text-primaryText-dark">
        {title}
      </h1>

      {/* Global Search & Command Palette Trigger */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-xs text-secondaryText-light dark:text-secondaryText-dark hover:border-accent transition-colors w-64 justify-between"
        >
          <div className="flex items-center gap-2">
            <Search size={14} />
            <span>Search workspace or ask AI...</span>
          </div>
          <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-surface-subtleLight dark:bg-surface-subtleDark font-mono text-[10px]">
            <Command size={10} /> K
          </kbd>
        </button>

        {/* AI Assistant Quick Toggle */}
        <button
          onClick={toggleAIPanel}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            aiPanelOpen
              ? 'bg-accent text-white border-accent'
              : 'border-border-light dark:border-border-dark text-secondaryText-light dark:text-secondaryText-dark hover:bg-surface-subtleLight dark:hover:bg-surface-subtleDark'
          }`}
        >
          <Sparkles size={14} className={aiPanelOpen ? 'text-white' : 'text-aiAccent'} />
          <span>AI Panel</span>
        </button>

        {/* User Profile */}
        <div className="w-8 h-8 rounded-full bg-surface-subtleLight dark:bg-surface-subtleDark border border-border-light dark:border-border-dark flex items-center justify-center text-xs font-bold text-accent">
          {user?.full_name ? user.full_name.substring(0, 2).toUpperCase() : 'U'}
        </div>
      </div>
    </header>
  );
};
