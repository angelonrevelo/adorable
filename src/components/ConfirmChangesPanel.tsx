import { FileOperation } from '@/types/projectTypes';
import { Check, X, FileCode, FilePlus, FileX, ChevronDown, ChevronRight, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ConfirmChangesPanelProps {
  thought?: string;
  message?: string;
  operations: FileOperation[];
  onConfirm: () => void;
  onReject: () => void;
}

export function ConfirmChangesPanel({ 
  thought, 
  message, 
  operations, 
  onConfirm, 
  onReject 
}: ConfirmChangesPanelProps) {
  const [showThought, setShowThought] = useState(false);
  const [expandedFiles, setExpandedFiles] = useState<Set<string>>(new Set());
  
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create':
        return <FilePlus className="w-4 h-4 text-emerald-400" />;
      case 'delete':
        return <FileX className="w-4 h-4 text-red-400" />;
      default:
        return <FileCode className="w-4 h-4 text-yellow-400" />;
    }
  };
  
  const getActionLabel = (action: string) => {
    switch (action) {
      case 'create':
        return 'Create';
      case 'delete':
        return 'Delete';
      default:
        return 'Modify';
    }
  };
  
  const toggleFileExpanded = (path: string) => {
    setExpandedFiles(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };
  
  return (
    <div className="border border-yellow-500/30 rounded-xl bg-yellow-500/5 backdrop-blur overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="px-4 py-3 border-b border-yellow-500/20 bg-yellow-500/10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-yellow-400" />
          <h3 className="text-sm font-medium text-white">Proposed Changes</h3>
        </div>
        {message && (
          <p className="text-xs text-gray-400 mt-1">{message}</p>
        )}
      </div>
      
      {/* AI Thought (collapsible) */}
      {thought && (
        <div className="border-b border-yellow-500/20">
          <button
            onClick={() => setShowThought(!showThought)}
            className="w-full px-4 py-2 flex items-center gap-2 text-sm text-gray-400 hover:bg-white/5 transition-colors"
          >
            {showThought ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <span>View AI's reasoning</span>
          </button>
          {showThought && (
            <div className="px-4 pb-3">
              <p className="text-sm text-gray-300 bg-black/30 p-3 rounded-lg">
                {thought}
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* File operations list */}
      <div className="px-4 py-3 space-y-2 max-h-60 overflow-y-auto">
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
          Proposed changes ({operations.length} file{operations.length !== 1 ? 's' : ''})
        </p>
        
        {operations.map((op) => {
          const isExpanded = expandedFiles.has(op.path);
          const fileName = op.path.split('/').pop() || op.path;
          
          return (
            <div key={op.path} className="border border-white/10 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleFileExpanded(op.path)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 transition-colors"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-500" /> : <ChevronRight className="w-4 h-4 text-gray-500" />}
                {getActionIcon(op.action)}
                <span className="flex-1 text-left">
                  <span className="text-white text-sm">{fileName}</span>
                  <span className="text-gray-500 text-xs ml-2">{op.path}</span>
                </span>
                <span className={cn(
                  'text-xs px-2 py-0.5 rounded',
                  op.action === 'create' && 'bg-emerald-500/20 text-emerald-400',
                  op.action === 'modify' && 'bg-yellow-500/20 text-yellow-400',
                  op.action === 'delete' && 'bg-red-500/20 text-red-400',
                )}>
                  {getActionLabel(op.action)}
                </span>
              </button>
              
              {isExpanded && op.content && (
                <div className="border-t border-white/10 bg-black/30">
                  <pre className="text-xs text-gray-300 p-3 overflow-x-auto max-h-40 overflow-y-auto">
                    {op.content.slice(0, 2000)}{op.content.length > 2000 ? '\n... (truncated)' : ''}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Actions */}
      <div className="px-4 py-3 border-t border-yellow-500/20 bg-yellow-500/10 flex items-center justify-end gap-3">
        <button
          onClick={onReject}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
          Reject
        </button>
        <button
          onClick={onConfirm}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          <Check className="w-4 h-4" />
          Apply Changes
        </button>
      </div>
    </div>
  );
}
