# Logging & Quality Improvements Plan

## Current Issues

### 1. Shallow Logging
**Problem:** Logs show high-level operations but miss critical details
- No token usage tracking
- No code quality metrics
- No validation results
- No error details from generated code

### 2. No Quality Gates
**Problem:** AI generates code but quality isn't verified
- TypeScript errors not caught
- Syntax errors not reported
- Runtime errors not logged
- Incomplete implementations not detected

### 3. Limited Debugging Info
**Problem:** When something goes wrong, hard to debug
- No AI "thought" process in logs
- No file content preview
- No diff of changes
- No before/after comparison

---

## Proposed Enhancements

### Phase 1: Enhanced Console Logging

#### Add Token Tracking
```typescript
// In geminiService.ts after AI response
logTokenUsage(promptTokens, responseTokens, totalTokens);
logTokenBudget(remaining, percentage, warningLevel);
```

**New log entries:**
```
[21:48:22] [INFO] 🔢 Token usage: 5,234 prompt + 8,456 response = 13,690 total
[21:48:22] [INFO] 📊 Token budget: 486,310 remaining (97.3%)
```

#### Add Code Quality Metrics
```typescript
// After file operations
logCodeMetrics({
  filesCreated: 3,
  filesModified: 2,
  linesAdded: 456,
  linesChanged: 89,
  complexity: 'moderate'
});
```

**New log entries:**
```
[21:48:22] [INFO] 📝 Code metrics: +3 files, ~2 files, +456 lines
[21:48:22] [INFO] 🎯 Estimated complexity: moderate (score: 6/10)
```

#### Add Validation Results
```typescript
// After applying changes
logValidation({
  typeScriptErrors: 0,
  syntaxErrors: 0,
  warnings: 2,
  status: 'success'
});
```

**New log entries:**
```
[21:48:23] [INFO] ✅ Validation: 0 errors, 2 warnings
[21:48:23] [WARN] ⚠️  Unused import: 'useState' in ChessBoard.tsx
```

#### Add AI Reasoning
```typescript
// During generation
logAIReasoning(thought, filesPlanned, approach);
```

**New log entries:**
```
[21:48:22] [DEBUG] 💭 AI Analysis:
  └─ Creating 3 new components (ChessBoard, ChessPiece, GameState)
  └─ Modifying App.tsx to integrate
  └─ Complexity: High (5 state variables, 12 functions)
```

---

### Phase 2: Quality Gates

#### Pre-generation Validation
```typescript
// Before calling AI
const validation = validatePrompt(prompt, contextTokens);
if (!validation.isValid) {
  logValidationErrors(validation.errors);
  return;
}
logValidationWarnings(validation.warnings);
```

#### Post-generation Validation
```typescript
// After receiving AI response
const codeQuality = analyzeGeneratedCode(files);
if (codeQuality.hasErrors) {
  logCodeErrors(codeQuality.errors);
  // Optionally: Auto-retry with error context
}
```

#### Runtime Error Detection
```typescript
// In preview iframe
window.addEventListener('error', (e) => {
  logRuntimeError(e.message, e.filename, e.lineno);
});
```

---

### Phase 3: Detailed File Operations

#### Before/After Diffs
```typescript
logFileDiff({
  path: 'src/ChessBoard.tsx',
  action: 'modify',
  before: {
    lines: 45,
    size: '2.1 KB'
  },
  after: {
    lines: 178,
    size: '6.8 KB'
  },
  linesAdded: 133,
  preview: '+ Added move validation logic...'
});
```

**New log entries:**
```
[21:48:22] [INFO] 📝 src/ChessBoard.tsx modified:
  └─ 45 → 178 lines (+133)
  └─ 2.1 KB → 6.8 KB (+4.7 KB)
  └─ + Added move validation, state management
```

#### File Content Preview
```typescript
logFilePreview({
  path: 'src/ChessBoard.tsx',
  preview: files[0].content.slice(0, 200),
  fullSize: files[0].content.length
});
```

---

### Phase 4: Performance Metrics

#### API Performance
```typescript
logPerformance({
  endpoint: 'generate-vibe',
  duration: 18761,
  tokensPerSecond: 450,
  status: duration > 20000 ? 'slow' : 'ok'
});
```

**New log entries:**
```
[21:48:22] [INFO] ⚡ API Performance: 18.8s (450 tokens/s)
[21:48:22] [WARN] 🐌 Slow response (>20s threshold)
```

