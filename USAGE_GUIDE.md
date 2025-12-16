# Usage Guide for New Features

## Quick Reference for Developers

This guide shows how to use all the new utilities and components added in version 2.1.0.

---

## 🔢 Token Counter

### Basic Usage

```typescript
import { estimateTokens, formatTokenCount, TOKEN_LIMITS } from '@/utils/tokenCounter';

// Estimate tokens in text
const text = "Your prompt here...";
const tokens = estimateTokens(text);
console.log(`Estimated tokens: ${tokens}`);

// Get detailed estimate
const estimate = getTokenEstimate(text);
console.log(estimate);
// { tokens: 150, characters: 500, words: 100 }

// Format for display
console.log(formatTokenCount(150000)); // "150K tokens"

// Check if exceeds limit
if (exceedsTokenLimit(text, 10000)) {
  alert("Prompt is too long!");
}

// Truncate to fit limit
const { text: truncated, truncated: wasTruncated } = truncateToTokenLimit(
  longText,
  5000
);
```

### Token Budget Management

```typescript
import {
  getRemainingTokens,
  getTokenUsagePercentage,
  isTokenWarningZone,
  isTokenDangerZone
} from '@/utils/tokenCounter';

const used = 400000;
const remaining = getRemainingTokens(used); // 100000
const percentage = getTokenUsagePercentage(used); // 80%

if (isTokenWarningZone(used)) {
  console.warn("Approaching token limit!");
}

if (isTokenDangerZone(used)) {
  console.error("Token limit almost reached!");
}
```

---

## ✅ Prompt Validation

### Validate User Input

```typescript
import { validatePrompt, checkForHarmfulContent } from '@/utils/promptValidation';

const result = validatePrompt(userPrompt, contextTokens);

if (!result.isValid) {
  // Show errors
  result.errors.forEach(error => console.error(error));
}

if (result.warnings.length > 0) {
  // Show warnings
  result.warnings.forEach(warning => console.warn(warning));
}

// Use sanitized version
const cleanPrompt = result.sanitized;

// Check complexity
console.log(`Complexity: ${result.complexity}`); // simple | moderate | complex
```

### Security Check

```typescript
const safety = checkForHarmfulContent(prompt);

if (!safety.safe) {
  console.error(`Blocked: ${safety.reason}`);
  return;
}
```

### Suggest Improvements

```typescript
import { suggestPromptImprovements } from '@/utils/promptValidation';

const suggestions = suggestPromptImprovements(prompt);
suggestions.forEach(suggestion => {
  console.log(`💡 ${suggestion}`);
});
```

---

## 💾 Response Cache

### Basic Caching

```typescript
import { ResponseCache, aiResponseCache } from '@/utils/responseCache';

// Generate cache key
const key = ResponseCache.generateKey(prompt, contextHash);

// Try to get cached response
const cached = aiResponseCache.get(key);
if (cached) {
  console.log("Cache hit!");
  return cached;
}

// If not cached, get from API and cache it
const response = await callAI(prompt);
aiResponseCache.set(key, response);
```

### Cache Management

```typescript
// Get statistics
const stats = aiResponseCache.getStats();
console.log(`Hit rate: ${stats.hitRate.toFixed(1)}%`);
console.log(`Cache size: ${stats.size}`);

// Clean up expired entries
const removed = aiResponseCache.cleanup();
console.log(`Removed ${removed} expired entries`);

// Clear all
aiResponseCache.clear();

// View top entries
const top = aiResponseCache.getTopEntries(5);
top.forEach(entry => {
  console.log(`${entry.key}: ${entry.hits} hits`);
});
```

### Export/Import

```typescript
import { exportCache, importCache } from '@/utils/responseCache';

// Export to JSON
const json = exportCache(aiResponseCache);
localStorage.setItem('cache_backup', json);

// Import from JSON
const stored = localStorage.getItem('cache_backup');
if (stored) {
  importCache(aiResponseCache, stored);
}
```

