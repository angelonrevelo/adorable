import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type ActivityType =
    | 'thinking'      // "Thought for Xs"
    | 'reading'       // "Read filename.tsx"
    | 'editing'       // "Editing/Edited filename.tsx"
    | 'explaining'    // AI's text explanations
    | 'tool'          // Tool usage
    | 'error';        // Errors

export type ActivityStatus = 'active' | 'completed' | 'error';

export interface Activity {
    id: string;
    type: ActivityType;
    title: string;
    content?: string;
    fileName?: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    status: ActivityStatus;
    isExpanded?: boolean;
}

interface ActivityStore {
    // State
    activities: Activity[];
    isActive: boolean;

    // Actions
    startSession: () => void;
    endSession: () => void;
    clearActivities: () => void;

    addActivity: (activity: Omit<Activity, 'id' | 'startTime' | 'status'> & { status?: ActivityStatus }) => string;
    updateActivity: (id: string, updates: Partial<Activity>) => void;
    completeActivity: (id: string, updates?: Partial<Activity>) => void;

    toggleActivityExpanded: (id: string) => void;

    // Convenience methods
    startThinking: () => string;
    stopThinking: (id: string, duration?: number) => void;

    addReading: (fileName: string, content?: string) => string;
    addEditing: (fileName: string, action: 'create' | 'modify' | 'delete') => string;
    addExplaining: (content: string) => string;
    addError: (message: string) => string;
}

export const useActivityStore = create<ActivityStore>((set, get) => ({
    // Initial state
    activities: [],
    isActive: false,

    // Session management
    startSession: () => {
        set({ activities: [], isActive: true });
    },

    endSession: () => {
        set({ isActive: false });
    },

    clearActivities: () => {
        set({ activities: [] });
    },

    // Core activity actions
    addActivity: (activity) => {
        const id = uuidv4();
        const newActivity: Activity = {
            ...activity,
            id,
            startTime: Date.now(),
            status: activity.status || 'active',
            isExpanded: false,
        };

        set(state => ({
            activities: [...state.activities, newActivity],
        }));

        return id;
    },

    updateActivity: (id, updates) => {
        set(state => ({
            activities: state.activities.map(a =>
                a.id === id ? { ...a, ...updates } : a
            ),
        }));
    },

    completeActivity: (id, updates) => {
        const now = Date.now();
        set(state => ({
            activities: state.activities.map(a =>
                a.id === id
                    ? {
                        ...a,
                        ...updates,
                        status: 'completed' as ActivityStatus,
                        endTime: now,
                        duration: now - a.startTime,
                    }
                    : a
            ),
        }));
    },

    toggleActivityExpanded: (id) => {
        set(state => ({
            activities: state.activities.map(a =>
                a.id === id ? { ...a, isExpanded: !a.isExpanded } : a
            ),
        }));
    },

    // Convenience methods
    startThinking: () => {
        return get().addActivity({
            type: 'thinking',
            title: 'Thinking...',
        });
    },

    stopThinking: (id, duration) => {
        const activity = get().activities.find(a => a.id === id);
        if (activity) {
            const finalDuration = duration ?? (Date.now() - activity.startTime);
            const seconds = Math.round(finalDuration / 1000);
            get().completeActivity(id, {
                title: `Thought for ${seconds}s`,
                duration: finalDuration,
            });
        }
    },

    addReading: (fileName, content) => {
        return get().addActivity({
            type: 'reading',
            title: `Read`,
            fileName,
            content,
            status: 'completed',
        });
    },

    addEditing: (fileName, action) => {
        const actionLabel = action === 'create' ? 'Created' : action === 'modify' ? 'Edited' : 'Deleted';
        return get().addActivity({
            type: 'editing',
            title: actionLabel,
            fileName,
            status: 'completed',
        });
    },

    addExplaining: (content) => {
        return get().addActivity({
            type: 'explaining',
            title: content,
            status: 'completed',
        });
    },

    addError: (message) => {
        return get().addActivity({
            type: 'error',
            title: 'Error',
            content: message,
            status: 'error',
        });
    },
}));
