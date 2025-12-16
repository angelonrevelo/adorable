import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

// Prompt template versioning for A/B testing and tracking improvements
const PROMPT_VERSION = "3.0.0"; // EXTENDED THINKING MODE - Deep autonomous reasoning
const PROMPT_CHANGELOG = {
  "3.0.0": "Extended thinking with 7-phase analysis, 1600+ token minimum reasoning, autonomous architecture evaluation",
  "2.1.0": "Added edge cases, accessibility, performance, and error handling rules",
  "2.0.0": "Multi-file system with SCoT, few-shot examples",
  "1.0.0": "Legacy single-file HTML generation",
};

// Legacy single-file HTML prompt (for backward compatibility)
const legacySystemPrompt = `You are an elite Creative Technologist who builds stunning, production-quality web prototypes. Every output must look like it was crafted by a top-tier design agency.

DESIGN SYSTEM:
- Background: #0a0a0f, #111118, #1a1a24
- Primary: #8b5cf6 (violet), #a855f7 (purple)
- Accent: #22d3ee (cyan), #10b981 (emerald)
- Text: #ffffff, #a1a1aa (muted)
- Use Google Fonts: Inter, Plus Jakarta Sans, JetBrains Mono
- Use Tailwind CSS via CDN
- Images: https://image.pollinations.ai/prompt/{description}

OUTPUT FORMAT - Respond ONLY with valid JSON:
{
  "thought": "Brief explanation of your design decisions",
  "html": "Complete <!DOCTYPE html> document with all CSS/JS inline",
  "title": "Short title (2-4 words)"
}`;

// Structured Chain-of-Thought (SCoT) prompt for better code generation
const multiFileSystemPrompt = `You are an AUTONOMOUS AI coding agent with deep expertise in software architecture, debugging, and problem-solving. You are proactive, intelligent, and self-sufficient.

## YOUR CAPABILITIES & AUTONOMY

You have access to:
- The user's complete project files (provided in context)
- Conversation history showing what was built previously
- Error messages from the sandbox (if any)
- The ability to create, modify, or delete files

You MUST be PROACTIVE and AUTONOMOUS:
1. **Self-Diagnose**: If you encounter errors or issues, analyze the root cause yourself
2. **Self-Correct**: Fix your own mistakes without waiting for user feedback
3. **Anticipate Needs**: Infer implied requirements the user didn't explicitly mention
4. **Think Deeply**: Use extensive reasoning before generating code
5. **Be Thorough**: Create production-quality code, not quick prototypes
6. **Stay Coherent**: Build upon existing code rather than replacing everything

## EXTENDED THINKING PROCESS (MANDATORY - Spend at least 1000 tokens on this)

Before writing ANY code, you MUST thoroughly analyze the request through ALL of these phases:

### PHASE 0: ERROR DIAGNOSIS (If errors are present - 200+ tokens)
**ONLY if there are sandbox errors or issues in the context:**
- What is the EXACT error message?
- What is the ROOT CAUSE of this error?
- Is this due to:
  * Missing imports?
  * Incorrect file paths?
  * Type errors?
  * Runtime logic errors?
  * Missing dependencies?
- What are ALL possible causes? (List at least 3 hypotheses)
- Which hypothesis is most likely based on the error?
- What is the MINIMAL fix needed?
- Will this fix break anything else?

**If no errors present, skip to Phase 1.**

### PHASE 1: REQUIREMENTS ANALYSIS (300+ tokens)
- What is the user REALLY asking for? (explicit + implicit requirements)
- What features are mentioned? What features are IMPLIED but not mentioned?
- What would make this production-quality vs a quick prototype?
- What edge cases must be handled?
- What user experience considerations exist?
- What accessibility requirements should be met?
- What performance considerations are there?

### PHASE 2: ARCHITECTURE DESIGN (400+ tokens)
- Evaluate 2-3 DIFFERENT architectural approaches
- For each approach, list pros and cons
- Consider: Component structure, state management, data flow
- Decide on optimal architecture with detailed reasoning
- Plan the component hierarchy and relationships
- Identify potential bottlenecks or technical debt
- Consider scalability and maintainability

### PHASE 3: TECHNICAL PLANNING (300+ tokens)

#### 3A. COMPONENTS
- What React components are needed?
- Which are NEW files vs modifications to existing files?
- What is the component hierarchy and data flow?
- Should any components be memoized for performance?
- What props does each component accept?

#### 3B. STATE MANAGEMENT
- What useState variables are needed?
- What are their exact types and initial values?
- Should any state be lifted or use context?
- Are there derived state values that should use useMemo?
- What state updates might cause unnecessary re-renders?

#### 3C. FUNCTIONS & LOGIC
- What event handlers are needed?
- What business logic does each function contain?
- Should any callbacks be wrapped in useCallback?
- What async operations need error handling?
- What validation logic is needed?

#### 3D. DATA STRUCTURES
- What interfaces/types need to be defined?
- What data transformations will occur?
- How will data be validated?

### PHASE 4: EDGE CASE ANALYSIS (200+ tokens)
- What happens with empty/null/undefined data?
- What happens with very large datasets?
- What happens if API calls fail?
- What happens with invalid user input?
- What happens on slow networks?
- What happens if user performs actions out of order?
- How to handle loading states?
- How to handle error states?

### PHASE 5: STYLING & UX (200+ tokens)
- What Tailwind classes for layout? (flex, grid, etc.)
- What colors, shadows, gradients, transitions to use?
- How to make this look premium and polished?
- What animations or micro-interactions enhance UX?
- How to ensure responsive design?
- How to provide visual feedback for user actions?

### PHASE 6: VALIDATION (200+ tokens)
- Mentally simulate 5 different user scenarios
- Walk through each scenario step-by-step
- Verify the design handles all edge cases
- Check for potential bugs or logic errors
- Confirm accessibility requirements are met
- Verify performance won't degrade

### PHASE 7: FILE PLAN
- List EVERY file you will create or modify
- For each file, explain WHAT changes and WHY
- Use action: "create" for new files, "modify" for existing

## FILE STRUCTURE RULES (CRITICAL)

1. **ALWAYS create separate component files for new features:**
   - New pages → src/pages/PageName.tsx
   - New components → src/components/ComponentName.tsx
   - Utility functions → src/utils/utilName.ts
   - Hooks → src/hooks/useHookName.ts

2. **NEVER put more than 150 lines in App.tsx**
   - App.tsx should only contain routing/layout and imports
   - Extract complex logic into separate components

3. **When user asks for a new feature:**
   - Create the feature in its own file
   - Modify App.tsx to import and render it

4. **Return MULTIPLE files in the "files" array when needed**

## OUTPUT FORMAT

You MUST respond with this exact JSON structure:

{
  "thought": "## PHASE 1: REQUIREMENTS ANALYSIS\\n[Detailed 300+ token analysis of requirements, implicit needs, edge cases, etc.]\\n\\n## PHASE 2: ARCHITECTURE DESIGN\\n[Detailed 400+ token evaluation of 2-3 approaches with pros/cons and final decision]\\n\\n## PHASE 3: TECHNICAL PLANNING\\n### 3A. COMPONENTS\\n[Component breakdown]\\n### 3B. STATE MANAGEMENT\\n[State plan]\\n### 3C. FUNCTIONS\\n[Function plan]\\n### 3D. DATA STRUCTURES\\n[Types/interfaces]\\n\\n## PHASE 4: EDGE CASE ANALYSIS\\n[200+ token edge case analysis]\\n\\n## PHASE 5: STYLING & UX\\n[200+ token styling decisions]\\n\\n## PHASE 6: VALIDATION\\n[200+ token mental simulation]\\n\\n## PHASE 7: FILE PLAN\\n[List of all files with reasoning]",
  "message": "Summary of what was built",
  "files": [
    {
      "path": "src/pages/PageName.tsx",
      "content": "// Complete, production-ready component code",
      "action": "create"
    },
    {
      "path": "src/App.tsx",
      "content": "// Updated App with import",
      "action": "modify"
    }
  ]
}

## CRITICAL RULES

1. The "thought" field MUST show ALL 7 PHASES of your analysis (minimum 1600 tokens)
2. NEVER skip phases - the user wants to see your complete thinking process
2. ALWAYS use "files" array, NEVER use "html" field
3. CREATE new files for new features - don't cram everything into App.tsx
4. Use Tailwind CSS for ALL styling
5. Use JSX comments {/* comment */} NOT HTML comments <!-- -->
6. Self-close tags: <img />, <input />, <br />
7. Use className not class
8. Make UI look PREMIUM with gradients, shadows, transitions
9. Export default the main component
10. **EDGE CASES**: Handle empty states, loading states, and error states gracefully
11. **ACCESSIBILITY**: Use semantic HTML (header, nav, main, section, article, footer)
    - Add aria-label to icon buttons
    - Use proper heading hierarchy (h1 -> h2 -> h3)
    - Ensure sufficient color contrast (WCAG AA minimum)
12. **PERFORMANCE**: Avoid unnecessary re-renders
    - Use React.memo for expensive components
    - Memoize callbacks with useCallback when passed to children
    - Memoize computed values with useMemo
13. **ERROR HANDLING**: Wrap async operations in try-catch
    - Show user-friendly error messages
    - Provide retry mechanisms for failed operations
    - Log errors for debugging
14. **ANTI-HALLUCINATION**: NEVER reference files that don't exist!
    - DO NOT use: background.png, pipe.png, bird.png, logo.svg, photo.jpg
    - DO NOT import: import logo from './logo.svg'
    - DO NOT assume images exist in public folder
    - FOR GAMES: Use Canvas API to draw shapes, NOT image files
    - FOR PLACEHOLDERS: Use https://image.pollinations.ai/prompt/description
    - Use Tailwind CSS classes and gradients for styling, NOT custom images
15. **PRESERVE EXISTING CODE** (CRITICAL - Prevents accidental deletion):
    - When modifying files, read the ENTIRE existing content carefully
    - Preserve ALL existing functionality unless explicitly asked to remove it
    - Only modify the SPECIFIC parts mentioned by the user
    - NEVER replace a working file with a minimal placeholder or TODO
    - If user says vague things like "it's gone", "it's missing", "not working":
      * DO NOT assume you should replace everything
      * Instead, ask for clarification about what specifically is wrong
      * Restore the previous working version if you accidentally deleted something
    - Before modifying a file, explicitly note what you're preserving vs changing
    - Example: User says "the pieces are moving wrong"
      * CORRECT: Fix ONLY the movement validation logic, keep all other code intact
      * WRONG: Replace entire file with a TODO comment
    - If you're unsure what to preserve, ASK the user for clarification

## PROMPT VERSION: ${PROMPT_VERSION}`;

// =====================
// ENHANCED LOGGING SYSTEM
// =====================

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: 'model' | 'validation' | 'code_change' | 'decision' | 'api' | 'context';
  message: string;
  data?: any;
}

class EdgeLogger {
  private logs: LogEntry[] = [];
  private startTime: number = Date.now();

  log(level: LogEntry['level'], category: LogEntry['category'], message: string, data?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data
    };
    this.logs.push(entry);

