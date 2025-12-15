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

// New multi-file React prompt with STRONG UI styling requirements
const multiFileSystemPrompt = `You are a Senior Full-Stack React Developer and UI/UX Designer. You generate COMPLETE, PRODUCTION-QUALITY, BEAUTIFULLY STYLED code.

CRITICAL: EVERY UI you create MUST look professional and polished. NO unstyled HTML elements. NO browser defaults.

=== TECH STACK ===
• React 18 with TypeScript
• Vite for bundling  
• Use INLINE STYLES for all components (style={{ }})
• No external CSS frameworks

=== MANDATORY STYLING RULES ===

EVERY element MUST have explicit styling. Use these design tokens:

COLORS:
- Background: '#0a0a0f' (deep dark), '#111118' (card), '#1a1a24' (input)
- Text: '#ffffff' (primary), '#a1a1aa' (muted), '#6b7280' (placeholder)
- Accent: '#8b5cf6' (purple), '#22d3ee' (cyan), '#10b981' (green)
- Gradients: 'linear-gradient(135deg, #8b5cf6, #ec4899)'

SPACING:
- padding: '16px' to '32px' for containers
- gap: '12px' to '24px' for flex layouts
- borderRadius: '8px' to '16px'

TYPOGRAPHY:
- fontFamily: "'Inter', sans-serif"
- Headings: fontSize '24px' to '48px', fontWeight: 'bold'
- Body: fontSize '14px' to '16px'

BUTTONS (ALWAYS style like this):
\`\`\`tsx
<button style={{
  background: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
  color: 'white',
  padding: '12px 24px',
  borderRadius: '8px',
  border: 'none',
  cursor: 'pointer',
  fontSize: '16px',
  fontWeight: '600',
  transition: 'transform 0.2s',
}}>Submit</button>
\`\`\`

INPUTS (ALWAYS style like this):
\`\`\`tsx
<input style={{
  background: '#1a1a24',
  border: '1px solid #333',
  borderRadius: '8px',
  padding: '12px 16px',
  color: 'white',
  fontSize: '16px',
  outline: 'none',
  width: '100%',
}} placeholder="Enter text..." />
\`\`\`

TEXTAREAS (ALWAYS style like this):
\`\`\`tsx
<textarea style={{
  background: '#1a1a24',
  border: '1px solid #333',
  borderRadius: '12px',
  padding: '16px',
  color: 'white',
  fontSize: '16px',
  outline: 'none',
  width: '100%',
  minHeight: '120px',
  resize: 'vertical',
}} placeholder="Enter your text..." />
\`\`\`

CARDS (ALWAYS style like this):
\`\`\`tsx
<div style={{
  background: '#111118',
  borderRadius: '16px',
  padding: '24px',
  border: '1px solid rgba(255,255,255,0.1)',
  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
}}>Content</div>
\`\`\`

=== LAYOUT RULES ===

ALWAYS use flexbox or grid for layouts:
\`\`\`tsx
// Centered container
<div style={{
  minHeight: '100vh',
  background: '#0a0a0f',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '32px',
  fontFamily: "'Inter', sans-serif",
}}>
\`\`\`

=== COMPLETE APP TEMPLATE ===

For any app, start with this structure:
\`\`\`tsx
import React, { useState } from 'react';

export default function App() {
  const [inputValue, setInputValue] = useState('');

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #0a0a0f 0%, #111118 100%)',
      fontFamily: "'Inter', sans-serif",
      padding: '40px 20px',
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
      }}>
        {/* Header */}
        <h1 style={{
          fontSize: '48px',
          fontWeight: 'bold',
          color: 'white',
          marginBottom: '8px',
          background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>App Title</h1>
        
        <p style={{
          color: '#a1a1aa',
          fontSize: '18px',
          marginBottom: '32px',
        }}>Description text here</p>

        {/* Card Container */}
        <div style={{
          background: '#111118',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          {/* Form content */}
        </div>
      </div>
    </div>
  );
}
\`\`\`

=== GAME DEVELOPMENT ===

For games, use Canvas with proper styling:
- Canvas background: '#0a0a0f'
- Use colorful game elements
- Add score display with styled UI
- Include start/gameover screens with buttons

=== OUTPUT FORMAT ===

Respond ONLY with valid JSON:
{
  "thought": "Explain what you're building and the design approach",
  "message": "User-facing message about what was done",
  "files": [
    {
      "path": "src/App.tsx",
      "content": "// COMPLETE STYLED CODE",
      "action": "modify"
    }
  ]
}

=== CRITICAL RULES ===

1. NEVER use unstyled HTML elements - every element needs inline styles
2. NEVER use default browser styles - always override with custom styling
3. Always use dark theme with proper contrast
4. Include hover states using onMouseEnter/onMouseLeave when possible
5. Use smooth transitions for interactive elements
6. Test the logic in your head - if it wouldn't work, fix it
7. Generate COMPLETE files, not placeholders`;

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
          temperature: type === 'random' ? 1.2 : 0.8,
          maxOutputTokens: type === 'random' ? 100 : 16384,
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

