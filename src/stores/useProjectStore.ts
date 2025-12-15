import { create } from 'zustand';
import { Project, ProjectFile, FileTreeNode, ConversationMessage, FileOperation } from '@/types/projectTypes';
import { v4 as uuidv4 } from 'uuid';

// Helper to get language from file path
function getLanguageFromPath(path: string): ProjectFile['language'] {
    const ext = path.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'ts': return 'typescript';
        case 'tsx': return 'tsx';
        case 'js': return 'javascript';
        case 'jsx': return 'jsx';
        case 'css': return 'css';
        case 'html': return 'html';
        case 'json': return 'json';
        case 'md': return 'markdown';
        default: return 'text';
    }
}

// Helper to build file tree from flat file list
function buildFileTree(files: ProjectFile[]): FileTreeNode[] {
    const root: FileTreeNode[] = [];

    files.forEach(file => {
        const parts = file.path.split('/');
        let current = root;

        parts.forEach((part, index) => {
            const isFile = index === parts.length - 1;
            const path = parts.slice(0, index + 1).join('/');

            let node = current.find(n => n.name === part);

            if (!node) {
                node = {
                    name: part,
                    path,
                    type: isFile ? 'file' : 'directory',
                    children: isFile ? undefined : [],
                    isOpen: true,
                };
                current.push(node);
            }

            if (!isFile && node.children) {
                current = node.children;
            }
        });
    });

    // Sort: directories first, then files, alphabetically
    const sortNodes = (nodes: FileTreeNode[]): FileTreeNode[] => {
        return nodes.sort((a, b) => {
            if (a.type !== b.type) {
                return a.type === 'directory' ? -1 : 1;
            }
            return a.name.localeCompare(b.name);
        }).map(node => ({
            ...node,
            children: node.children ? sortNodes(node.children) : undefined,
        }));
    };

    return sortNodes(root);
}

interface ProjectStore {
    // Project state
    project: Project | null;
    files: Map<string, ProjectFile>;
    fileTree: FileTreeNode[];

    // Editor state
    activeFile: string | null;
    openFiles: string[];

    // Conversation state
    messages: ConversationMessage[];
    isGenerating: boolean;

    // Error state for Sandpack
    sandpackError: string | null;

    // Project actions
    createProject: (name: string, templateFiles?: Omit<ProjectFile, 'id'>[]) => void;
    loadProject: (project: Project, files: ProjectFile[]) => void;
    clearProject: () => void;

    // File actions
    setActiveFile: (path: string | null) => void;
    openFile: (path: string) => void;
    closeFile: (path: string) => void;
    updateFileContent: (path: string, content: string) => void;
    createFile: (path: string, content?: string) => void;
    deleteFile: (path: string) => void;
    renameFile: (oldPath: string, newPath: string) => void;
    applyFileOperations: (operations: FileOperation[]) => void;

    // Tree actions
    toggleDirectory: (path: string) => void;

    // Conversation actions
    addMessage: (message: Omit<ConversationMessage, 'id' | 'timestamp'>) => void;
    setGenerating: (isGenerating: boolean) => void;
    clearMessages: () => void;

    // Error actions
    setSandpackError: (error: string | null) => void;
    clearSandpackError: () => void;
}

