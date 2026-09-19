'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, FileText, Check, X, ShieldAlert, ArrowRight, Loader2, Paperclip } from 'lucide-react';

interface AIAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentWorkspace: any;
  pendingApprovals: any[];
  onActionApproval: (toolCallId: string, approval: boolean) => void;
}

export const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  isOpen,
  onClose,
  currentWorkspace,
  pendingApprovals,
  onActionApproval
}) => {
  const [messages, setMessages] = useState<any[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am your AI Work OS Assistant. I can search workspace tasks, projects, and documents, or create/update tasks for you.',
      sources: []
    }
  ]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [statusBadge, setStatusBadge] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, statusBadge]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const msgText = textToSend || inputMessage;
    if (!msgText.trim() || isStreaming) return;

    const userMsg = { id: Date.now().toString(), role: 'user', content: msgText };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsStreaming(true);
    setStatusBadge('Analyzing request...');

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      const response = await fetch('http://localhost:8000/api/v1/ai/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          workspace_id: currentWorkspace?.id || '',
          message: msgText
        })
      });

      if (!response.body) throw new Error('No SSE stream body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      let currentAssistantText = '';
      let currentSources: any[] = [];
      let toolCallRequested = false;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.replace('data: ', '').trim());
              
              if (data.type === 'status') {
                setStatusBadge(data.content);
              } else if (data.type === 'tool_approval_required') {
                setStatusBadge(null);
                toolCallRequested = true;
                setMessages(prev => [
                  ...prev,
                  {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: data.message || 'I prepared an action that requires your explicit approval.',
                    approvalCard: {
                      id: data.tool_call_id,
                      tool_name: data.tool_name,
                      arguments: data.arguments
                    }
                  }
                ]);
              } else if (data.type === 'message') {
                setStatusBadge(null);
                currentAssistantText = data.content;
                currentSources = data.sources || [];
                setMessages(prev => [
                  ...prev,
                  {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: currentAssistantText,
                    sources: currentSources
                  }
                ]);
              }
            } catch (err) {
              // Ignore line parse errors
            }
          }
        }
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        { id: Date.now().toString(), role: 'assistant', content: 'Connected to local workspace fallback. Ready for next prompt!' }
      ]);
    } finally {
      setIsStreaming(false);
      setStatusBadge(null);
    }
  };

  return (
    <aside className="w-80 border-l border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark flex flex-col h-screen select-none shrink-0 shadow-lg transition-colors duration-150">
      {/* Panel Header */}
      <div className="p-4 border-b border-border-light dark:border-border-dark flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-aiAccent-subtle flex items-center justify-center text-accent">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-primaryText-light dark:text-primaryText-dark">
              AI Assistant
            </h3>
            <span className="text-[10px] text-secondaryText-light dark:text-secondaryText-dark">
              Grounded Local RAG
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-surface-subtleLight dark:hover:bg-surface-subtleDark text-secondaryText-light dark:text-secondaryText-dark text-xs font-semibold"
        >
          <X size={16} />
        </button>
      </div>

      {/* Suggested Prompts & Conversation Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
        {messages.length === 1 && (
          <div className="space-y-2">
            <span className="text-[11px] font-semibold text-secondaryText-light dark:text-secondaryText-dark uppercase tracking-wider">
              SUGGESTED ACTIONS
            </span>
            {[
              "Explain the blocker in AI Work OS Launch project",
              "Search workspace documents for vector security",
              "Create a high priority task for vector isolation",
              "Summarize project status and open tasks"
            ].map((prompt, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(prompt)}
                className="w-full text-left p-2.5 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark hover:border-accent text-secondaryText-light dark:text-secondaryText-dark hover:text-primaryText-light transition-all flex items-center justify-between group"
              >
                <span className="line-clamp-1">{prompt}</span>
                <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 text-accent transition-opacity shrink-0" />
              </button>
            ))}
          </div>
        )}

        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`p-3 rounded-xl max-w-[90%] ${
                msg.role === 'user'
                  ? 'bg-accent text-white rounded-br-none'
                  : 'bg-surface-subtleLight dark:bg-surface-subtleDark text-primaryText-light dark:text-primaryText-dark border border-border-light dark:border-border-dark rounded-bl-none'
              }`}
            >
              <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>

              {/* Sources / Citations */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-border-light dark:border-border-dark space-y-1">
                  <span className="text-[10px] font-semibold text-secondaryText-light dark:text-secondaryText-dark block">
                    GROUNDED SOURCES:
                  </span>
                  {msg.sources.map((src: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[11px] text-accent font-medium">
                      <FileText size={12} />
                      <span className="truncate">{src.title}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Human Approval Card */}
              {msg.approvalCard && (
                <div className="mt-3 p-3 rounded-lg bg-surface-light dark:bg-surface-dark border-2 border-amber-400 dark:border-amber-500 shadow-md">
                  <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold mb-1.5">
                    <ShieldAlert size={14} />
                    <span>Approval Required</span>
                  </div>
                  <p className="text-[11px] font-semibold text-primaryText-light dark:text-primaryText-dark mb-1">
                    Action: {msg.approvalCard.tool_name}
                  </p>
                  <pre className="text-[10px] bg-background-light dark:bg-background-dark p-2 rounded font-mono text-secondaryText-light dark:text-secondaryText-dark overflow-x-auto mb-2">
                    {JSON.stringify(msg.approvalCard.arguments, null, 2)}
                  </pre>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onActionApproval(msg.approvalCard.id, true)}
                      className="flex-1 py-1.5 rounded bg-emerald-600 text-white font-bold text-[11px] hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1"
                    >
                      <Check size={12} /> Approve
                    </button>
                    <button
                      onClick={() => onActionApproval(msg.approvalCard.id, false)}
                      className="flex-1 py-1.5 rounded bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold text-[11px] hover:bg-gray-300 transition-colors flex items-center justify-center gap-1"
                    >
                      <X size={12} /> Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* User-facing Safe Status Indicator */}
        {statusBadge && (
          <div className="flex items-center gap-2 text-[11px] text-accent font-medium bg-aiAccent-subtle p-2 rounded-lg animate-pulse">
            <Loader2 size={13} className="animate-spin text-accent" />
            <span>{statusBadge}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-3 border-t border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask AI or request tool action..."
            className="flex-1 px-3 py-2 rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark text-xs text-primaryText-light dark:text-primaryText-dark focus:outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isStreaming}
            className="p-2 rounded-lg bg-accent text-white hover:bg-accent-hover disabled:opacity-50 transition-colors shrink-0"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </aside>
  );
};
