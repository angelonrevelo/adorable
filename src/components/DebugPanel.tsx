import { useState } from 'react';
import { ChevronDown, ChevronUp, Bug, Copy, Check, AlertCircle, FileCode, MessageSquare, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DebugInfo {
    systemPrompt?: string;
    userPrompt?: string;
    rawResponse?: string;
    parsedResponse?: {
        thought?: string;
        message?: string;
        files?: Array<{ path: string; action: string }>;
        html?: string;
    };
    error?: string;
    timestamp?: string;
    duration?: number;
}

interface DebugPanelProps {
    debugInfo: DebugInfo | null;
    isVisible: boolean;
    onToggle: () => void;
}

export function DebugPanel({ debugInfo, isVisible, onToggle }: DebugPanelProps) {
    const [activeTab, setActiveTab] = useState<'thinking' | 'prompt' | 'response' | 'files'>('thinking');
    const [copied, setCopied] = useState(false);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isVisible) {
        return (
            <button
                onClick={onToggle}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-300 hover:bg-white/5 rounded-lg transition-colors"
            >
                <Bug className="w-3 h-3" />
                Debug
            </button>
        );
    }

    return (
        <div className="border-t border-white/10 bg-[#0d0d14]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <Bug className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium text-white">AI Debug Panel</span>
                    {debugInfo?.duration && (
                        <span className="text-xs text-gray-500">{debugInfo.duration}ms</span>
                    )}
                </div>
                <button
                    onClick={onToggle}
                    className="p-1 text-gray-500 hover:text-white transition-colors"
                >
                    <ChevronDown className="w-4 h-4" />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 px-4 py-2 border-b border-white/5">
                {[
                    { id: 'thinking', label: 'Thinking', icon: Brain },
                    { id: 'prompt', label: 'Prompt', icon: MessageSquare },
                    { id: 'response', label: 'Response', icon: FileCode },
                    { id: 'files', label: 'Files', icon: FileCode },
                ].map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id as typeof activeTab)}
                        className={cn(
                            'flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors',
                            activeTab === id
                                ? 'bg-purple-500/20 text-purple-400'
                                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                        )}
                    >
                        <Icon className="w-3 h-3" />
                        {label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="max-h-64 overflow-auto p-4">
                {!debugInfo ? (
                    <div className="text-center text-gray-500 text-sm py-8">
                        <Bug className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No debug info yet</p>
                        <p className="text-xs mt-1">Send a message to see AI communication</p>
                    </div>
                ) : (
                    <>
                        {/* Error */}
                        {debugInfo.error && (
                            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                                <div className="flex items-center gap-2 text-red-400 text-sm">
                                    <AlertCircle className="w-4 h-4" />
                                    <span className="font-medium">Error</span>
                                </div>
                                <p className="mt-1 text-xs text-red-300">{debugInfo.error}</p>
                            </div>
                        )}

                        {/* Thinking Tab */}
                        {activeTab === 'thinking' && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-medium text-gray-400">AI Thought Process</h4>
                                </div>
                                <pre className="p-3 bg-[#111118] rounded-lg text-xs text-gray-300 whitespace-pre-wrap font-mono overflow-x-auto">
                                    {debugInfo.parsedResponse?.thought || 'No thinking data available'}
                                </pre>
                            </div>
                        )}

                        {/* Prompt Tab */}
                        {activeTab === 'prompt' && (
                            <div className="space-y-4">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-xs font-medium text-gray-400">System Prompt</h4>
                                        <button
                                            onClick={() => copyToClipboard(debugInfo.systemPrompt || '')}
                                            className="text-gray-500 hover:text-white transition-colors"
                                        >
                                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                        </button>
                                    </div>
                                    <pre className="p-3 bg-[#111118] rounded-lg text-xs text-green-400 whitespace-pre-wrap font-mono max-h-32 overflow-auto">
                                        {debugInfo.systemPrompt?.substring(0, 1000) || 'Not available'}
                                        {(debugInfo.systemPrompt?.length || 0) > 1000 && '...'}
                                    </pre>
                                </div>
                                <div>
                                    <h4 className="text-xs font-medium text-gray-400 mb-2">User Prompt</h4>
                                    <pre className="p-3 bg-[#111118] rounded-lg text-xs text-blue-400 whitespace-pre-wrap font-mono max-h-32 overflow-auto">
                                        {debugInfo.userPrompt || 'Not available'}
                                    </pre>
                                </div>
                            </div>
                        )}

                        {/* Response Tab */}
                        {activeTab === 'response' && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-medium text-gray-400">Raw AI Response</h4>
                                    <button
                                        onClick={() => copyToClipboard(debugInfo.rawResponse || '')}
                                        className="text-gray-500 hover:text-white transition-colors"
                                    >
                                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                </div>
                                <pre className="p-3 bg-[#111118] rounded-lg text-xs text-yellow-400 whitespace-pre-wrap font-mono overflow-x-auto">
                                    {debugInfo.rawResponse?.substring(0, 2000) || 'Not available'}
                                    {(debugInfo.rawResponse?.length || 0) > 2000 && '...'}
                                </pre>
                            </div>
                        )}

                        {/* Files Tab */}
                        {activeTab === 'files' && (
                            <div className="space-y-3">
                                <h4 className="text-xs font-medium text-gray-400">Files Modified</h4>
                                {debugInfo.parsedResponse?.files && debugInfo.parsedResponse.files.length > 0 ? (
                                    <div className="space-y-2">
                                        {debugInfo.parsedResponse.files.map((file, i) => (
                                            <div
                                                key={i}
                                                className="flex items-center justify-between p-2 bg-[#111118] rounded-lg"
                                            >
                                                <div className="flex items-center gap-2">
                                                    <FileCode className="w-4 h-4 text-purple-400" />
                                                    <span className="text-sm text-gray-300">{file.path}</span>
                                                </div>
                                                <span className={cn(
                                                    'text-xs px-2 py-0.5 rounded',
                                                    file.action === 'create' && 'bg-green-500/20 text-green-400',
                                                    file.action === 'modify' && 'bg-blue-500/20 text-blue-400',
                                                    file.action === 'delete' && 'bg-red-500/20 text-red-400'
                                                )}>
                                                    {file.action}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">No files modified</p>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
