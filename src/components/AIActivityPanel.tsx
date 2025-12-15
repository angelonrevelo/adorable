import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Brain,
    FileText,
    FileCode,
    ChevronDown,
    ChevronUp,
    AlertCircle,
    Loader2,
    Sparkles,
    Eye,
    EyeOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useActivityStore, Activity, ActivityType } from '@/stores/useActivityStore';

// Timer component that counts up while thinking
function ThinkingTimer({ startTime, isActive }: { startTime: number; isActive: boolean }) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        if (!isActive) return;

        const interval = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startTime) / 1000));
        }, 100);

        return () => clearInterval(interval);
    }, [startTime, isActive]);

    return (
        <span className="text-gray-400">
            {isActive ? `${elapsed}s` : null}
        </span>
    );
}

// Activity icon based on type
function ActivityIcon({ type, status }: { type: ActivityType; status: string }) {
    const iconClass = "w-4 h-4";

    switch (type) {
        case 'thinking':
            return status === 'active'
                ? <Loader2 className={cn(iconClass, "text-purple-400 animate-spin")} />
                : <Brain className={cn(iconClass, "text-purple-400")} />;
        case 'reading':
            return <FileText className={cn(iconClass, "text-blue-400")} />;
        case 'editing':
            return <FileCode className={cn(iconClass, "text-green-400")} />;
        case 'explaining':
            return <Sparkles className={cn(iconClass, "text-yellow-400")} />;
        case 'error':
            return <AlertCircle className={cn(iconClass, "text-red-400")} />;
        default:
            return <FileText className={cn(iconClass, "text-gray-400")} />;
    }
}

// Single activity item
function ActivityItem({ activity }: { activity: Activity }) {
    const { toggleActivityExpanded } = useActivityStore();
    const hasContent = !!activity.content;
    const isExpanded = activity.isExpanded ?? false;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="group"
        >
            <div className="flex items-start gap-2 py-1.5">
                {/* Icon */}
                <div className="mt-0.5">
                    <ActivityIcon type={activity.type} status={activity.status} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Title - show differently based on type */}
                        {activity.type === 'thinking' ? (
                            <span className="text-sm text-gray-300">
                                {activity.status === 'active' ? (
                                    <>
                                        Thinking{' '}
                                        <ThinkingTimer startTime={activity.startTime} isActive={true} />
                                    </>
                                ) : (
                                    activity.title
                                )}
                            </span>
                        ) : (
                            <>
                                <span className="text-sm text-gray-400">{activity.title}</span>
                                {activity.fileName && (
                                    <code className="px-1.5 py-0.5 text-xs bg-white/10 text-gray-200 rounded font-mono">
                                        {activity.fileName}
                                    </code>
                                )}
                            </>
                        )}
                    </div>

                    {/* Expandable content */}
                    {hasContent && isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-2"
                        >
                            <pre className="p-2 bg-[#111118] rounded-lg text-xs text-gray-400 whitespace-pre-wrap font-mono max-h-32 overflow-auto">
                                {activity.content}
                            </pre>
                        </motion.div>
                    )}
                </div>

                {/* Toggle button for expandable content */}
                {hasContent && (
                    <button
                        onClick={() => toggleActivityExpanded(activity.id)}
                        className="px-2 py-0.5 text-xs text-gray-500 hover:text-gray-300 hover:bg-white/5 rounded transition-colors"
                    >
                        {isExpanded ? (
                            <span className="flex items-center gap-1">
                                <EyeOff className="w-3 h-3" />
                                Hide
                            </span>
                        ) : (
                            <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                Show
                            </span>
                        )}
                    </button>
                )}
            </div>
        </motion.div>
    );
}

interface AIActivityPanelProps {
    isVisible: boolean;
    onToggle: () => void;
}

export function AIActivityPanel({ isVisible, onToggle }: AIActivityPanelProps) {
    const { activities, isActive } = useActivityStore();
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new activities are added
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [activities]);

    if (!isVisible) {
        return null;
    }

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-white/10 bg-[#0d0d14]"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
                <div className="flex items-center gap-2">
                    {isActive ? (
                        <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
                    ) : (
                        <Brain className="w-4 h-4 text-yellow-500" />
                    )}
                    <span className="text-sm font-medium text-white">
                        {isActive ? 'AI Working...' : 'AI Activity'}
                    </span>
                    {activities.length > 0 && (
                        <span className="text-xs text-gray-500">
                            {activities.length} {activities.length === 1 ? 'action' : 'actions'}
                        </span>
                    )}
                </div>
                <button
                    onClick={onToggle}
                    className="p-1 text-gray-500 hover:text-white transition-colors"
                >
                    <ChevronDown className="w-4 h-4" />
                </button>
            </div>

            {/* Activity List */}
            <div
                ref={scrollRef}
                className="max-h-64 overflow-y-auto px-4 py-2 space-y-1"
            >
                {activities.length === 0 ? (
                    <div className="text-center text-gray-500 text-sm py-6">
                        <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p>No activity yet</p>
                        <p className="text-xs mt-1">Send a message to see AI in action</p>
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        {activities.map((activity) => (
                            <ActivityItem key={activity.id} activity={activity} />
                        ))}
                    </AnimatePresence>
                )}
            </div>
        </motion.div>
    );
}
