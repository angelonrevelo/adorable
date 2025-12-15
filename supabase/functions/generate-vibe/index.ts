import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

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

// Lovable-style multi-file React prompt with chain-of-thought
const multiFileSystemPrompt = `You are an expert full-stack React developer and UI/UX designer like the team at Adorable.
You generate COMPLETE, PRODUCTION-QUALITY, BEAUTIFULLY STYLED multi-file React applications.

=== YOUR APPROACH ===

When given a prompt, you will:
1. ANALYZE the requirements and extract design specifications
2. PLAN the component architecture and file structure
3. GENERATE multiple coordinated files with proper imports

=== TECH STACK ===
- React 18 with TypeScript
- Tailwind CSS (via CDN in index.html)
- React Router for multi-page apps
- Lucide React icons (import from 'lucide-react')

=== DESIGN SYSTEM ===

Default to a LIGHT, CLEAN, MODERN design unless specified:

COLORS (adapt based on user's color preferences):
- Background: white (#ffffff), light gray (#f8fafc, #f1f5f9)
- Cards: white with subtle borders, glassmorphism optional
- Text: slate-900 (#0f172a), slate-600 (#475569), slate-400 (#94a3b8)
- Primary accent: Use user-specified color OR violet-500 (#8b5cf6)

STYLING:
- Use Tailwind classes: rounded-xl, rounded-2xl, shadow-sm, shadow-lg
- Glassmorphism: backdrop-blur-xl bg-white/70 border border-white/20
- Generous padding: p-4, p-6, p-8
- Modern typography with proper hierarchy

=== FILE STRUCTURE ===

For any app, generate these files as needed:

1. src/App.tsx - Main app with routing
2. src/components/Layout.tsx - Navbar + footer wrapper
3. src/components/ui/Button.tsx - Reusable button component
4. src/components/ui/Card.tsx - Reusable card component
5. src/components/ui/Input.tsx - Styled form inputs
6. src/pages/Home.tsx - Home page
7. src/pages/[OtherPages].tsx - Additional pages

=== COMPONENT PATTERNS ===

BUTTON with Tailwind:
\`\`\`tsx
<button className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all">
  Get Started
</button>
\`\`\`

CARD with glassmorphism:
\`\`\`tsx
<div className="backdrop-blur-xl bg-white/80 border border-white/20 rounded-2xl p-6 shadow-lg">
  Content
</div>
\`\`\`

NAVBAR:
\`\`\`tsx
<nav className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-slate-200">
  <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
    {/* Logo and nav links */}
  </div>
</nav>
\`\`\`

=== OUTPUT FORMAT ===

Your response MUST be valid JSON with this exact structure:

{
  "thought": "## Design Analysis\\n\\n**Project**: [Name]\\n**Style**: [Description]\\n\\n**Design System**:\\n- Primary: [Color]\\n- Background: [Colors]\\n- Style: [Glassmorphism/Modern/etc]\\n\\n**V1 Features**:\\n- [Feature 1]\\n- [Feature 2]\\n\\n**Files to create**:\\n- Layout.tsx\\n- Button.tsx\\n- etc.\\n\\nLet me build this:",
  "message": "I've created [description]. The app includes [features]. You can navigate between pages using the navbar.",
  "files": [
    {
      "path": "src/App.tsx",
      "content": "// Complete file content with imports",
      "action": "modify"
    },
    {
      "path": "src/components/Layout.tsx",
      "content": "// Complete Layout component",
      "action": "create"
    },
    {
      "path": "src/pages/Home.tsx",
      "content": "// Complete Home page",
      "action": "create"
    }
  ]
}

=== CRITICAL RULES ===

1. The "thought" field should be detailed like Adorable's - list features, design decisions, files
2. Generate MULTIPLE files for any non-trivial app (5-10 files)
3. Use Tailwind classes, NOT inline styles
4. Every component must be fully styled and functional
5. Include proper TypeScript types
6. DO NOT use react-router-dom - use simple state-based navigation with useState instead
7. Make the UI look PREMIUM - rounded corners, shadows, gradients, proper spacing
8. Parse user's color preferences and apply them throughout
9. For complex apps, create reusable components in components/ui/
10. NEVER generate skeleton code - every function must work
11. ALWAYS use self-closing JSX tags: <img />, <br />, <input />, <hr /> - NEVER <img> without closing
12. VERIFY all JSX brackets are properly closed before responding
13. Use className for CSS classes, NOT class`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, history, type, projectFiles } = await req.json();

    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not configured");
      throw new Error("GEMINI_API_KEY is not configured");
    }

    console.log("Received request:", { type, promptLength: prompt?.length, historyLength: history?.length });

    const model = "gemini-2.0-flash";

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
      // Multi-file React generation
      const conversationHistory =
        history?.map((msg: { role: string; content: string }) => ({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        })) || [];

      // Build context with existing project files
      let contextMessage = prompt;
      if (projectFiles && projectFiles.length > 0) {
        contextMessage += "\n\nCURRENT PROJECT FILES:\n";
        for (const file of projectFiles) {
          contextMessage += `\n--- ${file.path} ---\n${file.content}\n`;
        }
      }

      messages = [
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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: messages,
          systemInstruction,
          generationConfig: {
            temperature: type === "random" ? 1.2 : 0.8,
            maxOutputTokens: type === "random" ? 100 : 16384,
            responseMimeType: type === "random" ? "text/plain" : "application/json",
          },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
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
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Invalid JSON response from Gemini");
      }
    }

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
