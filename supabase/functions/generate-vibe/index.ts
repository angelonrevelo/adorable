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

// React multi-file generation prompt - NO HTML references
const multiFileSystemPrompt = `You are a React developer. Generate React TypeScript components.

REQUIRED OUTPUT FORMAT (you MUST use this exact JSON structure):

{
  "thought": "your brief analysis",
  "message": "what you built",
  "files": [
    {
      "path": "src/App.tsx",
      "content": "import { useState } from 'react';\\n\\nfunction App() {\\n  return <div>content</div>;\\n}\\n\\nexport default App;",
      "action": "modify"
    }
  ]
}

RULES:
- Output MUST be a JSON object with "files" array
- Each file MUST have path, content, and action
- Content MUST be valid React TypeScript
- Use Tailwind CSS classes for styling
- Use useState/useEffect for state
- Make UI premium: rounded-xl, shadow-lg, transitions`;



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

    const model = "gemini-2.5-flash-preview-05-20";

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
