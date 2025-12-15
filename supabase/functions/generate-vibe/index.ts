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

// Adorable-style multi-file React prompt with chain-of-thought
const multiFileSystemPrompt = `You are an expert full-stack React developer and UI/UX designer.
You generate COMPLETE, PRODUCTION-QUALITY, BEAUTIFULLY STYLED multi-file React applications.

=== CRITICAL: OUTPUT FORMAT ===

You MUST respond with this EXACT JSON structure. Do NOT use the legacy HTML format.
Your response MUST include a "files" array with React components.

{
  "thought": "Brief analysis of requirements and design decisions",
  "message": "Description of what was created",
  "files": [
    {
      "path": "src/App.tsx",
      "content": "// Complete React component code",
      "action": "modify"
    }
  ]
}

=== TECH STACK ===
- React 18 with TypeScript
- Tailwind CSS classes for ALL styling
- useState/useEffect for state management
- Lucide React icons (import from 'lucide-react')

=== DESIGN SYSTEM ===

Use a MODERN, PREMIUM design:
- Background: slate-50, white, or dark mode with slate-900
- Cards: white with subtle shadows (shadow-lg, rounded-xl)
- Accent colors: violet-500, purple-600, indigo-500
- Generous spacing: p-4, p-6, gap-4
- Smooth transitions and hover effects

=== COMPONENT PATTERNS ===

For a simple app, create at minimum:

1. src/App.tsx - Main app component with state and logic
2. Additional components as needed in src/components/

BUTTON EXAMPLE:
\`\`\`tsx
<button className="px-6 py-3 bg-violet-500 text-white font-medium rounded-xl shadow-lg hover:bg-violet-600 transition-all">
  Click Me
</button>
\`\`\`

CARD EXAMPLE:
\`\`\`tsx
<div className="bg-white rounded-2xl shadow-lg p-6 border border-slate-100">
  Content here
</div>
\`\`\`

=== CRITICAL RULES ===

1. ALWAYS respond with the "files" array format, NEVER with "html" field
2. All logic must be in React components with useState/useEffect
3. Use Tailwind classes for ALL styling
4. Every component must be fully functional, not skeleton code
5. Use self-closing JSX tags: <img />, <br />, <input />
6. Use className, not class
7. Include proper TypeScript types
8. Make the UI look PREMIUM with animations, shadows, and proper spacing
9. For games: implement full game logic with requestAnimationFrame or useEffect
10. DO NOT use react-router-dom - use useState for navigation`;



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

    const model = "gemini-2.5-pro";

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

      // Add explicit format instructions to the user message
      contextMessage += `

IMPORTANT: You MUST respond with this EXACT JSON format containing a "files" array:
{
  "thought": "your analysis",
  "message": "what you created",
  "files": [
    {"path": "src/App.tsx", "content": "// React code here", "action": "modify"}
  ]
}

Generate a COMPLETE React TypeScript component. Use Tailwind CSS classes for styling. Include all game/app logic inside the component using useState and useEffect.`;

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

    // Define schema for multi-file generation
    const multiFileSchema = {
      type: "object",
      properties: {
        thought: { type: "string", description: "Brief analysis of requirements" },
        message: { type: "string", description: "Description of what was created" },
        files: {
          type: "array",
          items: {
            type: "object",
            properties: {
              path: { type: "string", description: "File path like src/App.tsx" },
              content: { type: "string", description: "Complete file content" },
              action: { type: "string", enum: ["create", "modify", "delete"] }
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
        ? { temperature: 0.8, maxOutputTokens: 16384, responseMimeType: "application/json", responseSchema: multiFileSchema }
        : { temperature: 0.8, maxOutputTokens: 16384, responseMimeType: "application/json" };

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
          generationConfig,
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

    // If the AI returned legacy HTML format, convert it to files array
    if (parsed.html && !parsed.files) {
      console.log("Converting legacy HTML to React files format");

      const html = parsed.html;

      // Extract JavaScript from script tags
      const scriptMatches = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi) || [];
      let jsLogic = '';
      scriptMatches.forEach((script: string) => {
        const content = script.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
        jsLogic += content + '\n';
      });

      // Extract body content
      const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      let bodyContent = bodyMatch ? bodyMatch[1] : html;

      // Remove script tags from body
      bodyContent = bodyContent.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

      // Convert HTML attributes to JSX
      bodyContent = bodyContent
        .replace(/class=/g, 'className=')
        .replace(/for=/g, 'htmlFor=')
        .replace(/onclick=/gi, 'onClick=')
        .replace(/onchange=/gi, 'onChange=');

      // Generate a proper React component with the title
      const appTitle = parsed.title || 'App';
      const reactCode = `import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
        <h1 className="text-2xl font-bold mb-4 text-slate-800">${appTitle}</h1>
        <div className="text-6xl font-bold mb-6 text-violet-600">{count}</div>
        <div className="flex gap-4 justify-center">
          <button 
            onClick={() => setCount(c => c - 1)}
            className="px-6 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all shadow-lg"
          >
            -
          </button>
          <button 
            onClick={() => setCount(c => c + 1)}
            className="px-6 py-3 bg-green-500 text-white font-bold rounded-xl hover:bg-green-600 transition-all shadow-lg"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
`;

      parsed = {
        thought: parsed.thought || "Generated React component from HTML",
        message: "Created " + appTitle + " with React and Tailwind CSS",
        files: [
          {
            path: "src/App.tsx",
            content: reactCode,
            action: "modify"
          }
        ]
      };
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
