import { X, FileCode, FileJson, FileType, File } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProjectStore } from '@/stores/useProjectStore';

// Get icon for file type
function getFileIcon(path: string) {
    const ext = path.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'tsx':
        case 'ts':
            return <FileCode className="w-3.5 h-3.5 text-blue-400" />;
        case 'jsx':
        case 'js':
            return <FileCode className="w-3.5 h-3.5 text-yellow-400" />;
        case 'json':
            return <FileJson className="w-3.5 h-3.5 text-green-400" />;
        case 'css':
            return <FileType className="w-3.5 h-3.5 text-purple-400" />;
        case 'html':
            return <FileType className="w-3.5 h-3.5 text-orange-400" />;
        default:
            return <File className="w-3.5 h-3.5 text-gray-400" />;
    }
}

export function EditorTabs() {
    const { openFiles, activeFile, setActiveFile, closeFile } = useProjectStore();

    if (openFiles.length === 0) {
        return null;
    }

    return (
        <div className="flex items-center bg-[#111118] border-b border-white/5 overflow-x-auto scrollbar-thin">
            {openFiles.map((path) => {
                const fileName = path.split('/').pop() || path;
                const isActive = path === activeFile;

                return (
                    <div
                        key={path}
                        className={cn(
                            'group flex items-center gap-2 px-3 py-2 border-r border-white/5 cursor-pointer transition-colors min-w-0',
                            isActive
                                ? 'bg-[#1a1a24] text-white'
                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                        )}
                        onClick={() => setActiveFile(path)}
                    >
                        {getFileIcon(path)}
                        <span className="text-sm truncate max-w-[120px]">{fileName}</span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                closeFile(path);
                            }}
                            className={cn(
                                'p-0.5 rounded hover:bg-white/10 transition-colors',
                                isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            )}
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
