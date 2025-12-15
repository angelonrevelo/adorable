import { useMemo, useState } from 'react';
import {
    SandpackProvider,
    SandpackPreview,
    SandpackConsole,
    useSandpack,
} from '@codesandbox/sandpack-react';
import { useProjectStore } from '@/stores/useProjectStore';
import { Monitor, Smartphone, Tablet, Terminal, RefreshCw, ExternalLink, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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

function PreviewContent() {
    const [showConsole, setShowConsole] = useState(false);
    const [viewport, setViewport] = useState<ViewportSize>('desktop');

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
                <div className="h-48 border-t border-white/10 bg-[#0a0a0f] flex-shrink-0">
                    <SandpackConsole
                        style={{ height: '100%' }}
                    />
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
                    }}
                    customSetup={{
                        dependencies: {
                            'react': '^18.2.0',
                            'react-dom': '^18.2.0',
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
