# Chess Game Hallucination Bug - Analysis & Fix

## Problem Summary

User reported: AI generated a chess game successfully on first try, but on subsequent vague prompts ("pieces moving wrong", "its gone"), the AI **hallucinated and deleted all working code**, replacing it with empty templates.

---

## Root Cause Analysis

### Issue 1: Context Loss Between Requests ⚠️
**Evidence from logs:**
```
First request:  ChessGame.tsx = 317 lines generated
Second request: ChessGame.tsx = 3.0 KB read by AI
Third request:  ChessGame.tsx = 0.3 KB read by AI (nearly empty!)
```

**What happened:**
- AI generated full working chess game (5 files, 317 lines)
- User said "pieces moving wrong" (vague)
- AI saw truncated file content (3.0 KB instead of full 317 lines)
- User said "its gone" (extremely vague)
- AI interpreted this as "start over" and replaced with TODO placeholder

### Issue 2: Vague Prompts Trigger Hallucination 🎭
**Vague phrases that caused issues:**
- ❌ "the peices are moving in wrong places"
- ❌ "its gone"

**What AI should have done:**
- Ask for clarification
- Restore previous working version
- Only modify specific broken parts

**What AI actually did:**
- Assumed everything was wrong
- Replaced working code with placeholder
- Lost all state management, board logic, piece movement

### Issue 3: No Validation for Code Deletion 🚨
**Original validation:**
```typescript
✅ Parsing success: 5 file operations
```

But it never checked:
- Is new file suspiciously small?
- Did content shrink dramatically?
- Is new content just a placeholder?

---

## Solutions Implemented (v67)

### Fix 1: Content Shrinkage Detection ✅
**Location:** [supabase/functions/generate-vibe/index.ts](supabase/functions/generate-vibe/index.ts:2920-2970)

Detects when AI tries to replace large files with small ones:

```typescript
// Detects shrinkage >60%
if (existingFile && file.content.length < existingFile.content.length * 0.4) {
  const reductionPercent = Math.round((1 - file.content.length / existingFile.content.length) * 100);
  
  // Check if it's a placeholder
  const isPlaceholder = 
    file.content.includes('TODO') ||
    file.content.includes('// Implement') ||
    file.content.length < 500;
  
  if (isPlaceholder) {
    // REJECT the change
    return error with helpful guidance
  }
}
```

**Result:**
- AI can no longer accidentally delete working code
- Returns error: "Your prompt was too vague"
- Guides user to be more specific

### Fix 2: System Prompt Rule #15 ✅
**Location:** [supabase/functions/generate-vibe/index.ts](supabase/functions/generate-vibe/index.ts:227-240)

New rule explicitly tells AI to preserve code:

```
15. PRESERVE EXISTING CODE (CRITICAL):
    - Read ENTIRE existing content carefully
    - Preserve ALL functionality unless asked to remove
    - Only modify SPECIFIC parts mentioned
    - NEVER replace working file with TODO
    - If vague prompt: ASK for clarification
    - Example: "pieces moving wrong"
      ✅ Fix ONLY movement logic, keep everything else
      ❌ Replace entire file with TODO
```

### Fix 3: Small File Warning ⚠️
**Location:** Same as Fix 1

```typescript
// Warn about new files that are too small
if (operation === 'create' && file.content.length < 200 && !file.path.endsWith('.css')) {
  logger.warn('validation', `New file ${file.path} is very small - might be incomplete`);
}
```

---

## How This Fixes Your Issue

### Before (v66 and earlier):
```
User: "its gone"
AI: "Okay, I'll start from scratch" 
    → Generates 0.3 KB placeholder
    → All chess logic deleted
Result: ❌ Working game replaced with empty template
```

### After (v67):
```
User: "its gone"
AI: Attempts to replace 3.0 KB file with 0.3 KB placeholder
Validation: REJECTED - 90% shrinkage detected
Response: Error message guiding user to be specific
Result: ✅ Working code preserved, user gets helpful guidance
```

---

## Testing the Fix

### Test 1: Reproduce Original Bug
```
1. Generate: "build a chess game"
2. Say: "its gone"
3. Expected: AI now rejects the change and asks for clarity
```

### Test 2: Vague Prompt
```
1. Generate: "build a todo app"
2. Say: "not working"
3. Expected: AI asks "What specifically isn't working?"
```

### Test 3: Legitimate Small Change
```
1. Generate: "build a counter app"
2. Say: "change button color to red"
3. Expected: Works fine (small targeted change)
```

---

## Additional Recommendations

### For Users:
✅ **Be specific in prompts**
- Instead of: "its gone" → "The chess board disappeared"
- Instead of: "not working" → "Pieces aren't moving when I click them"
- Instead of: "wrong" → "Pawns are moving backwards instead of forward"

❌ **Avoid vague phrases:**
- "its gone", "not working", "broken", "weird", "strange" (without context)

### For Future Improvements:

1. **Better Context Persistence** (Optional)
   - Store full generated code in browser's localStorage
   - Send complete recent files in subsequent requests
   - Prevent file content truncation

2. **Vague Prompt Detection** (Optional)
   - Detect phrases like "its gone" and force clarification
   - Return: "I need more details - what specifically is gone?"

3. **Restore Previous Version** (Optional)
   - Add "undo" button to revert to previous working state
   - Keep history of last 3 generations

---

## Summary

**Problem:** AI hallucinated and deleted working chess game code  
**Root Cause:** Vague user prompts + no validation against code deletion  
**Solution:** Content shrinkage detection + system prompt rules  
**Status:** ✅ Fixed in v67, deployed to Supabase  
**Commit:** b2f0e84  

The AI will now **reject** any attempt to replace working code with placeholders and guide the user to provide specific feedback instead.