---

## 📊 Analytics Service

### Track Prompts

```typescript
import { analyticsService, createPromptTracker } from '@/services/analyticsService';

// Method 1: Manual tracking
analyticsService.trackPrompt({
  prompt: "Create a button component",
  promptTokens: 50,
  responseTokens: 1000,
  totalTokens: 1050,
  duration: 3500, // milliseconds
  success: true,
  filesGenerated: 2,
  complexity: 'simple',
});

// Method 2: Automatic timing
const tracker = createPromptTracker();
// ... do work ...
tracker.complete({
  prompt: "Create a button",
  promptTokens: 50,
  responseTokens: 1000,
  totalTokens: 1050,
  success: true,
  filesGenerated: 2,
  complexity: 'simple',
});
```

### View Analytics

```typescript
// Current session
const session = analyticsService.getCurrentSessionMetrics();
console.log(`Success rate: ${session.successfulPrompts / session.totalPrompts * 100}%`);

// Overall summary
const summary = analyticsService.getSummary();
console.log(`Average response time: ${summary.averageResponseTime}ms`);
console.log(`Most common errors:`, summary.mostCommonErrors);

// Recent failures
const failures = analyticsService.getRecentFailures(5);
failures.forEach(f => {
  console.error(`Failed: ${f.prompt.slice(0, 50)}... - ${f.errorMessage}`);
});

// Performance insights
const slowest = analyticsService.getSlowestPrompts(5);
const largest = analyticsService.getLargestPrompts(5);
```

### Export Data

```typescript
const json = analyticsService.export();
const blob = new Blob([json], { type: 'application/json' });
const url = URL.createObjectURL(blob);

// Download
const a = document.createElement('a');
a.href = url;
a.download = 'analytics.json';
a.click();
```

---

## 🎨 UI Components

### Prompt Suggestions

```tsx
import { PromptSuggestions } from '@/components/PromptSuggestions';

function ChatPanel() {
  const [prompt, setPrompt] = useState('');

  return (
    <div>
      <PromptSuggestions
        projectFiles={files}
        onSelectSuggestion={(suggestion) => setPrompt(suggestion)}
      />
      <textarea value={prompt} onChange={...} />
    </div>
  );
}
```

### Diff Viewer

```tsx
import { DiffViewer } from '@/components/DiffViewer';

function ConfirmChanges() {
  const operations = [...]; // FileOperation[]

  return (
    <DiffViewer
      operations={operations}
      onApprove={() => {
        // Apply changes
        applyOperations(operations);
      }}
      onReject={() => {
        // Cancel
        setPendingChanges(null);
      }}
    />
  );
}
```

### Error Boundary

```tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <YourApp />
    </ErrorBoundary>
  );
}

// With custom fallback
<ErrorBoundary fallback={<div>Custom error UI</div>}>
  <YourApp />
</ErrorBoundary>
```

---

## ↩️ Undo/Redo System

### Basic Usage

```typescript
import { UndoRedoManager, createFileSnapshot } from '@/utils/undoRedo';

const undoManager = new UndoRedoManager();

// Before making changes, create snapshot
const snapshot = createFileSnapshot(filesMap);

// Push to history
undoManager.push({
  description: "Added new component",
  operations: operations,
  previousFiles: snapshot,
});

// Undo
if (undoManager.canUndo()) {
  const entry = undoManager.undo();
  if (entry) {
    // Restore previous files
    restoreFiles(entry.previousFiles);
  }
}

// Redo
if (undoManager.canRedo()) {
  const entry = undoManager.redo();
  if (entry) {
    // Reapply operations
    applyOperations(entry.operations);
  }
}
```

### History View

```typescript
const history = undoManager.getRecentHistory(10);
history.forEach(entry => {
  console.log(formatHistoryEntry(entry));
  // [10:30:45 AM] Added new component (3 files)
});
```

