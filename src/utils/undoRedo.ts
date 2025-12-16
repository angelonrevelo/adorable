/**
 * Undo/Redo Stack Utility
 * Manages history of file operations for undo/redo functionality
 */

import { ProjectFile, FileOperation } from '@/types/projectTypes';

export interface HistoryEntry {
  id: string;
  timestamp: number;
  description: string;
  operations: FileOperation[];
  previousFiles: Map<string, ProjectFile>; // Snapshot before changes
}

export interface UndoRedoState {
  past: HistoryEntry[];
  future: HistoryEntry[];
  canUndo: boolean;
  canRedo: boolean;
}

export class UndoRedoManager {
  private past: HistoryEntry[] = [];
  private future: HistoryEntry[] = [];
  private maxHistorySize: number = 50;

  /**
   * Push a new entry to the history stack
   */
  push(entry: Omit<HistoryEntry, 'id' | 'timestamp'>): void {
    const fullEntry: HistoryEntry = {
      ...entry,
      id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    this.past.push(fullEntry);
    this.future = []; // Clear redo stack when new action is performed

    // Limit history size
    if (this.past.length > this.maxHistorySize) {
      this.past = this.past.slice(-this.maxHistorySize);
    }
  }

  /**
   * Undo the last operation
   */
  undo(): HistoryEntry | null {
    const entry = this.past.pop();
    if (!entry) return null;

    this.future.push(entry);
    return entry;
  }

  /**
   * Redo the last undone operation
   */
  redo(): HistoryEntry | null {
    const entry = this.future.pop();
    if (!entry) return null;

    this.past.push(entry);
    return entry;
  }

  /**
   * Check if undo is available
   */
  canUndo(): boolean {
    return this.past.length > 0;
  }

  /**
   * Check if redo is available
   */
  canRedo(): boolean {
    return this.future.length > 0;
  }

  /**
   * Get current state
   */
  getState(): UndoRedoState {
    return {
      past: [...this.past],
      future: [...this.future],
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
    };
  }

  /**
   * Get the last N history entries
   */
  getRecentHistory(limit: number = 10): HistoryEntry[] {
    return this.past.slice(-limit).reverse();
  }

  /**
   * Clear all history
   */
  clear(): void {
    this.past = [];
    this.future = [];
  }

  /**
   * Get history size
   */
  size(): number {
    return this.past.length + this.future.length;
  }
}

/**
 * Create a snapshot of current files for undo purposes
 */
export function createFileSnapshot(files: Map<string, ProjectFile>): Map<string, ProjectFile> {
  const snapshot = new Map<string, ProjectFile>();
  files.forEach((file, path) => {
    snapshot.set(path, { ...file });
  });
  return snapshot;
}

/**
 * Generate reverse operations to undo a set of operations
 */
export function generateReverseOperations(
  operations: FileOperation[],
  previousFiles: Map<string, ProjectFile>
): FileOperation[] {
  const reverse: FileOperation[] = [];

  operations.forEach(op => {
    switch (op.action) {
      case 'create':
        // To undo create, we delete
        reverse.push({
          path: op.path,
          content: '',
          action: 'delete',
        });
        break;

      case 'modify':
        // To undo modify, we restore previous content
        const previousFile = previousFiles.get(op.path);
        if (previousFile) {
          reverse.push({
            path: op.path,
            content: previousFile.content,
            action: 'modify',
          });
        }
        break;

      case 'delete':
        // To undo delete, we recreate
        const deletedFile = previousFiles.get(op.path);
        if (deletedFile) {
          reverse.push({
            path: op.path,
            content: deletedFile.content,
            action: 'create',
          });
        }
        break;
    }
  });

  return reverse;
}

/**
 * Format history entry for display
 */
export function formatHistoryEntry(entry: HistoryEntry): string {
  const time = new Date(entry.timestamp).toLocaleTimeString();
  const fileCount = entry.operations.length;
  const fileWord = fileCount === 1 ? 'file' : 'files';

  return `[${time}] ${entry.description} (${fileCount} ${fileWord})`;
}
