import { useState } from 'react';
import { ChevronDown, ChevronUp, Activity, Copy, Check, Clock, Code, AlertTriangle, Info, XCircle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogEntry {
    timestamp: string;
    level: 'info' | 'warn' | 'error' | 'debug';
    category: 'model' | 'validation' | 'code_change' | 'decision' | 'api' | 'context';
    message: string;
    data?: any;
}

interface LogSummary {
    totalLogs: number;
    errors: number;
    warnings: number;
    decisions: number;
    codeChanges: number;
    elapsedTime: number;
    categories: {
        model: number;
        validation: number;
        code_change: number;
        decision: number;
        api: number;
        context: number;
    };
}

export interface EdgeLogsData {
    entries: LogEntry[];
    summary: LogSummary;
    version: string;
}

interface EdgeLogsPanelProps {
    logs: EdgeLogsData | null;
    isVisible: boolean;
    onToggle: () => void;
}

export function EdgeLogsPanel({ logs, isVisible, onToggle }: EdgeLogsPanelProps) {
    const [activeTab, setActiveTab] = useState<'all' | 'model' | 'validation' | 'code_change' | 'decision'>('all');
    const [copied, setCopied] = useState(false);
    const [expandedLogs, setExpandedLogs] = useState<Set<number>>(new Set());

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const toggleLogExpansion = (index: number) => {
        const newExpanded = new Set(expandedLogs);
        if (newExpanded.has(index)) {
            newExpanded.delete(index);
        } else {
            newExpanded.add(index);
        }
        setExpandedLogs(newExpanded);
    };

    const getLevelIcon = (level: string) => {
        switch (level) {
            case 'error':
                return <XCircle className="w-3 h-3 text-red-400" />;
            case 'warn':
                return <AlertTriangle className="w-3 h-3 text-yellow-400" />;
            case 'debug':
                return <Code className="w-3 h-3 text-cyan-400" />;
            default:
                return <Info className="w-3 h-3 text-blue-400" />;
        }
    };

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'error':
                return 'text-red-400 bg-red-500/10 border-red-500/30';
            case 'warn':
                return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
            case 'debug':
                return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
            default:
                return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'model':
                return 'bg-purple-500/20 text-purple-400';
            case 'validation':
                return 'bg-green-500/20 text-green-400';
            case 'code_change':
                return 'bg-orange-500/20 text-orange-400';
            case 'decision':
                return 'bg-pink-500/20 text-pink-400';
            case 'api':
                return 'bg-blue-500/20 text-blue-400';
            case 'context':
                return 'bg-cyan-500/20 text-cyan-400';
            default:
                return 'bg-gray-500/20 text-gray-400';
        }
    };

    const filteredLogs = logs?.entries.filter(log => {
        if (activeTab === 'all') return true;
        return log.category === activeTab;
    }) || [];

    if (!isVisible) {
        return (
            <button
                onClick={onToggle}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-gray-500 hover:text-gray-300 hover:bg-white/5 rounded-lg transition-colors"
            >
                <Activity className="w-3 h-3" />
                Edge Logs
                {logs && logs.summary.errors > 0 && (
                    <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-[10px] rounded-full">
                        {logs.summary.errors}
                    </span>
                )}
            </button>
        );
    }

    return (
        <div className="border-t border-white/10 bg-[#0d0d14]">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium text-white">Edge Function Logs</span>
                    </div>
                    {logs && (
                        <>
                            <span className="text-xs text-gray-500">v{logs.version}</span>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Clock className="w-3 h-3" />
                                {logs.summary.elapsedTime}ms
                            </div>
                            {logs.summary.errors > 0 && (
                                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                                    {logs.summary.errors} errors
                                </span>
                            )}
                            {logs.summary.warnings > 0 && (
                                <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                                    {logs.summary.warnings} warnings
                                </span>
                            )}
                        </>
                    )}
                </div>
                <button
                    onClick={onToggle}
                    className="p-1 text-gray-500 hover:text-white transition-colors"
                >
                    <ChevronDown className="w-4 h-4" />
                </button>
            </div>

            {/* Summary Stats */}
            {logs && (
                <div className="flex gap-3 px-4 py-2 border-b border-white/5 overflow-x-auto">
                    <div className="flex items-center gap-1.5 text-xs">
                        <Zap className="w-3 h-3 text-purple-400" />
                        <span className="text-gray-400">Model:</span>
                        <span className="text-white font-medium">{logs.summary.categories.model}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                        <Code className="w-3 h-3 text-orange-400" />
                        <span className="text-gray-400">Code Changes:</span>
                        <span className="text-white font-medium">{logs.summary.codeChanges}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                        <AlertTriangle className="w-3 h-3 text-green-400" />
                        <span className="text-gray-400">Validations:</span>
                        <span className="text-white font-medium">{logs.summary.categories.validation}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                        <Info className="w-3 h-3 text-pink-400" />
                        <span className="text-gray-400">Decisions:</span>
                        <span className="text-white font-medium">{logs.summary.decisions}</span>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1 px-4 py-2 border-b border-white/5 overflow-x-auto">
                {[
                    { id: 'all', label: 'All Logs' },
                    { id: 'model', label: 'Model' },
                    { id: 'validation', label: 'Validation' },
                    { id: 'code_change', label: 'Code Changes' },
                    { id: 'decision', label: 'Decisions' },
                ].map(({ id, label }) => (
                    <button
                        key={id}
                        onClick={() => setActiveTab(id as typeof activeTab)}
                        className={cn(
                            'px-3 py-1.5 text-xs rounded-lg transition-colors whitespace-nowrap',
                            activeTab === id
                                ? 'bg-purple-500/20 text-purple-400'
                                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                        )}
                    >
                        {label}
                        {logs && id !== 'all' && (
                            <span className="ml-1.5 text-[10px] opacity-60">
                                ({logs.summary.categories[id as keyof typeof logs.summary.categories] || 0})
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="max-h-96 overflow-auto p-4">
                {!logs ? (
                    <div className="text-center text-gray-500 text-sm py-8">
                        <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No logs yet</p>
                        <p className="text-xs mt-1">Send a message to see edge function activity</p>
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="text-center text-gray-500 text-sm py-8">
                        <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No logs in this category</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {filteredLogs.map((log, index) => (
                            <div
                                key={index}
                                className={cn(
                                    'border rounded-lg overflow-hidden transition-all',
                                    getLevelColor(log.level)
                                )}
                            >
                                <div
                                    className="flex items-start gap-2 p-3 cursor-pointer hover:bg-white/5"
                                    onClick={() => log.data && toggleLogExpansion(index)}
                                >
                                    {getLevelIcon(log.level)}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={cn(
                                                'text-[10px] px-1.5 py-0.5 rounded font-medium',
                                                getCategoryColor(log.category)
                                            )}>
                                                {log.category.toUpperCase()}
                                            </span>
                                            <span className="text-[10px] text-gray-500">
                                                {new Date(log.timestamp).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        <p className="text-xs leading-relaxed">{log.message}</p>
                                    </div>
                                    {log.data && (
                                        <button className="text-gray-500 hover:text-white">
                                            {expandedLogs.has(index) ? (
                                                <ChevronUp className="w-3 h-3" />
                                            ) : (
                                                <ChevronDown className="w-3 h-3" />
                                            )}
                                        </button>
                                    )}
                                </div>

                                {/* Expanded Data */}
                                {log.data && expandedLogs.has(index) && (
                                    <div className="px-3 pb-3">
                                        <div className="relative">
                                            <button
                                                onClick={() => copyToClipboard(JSON.stringify(log.data, null, 2))}
                                                className="absolute top-2 right-2 p-1 text-gray-500 hover:text-white bg-[#111118] rounded transition-colors"
                                            >
                                                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                            </button>
                                            <pre className="p-3 bg-[#111118] rounded-lg text-[10px] text-gray-300 whitespace-pre-wrap font-mono overflow-x-auto max-h-48">
                                                {JSON.stringify(log.data, null, 2)}
                                            </pre>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
