'use client';

import React, { useState } from 'react';
import { FileText, UploadCloud, Sparkles, Trash2, Search, CheckCircle } from 'lucide-react';

interface DocumentsViewProps {
  documents: any[];
  onUploadFile: (file: File) => void;
  onAskAIAboutDoc: (doc: any) => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({
  documents,
  onUploadFile,
  onAskAIAboutDoc
}) => {
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      try {
        await onUploadFile(e.target.files[0]);
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div className="flex-1 p-6 bg-background-light dark:bg-background-dark overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-bold text-primaryText-light dark:text-primaryText-dark">
            Documents & Vector RAG Index
          </h2>
          <p className="text-xs text-secondaryText-light dark:text-secondaryText-dark">
            Upload text specifications, docs, and notes to ground AI workspace responses.
          </p>
        </div>

        {/* Upload Button */}
        <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent text-white text-xs font-medium cursor-pointer shadow-sm hover:bg-accent-hover transition-colors">
          <UploadCloud size={14} />
          <span>{isUploading ? 'Uploading & Chunking...' : 'Upload Document'}</span>
          <input type="file" onChange={handleFileChange} className="hidden" accept=".txt,.md,.json,.pdf,.docx" />
        </label>
      </div>

      {/* Document List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documents.length === 0 ? (
          <div className="col-span-2 p-12 text-center text-secondaryText-light dark:text-secondaryText-dark bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-border-dark">
            <FileText size={36} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">No documents uploaded yet</p>
            <p className="text-xs opacity-75 mt-1">Upload files to enable document grounded search and vector citations.</p>
          </div>
        ) : (
          documents.map(doc => (
            <div
              key={doc.id}
              className="p-4 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark hover:border-accent transition-all flex flex-col justify-between gap-3 group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-surface-subtleLight dark:bg-surface-subtleDark flex items-center justify-center text-accent shrink-0">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h3 className="text-xs font-semibold text-primaryText-light dark:text-primaryText-dark line-clamp-1">
                      {doc.filename}
                    </h3>
                    <span className="text-[11px] text-secondaryText-light dark:text-secondaryText-dark font-mono">
                      {(doc.file_size / 1024).toFixed(1)} KB • {doc.chunk_count} Vector Chunks
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-between pt-2 border-t border-border-light dark:border-border-dark">
                <span className="text-[10px] text-secondaryText-light dark:text-secondaryText-dark font-mono">
                  Indexed {new Date(doc.created_at).toLocaleDateString()}
                </span>
                <button
                  onClick={() => onAskAIAboutDoc(doc)}
                  className="flex items-center gap-1 text-xs font-medium text-accent hover:underline"
                >
                  <Sparkles size={12} className="text-aiAccent" />
                  <span>Ask AI about document</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
