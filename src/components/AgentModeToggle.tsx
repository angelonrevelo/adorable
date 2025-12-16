import { Zap, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AgentMode } from '@/types/agentTypes';

interface AgentModeToggleProps {
    mode: AgentMode;
    onModeChange: (mode: AgentMode) => void;
    disabled?: boolean;
}

export function AgentModeToggle({ mode, onModeChange, disabled }: AgentModeToggleProps) {
    return (
        <div className="flex items-center gap-1 p-1 bg-[#1a1a24] rounded-lg border border-white/10">
            <button
                onClick={() => onModeChange('instant')}
                disabled={disabled}
                className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
                    mode === 'instant'
                        ? "bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 shadow-sm"
                        : "text-gray-500 hover:text-gray-300 hover:bg-white/5",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
                title="Instant Mode: Fast, single-shot generation"
            >
                <Zap className="w-3.5 h-3.5" />
                <span>Instant</span>
            </button>
            <button
                onClick={() => onModeChange('plan')}
                disabled={disabled}
                className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all",
                    mode === 'plan'
                        ? "bg-gradient-to-r from-purple-500/20 to-violet-500/20 text-purple-400 shadow-sm"
                        : "text-gray-500 hover:text-gray-300 hover:bg-white/5",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
                title="Plan Mode: Think → Plan → Execute → Validate"
            >
                <ClipboardList className="w-3.5 h-3.5" />
                <span>Plan</span>
            </button>
        </div>
    );
}