    // Also log to console for Supabase dashboard
    const prefix = `[${category.toUpperCase()}]`;
    if (level === 'error') {
      console.error(prefix, message, data || '');
    } else if (level === 'warn') {
      console.warn(prefix, message, data || '');
    } else {
      console.log(prefix, message, data || '');
    }
  }

  info(category: LogEntry['category'], message: string, data?: any) {
    this.log('info', category, message, data);
  }

  warn(category: LogEntry['category'], message: string, data?: any) {
    this.log('warn', category, message, data);
  }

  error(category: LogEntry['category'], message: string, data?: any) {
    this.log('error', category, message, data);
  }

  debug(category: LogEntry['category'], message: string, data?: any) {
    this.log('debug', category, message, data);
  }

  logModelSelection(selectedModel: string, reason: string, isComplex: boolean) {
    this.info('model', `Selected model: ${selectedModel}`, {
      reason,
      isComplex,
      availableModels: ['gemini-2.0-flash-exp', 'gemini-1.5-flash', 'gemini-1.5-pro']
    });
  }

  logCodeChange(operation: 'create' | 'modify' | 'delete', filePath: string, oldContent?: string, newContent?: string) {
    const data: any = { operation, filePath };

    if (operation === 'modify' && oldContent && newContent) {
      // Calculate simple diff statistics
      const oldLines = oldContent.split('\n').length;
      const newLines = newContent.split('\n').length;
      const linesAdded = Math.max(0, newLines - oldLines);
      const linesRemoved = Math.max(0, oldLines - newLines);

      data.diff = {
        oldLines,
        newLines,
        linesAdded,
        linesRemoved,
        changePercentage: oldLines > 0 ? Math.round((Math.abs(newLines - oldLines) / oldLines) * 100) : 100
      };
    }

    this.info('code_change', `${operation.toUpperCase()}: ${filePath}`, data);
  }

  logDecision(decision: string, reasoning: string, alternatives?: string[]) {
    this.info('decision', decision, {
      reasoning,
      alternatives: alternatives || [],
      promptVersion: PROMPT_VERSION
    });
  }

  logValidation(filesCount: number, issues: ValidationIssue[], selfCorrected: boolean = false) {
    const errors = issues.filter(i => i.type === 'error').length;
    const warnings = issues.filter(i => i.type === 'warning').length;

    const message = selfCorrected
      ? `Self-correction applied: ${issues.length} issues fixed`
      : `Validation: ${filesCount} files, ${errors} errors, ${warnings} warnings`;

    this.info('validation', message, {
      filesCount,
      errors,
      warnings,
      selfCorrected,
      issues: issues.slice(0, 10) // Only first 10 to avoid huge logs
    });
  }

  logContext(promptLength: number, historyLength: number, filesCount: number, selectedFilesCount: number) {
    this.info('context', 'Context prepared for AI', {
      promptLength,
      historyMessages: historyLength,
      totalFiles: filesCount,
      selectedFiles: selectedFilesCount,
      contextEfficiency: filesCount > 0 ? Math.round((selectedFilesCount / filesCount) * 100) + '%' : 'N/A'
    });
  }

  getElapsedTime(): number {
    return Date.now() - this.startTime;
  }

  getAllLogs(): LogEntry[] {
    return this.logs;
  }

  getSummary() {
    const errors = this.logs.filter(l => l.level === 'error').length;
    const warnings = this.logs.filter(l => l.level === 'warn').length;
    const decisions = this.logs.filter(l => l.category === 'decision').length;
    const codeChanges = this.logs.filter(l => l.category === 'code_change').length;

    return {
      totalLogs: this.logs.length,
      errors,
      warnings,
      decisions,
      codeChanges,
      elapsedTime: this.getElapsedTime(),
      categories: {
        model: this.logs.filter(l => l.category === 'model').length,
        validation: this.logs.filter(l => l.category === 'validation').length,
        code_change: this.logs.filter(l => l.category === 'code_change').length,
        decision: this.logs.filter(l => l.category === 'decision').length,
        api: this.logs.filter(l => l.category === 'api').length,
        context: this.logs.filter(l => l.category === 'context').length,
      }
    };
  }
}

// =====================
// SELF-CORRECTION: Validate generated code
// =====================

interface ValidationIssue {
  type: 'error' | 'warning';
  file: string;
  issue: string;
}

