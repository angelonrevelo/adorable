import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogCategory = 'file' | 'api' | 'parse' | 'system' | 'ai' | 'plan';

export interface ConsoleLog {
  id: string;
  timestamp: number;
  level: LogLevel;
  category: LogCategory;
  message: string;
  data?: any;
  duration?: number;
}

interface ConsoleStore {
  logs: ConsoleLog[];
  maxLogs: number;
  searchQuery: string;
  
  // Core actions
  addLog: (log: Omit<ConsoleLog, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
  setSearchQuery: (query: string) => void;
  
  // Export methods
  exportLogs: () => string;
  copyLogs: () => void;
  
  // Convenience methods with icons
  logFileRead: (fileName: string, size?: number) => void;
  logFileWrite: (fileName: string, action: 'create' | 'modify' | 'delete') => void;
  logApiRequest: (endpoint: string, payloadSize: number) => void;
  logApiResponse: (statusCode: number, responsePreview: string, duration: number) => void;
  logParsing: (status: 'started' | 'success' | 'error', details?: string) => void;
  logAIThought: (thought: string) => void;
  logAIResponse: (message: string, fileCount: number) => void;
  logError: (message: string, error?: Error) => void;
  logSystem: (message: string) => void;
  logStreaming: (chars: number) => void;
  logPlan: (message: string, data?: any) => void;

  // Enhanced logging methods (v2.1.0)
  logTokenUsage: (promptTokens: number, responseTokens: number, totalTokens: number) => void;
  logTokenBudget: (remaining: number, percentage: number, level: 'ok' | 'warning' | 'danger') => void;
  logCodeMetrics: (metrics: {filesCreated: number, filesModified: number, linesAdded: number}) => void;
  logValidation: (errors: number, warnings: number) => void;
  logPerformance: (operation: string, duration: number, tokensPerSecond?: number) => void;
}

export const useConsoleStore = create<ConsoleStore>((set, get) => ({
  logs: [],
  maxLogs: 500,
  searchQuery: '',
  
  addLog: (log) => {
    const newLog: ConsoleLog = {
      ...log,
      id: uuidv4(),
      timestamp: Date.now(),
    };
    
    set(state => ({
      logs: [...state.logs, newLog].slice(-state.maxLogs),
    }));
  },
  
  clearLogs: () => {
    set({ logs: [] });
  },
  
  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },
  
  exportLogs: () => {
    const { logs } = get();
    const formatTime = (ts: number) => {
      const d = new Date(ts);
      return d.toLocaleTimeString('en-US', { hour12: false }) + '.' + d.getMilliseconds().toString().padStart(3, '0');
    };
    
    let output = `# Adorable IDE System Logs\n`;
    output += `# Exported: ${new Date().toISOString()}\n`;
    output += `# Total: ${logs.length} entries\n\n`;
    
    logs.forEach(log => {
      const time = formatTime(log.timestamp);
      const duration = log.duration ? ` (${log.duration.toFixed(0)}ms)` : '';
      output += `[${time}] [${log.level.toUpperCase()}] ${log.message}${duration}\n`;
      if (log.data) {
        output += `  └─ ${typeof log.data === 'string' ? log.data.slice(0, 200) : JSON.stringify(log.data).slice(0, 200)}\n`;
      }
    });
    
    return output;
  },
  
  copyLogs: () => {
    const text = get().exportLogs();
    navigator.clipboard.writeText(text);
  },
  
  logFileRead: (fileName, size) => {
    get().addLog({
      level: 'info',
      category: 'file',
      message: `📖 Reading: ${fileName}${size ? ` (${(size / 1024).toFixed(1)} KB)` : ''}`,
    });
  },
  
  logFileWrite: (fileName, action) => {
    const actionIcon = action === 'create' ? '➕' : action === 'modify' ? '✏️' : '🗑️';
    const actionText = action === 'create' ? 'Creating' : action === 'modify' ? 'Modifying' : 'Deleting';
    get().addLog({
      level: 'info',
      category: 'file',
      message: `${actionIcon} ${actionText}: ${fileName}`,
    });
  },
  
  logApiRequest: (endpoint, payloadSize) => {
    get().addLog({
      level: 'info',
      category: 'api',
      message: `🌐 API Request: ${endpoint} (${(payloadSize / 1024).toFixed(1)} KB payload)`,
    });
  },
  
  logApiResponse: (statusCode, responsePreview, duration) => {
    const isSuccess = statusCode >= 200 && statusCode < 300;
    get().addLog({
      level: isSuccess ? 'info' : 'error',
      category: 'api',
      message: `📥 API Response: ${statusCode} ${isSuccess ? 'OK' : 'Error'} (${duration.toFixed(0)}ms)`,
      data: responsePreview,
      duration,
    });
  },
  
  logParsing: (status, details) => {
    const icon = status === 'started' ? '🔧' : status === 'success' ? '✅' : '❌';
    get().addLog({
      level: status === 'error' ? 'error' : 'info',
      category: 'parse',
      message: `${icon} Parsing ${status}${details ? `: ${details}` : ''}`,
    });
  },
  
  logAIThought: (thought) => {
    get().addLog({
      level: 'debug',
      category: 'ai',
      message: `🧠 AI Thinking: ${thought.slice(0, 150)}${thought.length > 150 ? '...' : ''}`,
      data: thought,
    });
  },
  
  logAIResponse: (message, fileCount) => {
    get().addLog({
      level: 'info',
      category: 'ai',
      message: `💬 AI Response: "${message.slice(0, 80)}${message.length > 80 ? '...' : ''}" (${fileCount} file${fileCount !== 1 ? 's' : ''})`,
    });
  },
  
  logError: (message, error) => {
    get().addLog({
      level: 'error',
      category: 'system',
      message: `❌ Error: ${message}`,
      data: error?.stack || error?.message,
    });
  },
  
  logSystem: (message) => {
    get().addLog({
      level: 'info',
      category: 'system',
      message: `⚙️ ${message}`,
    });
  },
  
  logStreaming: (chars) => {
    if (chars % 1000 === 0) {
      get().addLog({
        level: 'debug',
        category: 'api',
        message: `📶 Streaming: ${chars} chars received`,
      });
    }
  },
  
  logPlan: (message, data) => {
    get().addLog({
      level: 'info',
      category: 'plan',
      message: `📋 ${message}`,
      data,
    });
  },

  // Enhanced logging methods (v2.1.0)
  logTokenUsage: (promptTokens, responseTokens, totalTokens) => {
    const formatNum = (n: number) => n.toLocaleString();
    get().addLog({
      level: 'info',
      category: 'ai',
      message: `🔢 Tokens: ${formatNum(promptTokens)} prompt + ${formatNum(responseTokens)} response = ${formatNum(totalTokens)} total`,
      data: { promptTokens, responseTokens, totalTokens },
    });
  },

  logTokenBudget: (remaining, percentage, level) => {
    const icon = level === 'danger' ? '🚨' : level === 'warning' ? '⚠️' : '✅';
    const formatNum = (n: number) => n.toLocaleString();
    get().addLog({
      level: level === 'danger' ? 'error' : level === 'warning' ? 'warn' : 'info',
      category: 'system',
      message: `${icon} Token budget: ${formatNum(remaining)} remaining (${percentage.toFixed(1)}%)`,
      data: { remaining, percentage, level },
    });
  },

  logCodeMetrics: (metrics) => {
    const { filesCreated, filesModified, linesAdded } = metrics;
    const parts: string[] = [];
    if (filesCreated > 0) parts.push(`+${filesCreated} files`);
    if (filesModified > 0) parts.push(`~${filesModified} files`);
    if (linesAdded > 0) parts.push(`+${linesAdded} lines`);

    get().addLog({
      level: 'info',
      category: 'system',
      message: `📝 Code: ${parts.join(', ') || 'No changes'}`,
      data: metrics,
    });
  },

  logValidation: (errors, warnings) => {
    const icon = errors > 0 ? '❌' : warnings > 0 ? '⚠️' : '✅';
    const level: LogLevel = errors > 0 ? 'error' : warnings > 0 ? 'warn' : 'info';

    get().addLog({
      level,
      category: 'system',
      message: `${icon} Validation: ${errors} error${errors !== 1 ? 's' : ''}, ${warnings} warning${warnings !== 1 ? 's' : ''}`,
      data: { errors, warnings },
    });
  },

  logPerformance: (operation, duration, tokensPerSecond) => {
    const seconds = (duration / 1000).toFixed(1);
    const isSlow = duration > 20000;
    const icon = isSlow ? '🐌' : '⚡';

    let message = `${icon} ${operation}: ${seconds}s`;
    if (tokensPerSecond) {
      message += ` (${Math.round(tokensPerSecond)} tok/s)`;
    }
    if (isSlow) {
      message += ' [SLOW]';
    }

    get().addLog({
      level: isSlow ? 'warn' : 'info',
      category: 'system',
      message,
      duration,
      data: { operation, duration, tokensPerSecond },
    });
  },
}));
