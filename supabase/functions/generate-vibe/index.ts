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

// React multi-file generation prompt with FEW-SHOT EXAMPLE
const multiFileSystemPrompt = `You are a React developer. Generate React TypeScript components.

OUTPUT FORMAT: You MUST return JSON with a "files" array containing React components.

=== EXAMPLE ===

User: "Create a counter with + and - buttons"

Your response:
{
  "thought": "Creating a counter component with increment/decrement functionality using useState",
  "message": "Created a beautiful counter app with + and - buttons",
  "files": [
    {
      "path": "src/App.tsx",
      "content": "import { useState } from 'react';\\n\\nfunction App() {\\n  const [count, setCount] = useState(0);\\n\\n  return (\\n    <div className=\\"min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center\\">\\n      <div className=\\"bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20\\">\\n        <h1 className=\\"text-2xl font-bold text-white mb-6 text-center\\">Counter</h1>\\n        <div className=\\"text-7xl font-bold text-white text-center mb-8\\">{count}</div>\\n        <div className=\\"flex gap-4\\">\\n          <button onClick={() => setCount(c => c - 1)} className=\\"px-8 py-4 bg-red-500 text-white text-2xl font-bold rounded-2xl hover:bg-red-600 transition-all shadow-lg\\">-</button>\\n          <button onClick={() => setCount(c => c + 1)} className=\\"px-8 py-4 bg-green-500 text-white text-2xl font-bold rounded-2xl hover:bg-green-600 transition-all shadow-lg\\">+</button>\\n        </div>\\n      </div>\\n    </div>\\n  );\\n}\\n\\nexport default App;",
      "action": "modify"
    }
  ]
}

=== END EXAMPLE ===

CRITICAL RULES:
1. Your response MUST be valid JSON with "files" array
2. NEVER use "html" field - only use "files" array
3. Each file needs: path, content, action
4. Content must be valid React TypeScript
5. Use Tailwind CSS for styling
6. Use useState/useEffect for state
7. Make UI look premium with shadows, gradients, rounded corners`;



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

    const model = "gemini-1.5-pro-latest";

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
      // Multi-file React generation with environment context
      const conversationHistory =
        history?.map((msg: { role: string; content: string }) => ({
          role: msg.role === "assistant" ? "model" : "user",
          parts: [{ text: msg.content }],
        })) || [];

      // CRITICAL: Environment context preamble
      const environmentContext = `
=== ENVIRONMENT ===
You are generating code for a React + TypeScript + Tailwind CSS project.

FILE STRUCTURE:
- index.html (contains Tailwind CDN - DO NOT REPLACE)
- src/main.tsx (React entry point - DO NOT REPLACE)  
- src/App.tsx (main component - THIS IS WHAT YOU GENERATE)
- src/index.css (global styles)

TECH STACK:
- React 18 with TypeScript
- Tailwind CSS (loaded via CDN, all classes available)
- useState/useEffect for state management

=== YOUR TASK ===
Generate ONLY the content for src/App.tsx as a React component.
Use Tailwind CSS classes for ALL styling (bg-*, text-*, flex, grid, etc).
Make the UI look premium with shadows, rounded corners, and transitions.

=== OUTPUT FORMAT ===
Return JSON with a "files" array:
{
  "thought": "brief analysis",
  "message": "what you created", 
  "files": [{"path": "src/App.tsx", "content": "...", "action": "modify"}]
}

=== USER REQUEST ===
`;

      // Build context with existing project files
      let contextMessage = environmentContext + prompt;
      if (projectFiles && projectFiles.length > 0) {
        contextMessage += "\n\n--- EXISTING PROJECT FILES ---\n";
        for (const file of projectFiles) {
          contextMessage += `\n--- ${file.path} ---\n${file.content}\n`;
        }
      }

      // FEW-SHOT: Add example conversation turns to teach the model
      const fewShotExample = [
        {
          role: "user",
          parts: [{ text: "Create a counter with + and - buttons" }]
        },
        {
          role: "model",
          parts: [{
            text: JSON.stringify({
              thought: "Creating a counter component with useState",
              message: "Created a beautiful counter app",
              files: [{
                path: "src/App.tsx",
                content: `import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="bg-white/10 rounded-3xl p-8 shadow-2xl">
        <h1 className="text-2xl font-bold text-white mb-6">Counter</h1>
        <div className="text-6xl font-bold text-white mb-8">{count}</div>
        <div className="flex gap-4">
          <button onClick={() => setCount(c => c - 1)} className="px-6 py-3 bg-red-500 text-white rounded-xl">-</button>
          <button onClick={() => setCount(c => c + 1)} className="px-6 py-3 bg-green-500 text-white rounded-xl">+</button>
        </div>
      </div>
    </div>
  );
}

export default App;`,
                action: "modify"
              }]
            })
          }]
        }
      ];

      messages = [
        ...fewShotExample,
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
        ? { temperature: 0.8, maxOutputTokens: 16384, responseMimeType: "application/json", responseSchema: multiFileSchema }
        : { temperature: 0.8, maxOutputTokens: 16384, responseMimeType: "application/json" };

    console.log("Generation config:", JSON.stringify({ type, hasSchema: !!generationConfig.responseSchema }));

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
    if (parsed.files && Array.isArray(parsed.files)) {
      parsed.files = parsed.files.map((file: { path: string; content: string; action: string }) => {
        if (file.path.endsWith('.tsx') || file.path.endsWith('.jsx')) {
          let fixedContent = file.content;

          // Fix self-closing tags (img, br, input, hr, meta, link)
          fixedContent = fixedContent.replace(/<(img|br|input|hr|meta|link)([^>]*?)(?<!\/)>/gi, '<$1$2 />');

          // Fix class= to className=
          fixedContent = fixedContent.replace(/\bclass=/g, 'className=');

          // Fix for= to htmlFor=
          fixedContent = fixedContent.replace(/\bfor=/g, 'htmlFor=');

          // Fix onclick to onClick (case insensitive)
          fixedContent = fixedContent.replace(/\bonclick=/gi, 'onClick=');
          fixedContent = fixedContent.replace(/\bonchange=/gi, 'onChange=');
          fixedContent = fixedContent.replace(/\bonsubmit=/gi, 'onSubmit=');
          fixedContent = fixedContent.replace(/\bonkeydown=/gi, 'onKeyDown=');
          fixedContent = fixedContent.replace(/\bonkeyup=/gi, 'onKeyUp=');

          // Fix tabindex to tabIndex
          fixedContent = fixedContent.replace(/\btabindex=/gi, 'tabIndex=');
          fixedContent = fixedContent.replace(/\bcolspan=/gi, 'colSpan=');
          fixedContent = fixedContent.replace(/\browspan=/gi, 'rowSpan=');
          fixedContent = fixedContent.replace(/\bcellpadding=/gi, 'cellPadding=');
          fixedContent = fixedContent.replace(/\bcellspacing=/gi, 'cellSpacing=');

          // Ensure file exports default
          if (!fixedContent.includes('export default')) {
            fixedContent += '\n\nexport default App;\n';
          }

          return { ...file, content: fixedContent };
        }
        return file;
      });

      console.log("Applied JSX self-fixing to generated files");
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
