import { useState, useEffect, useCallback } from 'react';
import {
    Panel,
    PanelGroup,
    PanelResizeHandle
} from 'react-resizable-panels';
import { IDEChatPanel } from '@/components/IDEChatPanel';
import { EditorPanel } from '@/components/editor/EditorPanel';
import { FileTree } from '@/components/file-tree/FileTree';
import { PreviewPanel } from '@/components/preview/PreviewPanel';
import { ProjectDashboard } from '@/components/ProjectDashboard';
import { useProjectStore } from '@/stores/useProjectStore';
import { ProjectService } from '@/services/projectService';
import { templates } from '@/templates/projectTemplates';
import { Home, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

function ResizeHandle({ className }: { className?: string }) {
    return (
        <PanelResizeHandle className={`group relative flex items-center justify-center ${className}`}>
            <div className="w-px h-full bg-white/5 group-hover:bg-purple-500/50 transition-colors" />
            <div className="absolute inset-y-0 -left-1 -right-1 cursor-col-resize" />
        </PanelResizeHandle>
    );
}

export default function IDE() {
    const { project, files, createProject, loadProject, clearProject } = useProjectStore();
    const [showDashboard, setShowDashboard] = useState(!project);
    const [isSaving, setIsSaving] = useState(false);
    const { toast } = useToast();

    // Show dashboard when no project
    useEffect(() => {
        if (!project) {
            setShowDashboard(true);
        }
    }, [project]);

    const handleNewProject = useCallback(async (templateId: string) => {
        const template = templates.find(t => t.id === templateId);
        if (!template) return;

        // Create project locally
        createProject(template.name, template.files);
        setShowDashboard(false);

        // Try to save to database if authenticated
        const isAuth = await ProjectService.isAuthenticated();
        if (isAuth) {
            const result = await ProjectService.createProject(
                template.name,
                template.files,
                template.description
            );
            if (result) {
                // Update local project with database ID
                loadProject(result.project, result.files);
                toast({
                    title: 'Project created',
                    description: 'Your project has been saved to the cloud.',
                });
            }
        }
    }, [createProject, loadProject, toast]);

    const handleProjectSelect = useCallback(async (projectId: string) => {
        const result = await ProjectService.loadProject(projectId);
        if (result) {
            loadProject(result.project, result.files);
            setShowDashboard(false);
            toast({
                title: 'Project loaded',
                description: `Opened "${result.project.name}"`,
            });
        } else {
            toast({
                title: 'Error',
                description: 'Failed to load project',
                variant: 'destructive',
            });
        }
    }, [loadProject, toast]);

    const handleSave = useCallback(async () => {
        if (!project) return;

        setIsSaving(true);
        try {
            const isAuth = await ProjectService.isAuthenticated();
            if (!isAuth) {
                toast({
                    title: 'Sign in required',
                    description: 'Please sign in to save your project.',
                    variant: 'destructive',
                });
                return;
            }

            const projectFiles = Array.from(files.values());
            const success = await ProjectService.saveProjectFiles(project.id, projectFiles);

            if (success) {
                toast({
                    title: 'Saved',
                    description: 'Project saved successfully.',
                });
            } else {
                throw new Error('Failed to save');
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to save project.',
                variant: 'destructive',
            });
        } finally {
            setIsSaving(false);
        }
    }, [project, files, toast]);

    const handleGoHome = useCallback(() => {
        clearProject();
        setShowDashboard(true);
    }, [clearProject]);

    // Show dashboard
    if (showDashboard) {
        return (
            <ProjectDashboard
                onProjectSelect={handleProjectSelect}
                onNewProject={handleNewProject}
            />
        );
    }

    return (
        <div className="h-screen flex flex-col bg-[#0a0a0f] overflow-hidden">
            {/* Top Bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-[#0d0d12]">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleGoHome}
                        className="text-gray-400 hover:text-white"
                    >
                        <Home className="w-4 h-4 mr-1" />
                        Home
                    </Button>
                    {project && (
                        <span className="text-sm text-gray-500 border-l border-white/10 pl-3 ml-1">
                            {project.name}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSave}
                        disabled={isSaving || !project}
                        className="text-gray-400 hover:text-white"
                    >
                        {isSaving ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4 mr-1" />
                        )}
                        Save
                    </Button>
                </div>
            </div>

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

