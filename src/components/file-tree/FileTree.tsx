import { useState, useCallback } from 'react';
import {
    ChevronRight,
    ChevronDown,
    File,
    FileCode,
    FileJson,
    FileType,
    Folder,
    FolderOpen,
    Plus,
    Trash2,
    Edit2,
    MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProjectStore } from '@/stores/useProjectStore';
import { FileTreeNode as IFileTreeNode } from '@/types/projectTypes';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
    ContextMenuSeparator,
} from '@/components/ui/context-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

// Get icon for file type
function getFileIcon(name: string) {
    const ext = name.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'tsx':
        case 'ts':
            return <FileCode className="w-4 h-4 text-blue-400" />;
        case 'jsx':
        case 'js':
            return <FileCode className="w-4 h-4 text-yellow-400" />;
        case 'json':
            return <FileJson className="w-4 h-4 text-green-400" />;
        case 'css':
            return <FileType className="w-4 h-4 text-purple-400" />;
        case 'html':
            return <FileType className="w-4 h-4 text-orange-400" />;
        default:
            return <File className="w-4 h-4 text-gray-400" />;
    }
}

interface FileTreeNodeProps {
    node: IFileTreeNode;
    depth: number;
    onCreateFile: (parentPath: string) => void;
    onDeleteFile: (path: string) => void;
    onRenameFile: (path: string) => void;
}

