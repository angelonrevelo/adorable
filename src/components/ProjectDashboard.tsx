import { useState, useEffect } from 'react';
import {
    FolderOpen,
    Plus,
    Trash2,
    Clock,
    MoreVertical,
    Sparkles,
    LogIn,
    LogOut,
    User
} from 'lucide-react';
import { Project } from '@/types/projectTypes';
import { ProjectService } from '@/services/projectService';
import { templates } from '@/templates/projectTemplates';
import { useProjectStore } from '@/stores/useProjectStore';
import { supabase } from '@/integrations/supabase/client';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface ProjectDashboardProps {
    onProjectSelect: (projectId: string) => void;
    onNewProject: (templateId: string) => void;
}

export function ProjectDashboard({ onProjectSelect, onNewProject }: ProjectDashboardProps) {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userEmail, setUserEmail] = useState<string | null>(null);
    const [showAuthDialog, setShowAuthDialog] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [authError, setAuthError] = useState<string | null>(null);
    const [authLoading, setAuthLoading] = useState(false);

    useEffect(() => {
        loadProjects();
        checkAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setIsAuthenticated(!!session?.user);
            setUserEmail(session?.user?.email || null);
            if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
                loadProjects();
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const checkAuth = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setIsAuthenticated(!!user);
        setUserEmail(user?.email || null);
    };

    const loadProjects = async () => {
        setIsLoading(true);
        const projectList = await ProjectService.getUserProjects();
        setProjects(projectList);
        setIsLoading(false);
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setAuthError(null);
        setAuthLoading(true);

        try {
            if (authMode === 'login') {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
            }
            setShowAuthDialog(false);
            setEmail('');
            setPassword('');
        } catch (err: any) {
            setAuthError(err.message || 'Authentication failed');
        } finally {
            setAuthLoading(false);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
    };

    const handleDeleteProject = async (projectId: string) => {
        if (confirm('Are you sure you want to delete this project?')) {
            await ProjectService.deleteProject(projectId);
            loadProjects();
        }
    };

    const formatDate = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white">
            {/* Header */}
            <header className="border-b border-white/5 px-6 py-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-semibold text-white">Adorable</h1>
                            <span className="text-xs font-mono text-gray-500">Adorable AI</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {isAuthenticated ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors">
                                        <User className="w-4 h-4 text-gray-400" />
                                        <span className="text-sm text-gray-300 truncate max-w-[150px]">
                                            {userEmail}
                                        </span>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-[#1a1a24] border-white/10">
                                    <DropdownMenuItem
                                        onClick={handleSignOut}
                                        className="text-gray-300 focus:text-white focus:bg-white/10"
                                    >
                                        <LogOut className="w-4 h-4 mr-2" />
                                        Sign Out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowAuthDialog(true)}
                                className="border-white/10 text-gray-300 hover:text-white hover:bg-white/5"
                            >
                                <LogIn className="w-4 h-4 mr-2" />
                                Sign In
                            </Button>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-6 py-8">
                {/* New Project Section */}
                <section className="mb-12">
                    <h2 className="text-lg font-medium mb-4">Start a new project</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {templates.map((template) => (
                            <button
                                key={template.id}
                                onClick={() => onNewProject(template.id)}
                                className="flex flex-col items-center gap-3 p-6 bg-[#111118] border border-white/5 rounded-xl 
                           hover:border-purple-500/30 hover:bg-purple-500/5 transition-all group"
                            >
                                <span className="text-3xl">{template.icon}</span>
                                <div className="text-center">
                                    <div className="font-medium text-white group-hover:text-purple-300 transition-colors">
                                        {template.name}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">{template.description}</div>
                                </div>
                            </button>
                        ))}
                    </div>
                </section>

                {/* Recent Projects Section */}
                <section>
                    <h2 className="text-lg font-medium mb-4">Recent projects</h2>

                    {!isAuthenticated ? (
                        <div className="text-center py-12 bg-[#111118] rounded-xl border border-white/5">
                            <User className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400 mb-4">Sign in to save and access your projects</p>
                            <Button
                                onClick={() => setShowAuthDialog(true)}
                                className="bg-purple-600 hover:bg-purple-700"
                            >
                                <LogIn className="w-4 h-4 mr-2" />
                                Sign In
                            </Button>
                        </div>
                    ) : isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-32 bg-[#111118] rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="text-center py-12 bg-[#111118] rounded-xl border border-white/5">
                            <FolderOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                            <p className="text-gray-400">No projects yet. Create your first one above!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {projects.map((project) => (
                                <div
                                    key={project.id}
                                    className="group bg-[#111118] border border-white/5 rounded-xl p-4 
                             hover:border-purple-500/30 transition-all cursor-pointer"
                                    onClick={() => onProjectSelect(project.id)}
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                            <FolderOpen className="w-5 h-5 text-purple-400" />
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button
                                                    className="p-1 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded transition-all"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <MoreVertical className="w-4 h-4 text-gray-400" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent className="bg-[#1a1a24] border-white/10">
                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteProject(project.id);
                                                    }}
                                                    className="text-red-400 focus:text-red-300 focus:bg-red-500/10"
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <h3 className="font-medium text-white mb-1 truncate">{project.name}</h3>
                                    {project.description && (
                                        <p className="text-sm text-gray-500 truncate mb-2">{project.description}</p>
                                    )}
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <Clock className="w-3 h-3" />
                                        {formatDate(project.updatedAt)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>

            {/* Auth Dialog */}
            <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
                <DialogContent className="bg-[#1a1a24] border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-white">
                            {authMode === 'login' ? 'Sign In' : 'Create Account'}
                        </DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAuth} className="space-y-4">
                        <div>
                            <Input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-[#0a0a0f] border-white/10 text-white"
                                required
                            />
                        </div>
                        <div>
                            <Input
                                type="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-[#0a0a0f] border-white/10 text-white"
                                required
                                minLength={6}
                            />
                        </div>
                        {authError && (
                            <p className="text-red-400 text-sm">{authError}</p>
                        )}
                        <DialogFooter className="flex-col gap-2">
                            <Button
                                type="submit"
                                className="w-full bg-purple-600 hover:bg-purple-700"
                                disabled={authLoading}
                            >
                                {authLoading ? 'Loading...' : authMode === 'login' ? 'Sign In' : 'Create Account'}
                            </Button>
                            <button
                                type="button"
                                onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                                className="text-sm text-gray-400 hover:text-white transition-colors"
                            >
                                {authMode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
                            </button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
