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
  
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create':
        return <FilePlus className="w-3.5 h-3.5 text-emerald-400" />;
      case 'delete':
        return <FileX className="w-3.5 h-3.5 text-red-400" />;
      default:
        return <FileCode className="w-3.5 h-3.5 text-amber-400" />;
    }
  };
  
  const getActionLabel = (action: string) => {
    switch (action) {
      case 'create':
        return 'New';
      case 'delete':
        return 'Delete';
      default:
        return 'Modify';
    }
  };
  
  return (
    <div className="rounded-2xl bg-amber-950/40 border border-amber-500/20 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-amber-900/30">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-medium text-amber-100">Proposed Changes</span>
        </div>
        {message && (
          <p className="text-xs text-amber-200/70 mt-1 leading-relaxed">{message}</p>
        )}
      </div>
      
      {/* AI Thought (collapsible) */}
      {thought && (
        <div className="border-t border-amber-500/10">
          <button
            onClick={() => setShowThought(!showThought)}
            className="w-full px-4 py-2.5 flex items-center gap-2 text-xs text-amber-300/60 hover:text-amber-200 hover:bg-amber-900/20 transition-colors"
          >
            {showThought ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            <span>View AI's reasoning</span>
          </button>
          {showThought && (
            <div className="px-4 pb-3">
              <p className="text-xs text-amber-100/80 bg-black/20 p-3 rounded-xl leading-relaxed whitespace-pre-wrap">
                {thought}
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* File operations list */}
      <div className="px-4 py-3 border-t border-amber-500/10">
        <p className="text-[10px] text-amber-400/50 uppercase tracking-wider font-medium mb-2">
          Proposed changes ({operations.length} file{operations.length !== 1 ? 's' : ''})
        </p>
        
        <div className="space-y-1.5">
          {operations.map((op) => {
            const fileName = op.path.split('/').pop() || op.path;
            const directory = op.path.includes('/') ? op.path.substring(0, op.path.lastIndexOf('/') + 1) : '';
            
            return (
              <div 
                key={op.path} 
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-black/20 border border-white/5"
              >
                {getActionIcon(op.action)}
                <span className="flex-1 min-w-0">
                  <span className="text-sm text-white font-medium">{fileName}</span>
                  {directory && (
                    <span className="text-xs text-slate-500 ml-1.5">{directory}</span>
                  )}
                </span>
                {op.action !== 'create' && (
                  <span className={cn(
                    'text-[10px] px-2 py-0.5 rounded-md font-medium',
                    op.action === 'modify' && 'bg-amber-500/20 text-amber-300',
                    op.action === 'delete' && 'bg-red-500/20 text-red-300',
                  )}>
                    {getActionLabel(op.action)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Actions */}
      <div className="px-4 py-3 border-t border-amber-500/10 flex items-center gap-2">
        <button
          onClick={onReject}
          className="flex items-center gap-1.5 px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          <span>Reject</span>
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold rounded-xl hover:opacity-90 transition-opacity"
        >
          <Check className="w-4 h-4" />
          <span>Apply Changes</span>
        </button>
      </div>
    </div>
  );
}
