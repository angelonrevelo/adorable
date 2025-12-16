import { useState } from 'react';
import {
    Sparkles,
    Check,
    X,
    ChevronDown,
    ChevronRight,
    Loader2,
    Zap,
    Package,
    FileCode,
    FilePlus
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AgentPlan } from '@/types/agentTypes';

interface AgentPlanPanelProps {
    plan: AgentPlan;
    onExecute: () => void;
    onReject: () => void;
    isExecuting?: boolean;
    currentPhaseIndex?: number;
}

const complexityColors = {
    simple: 'text-green-400 bg-green-500/10 border-green-500/30',
    moderate: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    complex: 'text-red-400 bg-red-500/10 border-red-500/30',
};

export function AgentPlanPanel({
    plan,
    onExecute,
    onReject,
    isExecuting,
    currentPhaseIndex = -1
}: AgentPlanPanelProps) {
    const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set([plan.phases[0]?.id]));
    const [showDeps, setShowDeps] = useState(false);

    const togglePhase = (phaseId: string) => {
        setExpandedPhases(prev => {
            const next = new Set(prev);
            if (next.has(phaseId)) {
                next.delete(phaseId);
            } else {
                next.add(phaseId);
            }
            return next;
        });
    };

    return (
        <div className="border border-purple-500/30 rounded-xl bg-purple-500/5 backdrop-blur overflow-hidden animate-fade-in">
            {/* Header */}
            <div className="px-4 py-3 border-b border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-violet-500/10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-400" />
                        <h3 className="font-medium text-white">Execution Plan</h3>
                    </div>
                    <span className={cn(
                        "px-2 py-0.5 text-xs font-medium rounded-full border",
                        complexityColors[plan.estimatedComplexity]
                    )}>
                        {plan.estimatedComplexity}
                    </span>
                </div>
                <p className="text-sm text-gray-300 mt-1">{plan.summary}</p>
            </div>

            {/* Reasoning */}
            <div className="px-4 py-2 border-b border-purple-500/20 bg-black/20">
                <p className="text-xs text-gray-400 italic">{plan.reasoning}</p>
            </div>

            {/* Phases */}
            <div className="divide-y divide-purple-500/10">
                {plan.phases.map((phase, index) => {
                    const isExpanded = expandedPhases.has(phase.id);
                    const isActive = index === currentPhaseIndex;
                    const isComplete = phase.status === 'complete';
                    const isFailed = phase.status === 'failed';

                    return (
                        <div key={phase.id} className={cn(
                            "transition-colors",
                            isActive && "bg-purple-500/10"
                        )}>
                            <button
                                onClick={() => togglePhase(phase.id)}
                                className="w-full px-4 py-2.5 flex items-center gap-3 text-left hover:bg-white/5 transition-colors"
                            >
                                {/* Status indicator */}
                                <div className={cn(
                                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2",
                                    isActive && "border-purple-400 bg-purple-500/20 text-purple-400 animate-pulse",
                                    isComplete && "border-green-400 bg-green-500/20 text-green-400",
                                    isFailed && "border-red-400 bg-red-500/20 text-red-400",
                                    !isActive && !isComplete && !isFailed && "border-gray-600 text-gray-500"
                                )}>
                                    {isActive ? (
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : isComplete ? (
                                        <Check className="w-3 h-3" />
                                    ) : (
                                        index + 1
                                    )}
                                </div>

                                {/* Phase info */}
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm text-white truncate">
                                        {phase.name}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate">
                                        {phase.description}
                                    </div>
                                </div>

                                {/* Expand icon */}
                                {isExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-gray-500" />
                                ) : (
                                    <ChevronRight className="w-4 h-4 text-gray-500" />
                                )}
                            </button>

                            {/* Expanded details */}
                            {isExpanded && (
                                <div className="px-4 pb-3 pl-14 space-y-2 animate-fade-in">
                                    {phase.filesToCreate.length > 0 && (
                                        <div className="flex items-center gap-2 text-xs">
                                            <FilePlus className="w-3.5 h-3.5 text-emerald-400" />
                                            <span className="text-gray-400">Create:</span>
                                            <div className="flex flex-wrap gap-1">
                                                {phase.filesToCreate.map(f => (
                                                    <span key={f} className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-300 rounded">
                                                        {f.split('/').pop()}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {phase.filesToModify.length > 0 && (
                                        <div className="flex items-center gap-2 text-xs">
                                            <FileCode className="w-3.5 h-3.5 text-yellow-400" />
                                            <span className="text-gray-400">Modify:</span>
                                            <div className="flex flex-wrap gap-1">
                                                {phase.filesToModify.map(f => (
                                                    <span key={f} className="px-1.5 py-0.5 bg-yellow-500/10 text-yellow-300 rounded">
                                                        {f.split('/').pop()}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Dependencies */}
            {plan.suggestedDependencies && plan.suggestedDependencies.length > 0 && (
                <div className="border-t border-purple-500/20">
                    <button
                        onClick={() => setShowDeps(!showDeps)}
                        className="w-full px-4 py-2 flex items-center gap-2 text-xs text-gray-400 hover:bg-white/5"
                    >
                        <Package className="w-3.5 h-3.5" />
                        <span>Dependencies ({plan.suggestedDependencies.length})</span>
                        {showDeps ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </button>
                    {showDeps && (
                        <div className="px-4 pb-3 flex flex-wrap gap-1">
                            {plan.suggestedDependencies.map(dep => (
                                <span key={dep} className="px-2 py-0.5 bg-blue-500/10 text-blue-300 text-xs rounded">
                                    {dep}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Actions */}
            <div className="px-4 py-3 border-t border-purple-500/20 bg-purple-500/10 flex items-center justify-end gap-3">
                <button
                    onClick={onReject}
                    disabled={isExecuting}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
                >
                    <X className="w-4 h-4" />
                    Cancel
                </button>
                <button
                    onClick={onExecute}
                    disabled={isExecuting}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-purple-500 to-violet-500 text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                    {isExecuting ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Executing...
                        </>
                    ) : (
                        <>
                            <Zap className="w-4 h-4" />
                            Execute Plan
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