export const useProjectStore = create<ProjectStore>((set, get) => ({
    // Initial state
    project: null,
    files: new Map(),
    fileTree: [],
    activeFile: null,
    openFiles: [],
    messages: [],
    isGenerating: false,
    sandpackError: null,

    // Project actions
    createProject: (name, templateFiles) => {
        const project: Project = {
            id: uuidv4(),
            name,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const files = new Map<string, ProjectFile>();

        if (templateFiles) {
            templateFiles.forEach(file => {
                const projectFile: ProjectFile = {
                    ...file,
                    id: uuidv4(),
                };
                files.set(file.path, projectFile);
            });
        }

        const fileTree = buildFileTree(Array.from(files.values()));
        const firstFile = templateFiles?.[0]?.path || null;

        set({
            project,
            files,
            fileTree,
            activeFile: firstFile,
            openFiles: firstFile ? [firstFile] : [],
            messages: [],
        });
    },

    loadProject: (project, projectFiles) => {
        const files = new Map<string, ProjectFile>();
        projectFiles.forEach(file => files.set(file.path, file));

        const fileTree = buildFileTree(projectFiles);

        set({
            project,
            files,
            fileTree,
            activeFile: projectFiles[0]?.path || null,
            openFiles: projectFiles[0] ? [projectFiles[0].path] : [],
            messages: [],
        });
    },

    clearProject: () => {
        set({
            project: null,
            files: new Map(),
            fileTree: [],
            activeFile: null,
            openFiles: [],
            messages: [],
        });
    },

    // File actions
    setActiveFile: (path) => {
        set({ activeFile: path });
    },

    openFile: (path) => {
        const { openFiles } = get();
        if (!openFiles.includes(path)) {
            set({ openFiles: [...openFiles, path], activeFile: path });
        } else {
            set({ activeFile: path });
        }
    },

    closeFile: (path) => {
        const { openFiles, activeFile, files } = get();
        const newOpenFiles = openFiles.filter(f => f !== path);

        let newActiveFile = activeFile;
        if (activeFile === path) {
            const index = openFiles.indexOf(path);
            newActiveFile = newOpenFiles[index] || newOpenFiles[index - 1] || null;
        }

        set({ openFiles: newOpenFiles, activeFile: newActiveFile });
    },

    updateFileContent: (path, content) => {
        const { files, project } = get();
        const file = files.get(path);

        if (file) {
            const updatedFile = { ...file, content };
            const newFiles = new Map(files);
            newFiles.set(path, updatedFile);

            set({
                files: newFiles,
                project: project ? { ...project, updatedAt: new Date() } : null,
            });
        }
    },

    createFile: (path, content = '') => {
        const { files, project } = get();

        const newFile: ProjectFile = {
            id: uuidv4(),
            path,
            content,
            language: getLanguageFromPath(path),
        };

        const newFiles = new Map(files);
        newFiles.set(path, newFile);

        const fileTree = buildFileTree(Array.from(newFiles.values()));

        set({
            files: newFiles,
            fileTree,
            project: project ? { ...project, updatedAt: new Date() } : null,
        });

        // Open the new file
        get().openFile(path);
    },

    deleteFile: (path) => {
        const { files, openFiles, activeFile, project } = get();

        const newFiles = new Map(files);
        newFiles.delete(path);

        const fileTree = buildFileTree(Array.from(newFiles.values()));
        const newOpenFiles = openFiles.filter(f => f !== path);

        let newActiveFile = activeFile;
        if (activeFile === path) {
            newActiveFile = newOpenFiles[0] || null;
        }

        set({
            files: newFiles,
            fileTree,
            openFiles: newOpenFiles,
            activeFile: newActiveFile,
            project: project ? { ...project, updatedAt: new Date() } : null,
        });
    },

    renameFile: (oldPath, newPath) => {
        const { files } = get();
        const file = files.get(oldPath);

        if (file) {
            get().deleteFile(oldPath);
            get().createFile(newPath, file.content);
        }
    },

    applyFileOperations: (operations) => {
        operations.forEach(op => {
            switch (op.action) {
                case 'create':
                case 'modify':
                    const { files } = get();
                    if (files.has(op.path)) {
                        get().updateFileContent(op.path, op.content);
                    } else {
                        get().createFile(op.path, op.content);
                    }
                    break;
                case 'delete':
                    get().deleteFile(op.path);
                    break;
            }
        });
    },

    // Tree actions
    toggleDirectory: (path) => {
        const { fileTree } = get();

        const toggleNode = (nodes: FileTreeNode[]): FileTreeNode[] => {
            return nodes.map(node => {
                if (node.path === path && node.type === 'directory') {
                    return { ...node, isOpen: !node.isOpen };
                }
                if (node.children) {
                    return { ...node, children: toggleNode(node.children) };
                }
                return node;
            });
        };

        set({ fileTree: toggleNode(fileTree) });
    },

    // Conversation actions
    addMessage: (message) => {
        const { messages } = get();
        const newMessage: ConversationMessage = {
            ...message,
            id: uuidv4(),
            timestamp: new Date(),
        };
        set({ messages: [...messages, newMessage] });
    },

    setGenerating: (isGenerating) => {
        set({ isGenerating });
    },

    clearMessages: () => {
        set({ messages: [] });
    },

    // Error actions
    setSandpackError: (error) => {
        set({ sandpackError: error });
    },

    clearSandpackError: () => {
        set({ sandpackError: null });
    },
}));
