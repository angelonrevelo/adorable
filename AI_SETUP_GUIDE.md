# 🤖 AI Setup Guide for Adorable IDE

This guide provides all the context an AI assistant needs to work on this project effectively. Read this document first to understand the project structure, credentials, deployment processes, and development workflows.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Environment Setup](#environment-setup)
5. [Supabase Configuration](#supabase-configuration)
6. [GitHub Configuration](#github-configuration)
7. [Development Workflow](#development-workflow)
8. [Deployment Process](#deployment-process)
9. [Key Files Reference](#key-files-reference)
10. [Common Tasks](#common-tasks)
11. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

**Adorable IDE** is an open-source clone of Lovable.dev (formerly GPT Engineer), built with React + TypeScript + Gemini AI.

**Purpose**: Allow users to build React applications through natural language conversations with AI.

**Key Features**:
- 🧠 Two AI modes: Instant Mode (fast) and Plan Mode (multi-phase execution)
- 📁 Multi-file project management
- 🔄 Real-time code preview with Sandpack
- 🎨 Tailwind CSS + shadcn/ui components
- 🤖 Self-correcting AI with context awareness
- 📊 Advanced console logging system
- 🔍 Smart file selection to optimize token usage

**Architecture**:
- **Frontend**: React + TypeScript + Vite + TanStack Query
- **Backend**: Supabase Edge Functions (Deno runtime)
- **AI**: Google Gemini 2.0 Flash + Thinking models
- **Preview**: Sandpack (in-browser code execution)

---

## 🛠️ Tech Stack

### Frontend
- **React 18.3** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TanStack Query v5** - Server state management
- **Zustand** - Client state management (console store)
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI component library
- **Sandpack** - In-browser code preview
- **React Router** - Navigation
- **Lucide React** - Icons

### Backend
- **Supabase Edge Functions** - Serverless functions (Deno runtime)
- **Google Gemini API** - AI code generation
  - `gemini-2.0-flash-exp` - Fast model (primary)
  - `gemini-1.5-flash` - Stable fallback
  - `gemini-1.5-pro` - High-quality fallback

### Development
- **pnpm** - Package manager
- **ESLint** - Linting
- **Prettier** - Code formatting
- **Git** - Version control

---

## 📁 Project Structure

```
adorable-1/
├── src/
│   ├── components/
│   │   ├── IDEChatPanel.tsx          # Main chat interface (Instant + Plan modes)
│   │   ├── IDEFileTree.tsx           # File explorer sidebar
│   │   ├── IDEPreview.tsx            # Sandpack code preview
│   │   ├── PlanModeVisualizer.tsx    # Plan mode UI
│   │   └── ui/                       # shadcn/ui components
│   ├── services/
│   │   ├── geminiService.ts          # Frontend API client (streaming + non-streaming)
│   │   ├── fileSelectionService.ts   # Smart file selection algorithm
│   │   └── fileStorage.ts            # IndexedDB persistence
│   ├── stores/
│   │   └── useConsoleStore.ts        # Zustand store for advanced logging
│   ├── utils/
│   │   ├── tokenCounter.ts           # Token estimation and budget tracking
│   │   ├── promptValidation.ts       # Prompt validation and sanitization
│   │   └── jsxFixer.ts               # HTML → JSX conversion
│   ├── types/
│   │   ├── index.ts                  # Core types (FileOperation, GenerateVibeResponse)
│   │   ├── projectTypes.ts           # ProjectFile, ConversationMessage
│   │   └── agentTypes.ts             # Plan mode types (AgentPlan, AgentPhase)
│   └── integrations/
│       └── supabase/
│           └── client.ts             # Supabase client initialization
├── supabase/
│   └── functions/
│       └── generate-vibe/
│           └── index.ts              # Main AI generation function (2700+ lines)
│                                     # - Extended thinking prompts (7 phases)
│                                     # - Self-correction loop
│                                     # - Smart model selection
│                                     # - Streaming SSE support
├── .env.local                        # Local environment variables (NEVER commit)
├── package.json                      # Dependencies and scripts
├── tsconfig.json                     # TypeScript configuration
├── vite.config.ts                    # Vite configuration
├── DEPLOYMENT.md                     # Deployment guide
└── AI_SETUP_GUIDE.md                # This file
```

---

## 🔧 Environment Setup

### Prerequisites
- **Node.js**: v18+ (check with `node --version`)
- **pnpm**: v8+ (install with `npm install -g pnpm`)
- **Supabase CLI**: Use `npx supabase` (no global install needed)
- **Git**: Latest version

### Local Development Setup

1. **Clone repository**:
```bash
git clone https://github.com/CelestialBrain/adorable-1.git
cd adorable-1
```

2. **Install dependencies**:
```bash
pnpm install
```

3. **Environment variables** (already configured in `.env.local`):
```bash
# .env.local (DO NOT COMMIT THIS FILE)
VITE_SUPABASE_URL="https://vwwczyicvfmctttjgqry.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="eyJhbGc..."
VITE_SUPABASE_PROJECT_ID="vwwczyicvfmctttjgqry"
```

4. **Start development server**:
```bash
pnpm dev
# Runs on http://localhost:5173
```

5. **Build for production**:
```bash
pnpm build
pnpm preview  # Preview production build
```

---

## ☁️ Supabase Configuration

### Project Details
- **Project Name**: killable
- **Project ID**: `vwwczyicvfmctttjgqry`
- **Region**: South Asia (Mumbai)
- **URL**: `https://vwwczyicvfmctttjgqry.supabase.co`
- **Dashboard**: https://supabase.com/dashboard/project/vwwczyicvfmctttjgqry

### Edge Functions

**Current Functions**:
- `generate-vibe` - Main AI generation endpoint
  - Handles streaming (SSE) and non-streaming requests
  - Types: `generate-stream`, `generate-multifile`, `generate-plan`, `random`
  - Current version: 56 (as of 2025-12-16)

**Function Secrets** (set in Supabase Dashboard):
```bash
GEMINI_API_KEY="AIza..."  # Google Gemini API key
```

### CLI Commands

**Check login status**:
```bash
npx supabase projects list
```

**Link project** (already linked):
```bash
npx supabase link --project-ref vwwczyicvfmctttjgqry
```

**Deploy function**:
```bash
npx supabase functions deploy generate-vibe --project-ref vwwczyicvfmctttjgqry
```

**View logs**:
```bash
npx supabase functions logs generate-vibe --project-ref vwwczyicvfmctttjgqry
```

**Test function locally**:
```bash
npx supabase functions serve generate-vibe
```

### Important Notes
- ⚠️ **GEMINI_API_KEY must be set** in Supabase Edge Function secrets (Dashboard → Edge Functions → Secrets)
- ⚠️ **Do NOT commit** `.env.local` to Git (already in `.gitignore`)
- ⚠️ Supabase CLI is **already logged in** on this machine
- ⚠️ Project is **already linked** - no need to re-link

---

## 🐙 GitHub Configuration

### Repository Details
- **Owner**: CelestialBrain
- **Repo**: adorable-1
- **URL**: https://github.com/CelestialBrain/adorable-1
- **Branch**: `main`
- **Main branch for PRs**: `main`

### Git Status (as of last session)
- **Current branch**: `main`
- **Status**: Clean (no uncommitted changes)
- **Remote**: Connected to GitHub

### Recent Commits
```
eb9a6cf - feat: enhanced logging, error handling, and UI improvements
93581e8 - chore: remove embedded paddleme repo (separate project)
522d364 - feat: add agent mode with plan execution capabilities
53b24ce - Enhance plan mode and context
e62cc89 - Changes
```

### Key Commits Related to AI Improvements
- **b12f56d**: AI quality improvements (self-correction, console awareness, smart models)
- **978dc2a**: Context awareness across phases
- **79a792c**: Extended thinking mode (v3.0.0)

### Commit Guidelines

**Format**:
```
<type>: <description>

<optional body>

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

**Types**: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`

**Example**:
```bash
git add .
git commit -m "feat: add console output awareness to AI

- Capture console.log/error/warn in IDEChatPanel
- Inject last 20 console messages into AI context
- AI can now debug based on runtime output

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
git push origin main
```

---

## 🔄 Development Workflow

### 1. Making Code Changes

**For Frontend Changes** (React components, services):
```bash
# 1. Make changes in src/
# 2. Test locally with hot reload
pnpm dev

# 3. Check for TypeScript errors
pnpm type-check  # or npx tsc --noEmit

# 4. Commit and push
git add .
git commit -m "feat: your changes"
git push origin main
```

**For Backend Changes** (Supabase Edge Functions):
```bash
# 1. Make changes in supabase/functions/generate-vibe/index.ts
# 2. Test locally (optional)
npx supabase functions serve generate-vibe

# 3. Deploy to Supabase
npx supabase functions deploy generate-vibe --project-ref vwwczyicvfmctttjgqry

# 4. Verify deployment
npx supabase functions list --project-ref vwwczyicvfmctttjgqry

# 5. Commit and push
git add .
git commit -m "feat: backend changes"
git push origin main
```

### 2. Testing Changes

**Frontend Testing**:
- Run `pnpm dev` and test in browser
- Check browser DevTools console for errors
- Test both Instant Mode and Plan Mode

**Backend Testing**:
- Check Supabase function logs: https://supabase.com/dashboard/project/vwwczyicvfmctttjgqry/functions
- Look for validation logs: `[STREAM] Validation found X issues`
- Test with complex prompts like "build a chess game"

**Integration Testing**:
- Test self-correction: Check logs for "Self-correction: X -> 0 errors"
- Test console awareness: Generate code that logs to console, then ask AI to debug
- Test smart model selection: Check logs for "Selected model: gemini-2.0-flash-thinking-exp"

### 3. Key Files to Understand

**Core AI Logic**:
- [supabase/functions/generate-vibe/index.ts](supabase/functions/generate-vibe/index.ts) - Main AI generation (2700+ lines)
  - Lines 39-188: Extended thinking prompts (7 phases)
  - Lines 190-284: Validation function
  - Lines 286-384: Self-correction function
  - Lines 402-418: Smart model selection
  - Lines 585-614: Streaming validation integration
  - Lines 2563-2612: Non-streaming validation integration

**Frontend AI Interface**:
- [src/components/IDEChatPanel.tsx](src/components/IDEChatPanel.tsx) - Main chat UI
  - Lines 92-140: Console output capture
  - Lines 261-264: Console context injection (Instant Mode)
  - Lines 354-448: Persistent phase context (Plan Mode)
  - Lines 443-448: Console context injection (Plan Mode)

**AI Services**:
- [src/services/geminiService.ts](src/services/geminiService.ts) - API client
  - `generateVibeStream()` - Streaming SSE generator
  - `generateVibe()` - Non-streaming API
  - `generatePlan()` - Plan mode generation

---

## 🚀 Deployment Process

### Quick Deploy (Recommended)

**Backend** (Supabase Edge Function):
```bash
npx supabase functions deploy generate-vibe --project-ref vwwczyicvfmctttjgqry
```

**Frontend** (depends on hosting):
```bash
pnpm build
# Then deploy dist/ folder to your hosting provider
```

### Manual Deploy via Dashboard

1. Go to https://supabase.com/dashboard/project/vwwczyicvfmctttjgqry/functions
2. Click `generate-vibe` function
3. Click "Edit Function"
4. Copy contents of `supabase/functions/generate-vibe/index.ts`
5. Paste into editor
6. Click "Deploy"

### Automated Deploy (Future)

See [DEPLOYMENT.md](DEPLOYMENT.md) for GitHub Actions setup.

---

## 📚 Key Files Reference

### Critical Files (DO NOT DELETE)

1. **supabase/functions/generate-vibe/index.ts** (2700+ lines)
   - Main AI generation logic
   - Extended thinking prompts
   - Self-correction loop
   - Validation system
   - Model selection
   - SSE streaming

2. **src/components/IDEChatPanel.tsx** (700+ lines)
   - Main chat interface
   - Instant Mode and Plan Mode UI
   - Console capture
   - Phase context persistence
   - File operations

3. **src/services/geminiService.ts** (460+ lines)
   - API client for Supabase functions
   - Streaming generator
   - Token counting
   - Prompt validation

4. **src/stores/useConsoleStore.ts**
   - Advanced logging system
   - Token tracking
   - Performance metrics
   - AI thought logging

5. **.env.local** (NEVER COMMIT)
   - Supabase credentials
   - API keys

### Configuration Files

- **package.json** - Dependencies and scripts
- **tsconfig.json** - TypeScript config
- **vite.config.ts** - Vite build config
- **tailwind.config.ts** - Tailwind CSS config
- **.gitignore** - Files to exclude from Git

### Documentation Files

- **DEPLOYMENT.md** - Deployment guide (3 methods)
- **AI_SETUP_GUIDE.md** - This file
- **README.md** - Project overview

---

## 🔧 Common Tasks

### Add a New Feature to AI System Prompt

**File**: `supabase/functions/generate-vibe/index.ts`

**Location**: Lines 39-188 (Extended thinking prompts)

**Example**:
```typescript
// Add to multiFileSystemPrompt
const multiFileSystemPrompt = `
...existing prompt...

### PHASE 8: YOUR NEW PHASE (200+ tokens)
- Your instructions here
- Think deeply about X
- Consider Y and Z
`;
```

**Deploy**:
```bash
npx supabase functions deploy generate-vibe --project-ref vwwczyicvfmctttjgqry
```

### Add Console Context for New Event Type

**File**: `src/components/IDEChatPanel.tsx`

**Location**: Lines 106-140 (Console capture)

**Example**:
```typescript
useEffect(() => {
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalInfo = console.info; // NEW

  console.info = (...args: any[]) => { // NEW
    const message = args.map(arg =>
      typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
    ).join(' ');
    setConsoleHistory(prev => [...prev.slice(-50), `[INFO] ${message}`]);
    originalInfo(...args);
  };

  // ... rest of cleanup
}, []);
```

### Add New Validation Rule

**File**: `supabase/functions/generate-vibe/index.ts`

**Location**: Lines 190-284 (validateGeneratedCode function)

**Example**:
```typescript
function validateGeneratedCode(files: any[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const file of files) {
    const content = file.content || '';

    // NEW RULE: Check for console.log in production
    if (content.includes('console.log') && file.path.includes('production')) {
      issues.push({
        type: 'warning',
        file: file.path,
        issue: 'Console.log statements found in production code'
      });
    }

    // ... existing rules
  }

  return issues;
}
```

### Add New Model Selection Criteria

**File**: `supabase/functions/generate-vibe/index.ts`

**Location**: Lines 402-418 (Smart model selection)

**Example**:
```typescript
const isComplexTask =
  type === "generate-plan" ||
  (prompt && (
    prompt.length > 200 ||
    prompt.toLowerCase().includes('game') ||
    prompt.toLowerCase().includes('algorithm') ||
    prompt.toLowerCase().includes('machine learning') || // NEW
    prompt.toLowerCase().includes('3d graphics') ||      // NEW
    (projectFiles && projectFiles.length > 5)
  ));
```

### Clear Conversation History

**User Action**: Click "Clear Chat" button in UI

**Programmatic**:
```typescript
// In IDEChatPanel.tsx
const handleClearChat = () => {
  setMessages([]);
  setConsoleHistory([]);
  // Files persist in IndexedDB
};
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. "GEMINI_API_KEY not found"
**Cause**: Supabase Edge Function secret not set

**Fix**:
```bash
# Go to Supabase Dashboard → Edge Functions → Secrets
# Add secret: GEMINI_API_KEY = "your-key-here"
```

#### 2. "Module not found" errors in AI-generated code
**Cause**: Phase context not refreshing (should be fixed in v3.0.0)

**Check**:
- Verify [src/components/IDEChatPanel.tsx:366](src/components/IDEChatPanel.tsx#L366) has `const currentProjectFiles = Array.from(files.values());`
- Check logs for "Phase X CREATED: file.tsx"

**Fix**: Already implemented in commit 978dc2a

#### 3. Self-correction not working
**Cause**: Validation or self-correction function broken

**Check**:
- Supabase function logs: https://supabase.com/dashboard/project/vwwczyicvfmctttjgqry/functions
- Look for: "Validation found X issues"
- Look for: "Self-correction: X -> 0 errors"

**Debug**:
```bash
npx supabase functions logs generate-vibe --project-ref vwwczyicvfmctttjgqry
```

#### 4. Console capture not working
**Cause**: Console overrides not mounting

**Check**:
- Open browser DevTools → Console
- Type `console.log('test')`
- Check if message appears in `consoleHistory` state
- Verify [src/components/IDEChatPanel.tsx:106-140](src/components/IDEChatPanel.tsx#L106) is present

#### 5. Token limit exceeded
**Cause**: Too many files or long conversation history

**Fix**:
- Click "Clear Chat" to reset conversation
- Smart file selection automatically limits to 15 most relevant files
- Check token usage in console logs (useConsoleStore)

#### 6. TypeScript errors in Supabase function
**Cause**: Implicit 'any' types or other TS errors

**Check**:
```bash
# Supabase Edge Functions use Deno (strict TypeScript)
# Check for errors in index.ts
```

**Fix**: Add explicit type annotations (see commit b12f56d for examples)

#### 7. Function deployment fails
**Cause**: Not logged in or not linked

**Fix**:
```bash
# Check login
npx supabase projects list

# If not logged in, need access token
# Get token from: https://supabase.com/dashboard/account/tokens
export SUPABASE_ACCESS_TOKEN="your-token"
npx supabase login

# Link project
npx supabase link --project-ref vwwczyicvfmctttjgqry
```

---

## 📊 Monitoring and Logs

### Frontend Logs
- Open browser DevTools → Console
- Look for logs from `useConsoleStore`:
  - `[SYSTEM]` - System events
  - `[API REQUEST]` - Outgoing API calls
  - `[API RESPONSE]` - API responses
  - `[AI THOUGHT]` - AI reasoning
  - `[AI RESPONSE]` - AI responses
  - `[TOKEN USAGE]` - Token tracking
  - `[PERFORMANCE]` - Performance metrics

### Backend Logs
- Dashboard: https://supabase.com/dashboard/project/vwwczyicvfmctttjgqry/functions
- CLI: `npx supabase functions logs generate-vibe --project-ref vwwczyicvfmctttjgqry`

**Key log messages to watch**:
- `Selected model: gemini-2.0-flash-thinking-exp (complex: true)` - Model selection
- `[STREAM] Validation found X issues` - Validation triggered
- `Self-correction improved code: 5 -> 0 errors` - Self-correction success
- `[STREAM] Validation passed ✓` - No issues found

### Performance Metrics
- Token usage per request
- Tokens per second (generation speed)
- Files created/modified per request
- Lines of code generated
- Self-correction success rate

---

## 🎯 AI Assistant Guidelines

### When Working on This Project

1. **Always read this file first** to get full context
2. **Check `.env.local`** for current credentials (never expose in responses)
3. **Test changes locally** with `pnpm dev` before deploying
4. **Deploy backend changes** with `npx supabase functions deploy generate-vibe --project-ref vwwczyicvfmctttjgqry`
5. **Commit changes** with proper format (see GitHub Configuration section)
6. **Check logs** after deployment to verify changes work
7. **Update this guide** if you add new setup steps or configuration

### Key Context for AI

- This is an **AI-powered IDE** that generates React code
- The AI system has **two modes**: Instant (fast) and Plan (multi-phase)
- **Self-correction** is critical - AI validates and fixes its own code
- **Context awareness** is critical - AI must see files it created, console output, and errors
- **Token optimization** is important - use smart file selection
- **Extended thinking** (7 phases, 1600+ tokens) produces better results
- **Smart model selection** balances speed and quality

### Files to Read for Full Context

1. This file (`AI_SETUP_GUIDE.md`) - Project setup and configuration
2. [DEPLOYMENT.md](DEPLOYMENT.md) - Deployment instructions
3. [supabase/functions/generate-vibe/index.ts](supabase/functions/generate-vibe/index.ts) - AI generation logic
4. [src/components/IDEChatPanel.tsx](src/components/IDEChatPanel.tsx) - Main UI logic
5. [src/services/geminiService.ts](src/services/geminiService.ts) - API client

---

## 🔐 Security Notes

### Secrets Management

**NEVER commit these files**:
- `.env.local` (already in `.gitignore`)
- Any file containing API keys

**Secrets are stored**:
- Frontend env vars: `.env.local` (local) + hosting provider env vars (production)
- Backend secrets: Supabase Dashboard → Edge Functions → Secrets

**Current secrets**:
- `GEMINI_API_KEY` - Stored in Supabase (backend)
- `VITE_SUPABASE_URL` - Public (can be exposed)
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Public (can be exposed)

### Access Control

**Supabase Project Access**:
- Project is already linked on this machine
- Use `npx supabase projects list` to verify access
- Get access tokens from: https://supabase.com/dashboard/account/tokens

**GitHub Access**:
- Repository is public
- Push access requires authentication

---

## 📈 Future Improvements

Potential enhancements for AI assistants to consider:

1. **Add tests** - Unit tests for validation, self-correction, file selection
2. **Add CI/CD** - GitHub Actions for automatic deployment
3. **Add analytics** - Track AI generation success rate, token usage
4. **Add user feedback loop** - Let users rate AI generations
5. **Add code quality metrics** - Measure complexity, maintainability
6. **Add multi-language support** - Support Python, Java, etc.
7. **Add collaborative features** - Real-time collaboration on projects
8. **Add version control** - Git integration for generated code
9. **Add deployment integration** - One-click deploy to Vercel, Netlify

---

## 📞 Support

- **Documentation**: See [DEPLOYMENT.md](DEPLOYMENT.md)
- **Supabase Docs**: https://supabase.com/docs/guides/functions
- **Gemini API Docs**: https://ai.google.dev/docs
- **React Docs**: https://react.dev
- **Sandpack Docs**: https://sandpack.codesandbox.io

---

## ✅ Quick Reference

### Most Common Commands

```bash
# Start dev server
pnpm dev

# Build for production
pnpm build

# Deploy backend
npx supabase functions deploy generate-vibe --project-ref vwwczyicvfmctttjgqry

# View logs
npx supabase functions logs generate-vibe --project-ref vwwczyicvfmctttjgqry

# Check Supabase status
npx supabase projects list

# Git workflow
git add .
git commit -m "feat: your change"
git push origin main
```

### Quick Links

- **Supabase Dashboard**: https://supabase.com/dashboard/project/vwwczyicvfmctttjgqry
- **Edge Functions**: https://supabase.com/dashboard/project/vwwczyicvfmctttjgqry/functions
- **GitHub Repo**: https://github.com/CelestialBrain/adorable-1
- **Access Tokens**: https://supabase.com/dashboard/account/tokens

---

**Last Updated**: 2025-12-16 by Claude Sonnet 4.5

**Current Status**:
- ✅ All AI improvements deployed (v60+)
- ✅ Self-correction loop active
- ✅ Console awareness working
- ✅ Smart model selection enabled
- ✅ Extended thinking prompts live (8 phases including error diagnosis)
- ✅ Autonomous AI capabilities (proactive problem-solving)
- ✅ Model fallback system (3-tier: primary → fallback1 → fallback2)
- ✅ Conversational prompt detection
- ✅ Fixed 404 model errors (gemini-2.0-flash-exp)
