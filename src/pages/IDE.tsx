import {
    Panel,
    PanelGroup,
    PanelResizeHandle
} from 'react-resizable-panels';
import { IDEChatPanel } from '@/components/IDEChatPanel';
import { EditorPanel } from '@/components/editor/EditorPanel';
import { FileTree } from '@/components/file-tree/FileTree';
import { PreviewPanel } from '@/components/preview/PreviewPanel';
import { useProjectStore } from '@/stores/useProjectStore';
import { GripVertical } from 'lucide-react';

function ResizeHandle({ className }: { className?: string }) {
    return (
        <PanelResizeHandle className={`group relative flex items-center justify-center ${className}`}>
            <div className="w-px h-full bg-white/5 group-hover:bg-purple-500/50 transition-colors" />
            <div className="absolute inset-y-0 -left-1 -right-1 cursor-col-resize" />
        </PanelResizeHandle>
    );
}

export default function IDE() {
    const { project } = useProjectStore();

    return (
        <div className="h-screen flex flex-col bg-[#0a0a0f] overflow-hidden">
            {/* Main Content */}
            <PanelGroup direction="horizontal" className="flex-1">
                {/* Left: Chat Panel */}
                <Panel defaultSize={25} minSize={20} maxSize={35}>
                    <IDEChatPanel />
                </Panel>

                <ResizeHandle />

                {/* Middle: File Tree + Editor */}
                <Panel defaultSize={40} minSize={30}>
                    <PanelGroup direction="horizontal">
                        {/* File Tree */}
                        {project && (
                            <>
                                <Panel defaultSize={25} minSize={15} maxSize={40}>
                                    <FileTree />
                                </Panel>
                                <ResizeHandle />
                            </>
                        )}

                        {/* Editor */}
                        <Panel defaultSize={project ? 75 : 100}>
                            <EditorPanel />
                        </Panel>
                    </PanelGroup>
                </Panel>

                <ResizeHandle />

                {/* Right: Preview */}
                <Panel defaultSize={35} minSize={25}>
                    <PreviewPanel />
                </Panel>
            </PanelGroup>
        </div>
    );
}