function validateGeneratedCode(files: any[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const file of files) {
    if (!file.path.endsWith('.tsx') && !file.path.endsWith('.ts') && !file.path.endsWith('.jsx')) {
      continue; // Only validate TypeScript/React files
    }

    const content = file.content;

    // Check 1: Missing imports that are used
    const imports = content.match(/import .* from ['"](.*)['"];?/g) || [];
    const importedModules = imports.map((imp: string) => {
      const match = imp.match(/from ['"](.*)['"]/);
      return match ? match[1] : '';
    });

    // Check for React usage without import
    if ((content.includes('useState') || content.includes('useEffect') || content.includes('React.'))
        && !imports.some((imp: string) => imp.includes('react'))) {
      issues.push({
        type: 'error',
        file: file.path,
        issue: 'Uses React hooks/features but missing "import React from \'react\'"'
      });
    }

    // Check 2: Importing non-existent relative files
    const relativeImports = importedModules.filter((mod: string) => mod.startsWith('./') || mod.startsWith('../'));
    for (const relImport of relativeImports) {
      const importPath = relImport.replace(/^\.\//, 'src/').replace(/\.\w+$/, '');
      const expectedFile = files.find(f =>
        f.path.includes(importPath) || f.path.replace(/\.\w+$/, '') === importPath
      );
      if (!expectedFile) {
        issues.push({
          type: 'error',
          file: file.path,
          issue: `Imports "${relImport}" but this file was not created`
        });
      }
    }

    // Check 3: Missing export default
    if (!content.includes('export default') && !content.includes('export {')) {
      issues.push({
        type: 'warning',
        file: file.path,
        issue: 'Missing "export default" - component may not be importable'
      });
    }

    // Check 4: Syntax issues
    const openBraces = (content.match(/{/g) || []).length;
    const closeBraces = (content.match(/}/g) || []).length;
    if (openBraces !== closeBraces) {
      issues.push({
        type: 'error',
        file: file.path,
        issue: `Mismatched braces: ${openBraces} opening, ${closeBraces} closing`
      });
    }

    // Check 5: HTML comments in JSX
    if (content.includes('<!--')) {
      issues.push({
        type: 'error',
        file: file.path,
        issue: 'Contains HTML comments (<!--) instead of JSX comments ({/* */})'
      });
    }

    // Check 6: className vs class
    const classRegex = /\sclass=/g;
    if (classRegex.test(content)) {
      issues.push({
        type: 'error',
        file: file.path,
        issue: 'Uses "class=" instead of "className=" in JSX'
      });
    }
  }

  return issues;
}

async function attemptSelfCorrection(
  originalPrompt: string,
  files: any[],
  issues: ValidationIssue[],
  model: string,
  systemPrompt: string,
  GEMINI_API_KEY: string
): Promise<any[]> {
  console.log(`Attempting self-correction for ${issues.length} issues`);

  const correctionPrompt = `
SELF-CORRECTION REQUIRED

You generated code with the following issues:

${issues.map((issue, i) => `${i + 1}. [${issue.type.toUpperCase()}] ${issue.file}: ${issue.issue}`).join('\n')}

Original request: ${originalPrompt}

Generated files:
${files.map(f => `- ${f.path} (${f.action})`).join('\n')}

TASK: Fix ALL issues listed above. Return the corrected files with the same structure.

CRITICAL:
- Fix EVERY issue mentioned
- Maintain all original functionality
- Return complete file contents (not just changes)
- Use proper imports, exports, JSX syntax
`.trim();

  const messages = [
    {
      role: "user",
      parts: [{ text: correctionPrompt }],
    },
  ];

  const multiFileSchema = {
    type: "OBJECT",
    properties: {
      thought: { type: "STRING", description: "Explanation of fixes made" },
      message: { type: "STRING", description: "Summary of corrections" },
      files: {
        type: "ARRAY",
        items: {
          type: "OBJECT",
          properties: {
            path: { type: "STRING" },
            content: { type: "STRING" },
            action: { type: "STRING", enum: ["create", "modify", "delete"] }
          },
          required: ["path", "content", "action"]
        }
      }
    },
    required: ["thought", "message", "files"]
  };

  // Use fallback helper (primary model should work, but just in case)
  const response = await callGeminiWithFallback(
    `https://generativelanguage.googleapis.com/v1beta/models/\${model}:generateContent?key=${GEMINI_API_KEY}`,
    {
      contents: messages,
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        temperature: 0.3, // Lower temp for corrections
        maxOutputTokens: 32768,
        responseMimeType: "application/json",
        responseSchema: multiFileSchema
      },
    },
    GEMINI_API_KEY,
    model,
    ["gemini-1.5-flash"] // Simple fallback for corrections
  );

  if (!response.ok) {
    console.error("Self-correction API call failed after all fallbacks");
    return files; // Return original if correction fails
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content) {
    console.error("No content in correction response");
    return files;
  }

  try {
    const corrected = JSON.parse(content);
    console.log("Self-correction successful");
    return corrected.files || files;
  } catch (e) {
    console.error("Failed to parse correction response");
    return files;
  }
}

// =====================
// MODEL FALLBACK HELPER
// =====================
/**
 * Calls Gemini API with automatic fallback to alternative models on failure
 */
async function callGeminiWithFallback(
  endpoint: string,
  body: any,
  GEMINI_API_KEY: string,
  primaryModel: string,
  fallbackModels: string[]
): Promise<Response> {
  const models = [primaryModel, ...fallbackModels];

  for (let i = 0; i < models.length; i++) {
    const model = models[i];
    const isLastAttempt = i === models.length - 1;

    try {
      console.log(`Attempting with model: ${model} (attempt ${i + 1}/${models.length})`);

      const url = endpoint.replace('${model}', model);
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      // If 404 or model not found, try next model
      if (response.status === 404) {
        const errorText = await response.text();
        console.error(`Model ${model} not found (404):`, errorText);

        if (!isLastAttempt) {
          console.log(`Falling back to next model: ${models[i + 1]}`);
          continue;
        } else {
          throw new Error(`All models failed. Last error: ${errorText}`);
        }
      }

      // If rate limit (429), wait and retry same model
      if (response.status === 429 && i < 2) {
        console.log(`Rate limited on ${model}, waiting 2s before retry`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        i--; // Retry same model
        continue;
      }

      // If successful or non-recoverable error, return
      if (response.ok || isLastAttempt) {
        if (response.ok) {
          console.log(`✓ Success with model: ${model}`);
        }
        return response;
      }

      // Other errors - try fallback
      const errorText = await response.text();
      console.error(`Model ${model} failed (${response.status}):`, errorText.slice(0, 200));

      if (!isLastAttempt) {
        console.log(`Falling back to next model: ${models[i + 1]}`);
        continue;
      }

    } catch (networkError) {
      console.error(`Network error with ${model}:`, networkError);
      if (isLastAttempt) {
        throw networkError;
      }
      console.log(`Trying next model due to network error`);
    }
  }

  throw new Error("All model attempts exhausted");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, history, type, projectFiles } = await req.json();

    // Initialize enhanced logger for this request
    const logger = new EdgeLogger();
    logger.info('api', `Request received: ${type}`, {
      promptLength: prompt?.length,
      historyLength: history?.length,
      filesCount: projectFiles?.length
    });

    if (!GEMINI_API_KEY) {
      logger.error('api', 'GEMINI_API_KEY is not configured');
      throw new Error("GEMINI_API_KEY is not configured");
    }

    console.log("Received request:", { type, promptLength: prompt?.length, historyLength: history?.length });

    // Smart model selection based on task complexity
    // AVAILABLE MODELS (as of Dec 2024):
    // - gemini-2.0-flash-exp - Fast, stable (recommended)
    // - gemini-1.5-flash - Legacy stable
    // - gemini-1.5-pro - High quality fallback
    const isComplexTask =
      type === "generate-plan" || // Planning always needs Pro
      (prompt && (
        prompt.length > 200 || // Long prompts likely complex
        prompt.toLowerCase().includes('game') ||
        prompt.toLowerCase().includes('algorithm') ||
        prompt.toLowerCase().includes('complex') ||
        prompt.toLowerCase().includes('architecture') ||
        (projectFiles && projectFiles.length > 5) // Large projects
      ));

    // Model selection with fallback chain
    const PRIMARY_MODEL = "gemini-2.0-flash-exp"; // Fixed: was gemini-2.0-flash-thinking-exp-01-21 (invalid)
    const FALLBACK_MODELS = ["gemini-1.5-flash", "gemini-1.5-pro"];

    let model = PRIMARY_MODEL;
    let modelAttemptCount = 0;

    // Log model selection decision
    const modelReason = isComplexTask
      ? type === "generate-plan"
        ? "Planning task requires deep reasoning"
        : `Complex task detected: ${prompt?.length > 200 ? 'long prompt' : ''} ${prompt?.toLowerCase().includes('game') ? 'game development' : ''}`
      : "Simple task, using fast model";

    logger.logModelSelection(model, modelReason, isComplexTask);
    logger.logDecision(
      `Using ${model}`,
      modelReason,
      FALLBACK_MODELS
    );

    console.log(`Selected model: ${model} (complex: ${isComplexTask})`);

    // =====================
    // CONVERSATIONAL PROMPT DETECTION (Dynamic)
    // =====================
    // Detect if user is being conversational vs asking for code
    // Uses intelligent heuristics instead of hardcoded patterns
    const detectConversational = (text: string): boolean => {
      if (!text) return false;

      const trimmed = text.trim().toLowerCase();
      const words = trimmed.split(/\s+/);

      // 1. Very short messages (1-2 words) that don't contain code keywords
      const codeKeywords = [
        'build', 'create', 'make', 'add', 'modify', 'update', 'fix', 'change',
        'component', 'page', 'app', 'button', 'form', 'input', 'list', 'table',
        'game', 'dashboard', 'landing', 'website', 'ui', 'interface', 'feature'
      ];

      if (words.length <= 2 && !codeKeywords.some(kw => trimmed.includes(kw))) {
        return true;
      }

      // 2. Greetings
      const greetings = ['hi', 'hello', 'hey', 'yo', 'sup'];
      if (greetings.includes(trimmed)) {
        return true;
      }

      // 3. Simple acknowledgments
      const acknowledgments = ['ok', 'okay', 'yes', 'no', 'sure', 'cool', 'nice', 'thanks', 'thank you'];
      if (acknowledgments.includes(trimmed)) {
        return true;
      }

      // 4. Random gibberish (random letters with no code intent)
      // If it's short and has no vowels or common code patterns
      if (words.length === 1 && words[0].length <= 10) {
        const hasCodePattern = /\w+(app|bot|ui|api|page|list|form|btn)/.test(trimmed);
        if (!hasCodePattern && !/[aeiou].*[aeiou]/.test(trimmed)) {
          return true; // Likely gibberish like "asdaddad", "xyzw"
        }
      }

      return false;
    };

    const isConversational = prompt && detectConversational(prompt);

    if (isConversational) {
      console.log(`Detected conversational prompt: "${prompt}" - Providing helpful response instead of code generation`);
    }

    if (isConversational && type === "generate-stream") {
      console.log("Returning conversational response via SSE stream");

      // Return a friendly response asking what they want to build
      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: "done",
            thought: "## User Greeted or Sent Short Message\n\nI detected a conversational message rather than a code request. I'm here to help you build React applications!\n\nTo get started, try describing what you want to build, for example:\n- \"Build a todo list app\"\n- \"Create a weather dashboard\"\n- \"Make a landing page for a coffee shop\"\n- \"Build a tic-tac-toe game\"\n\nI can create complete React applications with multiple files, routing, state management, and beautiful UI using Tailwind CSS.",
            message: "Hi! I'm ready to help you build something. What would you like to create?",
            files: []
          })}\n\n`));
          controller.close();
        }
      });

      return new Response(stream, {
        headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
      });
    }

    // =====================
    // STREAMING HANDLER (SSE)
    // =====================
    if (type === "generate-stream") {
      console.log("Starting SSE streaming response");

      // Build conversation history with file operation context
      const conversationHistory =
        history?.map((msg: { role: string; content: string; filesModified?: string[] }) => {
          let content = msg.content;
          // Include file operation context if available
          if (msg.filesModified && msg.filesModified.length > 0) {
            content += `\n[Files in this turn: ${msg.filesModified.join(', ')}]`;
          }
          return {
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: content }],
          };
        }) || [];

      // Build context with files - enhanced format
      let contextMessage = `
=== CRITICAL RULES ===
1. MODIFY, DON'T REPLACE existing code
2. PRESERVE existing design and structure
3. ADD new features without removing existing ones
4. You have ACCESS to conversation history showing what files were previously created/modified

=== TECH STACK ===
React 18 + TypeScript + Tailwind CSS

=== OUTPUT FORMAT ===
Respond with JSON: {"thought": "...", "message": "...", "files": [{"path": "...", "content": "...", "action": "create|modify|delete"}]}

=== CURRENT CODE (Smart Selection - Most Relevant Files) ===
`;

      if (projectFiles && projectFiles.length > 0) {
        console.log(`Processing ${projectFiles.length} files for context`);
        logger.logContext(prompt?.length || 0, history?.length || 0, projectFiles.length, projectFiles.length);
        for (const file of projectFiles) {
          contextMessage += `\n--- ${file.path} ---\n${file.content}\n`;
        }
      }

      contextMessage += `\n=== USER REQUEST ===\n${prompt}`;

      const messages = [
        ...conversationHistory,
        { role: "user", parts: [{ text: contextMessage }] },
      ];

      // Create SSE stream
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();

          // Send initial "thinking" event
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "thinking" })}\n\n`));

          try {
            // Call Gemini streaming API with fallback
            const response = await callGeminiWithFallback(
              `https://generativelanguage.googleapis.com/v1beta/models/\${model}:streamGenerateContent?key=${GEMINI_API_KEY}`,
              {
                contents: messages,
                systemInstruction: { parts: [{ text: multiFileSystemPrompt }] },
                generationConfig: {
                  temperature: 0.7,
                  maxOutputTokens: 32768,
                },
              },
              GEMINI_API_KEY,
              model,
              FALLBACK_MODELS
            );

            if (!response.ok) {
              const errorText = await response.text();
              console.error("Gemini streaming error after all fallbacks:", response.status, errorText);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: "error",
                message: `AI model unavailable (tried ${[model, ...FALLBACK_MODELS].join(', ')}). ${errorText}`
              })}\n\n`));
              controller.close();
              return;
            }

            const reader = response.body!.getReader();
            let rawChunks = "";

            // Just accumulate all chunks - Gemini sends complete JSON objects per chunk
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              rawChunks += new TextDecoder().decode(value);
            }

            console.log("Stream complete, raw chunks length:", rawChunks.length);

            // Gemini streaming returns JSON array: [{"candidates":[...]},{"candidates":[...]}]
            // Each element contains a partial text response
            let fullText = "";
            try {
              // The response is a JSON array of objects
              const parsed = JSON.parse(rawChunks);
              if (Array.isArray(parsed)) {
                for (const item of parsed) {
                  const text = item.candidates?.[0]?.content?.parts?.[0]?.text;
                  if (text) {
                    fullText += text;
                  }
                }
              } else if (parsed.candidates) {
                // Single object response
                fullText = parsed.candidates?.[0]?.content?.parts?.[0]?.text || "";
              }
            } catch {
              // If not valid JSON array, try to extract text from raw chunks
              console.log("Raw parsing failed, trying regex extraction");
              const textMatches = rawChunks.match(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/g);
              if (textMatches) {
                for (const match of textMatches) {
                  const textValue = match.match(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/)?.[1];
                  if (textValue) {
                    // Unescape the JSON string
                    fullText += JSON.parse(`"${textValue}"`);
                  }
                }
              }
            }

            console.log("Extracted text length:", fullText.length);
            console.log("First 500 chars:", fullText.slice(0, 500));

            // Send token event with accumulated text
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: "token",
              total: fullText.length
            })}\n\n`));

            // Now parse the AI's JSON response from fullText
            let aiResponse;
            try {
              const jsonStart = fullText.indexOf('{');
              const jsonEnd = fullText.lastIndexOf('}');

              if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
                const jsonStr = fullText.slice(jsonStart, jsonEnd + 1);
                aiResponse = JSON.parse(jsonStr);
              } else {
                console.error("No JSON object found in AI response");
                throw new Error("No JSON found in AI response");
              }
            } catch (e) {
              console.error("Failed to parse AI response:", e);
              console.error("Full text was:", fullText.slice(0, 2000));
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: "error",
                message: "Failed to parse AI response"
              })}\n\n`));
              controller.close();
              return;
            }

            // Apply self-fixing for JSX issues
            if (aiResponse.files && Array.isArray(aiResponse.files)) {
              aiResponse.files = aiResponse.files.map((file: { path: string; content: string; action: string }) => {
                if (file.path.endsWith('.tsx') || file.path.endsWith('.jsx')) {
                  let fixedContent = file.content;
                  // Strip markdown code blocks
                  fixedContent = fixedContent
                    .replace(/^```(?:tsx|typescript|jsx|ts|js|javascript)?\n?/gm, '')
                    .replace(/\n?```$/gm, '')
                    .trim();
                  // Fix HTML comments to JSX
                  fixedContent = fixedContent.replace(/<!--\s*([\s\S]*?)\s*-->/g, '{/* $1 */}');
                  // Fix class= to className=
                  fixedContent = fixedContent.replace(/\bclass=/g, 'className=');
                  return { ...file, content: fixedContent };
                }
                return file;
              });

              // SELF-CORRECTION for streaming mode
              const issues = validateGeneratedCode(aiResponse.files);
              if (issues.length > 0) {
                const errorIssues = issues.filter((i: ValidationIssue) => i.type === 'error');
                console.log(`[STREAM] Validation found ${errorIssues.length} errors`);

                if (errorIssues.length > 0 && errorIssues.length <= 10) {
                  try {
                    const correctedFiles = await attemptSelfCorrection(
                      prompt,
                      aiResponse.files,
                      errorIssues,
                      model,
                      multiFileSystemPrompt,
                      GEMINI_API_KEY as string
                    );
                    const remainingErrors = validateGeneratedCode(correctedFiles).filter((i: ValidationIssue) => i.type === 'error');
                    if (remainingErrors.length < errorIssues.length) {
                      console.log(`[STREAM] Self-correction: ${errorIssues.length} -> ${remainingErrors.length} errors`);
                      aiResponse.files = correctedFiles;
                      aiResponse.message += ` (Auto-corrected ${errorIssues.length - remainingErrors.length} issues)`;
                    }
                  } catch (e) {
                    console.error("[STREAM] Self-correction failed:", e);
                  }
                }
              } else {
                console.log("[STREAM] Validation passed ✓");
              }
            }

            // Send the final "done" event with parsed data
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: "done",
              thought: aiResponse.thought || "",
              message: aiResponse.message || "Generated successfully",
              files: aiResponse.files || []
            })}\n\n`));

            controller.close();
          } catch (error) {
            console.error("Streaming error:", error);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: "error",
              message: error instanceof Error ? error.message : "Unknown error"
            })}\n\n`));
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

    // =====================
    // PLANNING MODE HANDLER
    // =====================
    if (type === "generate-plan") {
      console.log("Planning mode - creating structured execution plan");

      const planningPrompt = `You are an expert software architect with deep autonomous planning capabilities. Your job is to THOROUGHLY analyze the request and create a comprehensive implementation plan.