#### Cache Performance
```typescript
logCacheStats({
  hit: false,
  key: 'abc123',
  hitRate: 23.5,
  size: 15
});
```

---

## Implementation Priority

### Immediate (Next 2 hours)
1. ✅ **Add token usage logging** - Critical for budget management
2. ✅ **Add validation logging** - Catch errors early
3. ✅ **Add code metrics** - Track quality

### Short-term (Next day)
4. ✅ **Add AI reasoning logs** - Debug AI decisions
5. ✅ **Add file diff logging** - See what changed
6. ✅ **Add runtime error capture** - Catch preview errors

### Medium-term (Next week)
7. ✅ **Add quality gates** - Auto-detect bad code
8. ✅ **Add performance tracking** - Optimize slow requests
9. ✅ **Add analytics integration** - Track patterns

---

## Enhanced Log Format Example

### Before (Current):
```
[21:48:22.772] [INFO] Created ChessBoard and ChessPiece components
```

### After (Enhanced):
```
[21:48:22.772] [INFO] 🎨 Generated 3 files
  └─ Files: ChessBoard.tsx, ChessPiece.tsx, gameState.ts

[21:48:22.773] [INFO] 🔢 Tokens: 5,234 → 8,456 (13,690 total)
  └─ Budget: 486,310 remaining (97.3%)

[21:48:22.774] [INFO] 📝 Code: +3 files, +456 lines
  └─ ChessBoard.tsx: 0 → 178 lines (new)
  └─ ChessPiece.tsx: 0 → 67 lines (new)
  └─ gameState.ts: 0 → 211 lines (new)

[21:48:22.775] [DEBUG] 💭 AI reasoning:
  └─ Creating chess board with 8x8 grid
  └─ Piece components for each type
  └─ State management for game logic

[21:48:22.900] [INFO] ✅ Validation: 0 errors, 1 warning
  └─ Warning: Consider memoizing renderSquare()

[21:48:22.901] [INFO] ⚡ Performance: 18.8s (450 tok/s)
  └─ Status: Acceptable
```

---

## Code Changes Required

### 1. Enhance useConsoleStore.ts
Add new logging methods:
- `logTokenUsage(prompt, response, total)`
- `logTokenBudget(remaining, percentage)`
- `logCodeMetrics(metrics)`
- `logValidation(results)`
- `logFileDiff(diff)`
- `logAIReasoning(thought)`
- `logPerformance(metrics)`

### 2. Integrate into geminiService.ts
```typescript
// Before AI call
const promptTokens = estimateTokens(prompt);
consoleStore.logTokenUsage(promptTokens, 0, promptTokens);

// After AI call
const responseTokens = estimateTokens(response);
consoleStore.logTokenUsage(promptTokens, responseTokens, promptTokens + responseTokens);

// Add validation
const validation = validateGeneratedCode(files);
consoleStore.logValidation(validation);

// Add metrics
const metrics = calculateCodeMetrics(files);
consoleStore.logCodeMetrics(metrics);
```

### 3. Add Quality Validation Service
Create `src/services/codeValidationService.ts`:
```typescript
export function validateGeneratedCode(files: FileOperation[]) {
  return {
    typeScriptErrors: checkTypeScriptErrors(files),
    syntaxErrors: checkSyntax(files),
    warnings: checkBestPractices(files),
    status: errors === 0 ? 'success' : 'error'
  };
}
```

---

## Benefits

### For Users
- ✅ **Better debugging** - See exactly what happened
- ✅ **Quality confidence** - Know code is validated
- ✅ **Token awareness** - Track budget usage
- ✅ **Performance insights** - Identify slow operations

### For Developers
- ✅ **Easier troubleshooting** - Rich debugging info
- ✅ **Quality metrics** - Track code quality over time
- ✅ **Performance optimization** - Find bottlenecks
- ✅ **Pattern detection** - Identify common issues

---

## Success Metrics

After implementing these improvements, we should see:
1. **Error detection rate:** >90% of issues caught before preview
2. **Token budget awareness:** Users warned at 80% usage
3. **Debug time:** 50% faster issue resolution
4. **Code quality:** Measurable improvement in generated code

---

## Next Steps

1. Review this plan with stakeholders
2. Prioritize which enhancements to implement first
3. Create implementation tickets
4. Implement in phases (don't do all at once)
5. Test each enhancement before moving to next
6. Gather user feedback on log usefulness
