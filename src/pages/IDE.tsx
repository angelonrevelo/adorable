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
import { Home, Save, Loader2, Code2, X, ChevronLeft, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
    const [showCodePanel, setShowCodePanel] = useState(false);
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

    // Export all project files as readable text for debugging/sharing
    const handleExport = useCallback(() => {
        if (!project) return;

        const projectFiles = Array.from(files.values());

        // Create a readable text format with all files
        let exportContent = `# ${project.name} - Exported Code\n`;
        exportContent += `# Exported at: ${new Date().toISOString()}\n`;
        exportContent += `# Total files: ${projectFiles.length}\n\n`;
        exportContent += `${'='.repeat(80)}\n\n`;

        projectFiles.forEach((file, index) => {
            exportContent += `## FILE ${index + 1}: ${file.path}\n`;
            exportContent += `## Language: ${file.language}\n`;
            exportContent += `${'─'.repeat(60)}\n\n`;
            exportContent += `\`\`\`${file.language === 'typescript' ? 'tsx' : file.language}\n`;
            exportContent += file.content;
            exportContent += `\n\`\`\`\n\n`;
            exportContent += `${'='.repeat(80)}\n\n`;
        });

        // Create blob and download as .txt for easy reading
        const blob = new Blob([exportContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.name.replace(/\s+/g, '_')}_code.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast({
            title: 'Exported',
            description: 'All code files downloaded as text.',
        });
    }, [project, files, toast]);

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
            {/* Main Content: Chat + Preview */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left: Chat Panel */}
                <div className="w-[320px] min-w-[280px] max-w-[400px] flex-shrink-0 border-r border-white/5">
                    <IDEChatPanel />
                </div>

                {/* Right: Preview (Full width when code panel closed) */}
                <div className="flex-1 flex flex-col min-w-0 relative">
                    {/* Preview Header */}
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
                                onClick={handleExport}
                                disabled={!project}
                                className="text-gray-400 hover:text-white"
                                title="Download project files as JSON"
                            >
                                <Download className="w-4 h-4 mr-1" />
                                Export
                            </Button>
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
                            <Button
                                variant={showCodePanel ? "secondary" : "outline"}
                                size="sm"
                                onClick={() => setShowCodePanel(!showCodePanel)}
                                className={cn(
                                    "transition-colors",
                                    showCodePanel
                                        ? "bg-purple-600 text-white hover:bg-purple-700"
                                        : "border-white/10 text-gray-300 hover:text-white hover:bg-white/5"
                                )}
                            >
                                <Code2 className="w-4 h-4 mr-1" />
                                Code
                            </Button>
                        </div>
                    </div>

                    {/* Preview Area */}
                    <div className="flex-1 overflow-hidden">
                        <PreviewPanel />
                    </div>
                </div>
            </div>

            {/* Code Panel Overlay (Slides in from right) */}
            <div
                className={cn(
                    "fixed inset-y-0 right-0 w-[600px] max-w-[80vw] bg-[#0d0d12] border-l border-white/10",
                    "transform transition-transform duration-300 ease-in-out z-50 shadow-2xl",
                    showCodePanel ? "translate-x-0" : "translate-x-full"
                )}
            >
                {/* Code Panel Header */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-medium text-white">Code</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowCodePanel(false)}
                        className="text-gray-400 hover:text-white"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                {/* Code Panel Content: File Tree + Editor */}
                <div className="absolute inset-0 top-[49px] flex">
                    {/* File Tree */}
                    <div className="w-[200px] border-r border-white/5 flex-shrink-0 overflow-y-auto">
                        <FileTree />
                    </div>

                    {/* Editor */}
                    <div className="flex-1 min-w-0 h-full">
                        <EditorPanel />
                    </div>
                </div>
            </div>

            {/* Overlay backdrop when code panel is open */}
            {showCodePanel && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 transition-opacity"
                    onClick={() => setShowCodePanel(false)}
                />
            )}
        </div>
    );
}