### Generate Reverse Operations

```typescript
import { generateReverseOperations } from '@/utils/undoRedo';

const reverseOps = generateReverseOperations(operations, previousFiles);

// Apply reverse operations to undo
applyOperations(reverseOps);
```

---

## 🔄 Enhanced File Selection

### Use Token-Aware Selection

```typescript
import { selectRelevantFilesWithStats } from '@/services/fileSelectionService';

const result = selectRelevantFilesWithStats(
  allFiles,
  prompt,
  conversationHistory,
  15, // max files
  500000 // max tokens
);

console.log(`Selected ${result.files.length} files`);
console.log(`Total tokens: ${result.totalTokens}`);
console.log(`Files omitted: ${result.filesOmitted}`);

if (result.tokenLimitReached) {
  console.warn("Token limit reached! Some files were omitted.");
}
```

---

## 🛠️ Integration Examples

### Complete Prompt Flow with All Features

```typescript
import { validatePrompt } from '@/utils/promptValidation';
import { ResponseCache } from '@/utils/responseCache';
import { selectRelevantFilesWithStats } from '@/services/fileSelectionService';
import { createPromptTracker } from '@/services/analyticsService';
import { estimateTokens } from '@/utils/tokenCounter';

async function handlePromptSubmit(prompt: string) {
  // 1. Validate prompt
  const contextTokens = estimateTokens(buildContext());
  const validation = validatePrompt(prompt, contextTokens);

  if (!validation.isValid) {
    showErrors(validation.errors);
    return;
  }

  if (validation.warnings.length > 0) {
    showWarnings(validation.warnings);
  }

  // 2. Check cache
  const cacheKey = ResponseCache.generateKey(prompt);
  const cached = aiResponseCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // 3. Select relevant files
  const fileSelection = selectRelevantFilesWithStats(
    allFiles,
    prompt,
    history,
    15,
    500000
  );

  // 4. Track performance
  const tracker = createPromptTracker();

  try {
    // 5. Call AI
    const response = await callAI(prompt, fileSelection.files);

    // 6. Cache response
    aiResponseCache.set(cacheKey, response);

    // 7. Track success
    tracker.complete({
      prompt,
      promptTokens: estimateTokens(prompt),
      responseTokens: estimateTokens(JSON.stringify(response)),
      totalTokens: fileSelection.totalTokens,
      success: true,
      filesGenerated: response.files.length,
      complexity: validation.complexity,
    });

    return response;
  } catch (error) {
    // 8. Track failure
    tracker.complete({
      prompt,
      promptTokens: estimateTokens(prompt),
      responseTokens: 0,
      totalTokens: fileSelection.totalTokens,
      success: false,
      filesGenerated: 0,
      complexity: validation.complexity,
      errorMessage: error.message,
    });

    throw error;
  }
}
```

---

## 🎯 Best Practices

### Token Management
- Always check token count before sending to API
- Use token-aware file selection
- Warn users at 70% token usage
- Block requests at 90% token usage

### Caching Strategy
- Cache successful responses only
- Clean up expired entries periodically
- Use cache for repeated/similar prompts
- Don't cache error responses

### Analytics
- Track every request (success and failure)
- Monitor success rate weekly
- Identify performance bottlenecks
- Use analytics to improve prompts

### Error Handling
- Always wrap components in ErrorBoundary
- Validate all user input
- Provide clear error messages
- Implement retry logic with exponential backoff

### User Experience
- Show prompt suggestions to guide users
- Use diff viewer for change transparency
- Implement undo/redo for mistake recovery
- Display token usage to manage expectations

---

## 📚 TypeScript Types

All utilities are fully typed. Import types as needed:

```typescript
import type { ValidationResult, PromptMetrics, HistoryEntry } from '@/utils/...';
import type { FileSelectionResult, CacheEntry, UndoRedoState } from '@/utils/...';
```

---

**For more details, see IMPROVEMENTS.md**
