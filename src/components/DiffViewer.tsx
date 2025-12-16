import { useMemo } from 'react';
import { FileOperation } from '@/types/projectTypes';
import { Check, X, FilePlus, FileEdit, FileX } from 'lucide-react';

interface DiffViewerProps {
  operations: FileOperation[];
  onApprove: () => void;
  onReject: () => void;
}

/**
 * Simple diff viewer that shows what changes will be made
 */
export function DiffViewer({ operations, onApprove, onReject }: DiffViewerProps) {
  const stats = useMemo(() => {
    const creates = operations.filter(op => op.action === 'create').length;
    const modifies = operations.filter(op => op.action === 'modify').length;
    const deletes = operations.filter(op => op.action === 'delete').length;

    return { creates, modifies, deletes, total: operations.length };
  }, [operations]);

  if (operations.length === 0) {
    return null;
  }

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="bg-white/5 border-b border-white/10 p-4">
        <h3 className="text-lg font-semibold text-white mb-2">Review Changes</h3>
        <div className="flex gap-4 text-sm">
          {stats.creates > 0 && (
            <span className="text-emerald-400 flex items-center gap-1">
              <FilePlus className="w-4 h-4" />
              {stats.creates} new
            </span>
          )}
          {stats.modifies > 0 && (
            <span className="text-amber-400 flex items-center gap-1">
              <FileEdit className="w-4 h-4" />
              {stats.modifies} modified
            </span>
          )}
          {stats.deletes > 0 && (
            <span className="text-red-400 flex items-center gap-1">
              <FileX className="w-4 h-4" />
              {stats.deletes} deleted
            </span>
          )}
        </div>
      </div>

      {/* File list */}
      <div className="max-h-96 overflow-y-auto">
        {operations.map((op, index) => (
          <DiffItem key={index} operation={op} />
        ))}
      </div>

      {/* Actions */}
      <div className="bg-white/5 border-t border-white/10 p-4 flex gap-3">
        <button
          onClick={onApprove}
          className="flex-1 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 font-medium"
        >
          <Check className="w-5 h-5" />
          Apply Changes
        </button>
        <button
          onClick={onReject}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <X className="w-5 h-5" />
          Cancel
        </button>
      </div>
    </div>
  );
}

/**
 * Individual file operation item
 */
function DiffItem({ operation }: { operation: FileOperation }) {
  const icon = {
    create: <FilePlus className="w-4 h-4 text-emerald-400" />,
    modify: <FileEdit className="w-4 h-4 text-amber-400" />,
    delete: <FileX className="w-4 h-4 text-red-400" />,
  }[operation.action];

  const bgColor = {
    create: 'bg-emerald-500/10 border-emerald-500/20',
    modify: 'bg-amber-500/10 border-amber-500/20',
    delete: 'bg-red-500/10 border-red-500/20',
  }[operation.action];

  const lines = operation.content.split('\n').length;

  return (
    <div className={`border-b border-white/5 p-4 hover:bg-white/5 transition-colors ${bgColor}`}>
      <div className="flex items-start gap-3">
        <div className="mt-1">{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-white font-mono text-sm font-medium truncate">
              {operation.path}
            </span>
            <span className="text-slate-500 text-xs flex-shrink-0">
              {lines} {lines === 1 ? 'line' : 'lines'}
            </span>
          </div>
          <p className="text-slate-400 text-xs">
            {operation.action === 'create' && 'New file will be created'}
            {operation.action === 'modify' && 'Existing file will be updated'}
            {operation.action === 'delete' && 'File will be deleted'}
          </p>
        </div>
      </div>

      {/* Preview first few lines */}
      {operation.action !== 'delete' && (
        <details className="mt-3">
          <summary className="text-slate-400 text-xs cursor-pointer hover:text-slate-300 transition-colors">
            Preview content
          </summary>
          <pre className="mt-2 p-3 bg-black/20 rounded-lg overflow-x-auto text-xs text-slate-300 font-mono border border-white/5">
            {operation.content.split('\n').slice(0, 20).join('\n')}
            {lines > 20 && '\n... (truncated)'}
          </pre>
        </details>
      )}
    </div>
  );
}