DO NOT write any code yet. Your job is ONLY to create a detailed, well-reasoned plan.

## EXTENDED ANALYSIS PROCESS (Spend 800+ tokens on this)

### 1. REQUIREMENTS DEEP DIVE (200+ tokens)
- What is the user EXPLICITLY asking for?
- What features are IMPLIED but not stated?
- What would make this production-quality vs a prototype?
- What are the obvious edge cases?
- What are the non-obvious edge cases?
- What would a senior developer anticipate needs to be handled?

### 2. ARCHITECTURE EVALUATION (300+ tokens)
- Evaluate 2-3 different implementation approaches
- For each approach: List pros, cons, technical trade-offs
- Consider: Performance, maintainability, scalability, complexity
- Choose optimal approach with detailed reasoning
- Explain why you rejected the alternatives

### 3. COMPLEXITY ASSESSMENT (100+ tokens)
- Analyze: How many files? How many components? State complexity?
- Is this simple (1-2 files), moderate (3-5 files), or complex (6+ files)?
- What makes it that complexity level?
- What are the challenging parts?

### 4. PHASE BREAKDOWN STRATEGY (200+ tokens)
- How should work be divided into phases?
- What dependencies exist between phases?
- What validation happens after each phase?
- Why is this the optimal phase structure?

## OUTPUT FORMAT (JSON only)

{
  "summary": "One-line summary of what will be built",
  "reasoning": "Explain your understanding of the request and approach",
  "estimatedComplexity": "simple" | "moderate" | "complex",
  "suggestedDependencies": ["package-name", ...],
  "phases": [
    {
      "id": "phase-1",
      "name": "Phase 1: Foundation",
      "description": "What this phase accomplishes",
      "filesToCreate": ["src/components/..."],
      "filesToModify": ["src/App.tsx"],
      "validationCriteria": ["App renders without errors", "Component is visible"]
    },
    ...more phases
  ]
}

## PHASE DESIGN RULES

1. Each phase should be independently testable
2. Phase 1 should always create the basic structure that renders
3. Later phases add features incrementally
4. For games: Phase 1 = rendering, Phase 2 = input/physics, Phase 3 = game logic, Phase 4 = polish
5. For apps: Phase 1 = layout/structure, Phase 2 = data/state, Phase 3 = interactivity, Phase 4 = polish

## EXAMPLES

User: "Build a Flappy Bird clone"
→ Phase 1: Canvas & Bird rendering
→ Phase 2: Jump physics & gravity
→ Phase 3: Pipe obstacles & collision
→ Phase 4: Scoring, game over, restart
→ Phase 5: Sound effects, animations, polish

User: "Create a money tracker"
→ Phase 1: Dashboard layout with totals
→ Phase 2: Add transaction form
→ Phase 3: Transaction list with edit/delete
→ Phase 4: Categories & filtering
→ Phase 5: Charts & data visualization

## CURRENT PROJECT FILES
${projectFiles?.map((f: { path: string }) => '- ' + f.path).join('\n') || 'Empty project'}

## USER REQUEST
${prompt}

