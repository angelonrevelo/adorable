# 🚀 Deployment Guide for Adorable AI Improvements

## ✅ Changes Committed (Ready to Deploy)

All code changes have been pushed to GitHub:
- **Commit b12f56d**: AI quality improvements (self-correction, console awareness, smart models)
- **Commit 978dc2a**: Context awareness across phases
- **Commit 79a792c**: Extended thinking mode (v3.0.0)

---

## 📦 What Needs to be Deployed

The updated Supabase Edge Function: `generate-vibe`

**Location:** `supabase/functions/generate-vibe/index.ts`

**Changes include:**
- ✅ Self-correction loop with validation
- ✅ Console output awareness
- ✅ Smart model selection (Flash vs Thinking)
- ✅ Persistent phase context
- ✅ Extended thinking prompts (7 phases)

---

## 🔧 Deployment Options

### **Option 1: Manual Deployment via Supabase Dashboard** (Recommended - Easiest)

1. Go to https://supabase.com/dashboard
2. Open your project: `vwwczyicvfmctttjgqry`
3. Navigate to **Edge Functions** in the left sidebar
4. Click on the `generate-vibe` function
5. Click **"Edit Function"**
6. Copy the entire contents of `supabase/functions/generate-vibe/index.ts`
7. Paste into the editor
8. Click **"Deploy"**
9. ✅ Done!

---

### **Option 2: CLI Deployment** (Advanced)

#### Step 1: Get Supabase Access Token

1. Go to https://supabase.com/dashboard/account/tokens
2. Click **"Generate new token"**
3. Give it a name: "Adorable Deploy"
4. Copy the token

#### Step 2: Set Environment Variable

```bash
export SUPABASE_ACCESS_TOKEN="your-token-here"
```

#### Step 3: Link Project

```bash
npx supabase link --project-ref vwwczyicvfmctttjgqry
```

#### Step 4: Deploy Function

```bash
npx supabase functions deploy generate-vibe
```

---

### **Option 3: GitHub Actions** (Automated - Future)

Create `.github/workflows/deploy-supabase.yml`:

```yaml
name: Deploy Supabase Functions

on:
  push:
    branches: [main]
    paths:
      - 'supabase/functions/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1

      - name: Deploy Functions
        run: npx supabase functions deploy generate-vibe
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_PROJECT_ID: vwwczyicvfmctttjgqry
```

Then add `SUPABASE_ACCESS_TOKEN` to GitHub Secrets.

---

## 🧪 Testing After Deployment

### 1. Test Self-Correction

Try in Adorable:
```
"build a chess game"
```

Check Supabase logs for:
```
Validation found X issues
Self-correction: X -> 0 errors ✓
```

### 2. Test Console Awareness

1. Make the AI generate code that logs to console
2. Check browser DevTools console
3. Ask AI to debug based on console output
4. AI should reference console messages

### 3. Test Smart Model Selection

Check Supabase logs for:
```
Selected model: gemini-2.0-flash-thinking-exp (complex: true)
```
for complex tasks like games.

---

## 📊 Monitoring

### Supabase Dashboard Logs

1. Go to **Edge Functions** → `generate-vibe`
2. Click **"Logs"** tab
3. Look for:
   - `[STREAM] Validation passed ✓`
   - `Self-correction improved code: 5 -> 0 errors`
   - `Selected model: gemini-2.0-flash-thinking-exp`

### Key Metrics to Watch

- **Error rate**: Should decrease significantly
- **Self-corrections**: Count how often AI fixes its own issues
- **Model usage**: Track Flash vs Thinking split

---

## ⚠️ Important Notes

1. **GEMINI_API_KEY must be set** in Supabase Edge Function secrets
2. **New model costs more** for complex tasks (gemini-2.0-flash-thinking-exp)
3. **Self-correction adds ~2-5s** to generation time (worth it!)
4. **Console capture only works** after frontend is deployed too

---

## 🔍 Troubleshooting

### Function not updating?
- Clear Supabase cache: Add `?v=2` to function URL
- Wait 30 seconds for edge deployment to propagate

### Self-correction not working?
- Check logs for "Validation found X issues"
- Verify GEMINI_API_KEY is set
- Ensure model has sufficient quota

### Console not capturing?
- Frontend changes need to be deployed too
- Check browser console for captured messages
- Verify `consoleHistory` state is updating

---

## 📞 Need Help?

- **Supabase Docs**: https://supabase.com/docs/guides/functions
- **Adorable Repo**: https://github.com/CelestialBrain/adorable
- **Issue Tracker**: https://github.com/CelestialBrain/adorable/issues

---

## ✅ Quick Start (TLDR)

**Easiest way to deploy RIGHT NOW:**

1. Open https://supabase.com/dashboard/project/vwwczyicvfmctttjgqry/functions
2. Click `generate-vibe` function
3. Click "Edit"
4. Copy-paste from `supabase/functions/generate-vibe/index.ts`
5. Click "Deploy"
6. Test with "build a chess game"
7. ✅ Done!

**Total time: 2 minutes**
