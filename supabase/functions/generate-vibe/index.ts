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

// Structured Chain-of-Thought (SCoT) prompt for better code generation
const multiFileSystemPrompt = `You are an expert React developer. You MUST think step-by-step before generating code.

## STRUCTURED THINKING PROCESS (Required)

Before writing any code, analyze the request using this structure:

### 1. COMPONENTS
- What React components are needed?
- What is the component hierarchy?

### 2. STATE  
- What useState variables are needed?
- What are their types and initial values?

### 3. FUNCTIONS
- What event handlers are needed?
- What logic does each function contain?

### 4. STYLING
- What Tailwind classes for layout? (flex, grid, etc.)
- What colors, shadows, spacing to use?

### 5. CODE GENERATION
After planning, write the complete React code.

## OUTPUT FORMAT

You MUST respond with this exact JSON structure:

{
  "thought": "## 1. COMPONENTS\\n- App (main)\\n- Form component\\n\\n## 2. STATE\\n- formData: object with name, email, message\\n- isSubmitting: boolean\\n\\n## 3. FUNCTIONS\\n- handleChange: update form fields\\n- handleSubmit: validate and submit\\n\\n## 4. STYLING\\n- Dark gradient background\\n- White card with shadow-2xl, rounded-2xl\\n- Violet accent buttons",
  "message": "Created a beautiful contact form with validation",
  "files": [
    {
      "path": "src/App.tsx",
      "content": "// Complete React TypeScript code here",
      "action": "modify"
    }
  ]
}

## CRITICAL RULES

1. The "thought" field MUST show your structured analysis (steps 1-4)
2. ALWAYS use "files" array, NEVER use "html" field
3. Use Tailwind CSS for ALL styling
4. Use JSX comments {/* comment */} NOT HTML comments <!-- -->
5. Self-close tags: <img />, <input />, <br />
6. Use className not class
7. Make UI look PREMIUM with gradients, shadows, transitions
8. Export default the main component`;



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
   - Keep existing navigation/layout
   - Only ADD or MODIFY the specific parts the user asked for

=== TECH STACK ===
- React 18 with TypeScript
- Tailwind CSS (ALL classes available)
- useState/useEffect for state

=== DESIGN REQUIREMENTS ===
- PREMIUM DESIGN: Use gradients, shadows, rounded corners, transitions
- Dark mode: Use slate-900, slate-800 backgrounds
- Accent colors: Use violet, purple, amber gradients
- Glassmorphism: bg-white/10 backdrop-blur-xl
- NEVER use plain gray backgrounds or unstyled forms

=== OUTPUT FORMAT ===
Return JSON with "files" array:
{
  "thought": "## WHAT I'M KEEPING\\n- existing navbar\\n- existing layout\\n\\n## WHAT I'M ADDING\\n- sign in form component",
  "message": "Added sign in form to the app", 
  "files": [{"path": "src/App.tsx", "content": "...", "action": "modify"}]
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
        ? { temperature: 0.7, maxOutputTokens: 32768, responseMimeType: "application/json", responseSchema: multiFileSchema }
        : { temperature: 0.7, maxOutputTokens: 32768, responseMimeType: "application/json" };

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
    // Create debug log
    const debugLog: string[] = [];
    debugLog.push(`[DEBUG] Type: ${type}`);
    debugLog.push(`[DEBUG] Has files: ${!!(parsed.files && Array.isArray(parsed.files))}`);
    debugLog.push(`[DEBUG] Has html: ${!!parsed.html}`);

    if (parsed.files && Array.isArray(parsed.files)) {
      debugLog.push(`[DEBUG] Processing ${parsed.files.length} files`);

      parsed.files = parsed.files.map((file: { path: string; content: string; action: string }) => {
        if (file.path.endsWith('.tsx') || file.path.endsWith('.jsx')) {
          let fixedContent = file.content;
          const originalLength = fixedContent.length;

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

          // Ensure file exports default
          if (!fixedContent.includes('export default')) {
            fixedContent += '\n\nexport default App;\n';
          }

          debugLog.push(`[DEBUG] Fixed ${file.path}: ${originalLength} -> ${fixedContent.length} chars`);

          return { ...file, content: fixedContent };
        }
        return file;
      });

      console.log("Self-fixing applied:", debugLog.join('\n'));
    }

    // Add debug info to response
    if (type === 'generate-multifile') {
      parsed._debug = debugLog;
      // Add system prompt and context for debug panel
      parsed._systemPrompt = multiFileSystemPrompt;
      parsed._contextSent = "Check Supabase function logs for full context";
    }

    // CRITICAL DEBUG: Log final response before sending
    console.log("FINAL RESPONSE KEYS:", Object.keys(parsed));
    console.log("Has files:", !!parsed.files);
    console.log("Has html:", !!parsed.html);

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
