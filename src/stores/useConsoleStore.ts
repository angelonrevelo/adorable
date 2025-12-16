import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogCategory = 'file' | 'api' | 'parse' | 'system' | 'ai';

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
  
  // Core actions
  addLog: (log: Omit<ConsoleLog, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
  
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
}

export const useConsoleStore = create<ConsoleStore>((set, get) => ({
  logs: [],
  maxLogs: 500,
  
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
    // Only log at certain intervals to avoid spam
    if (chars % 1000 === 0) {
      get().addLog({
        level: 'debug',
        category: 'api',
        message: `📶 Streaming: ${chars} chars received`,
      });
    }
  },
}));
