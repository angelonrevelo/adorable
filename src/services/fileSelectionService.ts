import { ProjectFile, FileOperation, ConversationMessage } from '@/types/projectTypes';
import { estimateTokens, TOKEN_LIMITS, formatTokenCount } from '@/utils/tokenCounter';

export interface FileSelectionResult {
  files: ProjectFile[];
  totalTokens: number;
  filesOmitted: number;
  tokenLimitReached: boolean;
}

/**
 * Intelligently select relevant files based on:
 * 1. Core files (always included)
 * 2. Files recently modified by AI
 * 3. Files mentioned in the prompt
 * 4. Files imported by recently modified files
 * 5. Token budget management
 */
export function selectRelevantFiles(
  allFiles: ProjectFile[],
  prompt: string,
  conversationHistory: ConversationMessage[],
  maxFiles: number = 15,
  maxTokens: number = TOKEN_LIMITS['safe-limit']
): ProjectFile[] {
  const relevantPaths = new Set<string>();
  const fileScores = new Map<string, number>();

  // Score function - higher = more relevant
  const addScore = (path: string, score: number) => {
    fileScores.set(path, (fileScores.get(path) || 0) + score);
    relevantPaths.add(path);
  };

  // 1. Core files always get high priority
  const coreFiles = ['src/App.tsx', 'src/main.tsx', 'src/index.css', 'tailwind.config.ts'];
  coreFiles.forEach(path => addScore(path, 100));

  // 2. Files recently modified by AI (from conversation history)
  const recentOps = getRecentFileOperations(conversationHistory, 5);
  recentOps.forEach((op, index) => {
    // More recent = higher score
    addScore(op.path, 80 - index * 10);
  });

  // 3. Files mentioned in the prompt
  const promptLower = prompt.toLowerCase();
  allFiles.forEach(file => {
    const fileName = file.path.split('/').pop()?.toLowerCase() || '';
    const baseName = fileName.replace(/\.(tsx?|jsx?|css|json|md)$/, '');
    
    // Check if file name is mentioned
    if (promptLower.includes(baseName)) {
      addScore(file.path, 70);
    }
    
    // Check for path segments mentioned
    const pathParts = file.path.toLowerCase().split('/');
    pathParts.forEach(part => {
      if (part.length > 3 && promptLower.includes(part.replace(/\.[^.]+$/, ''))) {
        addScore(file.path, 50);
      }
    });
  });

  // 4. Files that import recently modified files (dependency chain)
  const recentlyModifiedPaths = new Set(recentOps.map(op => op.path));
  allFiles.forEach(file => {
    if (!recentlyModifiedPaths.has(file.path)) {
      // Check if this file imports any recently modified files
      const imports = extractImports(file.content);
      imports.forEach(importPath => {
        const resolvedPath = resolveImportPath(file.path, importPath);
        if (recentlyModifiedPaths.has(resolvedPath)) {
          addScore(file.path, 40);
        }
      });
    }
  });

  // 5. Include files imported by high-priority files
  const highPriorityPaths = Array.from(fileScores.entries())
    .filter(([_, score]) => score >= 70)
    .map(([path]) => path);

  highPriorityPaths.forEach(path => {
    const file = allFiles.find(f => f.path === path);
    if (file) {
      const imports = extractImports(file.content);
      imports.forEach(importPath => {
        const resolvedPath = resolveImportPath(path, importPath);
        addScore(resolvedPath, 30);
      });
    }
  });

  // Sort by score and filter by token budget
  const sortedEntries = Array.from(fileScores.entries())
    .sort((a, b) => b[1] - a[1]);

  // Select files respecting both file count and token limits
  const selectedPaths: string[] = [];
  let totalTokens = 0;

  for (const [path, score] of sortedEntries) {
    if (selectedPaths.length >= maxFiles) break;

    const file = allFiles.find(f => f.path === path);
    if (!file) continue;

    const fileTokens = estimateTokens(file.content);

    // Always include high-priority files (score >= 90), otherwise check token limit
    if (score >= 90 || (totalTokens + fileTokens) <= maxTokens) {
      selectedPaths.push(path);
      totalTokens += fileTokens;
    } else if (selectedPaths.length < 3) {
      // Always include at least 3 files even if over token limit
      selectedPaths.push(path);
      totalTokens += fileTokens;
    }
  }

  console.log(`[FileSelection] Selected ${selectedPaths.length} files, ${formatTokenCount(totalTokens)}`);

  // Return files in order of relevance
  return allFiles.filter(f => selectedPaths.includes(f.path))
    .sort((a, b) => (fileScores.get(b.path) || 0) - (fileScores.get(a.path) || 0));
}

