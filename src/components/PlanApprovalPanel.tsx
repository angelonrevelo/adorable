import { Check, X, FileSearch, FilePlus, FileCode, ChevronDown, ChevronRight, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export interface AIPlan {
  summary: string;
  filesToRead: string[];
  filesToCreate: string[];
  filesToModify: string[];
  approach: string;
}

interface PlanApprovalPanelProps {
  plan: AIPlan;
  onApprove: () => void;
  onReject: () => void;
  isExecuting?: boolean;
}

export function PlanApprovalPanel({ plan, onApprove, onReject, isExecuting }: PlanApprovalPanelProps) {
  const [showApproach, setShowApproach] = useState(false);
  
  const totalFiles = plan.filesToRead.length + plan.filesToCreate.length + plan.filesToModify.length;
  
  return (
    <div className="border border-purple-500/30 rounded-xl bg-purple-500/5 backdrop-blur overflow-hidden animate-fade-in">
      {/* Header */}
      <div className="px-4 py-3 border-b border-purple-500/20 bg-purple-500/10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <h3 className="font-medium text-white">AI Plan</h3>
        </div>
        <p className="text-sm text-gray-300 mt-1">{plan.summary}</p>
      </div>
      
      {/* Approach (collapsible) */}
      {plan.approach && (
        <div className="border-b border-purple-500/20">
          <button
            onClick={() => setShowApproach(!showApproach)}
            className="w-full px-4 py-2 flex items-center gap-2 text-sm text-gray-400 hover:bg-white/5 transition-colors"
          >
            {showApproach ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <span>View approach</span>
          </button>
          {showApproach && (
            <div className="px-4 pb-3">
              <p className="text-sm text-gray-300 bg-black/30 p-3 rounded-lg whitespace-pre-wrap">
                {plan.approach}
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* File operations */}
      <div className="px-4 py-3 space-y-3">
        <p className="text-xs text-gray-500 uppercase tracking-wider">
          Plan Overview ({totalFiles} file{totalFiles !== 1 ? 's' : ''})
        </p>
        
        {/* Files to read */}
        {plan.filesToRead.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-blue-400">
              <FileSearch className="w-3.5 h-3.5" />
              <span>Will read ({plan.filesToRead.length})</span>
            </div>
            <div className="flex flex-wrap gap-1 pl-5">
              {plan.filesToRead.map((file) => (
                <span key={file} className="px-2 py-0.5 bg-blue-500/10 text-blue-300 text-xs rounded">
                  {file.split('/').pop()}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Files to create */}
        {plan.filesToCreate.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <FilePlus className="w-3.5 h-3.5" />
              <span>Will create ({plan.filesToCreate.length})</span>
            </div>
            <div className="flex flex-wrap gap-1 pl-5">
              {plan.filesToCreate.map((file) => (
                <span key={file} className="px-2 py-0.5 bg-emerald-500/10 text-emerald-300 text-xs rounded">
                  {file.split('/').pop()}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Files to modify */}
        {plan.filesToModify.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-yellow-400">
              <FileCode className="w-3.5 h-3.5" />
              <span>Will modify ({plan.filesToModify.length})</span>
            </div>
            <div className="flex flex-wrap gap-1 pl-5">
              {plan.filesToModify.map((file) => (
                <span key={file} className="px-2 py-0.5 bg-yellow-500/10 text-yellow-300 text-xs rounded">
                  {file.split('/').pop()}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Actions */}
      <div className="px-4 py-3 border-t border-purple-500/20 bg-purple-500/10 flex items-center justify-end gap-3">
        <button
          onClick={onReject}
          disabled={isExecuting}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
        >
          <X className="w-4 h-4" />
          Cancel
        </button>
        <button
          onClick={onApprove}
          disabled={isExecuting}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-purple-500 to-violet-500 text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isExecuting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Executing...
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              Execute Plan
            </>
          )}
        </button>
      </div>
    </div>
  );
}