function FileTreeNodeComponent({ node, depth, onCreateFile, onDeleteFile, onRenameFile }: FileTreeNodeProps) {
    const { activeFile, openFile, toggleDirectory } = useProjectStore();

    const isActive = node.path === activeFile;
    const isDirectory = node.type === 'directory';

    const handleClick = () => {
        if (isDirectory) {
            toggleDirectory(node.path);
        } else {
            openFile(node.path);
        }
    };

    return (
        <ContextMenu>
            <ContextMenuTrigger>
                <div
                    className={cn(
                        'flex items-center gap-1.5 px-2 py-1 cursor-pointer transition-colors rounded-sm mx-1',
                        isActive && !isDirectory
                            ? 'bg-purple-500/20 text-white'
                            : 'text-gray-400 hover:text-white hover:bg-white/5'
                    )}
                    style={{ paddingLeft: `${depth * 12 + 8}px` }}
                    onClick={handleClick}
                >
                    {isDirectory ? (
                        <>
                            {node.isOpen ? (
                                <ChevronDown className="w-4 h-4 flex-shrink-0" />
                            ) : (
                                <ChevronRight className="w-4 h-4 flex-shrink-0" />
                            )}
                            {node.isOpen ? (
                                <FolderOpen className="w-4 h-4 text-amber-400 flex-shrink-0" />
                            ) : (
                                <Folder className="w-4 h-4 text-amber-400 flex-shrink-0" />
                            )}
                        </>
                    ) : (
                        <>
                            <span className="w-4" /> {/* Spacer for alignment */}
                            {getFileIcon(node.name)}
                        </>
                    )}
                    <span className="text-sm truncate">{node.name}</span>
                </div>
            </ContextMenuTrigger>

            <ContextMenuContent className="bg-[#1a1a24] border-white/10">
                {isDirectory ? (
                    <>
                        <ContextMenuItem
                            onClick={() => onCreateFile(node.path)}
                            className="text-gray-300 focus:text-white focus:bg-white/10"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            New File
                        </ContextMenuItem>
                        <ContextMenuSeparator className="bg-white/10" />
                    </>
                ) : null}
                <ContextMenuItem
                    onClick={() => onRenameFile(node.path)}
                    className="text-gray-300 focus:text-white focus:bg-white/10"
                >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Rename
                </ContextMenuItem>
                <ContextMenuItem
                    onClick={() => onDeleteFile(node.path)}
                    className="text-red-400 focus:text-red-300 focus:bg-red-500/10"
                >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
}

function FileTreeNodes({ nodes, depth, onCreateFile, onDeleteFile, onRenameFile }: {
    nodes: IFileTreeNode[];
    depth: number;
    onCreateFile: (parentPath: string) => void;
    onDeleteFile: (path: string) => void;
    onRenameFile: (path: string) => void;
}) {
    return (
        <>
            {nodes.map((node) => (
                <div key={node.path}>
                    <FileTreeNodeComponent
                        node={node}
                        depth={depth}
                        onCreateFile={onCreateFile}
                        onDeleteFile={onDeleteFile}
                        onRenameFile={onRenameFile}
                    />
                    {node.type === 'directory' && node.isOpen && node.children && (
                        <FileTreeNodes
                            nodes={node.children}
                            depth={depth + 1}
                            onCreateFile={onCreateFile}
                            onDeleteFile={onDeleteFile}
                            onRenameFile={onRenameFile}
                        />
                    )}
                </div>
            ))}
        </>
    );
}

export function FileTree() {
    const { project, fileTree, createFile, deleteFile, renameFile } = useProjectStore();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogMode, setDialogMode] = useState<'create' | 'rename'>('create');
    const [dialogPath, setDialogPath] = useState('');
    const [inputValue, setInputValue] = useState('');

    const handleCreateFile = useCallback((parentPath: string) => {
        setDialogMode('create');
        setDialogPath(parentPath);
        setInputValue('');
        setDialogOpen(true);
    }, []);

    const handleDeleteFile = useCallback((path: string) => {
        if (confirm(`Are you sure you want to delete "${path}"?`)) {
            deleteFile(path);
        }
    }, [deleteFile]);

    const handleRenameFile = useCallback((path: string) => {
        setDialogMode('rename');
        setDialogPath(path);
        setInputValue(path.split('/').pop() || '');
        setDialogOpen(true);
    }, []);

    const handleDialogSubmit = useCallback(() => {
        if (!inputValue.trim()) return;

        if (dialogMode === 'create') {
            const newPath = dialogPath ? `${dialogPath}/${inputValue}` : inputValue;
            createFile(newPath, '');
        } else {
            const parentPath = dialogPath.split('/').slice(0, -1).join('/');
            const newPath = parentPath ? `${parentPath}/${inputValue}` : inputValue;
            renameFile(dialogPath, newPath);
        }

        setDialogOpen(false);
    }, [dialogMode, dialogPath, inputValue, createFile, renameFile]);

    const handleCreateRootFile = useCallback(() => {
        setDialogMode('create');
        setDialogPath('src');
        setInputValue('');
        setDialogOpen(true);
    }, []);

    if (!project) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                No project loaded
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#0d0d12]">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Files
                </span>
                <button
                    onClick={handleCreateRootFile}
                    className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
                    title="New File"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            {/* File tree */}
            <div className="flex-1 overflow-y-auto py-2 scrollbar-thin">
                {fileTree.length > 0 ? (
                    <FileTreeNodes
                        nodes={fileTree}
                        depth={0}
                        onCreateFile={handleCreateFile}
                        onDeleteFile={handleDeleteFile}
                        onRenameFile={handleRenameFile}
                    />
                ) : (
                    <div className="px-3 py-4 text-center text-gray-500 text-sm">
                        No files yet
                    </div>
                )}
            </div>

            {/* Dialog for create/rename */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="bg-[#1a1a24] border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-white">
                            {dialogMode === 'create' ? 'Create New File' : 'Rename File'}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder={dialogMode === 'create' ? 'filename.tsx' : 'New name'}
                            className="bg-[#0a0a0f] border-white/10 text-white"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleDialogSubmit();
                                }
                            }}
                        />
                        {dialogMode === 'create' && dialogPath && (
                            <p className="text-xs text-gray-500 mt-2">
                                Will be created in: {dialogPath}/
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDialogOpen(false)}
                            className="border-white/10 text-gray-300 hover:text-white hover:bg-white/5"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDialogSubmit}
                            className="bg-purple-600 hover:bg-purple-700"
                        >
                            {dialogMode === 'create' ? 'Create' : 'Rename'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
