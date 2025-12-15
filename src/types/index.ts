export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  thought?: string;
  timestamp: Date;
}

export interface Page {
  id: string;
  title: string;
  html: string;
}

export interface Template {
  id: string;
  title: string;
  icon: string;
  prompt: string;
}

export interface GenerationResult {
  thought: string;
  response: string;
  pages: Page[];
}

export interface FileOperation {
  path: string;
  content: string;
  action: 'create' | 'modify' | 'delete';
}

export interface GenerateVibeResponse {
  thought: string;
  html?: string;       // Legacy single-file HTML
  title?: string;      // Legacy title
  files?: FileOperation[];  // New multi-file format
  message?: string;    // Optional message for chat
  dependencies?: Record<string, string>;  // NPM packages to add
  debugInfo?: DebugInfo;  // Debug information for panel
}

export interface DebugInfo {
  systemPrompt?: string;
  userPrompt?: string;
  rawResponse?: string;
  parsedResponse?: {
    thought?: string;
    message?: string;
    files?: Array<{ path: string; action: string }>;
    html?: string;
  };
  error?: string;
  timestamp?: string;
  duration?: number;
}
