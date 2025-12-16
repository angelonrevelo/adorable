import { useState, useRef, useEffect } from 'react';
import { useConsoleStore, LogLevel, LogCategory, ConsoleLog } from '@/stores/useConsoleStore';
import { Trash2, ChevronDown, ChevronRight, Download, Copy, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const levelColors: Record<LogLevel, string> = {
  debug: 'text-gray-500',
  info: 'text-blue-400',
  warn: 'text-yellow-400',
  error: 'text-red-400',
};

const categoryFilters: { value: LogCategory | 'all'; label: string; icon: string }[] = [
  { value: 'all', label: 'All', icon: '📋' },
  { value: 'file', label: 'Files', icon: '📁' },
  { value: 'api', label: 'API', icon: '🌐' },
  { value: 'ai', label: 'AI', icon: '🧠' },
  { value: 'plan', label: 'Plan', icon: '📋' },
  { value: 'parse', label: 'Parse', icon: '🔧' },
  { value: 'system', label: 'System', icon: '⚙️' },
];

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }) + '.' + date.getMilliseconds().toString().padStart(3, '0');
}

function LogEntry({ log, isExpanded, onToggle }: { log: ConsoleLog; isExpanded: boolean; onToggle: () => void }) {
  const hasData = log.data !== undefined;
  
  return (
    <div className={cn(
      'group border-b border-white/5 hover:bg-white/5 transition-colors',
      log.level === 'error' && 'bg-red-500/5'
    )}>
      <div 
        className={cn(
          'flex items-start gap-2 px-3 py-1.5 text-xs font-mono',
          hasData && 'cursor-pointer'
        )}
        onClick={hasData ? onToggle : undefined}
      >
        <div className="w-4 flex-shrink-0">
          {hasData && (
            isExpanded 
              ? <ChevronDown className="w-3 h-3 text-gray-500" />
              : <ChevronRight className="w-3 h-3 text-gray-500" />
          )}
        </div>
        
        <span className="text-gray-600 flex-shrink-0 w-20">
          {formatTimestamp(log.timestamp)}
        </span>
        
        <span className={cn(
          'px-1.5 py-0.5 rounded text-[10px] uppercase font-semibold flex-shrink-0',
          log.level === 'debug' && 'bg-gray-500/20 text-gray-400',
          log.level === 'info' && 'bg-blue-500/20 text-blue-400',
          log.level === 'warn' && 'bg-yellow-500/20 text-yellow-400',
          log.level === 'error' && 'bg-red-500/20 text-red-400',
        )}>
          {log.level}
        </span>
        
        <span className={cn('flex-1', levelColors[log.level])}>
          {log.message}
        </span>
        
        {log.duration && (
          <span className="text-gray-500 flex-shrink-0">
            {log.duration.toFixed(0)}ms
          </span>
        )}
      </div>
      
      {hasData && isExpanded && (
        <div className="px-3 pb-2 pl-10">
          <pre className="text-[10px] text-gray-400 bg-black/30 p-2 rounded overflow-x-auto max-h-40 overflow-y-auto">
            {typeof log.data === 'string' ? log.data : JSON.stringify(log.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export function SystemConsole() {
  const { logs, clearLogs, exportLogs, copyLogs, searchQuery, setSearchQuery } = useConsoleStore();
  const [filter, setFilter] = useState<LogCategory | 'all'>('all');
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [showSearch, setShowSearch] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);
  
  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
      setAutoScroll(isAtBottom);
    }
  };
  
  const handleExport = () => {
    const text = exportLogs();
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `adorable-logs-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const filteredLogs = logs
    .filter(log => filter === 'all' || log.category === filter)
    .filter(log => !searchQuery || log.message.toLowerCase().includes(searchQuery.toLowerCase()));
  
  const toggleExpanded = (id: string) => {
    setExpandedLogs(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };
  
  return (
    <div className="flex flex-col h-full bg-[#0a0a0f]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-[#111118]">
        <div className="flex items-center gap-1">
          {categoryFilters.map(({ value, label, icon }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              className={cn(
                'px-2 py-1 text-xs rounded transition-colors flex items-center gap-1',
                filter === value
                  ? 'bg-yellow-500/20 text-yellow-400'
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              )}
            >
              <span>{icon}</span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-1">
          {/* Search */}
          {showSearch ? (
            <div className="flex items-center gap-1 bg-white/5 rounded-lg px-2">
              <Search className="w-3 h-3 text-gray-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search logs..."
                className="bg-transparent text-xs text-white placeholder:text-gray-500 outline-none w-24 py-1"
                autoFocus
              />
              <button onClick={() => { setShowSearch(false); setSearchQuery(''); }}>
                <X className="w-3 h-3 text-gray-500 hover:text-white" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded transition-colors"
              title="Search"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          )}
          
          <span className="text-xs text-gray-500 px-2">
            {filteredLogs.length}
          </span>
          
          <button
            onClick={copyLogs}
            className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded transition-colors"
            title="Copy logs"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={handleExport}
            className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded transition-colors"
            title="Export logs"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={clearLogs}
            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-white/5 rounded transition-colors"
            title="Clear logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      
      {/* Logs area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto scrollbar-thin"
        onScroll={handleScroll}
      >
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 text-sm">
            <span className="text-2xl mb-2">📋</span>
            <span>No logs yet</span>
            <span className="text-xs text-gray-600 mt-1">
              System activity will appear here
            </span>
          </div>
        ) : (
          filteredLogs.map(log => (
            <LogEntry 
              key={log.id} 
              log={log}
              isExpanded={expandedLogs.has(log.id)}
              onToggle={() => toggleExpanded(log.id)}
            />
          ))
        )}
      </div>
      
      {/* Auto-scroll indicator */}
      {!autoScroll && (
        <button
          onClick={() => {
            setAutoScroll(true);
            if (scrollRef.current) {
              scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
            }
          }}
          className="absolute bottom-2 right-2 px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full hover:bg-yellow-500/30 transition-colors"
        >
          ↓ New logs
        </button>
      )}
    </div>
  );
}
