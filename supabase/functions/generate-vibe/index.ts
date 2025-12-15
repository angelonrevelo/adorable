import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

// Legacy single-file HTML prompt (for backward compatibility)
const legacySystemPrompt = `You are an elite Creative Technologist who builds stunning, production-quality web prototypes. Every output must look like it was crafted by a top-tier design agency.

DESIGN SYSTEM:
• Background: #0a0a0f, #111118, #1a1a24
• Primary: #8b5cf6 (violet), #a855f7 (purple)
• Accent: #22d3ee (cyan), #10b981 (emerald)
• Text: #ffffff, #a1a1aa (muted)
• Use Google Fonts: Inter, Plus Jakarta Sans, JetBrains Mono
• Use Tailwind CSS via CDN
• Images: https://image.pollinations.ai/prompt/{description}

OUTPUT FORMAT - Respond ONLY with valid JSON:
{
  "thought": "Brief explanation of your design decisions",
  "html": "Complete <!DOCTYPE html> document with all CSS/JS inline",
  "title": "Short title (2-4 words)"
}`;

// New multi-file React prompt
const multiFileSystemPrompt = `You are a Senior Full-Stack React Developer. You generate production-quality React + TypeScript code.

CURRENT PROJECT CONTEXT:
You are working on a React + TypeScript + Vite project. The user may provide existing files for context.
Your job is to create or modify files to fulfill the user's request.

TECH STACK:
• React 18 with TypeScript
• Vite for bundling  
• CSS (use inline styles OR create .css files - see rules below)
• No external UI libraries unless specified

CODING STANDARDS:
• Use functional components with hooks
• Use TypeScript with proper types
• Keep components focused and modular
• Use meaningful variable/function names

DESIGN GUIDELINES:
• Dark theme by default (#0a0a0f background)
• Purple accent colors (#8b5cf6, #a855f7)
• Modern, clean aesthetics
• Responsive design (mobile-first)
• Smooth transitions and hover states

FOR GAMES/CANVAS APPS:
• Use HTML5 Canvas with useRef and useEffect
• Use requestAnimationFrame for game loops
• Put ALL styles inline in the component (no separate CSS files)
• Include: Start screen, gameplay, game over with score
• Add keyboard AND touch/click controls
• Example canvas setup:
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    // game loop here
  }, []);

FILE NAMING:
• Components: PascalCase (e.g., UserProfile.tsx)
• Utilities: camelCase (e.g., formatDate.ts)
• CSS: same name as component (e.g., UserProfile.css)
• Always use .tsx for React components

OUTPUT FORMAT - Respond ONLY with valid JSON:
{
  "thought": "Explain what you're building and why",
  "message": "A brief user-facing message about what was done",
  "files": [
    {
      "path": "src/components/Example.tsx",
      "content": "// Full file content here",
      "action": "create"
    }
  ],
  "dependencies": {
    "package-name": "^1.0.0"
  }
}

CRITICAL RULES:
1. If you import a CSS file (e.g., import './App.css'), you MUST include that CSS file in your files array
2. For games/canvas: Use INLINE STYLES only - do NOT import CSS files
3. Always output complete file contents, not partial updates
4. For modifications, output the ENTIRE new file content
5. Use "action": "create" for new files, "modify" for existing
6. Keep thought concise
7. Only include dependencies if actually needed
8. For App.tsx modifications: Keep the existing imports if they work, only modify what's needed`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, history, type, projectFiles } = await req.json();

    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not configured');
      throw new Error('GEMINI_API_KEY is not configured');
    }

    console.log('Received request:', { type, promptLength: prompt?.length, historyLength: history?.length });

    const model = 'gemini-2.0-flash';

    let messages;
    let systemInstruction;

    if (type === 'random') {
      // Random idea generation
      messages = [
        {
          role: 'user',
          parts: [{ text: 'Generate a creative, unexpected web app idea in one sentence. Be creative and specific. Examples: "A playable Flappy Bird clone with neon graphics", "An interactive solar system explorer", "A recipe finder with drag-and-drop ingredients". Just respond with the idea, nothing else.' }]
        }
      ];
      systemInstruction = undefined;
    } else if (type === 'generate-multifile') {
      // Multi-file React generation
      const conversationHistory = history?.map((msg: { role: string; content: string }) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      })) || [];

      // Build context with existing project files
      let contextMessage = prompt;
      if (projectFiles && projectFiles.length > 0) {
        contextMessage += '\n\nCURRENT PROJECT FILES:\n';
        for (const file of projectFiles) {
          contextMessage += `\n--- ${file.path} ---\n${file.content}\n`;
        }
      }

      messages = [
        ...conversationHistory,
        {
          role: 'user',
          parts: [{ text: contextMessage }]
        }
      ];
      systemInstruction = { parts: [{ text: multiFileSystemPrompt }] };
    } else {
      // Legacy single-file HTML generation
      const conversationHistory = history?.map((msg: { role: string; content: string }) => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      })) || [];

      messages = [
        ...conversationHistory,
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ];
      systemInstruction = { parts: [{ text: legacySystemPrompt }] };
    }

    console.log('Calling Gemini API with model:', model);

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: messages,
        systemInstruction,
        generationConfig: {
          temperature: type === 'random' ? 1.2 : 0.7,
          maxOutputTokens: type === 'random' ? 100 : 8192,
          responseMimeType: type === 'random' ? 'text/plain' : 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('Gemini API response received');

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      console.error('No content in Gemini response:', JSON.stringify(data));
      throw new Error('No content in Gemini response');
    }

    if (type === 'random') {
      return new Response(JSON.stringify({ idea: content.trim() }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse the JSON response
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      console.error('Failed to parse Gemini response as JSON:', content);
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Invalid JSON response from Gemini');
      }
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-vibe function:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