Respond with ONLY the JSON plan, no additional text.`;

      const planResponse = await callGeminiWithFallback(
        `https://generativelanguage.googleapis.com/v1beta/models/\${model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          contents: [{ role: "user", parts: [{ text: planningPrompt }] }],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 4096,
          },
        },
        GEMINI_API_KEY,
        model,
        FALLBACK_MODELS
      );

      if (!planResponse.ok) {
        const errorText = await planResponse.text();
        throw new Error(`Gemini API error after all fallbacks: ${planResponse.status} - ${errorText}`);
      }

      const planData = await planResponse.json();
      const planText = planData.candidates?.[0]?.content?.parts?.[0]?.text || "";

      // Extract JSON from response
      const jsonMatch = planText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Failed to parse planning response");
      }

      const plan = JSON.parse(jsonMatch[0]);

      // Add IDs to phases if not present
      if (plan.phases) {
        plan.phases = plan.phases.map((phase: any, index: number) => ({
          ...phase,
          id: phase.id || `phase-${index + 1}`,
          status: 'pending'
        }));
      }

      return new Response(
        JSON.stringify({ success: true, plan }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let messages;
    let systemInstruction;

    if (type === "random") {
      // Random idea generation
      messages = [
        {
          role: "user",
          parts: [
            {
              text: 'Generate a creative, unexpected web app idea in one sentence. Be creative and specific. Examples: "A playable Flappy Bird clone with neon graphics", "An interactive solar system explorer", "A recipe finder with drag-and-drop ingredients". Just respond with the idea, nothing else.',
            },
          ],
        },
      ];
      systemInstruction = undefined;
    } else if (type === "generate-multifile") {
      // Check for conversational prompts in non-streaming mode
      if (isConversational) {
        console.log("Returning conversational response (non-streaming)");
        return new Response(
          JSON.stringify({
            thought: "## User Greeted or Sent Short Message\n\nI detected a conversational message rather than a code request. I'm here to help you build React applications!\n\nTo get started, try describing what you want to build, for example:\n- \"Build a todo list app\"\n- \"Create a weather dashboard\"\n- \"Make a landing page for a coffee shop\"\n- \"Build a tic-tac-toe game\"\n\nI can create complete React applications with multiple files, routing, state management, and beautiful UI using Tailwind CSS.",
            message: "Hi! I'm ready to help you build something. What would you like to create?",
            files: []
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Multi-file React generation with environment context
      const conversationHistory =
        history?.map((msg: { role: string; content: string; filesModified?: string[] }) => {
          let content = msg.content;
          // Include file operation context if available
          if (msg.filesModified && msg.filesModified.length > 0) {
            content += `\n[Files in this turn: ${msg.filesModified.join(', ')}]`;
          }
          return {
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: content }],
          };
        }) || [];

      // CRITICAL: Environment context preamble with MODIFY-not-REPLACE rule
      const environmentContext = `
        === CRITICAL RULES ===

          1. MODIFY, DON'T REPLACE: You are modifying an EXISTING React application.
            - NEVER delete existing components that the user didn't mention
              - ADD new features to the existing code
                - PRESERVE the existing design, styling, and structure

      2. If user says "add X", add X to the existing code - don't create a brand new page

      3. PRESERVE EXISTING CODE: Look at the "CURRENT CODE" section below. 
   - Keep the existing App component structure
        - Keep existing CSS classes, shadows, styling
          - Keep existing navigation / layout
            - Only ADD or MODIFY the specific parts the user asked for

=== FILE STRUCTURE(REQUIRED) ===
        - Pages go in: src / pages / PageName.tsx
          - Components go in: src / components / ComponentName.tsx
            - Hooks go in: src / hooks / useHookName.ts
              - Utils go in: src / utils / utilName.ts
                - App.tsx should ONLY import and compose components, not contain all logic

                  === WHEN TO CREATE NEW FILES ===
                    - New page requested → CREATE src / pages / PageName.tsx
                      - New reusable component → CREATE src / components / ComponentName.tsx
                        - Custom hook needed → CREATE src / hooks / useHookName.ts
                          - ALWAYS return MULTIPLE files in the "files" array when creating features

                            === TECH STACK ===
                              - React 18 with TypeScript
                              - Tailwind CSS(ALL classes available)
                                - useState / useEffect for state


                                  === COMPLETE LIBRARY REFERENCE ===

✅ INSTALLED & READY TO USE:

      ROUTING:
      - react - router - dom: Full routing support for multi - page apps
  import { BrowserRouter, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
  
  Example App.tsx with routing:
      \`\`\`tsx
  import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
  import HomePage from './pages/HomePage';
  import AboutPage from './pages/AboutPage';
  
  function App() {
    return (
      <BrowserRouter>
        <nav><Link to="/">Home</Link> | <Link to="/about">About</Link></nav>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </BrowserRouter>
    );
  }
  \`\`\`

UI COMPONENTS:
- lucide-react: Icons (Home, Settings, User, ChevronRight, etc.)
- @radix-ui/*: Full Radix UI suite including:
  - Dialog, Dropdown, Tabs, Tooltip, Accordion, Switch
  - Checkbox, Select, Slider, Progress, Avatar
  - RadioGroup, Label, Popover, ScrollArea, Separator
  - Toggle, ContextMenu, HoverCard, Menubar, NavigationMenu
  - AlertDialog, AspectRatio, Collapsible
- class-variance-authority, clsx, tailwind-merge

3D & GRAPHICS:
- three, @react-three/fiber, @react-three/drei:
  CRITICAL: ALWAYS include lights in 3D scenes or the canvas will be black!
  \`\`\`tsx
  import { Canvas } from '@react-three/fiber';
  import { OrbitControls } from '@react-three/drei';
  
  function Scene() {
    return (
      <Canvas>
        {/* REQUIRED: Add lights or objects won't be visible */}
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <OrbitControls />
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="hotpink" />
        </mesh>
      </Canvas>
    );
  }
  \`\`\`


ANIMATION:
- framer-motion:
  import { motion } from 'framer-motion';

CHARTS:
- recharts:
  import { LineChart, BarChart, PieChart } from 'recharts';

HTTP & DATA FETCHING:
- axios: HTTP client for API calls
  import axios from 'axios';
  const { data } = await axios.get('https://api.example.com/data');
- @tanstack/react-query: Data fetching & caching
- native fetch: Also available

PUBLIC APIs (no key required):
- Weather: https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m
- Crypto: https://api.coincap.io/v2/assets
- Jokes: https://official-joke-api.appspot.com/random_joke
- IP Info: https://ipapi.co/json/

DATES:
- date-fns: format, parseISO, etc.

STATE:
- zustand: Global state management

FORMS & VALIDATION:
- react-hook-form: Form state management
- zod: Schema validation
- @hookform/resolvers: Zod resolver for react-hook-form

NOTIFICATIONS:
- sonner: Toast notifications

DRAG & DROP:
- @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities

❌ NOT INSTALLED - DO NOT USE:


MAPS (do NOT import - use window.L instead, see MAPS section below):
- import 'leaflet' ❌ (use window.L instead)
- react-leaflet ❌

STATE (use zustand or useState instead):
- redux, mobx ❌

STYLING (use Tailwind CSS instead):
- styled-components, emotion ❌

ANIMATION (use framer-motion instead):
- gsap, anime.js ❌


FORMS (use react-hook-form instead):
- formik ❌

=== SMART ALTERNATIVES ===

When user asks for... → Use this:
- "Add a map" → OpenStreetMap iframe (see MAPS section below)
- "Make API call" → Native fetch with async/await
- "Add notifications" → sonner toast()
- "Add drag and drop" → @dnd-kit/core
- "Form validation" → zod + react-hook-form
- "Global state" → zustand
- "Data caching" → @tanstack/react-query

=== MAPS (TWO OPTIONS) ===

OPTION 1: Simple Static Map (OpenStreetMap iframe) - BEST FOR SIMPLE DISPLAYS

<iframe
  src="https://www.openstreetmap.org/export/embed.html?bbox=120.9,14.4,121.2,14.8&layer=mapnik"
  className="w-full h-[400px] rounded-xl border-0"
  title="Map"
/>

Common bbox coordinates:
- Metro Manila: bbox=120.9,14.4,121.2,14.8
- New York: bbox=-74.1,40.6,-73.8,40.9
- London: bbox=-0.2,51.4,0.1,51.6
- San Francisco: bbox=-122.5,37.7,-122.3,37.85

For markers, append: ?mlat={lat}&mlon={lon}

OPTION 2: Interactive Map (Leaflet via CDN) - FOR MARKERS, PAN, ZOOM

Leaflet is loaded globally via CDN. Access it via window.L (NOT import!).

CRITICAL RULES FOR MAPS:
1. NEVER writes \`import L from 'leaflet'\` (this package is NOT installed)
2. NEVER writes \`import 'leaflet/dist/leaflet.css'\`
3. ALWAYS define \`const L = (window as any).L;\` inside useEffect
4. ALWAYS add this to your component:
   \`\`\`tsx
   declare global {
     interface Window { L: any; }
   }
   \`\`\`

Example MapComponent.tsx:
\`\`\`tsx
import { useEffect, useRef } from 'react';

declare global {
  interface Window { L: any; }
}

interface MapProps {
  center?: [number, number];
  zoom?: number;
  markers?: Array<{ lat: number; lng: number; popup?: string }>;
}

export function MapComponent({ center = [14.5995, 120.9842], zoom = 13, markers = [] }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    
    const L = window.L;
    if (!L) {
      console.error('Leaflet not loaded');
      return;
    }

    const map = L.map(mapRef.current).setView(center, zoom);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    markers.forEach(({ lat, lng, popup }) => {
      const marker = L.marker([lat, lng]).addTo(map);
      if (popup) marker.bindPopup(popup);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return <div ref={mapRef} className="w-full h-[400px] rounded-xl" />;
}
\`\`\`

=== IMAGES ===

NEVER use external image URLs from imgur, i.imgur.com, or random hosts (they will break!).

For placeholder images, use:
- https://picsum.photos/800/600 (random photo)
- https://picsum.photos/seed/nature/800/600 (seeded photo - consistent)
- https://placehold.co/800x600/1e293b/8b5cf6?text=Placeholder (colored placeholder)

For icons, use lucide-react instead of images:
import { MapPin, Navigation, Building, Image, Camera } from 'lucide-react';

=== TYPESCRIPT RULES (REQUIRED) ===

1. Define interfaces for ALL data shapes:
   interface User { id: string; name: string; email: string; }
   interface Todo { id: string; text: string; completed: boolean; }

2. Type ALL component props:
   interface CardProps { title: string; children: React.ReactNode; }
   function Card({ title, children }: CardProps) { ... }

3. Type ALL state:
   const [users, setUsers] = useState<User[]>([]);
   const [count, setCount] = useState<number>(0);
   const [isOpen, setIsOpen] = useState<boolean>(false);

4. Use proper event types:
   const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {}
   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {}
   const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {}

=== IMPORT RULES (CRITICAL) ===
- NEVER use @/ import aliases (like @/components/...)
- ALWAYS use relative imports (like ./components/... or ../utils/...)
- The bundler does not support path aliases

=== DESIGN REQUIREMENTS ===
- PREMIUM DESIGN: Use gradients, shadows, rounded corners, transitions
- Dark mode: Use slate-900, slate-800 backgrounds
- Accent colors: Use violet, purple, amber gradients
- Glassmorphism: bg-white/10 backdrop-blur-xl
- NEVER use plain gray backgrounds or unstyled forms

=== OUTPUT FORMAT (STREAMING) ===

You must respond with a STREAM of JSON objects. Each object must be on a new line.

1. Start with \`{"type": "thinking", "content": "Analyzing request..."}\`
2. Stream tokens: \`{"type": "token", "content": "..."}\`
3. End with a single JSON object containing the \`thought\` and \`files\` array.

CRITICAL: The final response MUST be consistent with this schema:
\`\`\`json
{
  "thought": "Brief explanation of your plan...",
  "message": "User-facing message...",
  "files": [
    {
      "type": "create" | "update",
      "path": "src/components/Example.tsx",
      "content": "..."
    }
  ]
}
\`\`\`

IMPORTANT:
- Do NOT wrap the final JSON in markdown code blocks.
- Ensure all JSON is valid and properly escaped.
- When fixing errors, carefully analyze the error message provided in the prompt.
- If you import a library, ensure it is in the allowed list.
- NEVER leave placeholders like \`// ... rest of code\`. ALWAYS write the full file content.

  "thought": "## FILE PLAN\\n- CREATE src/pages/GalleryPage.tsx\\n- MODIFY src/App.tsx to import it",
  "message": "Created gallery page", 
  "files": [
    {"path": "src/pages/GalleryPage.tsx", "content": "...", "action": "create"},
    {"path": "src/App.tsx", "content": "...", "action": "modify"}
  ]
}

=== CURRENT CODE ===
`;

      // Build context with existing project files - THIS IS CRITICAL
      let contextMessage = environmentContext;
      if (projectFiles && projectFiles.length > 0) {
        for (const file of projectFiles) {
          if (file.path.includes('App.tsx') || file.path.includes('App.jsx')) {
            contextMessage += `\n--- ${file.path} (PRESERVE THIS STRUCTURE) ---\n${file.content}\n`;
          } else {
            contextMessage += `\n--- ${file.path} ---\n${file.content}\n`;
          }
        }
      } else {
        contextMessage += "\n(No existing files - create from scratch)\n";
      }

      contextMessage += `\n=== USER REQUEST ===\n${prompt}\n\n=== REMEMBER: MODIFY the existing code above, don't replace it! ===`;

      // FEW-SHOT EXAMPLES: 5 diverse examples to teach different patterns
      const fewShotExamples = [
        // Example 1: Basic Counter Component
        {
          role: "user",
          parts: [{ text: "Create a counter with + and - buttons" }]
        },
        {
          role: "model",
          parts: [{
            text: JSON.stringify({
              thought: "## 1. COMPONENTS\n- Counter component (new file in src/components/)\n- App (modify to import Counter)\n\n## 2. STATE\n- count: number in Counter.tsx\n\n## 3. FUNCTIONS\n- increment/decrement handlers\n\n## 4. STYLING\n- Glassmorphic card, gradient buttons\n\n## 5. FILE PLAN\n- CREATE src/components/Counter.tsx\n- MODIFY src/App.tsx",
              message: "Created a modular counter component",
              files: [
                {
                  path: "src/components/Counter.tsx",
                  content: `import { useState } from 'react';

interface CounterProps {
  initialValue?: number;
}

export function Counter({ initialValue = 0 }: CounterProps) {
  const [count, setCount] = useState<number>(initialValue);
  
  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/10">
      <h2 className="text-2xl font-bold text-white mb-6">Counter</h2>
      <div className="text-6xl font-bold text-white mb-8 text-center">{count}</div>
      <div className="flex gap-4 justify-center">
        <button 
          onClick={() => setCount(c => c - 1)} 
          className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors"
        >
          -
        </button>
        <button 
          onClick={() => setCount(c => c + 1)} 
          className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
}`,
                  action: "create"
                },
                {
                  path: "src/App.tsx",
                  content: `import { Counter } from './components/Counter';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Counter />
    </div>
  );
}

export default App;`,
                  action: "modify"
                }
              ]
            })
          }]
        },
        // Example 2: Page with State-Based Navigation
        {
          role: "user",
          parts: [{ text: "Create an about page with company info" }]
        },
        {
          role: "model",
          parts: [{
            text: JSON.stringify({
              thought: "## 1. COMPONENTS\n- AboutPage (new page in src/pages/)\n- App (modify to add state-based routing)\n\n## 2. STATE\n- currentPage: string in App.tsx for navigation\n\n## 3. FUNCTIONS\n- setCurrentPage handler for nav\n\n## 4. STYLING\n- Glassmorphic cards, gradient text, nav bar\n\n## 5. FILE PLAN\n- CREATE src/pages/AboutPage.tsx\n- MODIFY src/App.tsx with navigation",
              message: "Created an About page with state-based navigation",
              files: [
                {
                  path: "src/pages/AboutPage.tsx",
                  content: `import { ChevronRight } from 'lucide-react';

interface AboutPageProps {
  onNavigate: (page: string) => void;
}

export function AboutPage({ onNavigate }: AboutPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 text-violet-400 hover:text-violet-300 mb-8 transition-colors"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Back to Home
        </button>
        
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent mb-6">
            About Us
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed mb-6">
            We are a forward-thinking company dedicated to building innovative solutions 
            that make a difference. Our team of experts works tirelessly to deliver 
            exceptional products and services.
          </p>
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-2">Our Mission</h3>
              <p className="text-slate-400">To innovate and inspire through technology.</p>
            </div>
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-2">Our Vision</h3>
              <p className="text-slate-400">A world connected through elegant solutions.</p>
            </div>
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-2">Our Values</h3>
              <p className="text-slate-400">Integrity, innovation, and excellence.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}`,
                  action: "create"
                },
                {
                  path: "src/App.tsx",
                  content: `import { useState } from 'react';
import { AboutPage } from './pages/AboutPage';

function App() {
  const [currentPage, setCurrentPage] = useState<string>('home');
  
  if (currentPage === 'about') {
    return <AboutPage onNavigate={setCurrentPage} />;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-white mb-8">Welcome Home</h1>
      <button 
        onClick={() => setCurrentPage('about')}
        className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white rounded-xl transition-all shadow-lg"
      >
        Learn About Us
      </button>
    </div>
  );
}

export default App;`,
                  action: "modify"
                }
              ]
            })
          }]
        },
        // Example 3: Custom Hook
        {
          role: "user",
          parts: [{ text: "Create a useLocalStorage hook" }]
        },
        {
          role: "model",
          parts: [{
            text: JSON.stringify({
              thought: "## 1. COMPONENTS\n- useLocalStorage hook (new in src/hooks/)\n- StorageDemo component to showcase usage\n- App (modify to use demo)\n\n## 2. STATE\n- Generic T value persisted to localStorage\n\n## 3. FUNCTIONS\n- setValue with localStorage sync\n- useEffect for initial load\n\n## 4. STYLING\n- Demo with input and display\n\n## 5. FILE PLAN\n- CREATE src/hooks/useLocalStorage.ts\n- CREATE src/components/StorageDemo.tsx\n- MODIFY src/App.tsx",
              message: "Created useLocalStorage hook with demo component",
              files: [
                {
                  path: "src/hooks/useLocalStorage.ts",
                  content: `import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading localStorage:', error);
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  };

  return [storedValue, setValue];
}`,
                  action: "create"
                },
                {
                  path: "src/components/StorageDemo.tsx",
                  content: `import { useLocalStorage } from '../hooks/useLocalStorage';

interface UserPrefs {
  theme: string;
  name: string;
}

export function StorageDemo() {
  const [prefs, setPrefs] = useLocalStorage<UserPrefs>('user-prefs', { theme: 'dark', name: '' });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrefs({ ...prefs, name: e.target.value });
  };

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/10 max-w-md">
      <h2 className="text-2xl font-bold text-white mb-6">LocalStorage Demo</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-slate-300 mb-2">Your Name (persisted)</label>
          <input
            type="text"
            value={prefs.name}
            onChange={handleNameChange}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
            placeholder="Enter your name..."
          />
        </div>
        <p className="text-slate-400 text-sm">
          Refresh the page - your name will persist!
        </p>
      </div>
    </div>
  );
}`,
                  action: "create"
                },
                {
                  path: "src/App.tsx",
                  content: `import { StorageDemo } from './components/StorageDemo';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <StorageDemo />
    </div>
  );
}

export default App;`,
                  action: "modify"
                }
              ]
            })
          }]
        },
        // Example 4: Data Fetching with Loading/Error States
        {
          role: "user",
          parts: [{ text: "Create a user list that fetches from an API" }]
        },
        {
          role: "model",
          parts: [{
            text: JSON.stringify({
              thought: "## 1. COMPONENTS\n- UserList component with fetch logic\n- App (modify to render UserList)\n\n## 2. STATE\n- users: User[] for data\n- loading: boolean for loading state\n- error: string | null for errors\n\n## 3. FUNCTIONS\n- useEffect with fetch\n- Error/loading handling\n\n## 4. STYLING\n- User cards with avatar, loading spinner\n\n## 5. FILE PLAN\n- CREATE src/components/UserList.tsx\n- MODIFY src/App.tsx",
              message: "Created UserList with loading and error states",
              files: [
                {
                  path: "src/components/UserList.tsx",
                  content: `import { useState, useEffect } from 'react';
import { User, AlertCircle } from 'lucide-react';

interface UserData {
  id: number;
  name: string;
  email: string;
  company: { name: string };
}

export function UserList() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('https://jsonplaceholder.typicode.com/users');
        if (!response.ok) throw new Error('Failed to fetch users');
        const data: UserData[] = await response.json();
        setUsers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 flex items-center gap-4">
        <AlertCircle className="w-6 h-6 text-red-400" />
        <p className="text-red-300">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white mb-6">Users</h2>
      {users.map((user) => (
        <div key={user.id} className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-500 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold">{user.name}</h3>
            <p className="text-slate-400 text-sm">{user.email}</p>
            <p className="text-slate-500 text-xs">{user.company.name}</p>
          </div>
        </div>
      ))}
    </div>
  );
}`,
                  action: "create"
                },
                {
                  path: "src/App.tsx",
                  content: `import { UserList } from './components/UserList';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-2xl mx-auto">
        <UserList />
      </div>
    </div>
  );
}

export default App;`,
                  action: "modify"
                }
              ]
            })
          }]
        },
        // Example 5: Form with Validation
        {
          role: "user",
          parts: [{ text: "Create a contact form with validation" }]
        },
        {
          role: "model",
          parts: [{
            text: JSON.stringify({
              thought: "## 1. COMPONENTS\n- ContactForm with validation\n- App (modify to render form)\n\n## 2. STATE\n- formData: object with name, email, message\n- errors: object with field errors\n- submitted: boolean for success state\n\n## 3. FUNCTIONS\n- handleChange for inputs\n- validate function\n- handleSubmit with validation\n\n## 4. STYLING\n- Styled inputs, error messages, submit button\n\n## 5. FILE PLAN\n- CREATE src/components/ContactForm.tsx\n- MODIFY src/App.tsx",
              message: "Created ContactForm with validation",
              files: [
                {
                  path: "src/components/ContactForm.tsx",
                  content: `import { useState } from 'react';
import { Send, Check } from 'lucide-react';

interface FormData {
  name: string;
  email: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

export function ContactForm() {
  const [formData, setFormData] = useState<FormData>({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState<boolean>(false);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validate()) {
      setSubmitted(true);
      // Handle form submission here
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  if (submitted) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-8 text-center">
        <Check className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Thank You!</h3>
        <p className="text-slate-300">Your message has been sent successfully.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/10">
      <h2 className="text-2xl font-bold text-white mb-6">Contact Us</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-slate-300 mb-2">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={\`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 \${errors.name ? 'border-red-500' : 'border-white/10'}\`}
            placeholder="Your name"
          />
          {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-slate-300 mb-2">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={\`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 \${errors.email ? 'border-red-500' : 'border-white/10'}\`}
            placeholder="your@email.com"
          />
          {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-slate-300 mb-2">Message</label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={4}
            className={\`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none \${errors.message ? 'border-red-500' : 'border-white/10'}\`}
            placeholder="Your message..."
          />
          {errors.message && <p className="text-red-400 text-sm mt-1">{errors.message}</p>}
        </div>

        <button
          type="submit"
          className="w-full px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
        >
          <Send className="w-5 h-5" />
          Send Message
        </button>
      </div>
    </form>
  );
}`,
                  action: "create"
                },
                {
                  path: "src/App.tsx",
                  content: `import { ContactForm } from './components/ContactForm';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <ContactForm />
      </div>
    </div>
  );
}

export default App;`,
                  action: "modify"
                }
              ]
            })
          }]
        },
        // Example 6: Dashboard with Charts (recharts)
        {
          role: "user",
          parts: [{ text: "Create a sales dashboard with charts" }]
        },
        {
          role: "model",
          parts: [{
            text: JSON.stringify({
              thought: "## 1. COMPONENTS\n- Dashboard page with charts\n- StatCard component\n\n## 2. STATE\n- salesData array (static)\n\n## 3. FUNCTIONS\n- None needed (static display)\n\n## 4. STYLING\n- Grid layout, glassmorphic cards, responsive\n\n## 5. FILE PLAN\n- CREATE src/components/StatCard.tsx\n- CREATE src/pages/Dashboard.tsx\n- MODIFY src/App.tsx",
              message: "Created sales dashboard with LineChart and stats",
              files: [
                {
                  path: "src/components/StatCard.tsx",
                  content: `import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  positive: boolean;
}

export function StatCard({ title, value, change, positive }: StatCardProps) {
  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
      <p className="text-slate-400 text-sm">{title}</p>
      <p className="text-3xl font-bold text-white mt-2">{value}</p>
      <div className={\`flex items-center gap-1 text-sm mt-2 \${positive ? 'text-emerald-400' : 'text-red-400'}\`}>
        {positive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        {change}
      </div>
    </div>
  );
}`,
                  action: "create"
                },
                {
                  path: "src/pages/Dashboard.tsx",
                  content: `import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { StatCard } from '../components/StatCard';

const salesData = [
  { month: 'Jan', sales: 4000, orders: 240 },
  { month: 'Feb', sales: 3000, orders: 198 },
  { month: 'Mar', sales: 5000, orders: 300 },
  { month: 'Apr', sales: 4500, orders: 278 },
  { month: 'May', sales: 6000, orders: 389 },
  { month: 'Jun', sales: 5500, orders: 349 },
];

export function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Sales Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total Revenue" value="$45,231" change="+20.1% from last month" positive={true} />
        <StatCard title="Active Users" value="2,350" change="+15.2% from last month" positive={true} />
        <StatCard title="Bounce Rate" value="12.5%" change="+2.3% from last month" positive={false} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h2 className="text-xl font-semibold text-white mb-4">Sales Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="sales" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h2 className="text-xl font-semibold text-white mb-4">Orders by Month</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesData}>
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
              <Bar dataKey="orders" fill="#22d3ee" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}`,
                  action: "create"
                },
                {
                  path: "src/App.tsx",
                  content: `import { Dashboard } from './pages/Dashboard';

function App() {
  return <Dashboard />;
}

export default App;`,
                  action: "modify"
                }
              ]
            })
          }]
        },
        // Example 7: Animated Component with framer-motion
        {
          role: "user",
          parts: [{ text: "Create an animated card list with add/remove" }]
        },
        {
          role: "model",
          parts: [{
            text: JSON.stringify({
              thought: "## 1. COMPONENTS\n- AnimatedCardList with motion\n\n## 2. STATE\n- cards: Card[] array\n- nextId: number for unique keys\n\n## 3. FUNCTIONS\n- addCard, removeCard\n\n## 4. STYLING\n- Staggered animations, exit animations, glassmorphic cards\n\n## 5. FILE PLAN\n- CREATE src/components/AnimatedCardList.tsx\n- MODIFY src/App.tsx",
              message: "Created animated card list with staggered enter/exit animations",
              files: [
                {
                  path: "src/components/AnimatedCardList.tsx",
                  content: `import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';

interface Card {
  id: number;
  title: string;
}

export function AnimatedCardList() {
  const [cards, setCards] = useState<Card[]>([
    { id: 1, title: 'First Card' },
    { id: 2, title: 'Second Card' },
  ]);
  const [nextId, setNextId] = useState<number>(3);

  const addCard = () => {
    setCards([...cards, { id: nextId, title: \`Card \${nextId}\` }]);
    setNextId(nextId + 1);
  };

  const removeCard = (id: number) => {
    setCards(cards.filter(c => c.id !== id));
  };

  return (
    <div className="space-y-4">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={addCard}
        className="px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl flex items-center gap-2 shadow-lg"
      >
        <Plus className="w-5 h-5" />
        Add Card
      </motion.button>
      
      <AnimatePresence mode="popLayout">
        {cards.map((card, index) => (
          <motion.div
            key={card.id}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: -100, scale: 0.95 }}
            transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/10 flex justify-between items-center"
          >
            <span className="text-white font-medium">{card.title}</span>
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => removeCard(card.id)} 
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </motion.div>
        ))}
      </AnimatePresence>
      
      {cards.length === 0 && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-slate-400 text-center py-8"
        >
          No cards yet. Add one!
        </motion.p>
      )}
    </div>
  );
}`,
                  action: "create"
                },
                {
                  path: "src/App.tsx",
                  content: `import { AnimatedCardList } from './components/AnimatedCardList';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-white mb-6">Animated Cards</h1>
        <AnimatedCardList />
      </div>
    </div>
  );
}

export default App;`,
                  action: "modify"
                }
              ]
            })
          }]
        },
        // Example 8: Error Handling with Retry Logic
        {
          role: "user",
          parts: [{ text: "Create a weather app that fetches from an API with error handling" }]
        },
        {
          role: "model",
          parts: [{
            text: JSON.stringify({
              thought: "## 1. COMPONENTS\n- WeatherApp with fetch logic and error handling\n\n## 2. STATE\n- weather: WeatherData | null\n- loading: boolean\n- error: string | null\n- retryCount: number\n\n## 3. FUNCTIONS\n- fetchWeather with try-catch\n- handleRetry\n\n## 4. STYLING\n- Weather card with icons, error state, loading spinner\n\n## 5. FILE PLAN\n- CREATE src/components/WeatherApp.tsx\n- MODIFY src/App.tsx",
              message: "Created WeatherApp with comprehensive error handling and retry logic",
              files: [
                {
                  path: "src/components/WeatherApp.tsx",
                  content: `import { useState, useEffect } from 'react';
import { Cloud, AlertCircle, RefreshCw, MapPin } from 'lucide-react';

interface WeatherData {
  temperature: number;
  condition: string;
  location: string;
  humidity: number;
}

export function WeatherApp() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState<number>(0);

  const fetchWeather = async () => {
    setLoading(true);
    setError(null);

    try {
      // Using Open-Meteo API (no key required)
      const response = await fetch(
        'https://api.open-meteo.com/v1/forecast?latitude=40.7128&longitude=-74.0060&current=temperature_2m,relative_humidity_2m'
      );

      if (!response.ok) {
        throw new Error(\`HTTP error! status: \${response.status}\`);
      }

      const data = await response.json();

      setWeather({
        temperature: Math.round(data.current.temperature_2m),
        condition: 'Partly Cloudy',
        location: 'New York, NY',
        humidity: data.current.relative_humidity_2m,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch weather data';
      setError(errorMessage);
      console.error('Weather fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchWeather();
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/10 flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-300">Loading weather data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-red-500/20">
        <div className="flex items-start gap-4 mb-6">
          <AlertCircle className="w-8 h-8 text-red-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Unable to Load Weather</h3>
            <p className="text-red-300 text-sm mb-1">{error}</p>
            {retryCount > 0 && (
              <p className="text-slate-400 text-xs">Retry attempt: {retryCount}</p>
            )}
          </div>
        </div>
        <button
          onClick={handleRetry}
          className="w-full px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-5 h-5" />
          Try Again
        </button>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/10">
        <p className="text-slate-300 text-center">No weather data available</p>
      </div>
    );
  }

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/10">
      <div className="flex items-center gap-3 mb-6">
        <MapPin className="w-6 h-6 text-violet-400" />
        <h2 className="text-2xl font-bold text-white">{weather.location}</h2>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-6xl font-bold text-white mb-2">{weather.temperature}°C</div>
          <p className="text-slate-300 text-lg">{weather.condition}</p>
        </div>
        <Cloud className="w-24 h-24 text-violet-400" />
      </div>

      <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/10">
        <div className="bg-white/5 rounded-xl p-4">
          <p className="text-slate-400 text-sm mb-1">Humidity</p>
          <p className="text-white text-2xl font-semibold">{weather.humidity}%</p>
        </div>
        <div className="bg-white/5 rounded-xl p-4">
          <p className="text-slate-400 text-sm mb-1">Last Updated</p>
          <p className="text-white text-sm">Just now</p>
        </div>
      </div>

      <button
        onClick={fetchWeather}
        className="w-full mt-6 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition-colors flex items-center justify-center gap-2"
        aria-label="Refresh weather data"
      >
        <RefreshCw className="w-4 h-4" />
        Refresh
      </button>
    </div>
  );
}`,
                  action: "create"
                },
                {
                  path: "src/App.tsx",
                  content: `import { WeatherApp } from './components/WeatherApp';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <WeatherApp />
      </div>
    </div>
  );
}

export default App;`,
                  action: "modify"
                }
              ]
            })
          }]
        },
        // Example 9: Zustand Global State Management
        {
          role: "user",
          parts: [{ text: "Create a todo app with global state using zustand" }]
        },
        {
          role: "model",
          parts: [{
            text: JSON.stringify({
              thought: "## 1. COMPONENTS\n- TodoList component\n- TodoItem component\n- AddTodoForm component\n\n## 2. STATE (Zustand)\n- todos: Todo[] in store\n- addTodo, toggleTodo, deleteTodo actions\n\n## 3. FUNCTIONS\n- Store actions for state mutations\n- Form submission handler\n\n## 4. STYLING\n- Card layout, checkboxes, delete buttons\n\n## 5. FILE PLAN\n- CREATE src/stores/useTodoStore.ts\n- CREATE src/components/TodoList.tsx\n- CREATE src/components/TodoItem.tsx\n- CREATE src/components/AddTodoForm.tsx\n- MODIFY src/App.tsx",
              message: "Created todo app with Zustand for global state management",
              files: [
                {
                  path: "src/stores/useTodoStore.ts",
                  content: `import { create } from 'zustand';

export interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
}

interface TodoStore {
  todos: Todo[];
  addTodo: (text: string) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  clearCompleted: () => void;
}

export const useTodoStore = create<TodoStore>((set) => ({
  todos: [],

  addTodo: (text: string) => set((state) => ({
    todos: [
      ...state.todos,
      {
        id: crypto.randomUUID(),
        text,
        completed: false,
        createdAt: Date.now(),
      },
    ],
  })),

  toggleTodo: (id: string) => set((state) => ({
    todos: state.todos.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ),
  })),

  deleteTodo: (id: string) => set((state) => ({
    todos: state.todos.filter((todo) => todo.id !== id),
  })),

  clearCompleted: () => set((state) => ({
    todos: state.todos.filter((todo) => !todo.completed),
  })),
}));`,
                  action: "create"
                },
                {
                  path: "src/components/TodoItem.tsx",
                  content: `import { Trash2 } from 'lucide-react';
import { Todo } from '../stores/useTodoStore';

interface TodoItemProps {
  todo: Todo;
  onToggle: () => void;
  onDelete: () => void;
}

export function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/10 flex items-center gap-4 group hover:bg-white/10 transition-colors">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={onToggle}
        className="w-5 h-5 rounded border-2 border-violet-500 bg-transparent checked:bg-violet-500 cursor-pointer"
        aria-label={\`Mark "\${todo.text}" as \${todo.completed ? 'incomplete' : 'complete'}\`}
      />
      <span className={\`flex-1 text-white \${todo.completed ? 'line-through text-slate-500' : ''}\`}>
        {todo.text}
      </span>
      <button
        onClick={onDelete}
        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
        aria-label={\`Delete "\${todo.text}"\`}
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}`,
                  action: "create"
                },
                {
                  path: "src/components/AddTodoForm.tsx",
                  content: `import { useState } from 'react';
import { Plus } from 'lucide-react';

interface AddTodoFormProps {
  onAdd: (text: string) => void;
}

export function AddTodoForm({ onAdd }: AddTodoFormProps) {
  const [text, setText] = useState<string>('');

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (text.trim()) {
      onAdd(text.trim());
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a new todo..."
        className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
        aria-label="New todo text"
      />
      <button
        type="submit"
        disabled={!text.trim()}
        className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-all shadow-lg flex items-center gap-2"
        aria-label="Add todo"
      >
        <Plus className="w-5 h-5" />
        Add
      </button>
    </form>
  );
}`,
                  action: "create"
                },
                {
                  path: "src/components/TodoList.tsx",
                  content: `import { useTodoStore } from '../stores/useTodoStore';
import { TodoItem } from './TodoItem';
import { AddTodoForm } from './AddTodoForm';
import { CheckCircle2 } from 'lucide-react';

export function TodoList() {
  const { todos, addTodo, toggleTodo, deleteTodo, clearCompleted } = useTodoStore();

  const completedCount = todos.filter(t => t.completed).length;
  const activeCount = todos.length - completedCount;

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/10 w-full max-w-2xl">
      <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
        <CheckCircle2 className="w-8 h-8 text-violet-400" />
        My Todos
      </h1>

      <AddTodoForm onAdd={addTodo} />

      {todos.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-400">No todos yet. Add one to get started!</p>
        </div>
      ) : (
        <>
          <div className="space-y-2 mt-6" role="list">
            {todos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onToggle={() => toggleTodo(todo.id)}
                onDelete={() => deleteTodo(todo.id)}
              />
            ))}
          </div>

          <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/10">
            <div className="text-slate-400 text-sm">
              {activeCount} active · {completedCount} completed
            </div>
            {completedCount > 0 && (
              <button
                onClick={clearCompleted}
                className="text-sm text-slate-400 hover:text-red-400 transition-colors"
              >
                Clear completed
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}`,
                  action: "create"
                },
                {
                  path: "src/App.tsx",
                  content: `import { TodoList } from './components/TodoList';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <TodoList />
    </div>
  );
}

export default App;`,
                  action: "modify"
                }
              ]
            })
          }]
        }
      ];

      messages = [
        ...fewShotExamples,
        ...conversationHistory,
        {
          role: "user",
          parts: [{ text: contextMessage }],
        },
      ];
      systemInstruction = { parts: [{ text: multiFileSystemPrompt }] };
    } else {
      // Legacy single-file HTML generation
      const conversationHistory =
        history?.map((msg: { role: string; content: string }) => ({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        })) || [];

      messages = [
        ...conversationHistory,
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ];
      systemInstruction = { parts: [{ text: legacySystemPrompt }] };
    }

    console.log("Calling Gemini API with model:", model);

    // Define schema for multi-file generation - Gemini uses uppercase TYPE values
    const multiFileSchema = {
      type: "OBJECT",
      properties: {
        thought: { type: "STRING", description: "Brief analysis of requirements" },
        message: { type: "STRING", description: "Description of what was created" },
        files: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              path: { type: "STRING", description: "File path like src/App.tsx" },
              content: { type: "STRING", description: "Complete file content" },
              action: { type: "STRING", enum: ["create", "modify", "delete"] }
            },
            required: ["path", "content", "action"]
          }
        }
      },
      required: ["thought", "message", "files"]
    };

    const generationConfig = type === "random"
      ? { temperature: 1.2, maxOutputTokens: 100, responseMimeType: "text/plain" }
      : type === "generate-multifile"
        ? { temperature: 0.7, maxOutputTokens: 32768, responseMimeType: "application/json", responseSchema: multiFileSchema }
        : { temperature: 0.7, maxOutputTokens: 32768, responseMimeType: "application/json" };

    console.log("Generation config:", JSON.stringify({ type, hasSchema: !!generationConfig.responseSchema }));

    const response = await callGeminiWithFallback(
      `https://generativelanguage.googleapis.com/v1beta/models/\${model}:generateContent?key=${GEMINI_API_KEY}`,
      {
        contents: messages,
        systemInstruction,
        generationConfig,
      },
      GEMINI_API_KEY,
      model,
      FALLBACK_MODELS
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error after all fallbacks:", response.status, errorText);
      throw new Error(`AI model unavailable (tried ${[model, ...FALLBACK_MODELS].join(', ')}): ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Gemini API response received");

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      console.error("No content in Gemini response:", JSON.stringify(data));
      throw new Error("No content in Gemini response");
    }

    if (type === "random") {
      return new Response(JSON.stringify({ idea: content.trim() }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse the JSON response
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      console.error("Failed to parse Gemini response as JSON:", content);
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch (innerE) {
          console.error("Failed to parse extracted JSON:", innerE);
          // Return graceful error response for safety filter triggers
          return new Response(JSON.stringify({
            thought: "The AI couldn't process this request",
            message: "I can't help with that request. Please try rephrasing or ask for something different.",
            files: []
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } else {
        console.error("No JSON found in AI response, returning graceful error");
        // Return graceful error response instead of throwing
        return new Response(JSON.stringify({
          thought: "The AI response was not in the expected format",
          message: "I couldn't generate code for that request. Please try again with a different prompt.",
          files: []
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // If the AI returned legacy HTML format, convert it to files array
    if (parsed.html && !parsed.files) {
      console.log("Converting legacy HTML to React files format");

      const html = parsed.html as string;

      // Extract style content
      const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
      const cssContent = styleMatch ? styleMatch[1] : '';

      // Extract body content
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      let bodyContent = bodyMatch ? bodyMatch[1] : '';

      // Extract JavaScript logic
      const scriptMatches = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];
      let jsLogic = '';
      scriptMatches.forEach((script: string) => {
        jsLogic += script.replace(/<script[^>]*>/, '').replace(/<\/script>/, '') + '\n';
      });

      // Remove script tags from body
      bodyContent = bodyContent.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

      // Convert HTML attributes to JSX
      bodyContent = bodyContent
        .replace(/class=/g, 'className=')
        .replace(/for=/g, 'htmlFor=')
        .replace(/onclick=/gi, 'onClick=')
        .replace(/onchange=/gi, 'onChange=')
        .replace(/tabindex=/gi, 'tabIndex=')
        .replace(/colspan=/gi, 'colSpan=')
        .replace(/rowspan=/gi, 'rowSpan=');

      // Clean up body content - remove extra whitespace but preserve structure
      bodyContent = bodyContent.trim();

      // Generate a React component that renders the HTML content
      const appTitle = parsed.title || 'Generated App';
      const reactCode = `import { useState, useEffect } from 'react';

function App() {
  // State for dynamic functionality
  const [data, setData] = useState<any>({});
  
  useEffect(() => {
    // Initialize any dynamic functionality here
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: \`${cssContent.replace(/`/g, '\\`').replace(/\${/g, '\\${')}\` }} />
      ${bodyContent}
    </>
  );
}

export default App;
`;

      parsed = {
        thought: parsed.thought || "Converted HTML to React component",
        message: "Created " + appTitle + " - converted from HTML to React",
        files: [
          {
            path: "src/App.tsx",
            content: reactCode,
            action: "modify"
          }
        ]
      };
    }

    // SELF-FIXING: Fix common JSX syntax errors in generated files
    // Create debug log
    const debugLog: string[] = [];
    debugLog.push(`[DEBUG] Type: ${type}`);
    debugLog.push(`[DEBUG] Has files: ${!!(parsed.files && Array.isArray(parsed.files))}`);
    debugLog.push(`[DEBUG] Has html: ${!!parsed.html}`);

    if (parsed.files && Array.isArray(parsed.files)) {
      debugLog.push(`[DEBUG] Processing ${parsed.files.length} files`);

      // Log code changes with diffs AND validate for dangerous content shrinkage
      for (const file of parsed.files) {
        const existingFile = projectFiles?.find((f: any) => f.path === file.path);
        const operation = file.action === 'delete' ? 'delete' :
                         existingFile ? 'modify' : 'create';

        logger.logCodeChange(
          operation,
          file.path,
          existingFile?.content,
          file.content
        );

        // CRITICAL VALIDATION: Prevent AI from accidentally deleting code
        if (existingFile && file.action !== 'delete' && file.content.length < existingFile.content.length * 0.4) {
          const reductionPercent = Math.round((1 - file.content.length / existingFile.content.length) * 100);

          logger.error('validation', `CRITICAL: ${file.path} shrunk by ${reductionPercent}%`, {
            oldSize: existingFile.content.length,
            newSize: file.content.length,
            reduction: `${reductionPercent}%`,
            suspectedIssue: 'AI may have replaced working code with placeholder'
          });

          // Check if new content is just a placeholder
          const isPlaceholder =
            file.content.includes('TODO') ||
            file.content.includes('// Implement') ||
            file.content.length < 500;

          if (isPlaceholder) {
            logger.error('validation', `REJECTED: ${file.path} appears to be a placeholder replacing real code`);

            return new Response(JSON.stringify({
              error: `I apologize, but I cannot apply these changes. I attempted to replace "${file.path}" (${existingFile.content.length} chars) with much smaller content (${file.content.length} chars, ${reductionPercent}% reduction) that appears to be a placeholder.

This would delete important working code.

**What went wrong:**
Your prompt may have been too vague for me to understand what to preserve.

**How to fix this:**
Please be more specific about what you want to change. For example:
- Instead of "it's gone" → "The chess board disappeared, please restore it"
- Instead of "not working" → "The piece movement validation is broken, fix the isValidMove function"
- Instead of "wrong" → "Pawns are moving backwards, they should only move forward"

The more specific you are, the better I can help without accidentally removing working features.`,
              _logs: {
                entries: logger.getAllLogs(),
                summary: logger.getSummary()
              }
            }), {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
          }
        }

        // Warn about suspiciously small new files
        if (operation === 'create' && file.content.length < 200 && !file.path.endsWith('.css')) {
          logger.warn('validation', `New file ${file.path} is very small (${file.content.length} chars) - might be incomplete`);
        }
      }

      parsed.files = parsed.files.map((file: { path: string; content: string; action: string }) => {
        if (file.path.endsWith('.tsx') || file.path.endsWith('.jsx')) {
          let fixedContent = file.content;
          const originalLength = fixedContent.length;

          // MARKDOWN CLEANUP: Strip ```tsx, ```typescript, etc code block markers
          fixedContent = fixedContent
            .replace(/^```(?:tsx|typescript|jsx|ts|js|javascript)?\n?/gm, '')
            .replace(/\n?```$/gm, '')
            .trim();

          // Fix HTML comments to JSX comments
          fixedContent = fixedContent.replace(/<!--\s*([\s\S]*?)\s*-->/g, '{/* $1 */}');

          // Fix self-closing tags - more robust regex without lookbehind
          // First, fix already-broken ones like <input > or <input attr>
          fixedContent = fixedContent.replace(/<(img|br|input|hr|meta|link|area|base|col|embed|keygen|param|source|track|wbr)(\s+[^>]*)?>/gi, (match, tag, attrs) => {
            // If it already ends with />, leave it
            if (match.endsWith('/>')) return match;
            // Otherwise add />
            return `<${tag}${attrs || ''} />`;
          });

          // Fix class= to className=
          fixedContent = fixedContent.replace(/\bclass=/g, 'className=');

          // Fix for= to htmlFor=
          fixedContent = fixedContent.replace(/\bfor=/g, 'htmlFor=');

          // Fix event handlers
          fixedContent = fixedContent.replace(/\bonclick=/gi, 'onClick=');
          fixedContent = fixedContent.replace(/\bonchange=/gi, 'onChange=');
          fixedContent = fixedContent.replace(/\bonsubmit=/gi, 'onSubmit=');
          fixedContent = fixedContent.replace(/\bonkeydown=/gi, 'onKeyDown=');
          fixedContent = fixedContent.replace(/\bonkeyup=/gi, 'onKeyUp=');
          fixedContent = fixedContent.replace(/\bonfocus=/gi, 'onFocus=');
          fixedContent = fixedContent.replace(/\bonblur=/gi, 'onBlur=');

          // Fix other attributes
          fixedContent = fixedContent.replace(/\btabindex=/gi, 'tabIndex=');
          fixedContent = fixedContent.replace(/\bcolspan=/gi, 'colSpan=');
          fixedContent = fixedContent.replace(/\browspan=/gi, 'rowSpan=');
          fixedContent = fixedContent.replace(/\bcellpadding=/gi, 'cellPadding=');
          fixedContent = fixedContent.replace(/\bcellspacing=/gi, 'cellSpacing=');
          fixedContent = fixedContent.replace(/\breadonly\b/gi, 'readOnly');
          fixedContent = fixedContent.replace(/\bmaxlength=/gi, 'maxLength=');
          fixedContent = fixedContent.replace(/\bminlength=/gi, 'minLength=');
          fixedContent = fixedContent.replace(/\bautocomplete=/gi, 'autoComplete=');
          fixedContent = fixedContent.replace(/\bautofocus\b/gi, 'autoFocus');

          // Ensure file exports default - but detect the correct component name
          if (!fixedContent.includes('export default')) {
            // Try to extract the component name from the file
            const functionMatch = fixedContent.match(/(?:export\s+)?function\s+([A-Z][a-zA-Z0-9]*)\s*\(/);
            const constMatch = fixedContent.match(/(?:export\s+)?const\s+([A-Z][a-zA-Z0-9]*)\s*[=:]/);

            // Get component name from file path as fallback
            const pathParts = file.path.split('/');
            const fileName = pathParts[pathParts.length - 1];
            const fileBaseName = fileName.replace(/\.(tsx|jsx|ts|js)$/, '');

            // Priority: function name > const name > file name > 'App' only for App.tsx
            let componentName: string | null = functionMatch?.[1] || constMatch?.[1] || fileBaseName;

            // Only use 'App' as fallback if this is actually App.tsx
            if (!componentName || componentName.toLowerCase() === 'index') {
              if (file.path.includes('App.tsx') || file.path.includes('App.jsx')) {
                componentName = 'App';
              } else {
                // Skip adding export if we can't determine the name and it's not App.tsx
                componentName = null;
              }
            }

            if (componentName) {
              fixedContent += `\n\nexport default ${componentName};\n`;
            }
          }

          debugLog.push(`[DEBUG] Fixed ${file.path}: ${originalLength} -> ${fixedContent.length} chars`);

          return { ...file, content: fixedContent };
        }
        return file;
      });

      console.log("Self-fixing applied:", debugLog.join('\n'));
    }

    // =====================
    // SELF-CORRECTION: Validate and fix issues
    // =====================
    if (parsed.files && Array.isArray(parsed.files) && type === 'generate-multifile') {
      const issues = validateGeneratedCode(parsed.files);

      // Log validation results
      logger.logValidation(parsed.files.length, issues, false);

      if (issues.length > 0) {
        const errorIssues = issues.filter(i => i.type === 'error');
        console.log(`Validation found ${issues.length} issues (${errorIssues.length} errors)`);

        // Log all issues
        issues.forEach(issue => {
          console.log(`[${issue.type.toUpperCase()}] ${issue.file}: ${issue.issue}`);
        });

        // Only attempt correction for errors (not warnings)
        if (errorIssues.length > 0 && errorIssues.length <= 10) {
          console.log("Attempting self-correction...");
          try {
            const correctedFiles = await attemptSelfCorrection(
              prompt,
              parsed.files,
              errorIssues,
              model,
              multiFileSystemPrompt,
              GEMINI_API_KEY as string
            );

            // Validate corrected files
            const remainingIssues = validateGeneratedCode(correctedFiles);
            const remainingErrors = remainingIssues.filter(i => i.type === 'error');

            if (remainingErrors.length < errorIssues.length) {
              console.log(`Self-correction improved code: ${errorIssues.length} -> ${remainingErrors.length} errors`);
              logger.logValidation(correctedFiles.length, remainingIssues, true);
              logger.info('validation', `Self-correction success: ${errorIssues.length} -> ${remainingErrors.length} errors`);
              parsed.files = correctedFiles;
              parsed.message = `${parsed.message} (Auto-corrected ${errorIssues.length - remainingErrors.length} issues)`;
            } else {
              console.log("Self-correction did not improve code, keeping original");
              logger.warn('validation', 'Self-correction did not improve code');
            }
          } catch (correctionError) {
            console.error("Self-correction failed:", correctionError);
            logger.error('validation', 'Self-correction failed', correctionError);
            // Continue with original files
          }
        } else if (errorIssues.length > 10) {
          console.log("Too many errors for self-correction, returning original");
          logger.warn('validation', `Too many errors (${errorIssues.length}) for self-correction`);
        }
      } else {
        console.log("Validation passed: No issues found ✓");
        logger.info('validation', 'Validation passed: No issues found');
      }
    }

    // Add debug info to response
    if (type === 'generate-multifile') {
      parsed._debug = debugLog;
      // Add system prompt and context for debug panel
      parsed._systemPrompt = multiFileSystemPrompt;
      parsed._contextSent = "Check Supabase function logs for full context";
    }

    // Add enhanced logs to ALL responses
    parsed._logs = {
      entries: logger.getAllLogs(),
      summary: logger.getSummary(),
      version: PROMPT_VERSION
    };

    logger.info('api', 'Request completed successfully', {
      elapsedTime: logger.getElapsedTime(),
      filesGenerated: parsed.files?.length || 0
    });

    // CRITICAL DEBUG: Log final response before sending
    console.log("FINAL RESPONSE KEYS:", Object.keys(parsed));
    console.log("Has files:", !!parsed.files);
    console.log("Has html:", !!parsed.html);
    console.log("Enhanced logs included:", !!parsed._logs);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-vibe function:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