/**
 * Enhanced file selection with detailed token tracking
 */
export function selectRelevantFilesWithStats(
  allFiles: ProjectFile[],
  prompt: string,
  conversationHistory: ConversationMessage[],
  maxFiles: number = 15,
  maxTokens: number = TOKEN_LIMITS['safe-limit']
): FileSelectionResult {
  const files = selectRelevantFiles(allFiles, prompt, conversationHistory, maxFiles, maxTokens);
  const totalTokens = files.reduce((sum, file) => sum + estimateTokens(file.content), 0);
  const filesOmitted = Math.max(0, allFiles.length - files.length);
  const tokenLimitReached = totalTokens >= maxTokens * 0.9; // 90% threshold

  return {
    files,
    totalTokens,
    filesOmitted,
    tokenLimitReached,
  };
}

/**
 * Get recent file operations from conversation history
 */
export function getRecentFileOperations(
  history: ConversationMessage[],
  maxMessages: number = 5
): FileOperation[] {
  const ops: FileOperation[] = [];
  
  // Go through recent assistant messages
  const recentAssistant = history
    .filter(m => m.role === 'assistant' && m.fileOperations?.length)
    .slice(-maxMessages);

  recentAssistant.forEach(msg => {
    msg.fileOperations?.forEach(op => {
      // Avoid duplicates, prefer most recent
      const existingIndex = ops.findIndex(o => o.path === op.path);
      if (existingIndex >= 0) {
        ops.splice(existingIndex, 1);
      }
      ops.push(op);
    });
  });

  return ops;
}

/**
 * Extract import paths from file content
 */
function extractImports(content: string): string[] {
  const imports: string[] = [];
  
  // Match ES6 imports: import X from 'path'
  const es6Regex = /import\s+(?:[\w{},\s*]+\s+from\s+)?['"]([^'"]+)['"]/g;
  let match;
  while ((match = es6Regex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  // Match dynamic imports: import('path')
  const dynamicRegex = /import\(['"]([^'"]+)['"]\)/g;
  while ((match = dynamicRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }

  return imports.filter(imp => imp.startsWith('.') || imp.startsWith('@/'));
}

/**
 * Resolve relative import path to absolute path
 */
function resolveImportPath(fromPath: string, importPath: string): string {
  // Handle @/ alias
  if (importPath.startsWith('@/')) {
    const resolved = 'src/' + importPath.slice(2);
    // Add extension if missing
    if (!resolved.includes('.')) {
      return resolved + '.tsx';
    }
    return resolved;
  }

  // Handle relative paths
  if (importPath.startsWith('./') || importPath.startsWith('../')) {
    const fromDir = fromPath.split('/').slice(0, -1).join('/');
    const parts = [...fromDir.split('/'), ...importPath.split('/')];
    const resolved: string[] = [];

    for (const part of parts) {
      if (part === '.' || part === '') continue;
      if (part === '..') {
        resolved.pop();
      } else {
        resolved.push(part);
      }
    }

    let result = resolved.join('/');
    // Add extension if missing
    if (!result.includes('.')) {
      result += '.tsx';
    }
    return result;
  }

  return importPath;
}

/**
 * Build enriched history for AI context
 */
export function buildEnrichedHistory(
  messages: ConversationMessage[]
): Array<{ role: 'user' | 'assistant'; content: string; filesModified?: string[] }> {
  return messages.map(msg => ({
    role: msg.role,
    content: msg.content,
    filesModified: msg.fileOperations?.map(op => `${op.action}: ${op.path}`) || undefined,
  }));
}

/**
 * Get list of recently modified file paths for display
 */
export function getRecentlyModifiedPaths(history: ConversationMessage[]): string[] {
  const paths = new Set<string>();
  
  // Get last 3 assistant messages with file ops
  const recent = history
    .filter(m => m.role === 'assistant' && m.fileOperations?.length)
    .slice(-3);

  recent.forEach(msg => {
    msg.fileOperations?.forEach(op => {
      paths.add(op.path);
    });
  });

  return Array.from(paths);
}
