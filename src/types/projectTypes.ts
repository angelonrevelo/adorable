// Project and file system types for the IDE

export interface Project {
    id: string;
    name: string;
    description?: string;
    createdAt: Date;
    updatedAt: Date;
    userId?: string;
}

export interface ProjectFile {
    id: string;
    path: string;           // e.g., "src/components/Button.tsx"
    content: string;
    language: FileLanguage;
    isEntryPoint?: boolean; // e.g., main.tsx
}

export type FileLanguage =
    | 'typescript'
    | 'javascript'
    | 'tsx'
    | 'jsx'
    | 'css'
    | 'html'
    | 'json'
    | 'markdown'
    | 'text';

export interface FileTreeNode {
    name: string;
    path: string;
    type: 'file' | 'directory';
    children?: FileTreeNode[];
    isOpen?: boolean; // For directories
}

// AI Generation types
export interface AIGenerationRequest {
    prompt: string;
    projectFiles: ProjectFile[];
    conversationHistory: ConversationMessage[];
}

export interface AIGenerationResponse {
    thought: string;
    files: FileOperation[];
    dependencies?: Record<string, string>;
    message?: string;
}

export interface FileOperation {
    path: string;
    content: string;
    action: 'create' | 'modify' | 'delete';
}

export interface ConversationMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    thought?: string;
    timestamp: Date;
    fileOperations?: FileOperation[];
}

// Template for new projects
export interface ProjectTemplate {
    id: string;
    name: string;
    description: string;
    icon: string;
    files: Omit<ProjectFile, 'id'>[];
    dependencies: Record<string, string>;
}
