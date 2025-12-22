import { useMemo, useState, useEffect } from 'react';
import {
    SandpackProvider,
    SandpackPreview,
    SandpackConsole,
    useSandpack,
} from '@codesandbox/sandpack-react';
import { useProjectStore } from '@/stores/useProjectStore';
import { Monitor, Smartphone, Tablet, Terminal, RefreshCw, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SystemConsole } from '@/components/SystemConsole';

type ViewportSize = 'desktop' | 'tablet' | 'mobile';

const viewportSizes: Record<ViewportSize, { width: string; icon: React.ElementType }> = {
    desktop: { width: '100%', icon: Monitor },
    tablet: { width: '768px', icon: Tablet },
    mobile: { width: '375px', icon: Smartphone },
};

function PreviewToolbar() {
    const { sandpack } = useSandpack();
    const [viewport, setViewport] = useState<ViewportSize>('desktop');
    const [showConsole, setShowConsole] = useState(false);

    return (
        <div className="flex items-center justify-between px-3 py-2 bg-[#111118] border-b border-white/5">
            <div className="flex items-center gap-1">
                {(Object.entries(viewportSizes) as [ViewportSize, typeof viewportSizes.desktop][]).map(
                    ([size, { icon: Icon }]) => (
                        <button
                            key={size}
                            onClick={() => setViewport(size)}
                            className={cn(
                                'p-1.5 rounded transition-colors',
                                viewport === size
                                    ? 'bg-purple-500/20 text-purple-400'
                                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                            )}
                            title={size.charAt(0).toUpperCase() + size.slice(1)}
                        >
                            <Icon className="w-4 h-4" />
                        </button>
                    )
                )}
            </div>

            <div className="flex items-center gap-1">
                <button
                    onClick={() => setShowConsole(!showConsole)}
                    className={cn(
                        'p-1.5 rounded transition-colors',
                        showConsole
                            ? 'bg-purple-500/20 text-purple-400'
                            : 'text-gray-500 hover:text-white hover:bg-white/5'
                    )}
                    title="Toggle Console"
                >
                    <Terminal className="w-4 h-4" />
                </button>
                <button
                    onClick={() => sandpack.runSandpack()}
                    className="p-1.5 text-gray-500 hover:text-white hover:bg-white/5 rounded transition-colors"
                    title="Refresh"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

type ConsoleTab = 'app' | 'system';

function PreviewContent() {
    const [showConsole, setShowConsole] = useState(false);
    const [consoleTab, setConsoleTab] = useState<ConsoleTab>('system');
    const [viewport, setViewport] = useState<ViewportSize>('desktop');
    const { sandpack } = useSandpack();
    const { setSandpackError, clearSandpackError } = useProjectStore();

    // Capture Sandpack errors and send to store
    useEffect(() => {
        if (sandpack.error) {
            setSandpackError(sandpack.error.message);
        } else {
            clearSandpackError();
        }
    }, [sandpack.error, setSandpackError, clearSandpackError]);

    return (
        <div className="absolute inset-0 flex flex-col">
            {/* Toolbar */}
            <div className="flex items-center justify-between px-3 py-2 bg-[#111118] border-b border-white/5 flex-shrink-0">
                <div className="flex items-center gap-1">
                    {(Object.entries(viewportSizes) as [ViewportSize, typeof viewportSizes.desktop][]).map(
                        ([size, { icon: Icon }]) => (
                            <button
                                key={size}
                                onClick={() => setViewport(size)}
                                className={cn(
                                    'p-1.5 rounded transition-colors',
                                    viewport === size
                                        ? 'bg-purple-500/20 text-purple-400'
                                        : 'text-gray-500 hover:text-white hover:bg-white/5'
                                )}
                                title={size.charAt(0).toUpperCase() + size.slice(1)}
                            >
                                <Icon className="w-4 h-4" />
                            </button>
                        )
                    )}
                </div>

                <div className="flex items-center gap-1">
                    {/* System Console toggle */}
                    <button
                        onClick={() => {
                            setShowConsole(true);
                            setConsoleTab('system');
                        }}
                        className={cn(
                            'p-1.5 rounded transition-colors flex items-center gap-1',
                            showConsole && consoleTab === 'system'
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'text-gray-500 hover:text-white hover:bg-white/5'
                        )}
                        title="System Console"
                    >
                        <Activity className="w-4 h-4" />
                    </button>
                    {/* App Console toggle */}
                    <button
                        onClick={() => {
                            setShowConsole(true);
                            setConsoleTab('app');
                        }}
                        className={cn(
                            'p-1.5 rounded transition-colors',
                            showConsole && consoleTab === 'app'
                                ? 'bg-purple-500/20 text-purple-400'
                                : 'text-gray-500 hover:text-white hover:bg-white/5'
                        )}
                        title="App Console"
                    >
                        <Terminal className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Preview Area - takes remaining height */}
            <div className="flex-1 relative min-h-0" style={{ backgroundColor: '#1a1a24' }}>
                <div
                    className="absolute inset-0 flex items-stretch justify-center overflow-hidden"
                >
                    <div
                        className="h-full bg-white overflow-hidden transition-all duration-300"
                        style={{
                            width: viewportSizes[viewport].width,
                            maxWidth: '100%',
                        }}
                    >
                        <SandpackPreview
                            showNavigator={false}
                            showRefreshButton={false}
                            showOpenInCodeSandbox={false}
                            style={{ height: '100%', width: '100%' }}
                        />
                    </div>
                </div>
            </div>

            {/* Console - fixed height at bottom */}
            {showConsole && (
                <div className="h-56 border-t border-white/10 bg-[#0a0a0f] flex-shrink-0 flex flex-col">
                    {/* Console tabs */}
                    <div className="flex items-center border-b border-white/10 bg-[#111118] px-2">
                        <button
                            onClick={() => setConsoleTab('system')}
                            className={cn(
                                'px-3 py-1.5 text-xs font-medium border-b-2 transition-colors',
                                consoleTab === 'system'
                                    ? 'border-yellow-400 text-yellow-400'
                                    : 'border-transparent text-gray-500 hover:text-white'
                            )}
                        >
                            <span className="flex items-center gap-1.5">
                                <Activity className="w-3 h-3" />
                                System
                            </span>
                        </button>
                        <button
                            onClick={() => setConsoleTab('app')}
                            className={cn(
                                'px-3 py-1.5 text-xs font-medium border-b-2 transition-colors',
                                consoleTab === 'app'
                                    ? 'border-purple-400 text-purple-400'
                                    : 'border-transparent text-gray-500 hover:text-white'
                            )}
                        >
                            <span className="flex items-center gap-1.5">
                                <Terminal className="w-3 h-3" />
                                App
                            </span>
                        </button>
                        <div className="flex-1" />
                        <button
                            onClick={() => setShowConsole(false)}
                            className="p-1 text-gray-500 hover:text-white"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Console content */}
                    <div className="flex-1 overflow-hidden">
                        {consoleTab === 'system' ? (
                            <SystemConsole />
                        ) : (
                            <SandpackConsole style={{ height: '100%' }} />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export function PreviewPanel() {
    const { files, project } = useProjectStore();

    // Convert our file format to Sandpack format
    const sandpackFiles = useMemo(() => {
        const result: Record<string, string> = {};

        files.forEach((file, path) => {
            // Sandpack expects paths to start with /
            const sandpackPath = path.startsWith('/') ? path : `/${path}`;
            result[sandpackPath] = file.content;
        });

        // Ensure we have required files
        if (!result['/index.html']) {
            result['/index.html'] = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Preview</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;
        }

        return result;
    }, [files]);

    // No project state
    if (!project || files.size === 0) {
        return (
            <div className="flex-1 flex items-center justify-center bg-[#0a0a0f]">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto">
                        <Monitor className="w-8 h-8 text-gray-500" />
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">No preview available</p>
                        <p className="text-gray-500 text-xs mt-1">
                            Create a project to see the live preview
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full w-full relative bg-[#0a0a0f]">
            <div className="absolute inset-0 flex flex-col">
                <SandpackProvider
                    template="react-ts"
                    files={sandpackFiles}
                    theme="dark"
                    options={{
                        autorun: true,
                        autoReload: true,
                        recompileMode: 'delayed',
                        recompileDelay: 500,
                        externalResources: [
                            "https://cdn.tailwindcss.com",
                        ],
                    }}
                    customSetup={{
                        dependencies: {
                            'react': '^18.2.0',
                            'react-dom': '^18.2.0',
                            // Routing - Full support for multi-page apps
                            'react-router-dom': '^6.20.0',
                            // Icons
                            'lucide-react': '^0.294.0',
                            // Styling utilities
                            'clsx': '^2.0.0',
                            'tailwind-merge': '^2.0.0',
                            'class-variance-authority': '^0.7.0',
                            // Animation
                            'framer-motion': '^10.16.4',
                            // 3D Graphics
                            'three': '^0.160.0',
                            '@react-three/fiber': '^8.15.16',
                            '@react-three/drei': '^9.99.0',
                            // HTTP & Data Fetching
                            'axios': '^1.6.0',
                            '@tanstack/react-query': '^5.0.0',
                            // Date utilities
                            'date-fns': '^2.30.0',
                            // Charts
                            'recharts': '^2.9.0',
                            // Radix UI Primitives - Full suite
                            '@radix-ui/react-slot': '^1.0.2',
                            '@radix-ui/react-dialog': '^1.0.5',
                            '@radix-ui/react-dropdown-menu': '^2.0.0',
                            '@radix-ui/react-tabs': '^1.0.4',
                            '@radix-ui/react-tooltip': '^1.0.7',
                            '@radix-ui/react-accordion': '^1.1.2',
                            '@radix-ui/react-switch': '^1.0.3',
                            '@radix-ui/react-checkbox': '^1.0.4',
                            '@radix-ui/react-select': '^2.0.0',
                            '@radix-ui/react-slider': '^1.1.2',
                            '@radix-ui/react-progress': '^1.0.3',
                            '@radix-ui/react-avatar': '^1.0.4',
                            '@radix-ui/react-radio-group': '^1.1.3',
                            '@radix-ui/react-label': '^2.0.2',
                            '@radix-ui/react-popover': '^1.0.7',
                            '@radix-ui/react-scroll-area': '^1.0.5',
                            '@radix-ui/react-separator': '^1.0.3',
                            '@radix-ui/react-toggle': '^1.0.3',
                            '@radix-ui/react-toggle-group': '^1.0.4',
                            '@radix-ui/react-context-menu': '^2.1.5',
                            '@radix-ui/react-hover-card': '^1.0.7',
                            '@radix-ui/react-menubar': '^1.0.4',
                            '@radix-ui/react-navigation-menu': '^1.1.4',
                            '@radix-ui/react-alert-dialog': '^1.0.5',
                            '@radix-ui/react-aspect-ratio': '^1.0.3',
                            '@radix-ui/react-collapsible': '^1.0.3',
                            // Utilities
                            'uuid': '^9.0.0',
                            // State Management
                            'zustand': '^4.4.0',
                            // Validation & Forms
                            'zod': '^3.22.0',
                            'react-hook-form': '^7.48.0',
                            '@hookform/resolvers': '^3.3.0',
                            // Notifications
                            'sonner': '^1.0.0',
                            // Drag & Drop
                            '@dnd-kit/core': '^6.1.0',
                            '@dnd-kit/sortable': '^7.0.0',
                            '@dnd-kit/utilities': '^3.2.0',
                        },
                        entry: '/src/main.tsx',
                    }}
                >
                    <PreviewContent />
                </SandpackProvider>
            </div>
        </div>
    );
}
