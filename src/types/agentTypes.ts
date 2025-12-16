// Agent mode types for intelligent planning and execution

export type AgentMode = 'instant' | 'plan';

export interface AgentPhase {
    id: string;
    name: string;
    description: string;
    status: 'pending' | 'in-progress' | 'complete' | 'failed';
    filesToCreate: string[];
    filesToModify: string[];
    validationCriteria: string[];
}

export interface AgentPlan {
    id: string;
    summary: string;
    reasoning: string;
    phases: AgentPhase[];
    estimatedComplexity: 'simple' | 'moderate' | 'complex';
    suggestedDependencies: string[];
}

export interface ValidationResult {
    phaseId: string;
    passed: boolean;
    issues: string[];
    autoFixed: boolean;
}

export interface AgentSession {
    mode: AgentMode;
    currentPlan?: AgentPlan;
    currentPhaseIndex: number;
    validationResults: ValidationResult[];
    isPlanning: boolean;
    isExecutingPhase: boolean;
}
