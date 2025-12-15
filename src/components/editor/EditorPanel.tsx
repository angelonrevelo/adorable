import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import { useCallback, useRef, forwardRef } from 'react';
import { useProjectStore } from '@/stores/useProjectStore';
import { EditorTabs } from './EditorTabs';
import { FileCode } from 'lucide-react';
import type { editor } from 'monaco-editor';

// Map file extensions to Monaco language IDs
function getMonacoLanguage(path: string): string {
    const ext = path.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'ts': return 'typescript';
        case 'tsx': return 'typescript';
        case 'js': return 'javascript';
        case 'jsx': return 'javascript';
        case 'json': return 'json';
        case 'css': return 'css';
        case 'html': return 'html';
        case 'md': return 'markdown';
        default: return 'plaintext';
    }
}

export const EditorPanel = forwardRef<HTMLDivElement>((_, ref) => {
    const { files, activeFile, updateFileContent, openFiles } = useProjectStore();
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);

    const activeFileContent = activeFile ? files.get(activeFile)?.content || '' : '';
    const language = activeFile ? getMonacoLanguage(activeFile) : 'plaintext';

    const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
        editorRef.current = editor;

        // Configure Monaco for React/TypeScript
        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.ESNext,
            module: monaco.languages.typescript.ModuleKind.ESNext,
            moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            jsx: monaco.languages.typescript.JsxEmit.ReactJSX,
            strict: true,
            esModuleInterop: true,
            allowSyntheticDefaultImports: true,
            skipLibCheck: true,
        });

        // Add React type definitions (simplified)
        monaco.languages.typescript.typescriptDefaults.addExtraLib(
            `declare module 'react' {
        export function useState<T>(initial: T): [T, (value: T) => void];
        export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
        export function useCallback<T extends Function>(callback: T, deps: any[]): T;
        export function useMemo<T>(factory: () => T, deps: any[]): T;
        export function useRef<T>(initial: T): { current: T };
        export const StrictMode: React.FC<{ children?: React.ReactNode }>;
        export type FC<P = {}> = (props: P) => JSX.Element | null;
        export type ReactNode = string | number | boolean | null | undefined | JSX.Element | ReactNode[];
      }
      declare namespace JSX {
        interface Element {}
        interface IntrinsicElements {
          [elemName: string]: any;
        }
      }`,
            'file:///node_modules/@types/react/index.d.ts'
        );
    }, []);

    const handleEditorChange: OnChange = useCallback((value) => {
        if (activeFile && value !== undefined) {
            updateFileContent(activeFile, value);
        }
    }, [activeFile, updateFileContent]);

    // No files open state
    if (openFiles.length === 0) {
        return (
            <div ref={ref} className="flex-1 flex flex-col bg-[#0a0a0f]">
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto">
                            <FileCode className="w-8 h-8 text-gray-500" />
                        </div>
                        <div>
                            <p className="text-gray-400 text-sm">No file open</p>
                            <p className="text-gray-500 text-xs mt-1">
                                Select a file from the file tree or ask AI to generate code
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div ref={ref} className="h-full flex flex-col bg-[#0a0a0f] min-w-0">
            <EditorTabs />

            <div className="flex-1 overflow-hidden">
                <Editor
                    key={activeFile} // Force remount on file change for language switch
                    height="100%"
                    language={language}
                    value={activeFileContent}
                    theme="vs-dark"
                    onChange={handleEditorChange}
                    onMount={handleEditorDidMount}
                    options={{
                        fontSize: 13,
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                        fontLigatures: true,
                        lineNumbers: 'on',
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        wordWrap: 'on',
                        tabSize: 2,
                        insertSpaces: true,
                        automaticLayout: true,
                        padding: { top: 16, bottom: 16 },
                        renderWhitespace: 'selection',
                        bracketPairColorization: { enabled: true },
                        cursorBlinking: 'smooth',
                        cursorSmoothCaretAnimation: 'on',
                        smoothScrolling: true,
                        suggest: {
                            showMethods: true,
                            showFunctions: true,
                            showConstructors: true,
                            showFields: true,
                            showVariables: true,
                            showClasses: true,
                            showStructs: true,
                            showInterfaces: true,
                            showModules: true,
                            showProperties: true,
                            showEvents: true,
                            showOperators: true,
                            showUnits: true,
                            showValues: true,
                            showConstants: true,
                            showEnums: true,
                            showEnumMembers: true,
                            showKeywords: true,
                            showWords: true,
                            showColors: true,
                            showFiles: true,
                            showReferences: true,
                            showFolders: true,
                            showTypeParameters: true,
                            showSnippets: true,
                        },
                    }}
                />
            </div>
        </div>
    );
});

EditorPanel.displayName = 'EditorPanel';
