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
const multiFileSystemPrompt = `You are a Senior Full-Stack React Developer and Game Developer. You generate COMPLETE, PRODUCTION-QUALITY, FULLY WORKING code.

IMPORTANT: When the user asks for a game or interactive app, you MUST generate ALL THE GAME LOGIC, not just a skeleton or placeholder. Every feature must be fully implemented and playable.

TECH STACK:
• React 18 with TypeScript
• Vite for bundling  
• CSS (use inline styles OR create .css files)
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
• Smooth animations

=== GAME DEVELOPMENT (CRITICAL) ===

When building games, you MUST include:

1. GAME STATE MANAGEMENT:
   - Use useState for game state (score, isPlaying, isGameOver)
   - Track player position, velocity, obstacles, etc.

2. GAME LOOP:
   - Use requestAnimationFrame inside useEffect
   - Clear and redraw canvas each frame
   - Update physics (gravity, velocity, collision)
   - Check for collisions and game over conditions

3. CONTROLS:
   - Keyboard: useEffect with 'keydown'/'keyup' listeners
   - Mouse/Touch: onClick or onMouseDown on canvas
   - Remove listeners in cleanup function

4. COMPLETE GAME STRUCTURE for a Flappy Bird-style game:
\`\`\`tsx
const [gameState, setGameState] = useState<'start' | 'playing' | 'gameover'>('start');
const [score, setScore] = useState(0);
const birdRef = useRef({ y: 250, velocity: 0 });
const pipesRef = useRef<{x: number, gapY: number}[]>([]);

useEffect(() => {
  if (gameState !== 'playing') return;
  
  const canvas = canvasRef.current;
  const ctx = canvas?.getContext('2d');
  if (!ctx || !canvas) return;

  let animationId: number;
  
  const gameLoop = () => {
    // Clear canvas
    ctx.fillStyle = '#0a0a0f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Update bird physics
    birdRef.current.velocity += 0.5; // gravity
    birdRef.current.y += birdRef.current.velocity;
    
    // Draw bird
    ctx.fillStyle = '#8b5cf6';
    ctx.fillRect(100, birdRef.current.y, 30, 30);
    
    // Update and draw pipes
    pipesRef.current.forEach(pipe => {
      pipe.x -= 3;
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(pipe.x, 0, 50, pipe.gapY);
      ctx.fillRect(pipe.x, pipe.gapY + 150, 50, canvas.height);
    });
    
    // Add new pipes
    if (pipesRef.current.length === 0 || 
        pipesRef.current[pipesRef.current.length - 1].x < canvas.width - 200) {
      pipesRef.current.push({ x: canvas.width, gapY: 100 + Math.random() * 200 });
    }
    
    // Remove off-screen pipes and update score
    pipesRef.current = pipesRef.current.filter(pipe => {
      if (pipe.x < -50) {
        setScore(s => s + 1);
        return false;
      }
      return true;
    });
    
    // Collision detection
    const bird = birdRef.current;
    for (const pipe of pipesRef.current) {
      if (100 < pipe.x + 50 && 130 > pipe.x) {
        if (bird.y < pipe.gapY || bird.y + 30 > pipe.gapY + 150) {
          setGameState('gameover');
          return;
        }
      }
    }
    
    // Ground/ceiling collision
    if (bird.y < 0 || bird.y > canvas.height - 30) {
      setGameState('gameover');
      return;
    }
    
    animationId = requestAnimationFrame(gameLoop);
  };
  
  animationId = requestAnimationFrame(gameLoop);
  return () => cancelAnimationFrame(animationId);
}, [gameState]);

// Flap handler
const flap = () => {
  if (gameState === 'start') {
    setGameState('playing');
    birdRef.current = { y: 250, velocity: 0 };
    pipesRef.current = [];
    setScore(0);
  } else if (gameState === 'playing') {
    birdRef.current.velocity = -10;
  } else {
    setGameState('start');
  }
};
\`\`\`

5. RENDER START/GAMEOVER SCREENS:
   - Show instructions on start screen
   - Show score on game over
   - Allow restart

FILE NAMING:
• Components: PascalCase (e.g., UserProfile.tsx)
• Always use .tsx for React components

OUTPUT FORMAT - Respond ONLY with valid JSON:
{
  "thought": "Explain what you're building",
  "message": "User-facing message about what was done",
  "files": [
    {
      "path": "src/App.tsx",
      "content": "// COMPLETE FILE CONTENT - NO PLACEHOLDERS",
      "action": "modify"
    }
  ]
}

CRITICAL RULES:
1. NEVER generate skeleton code or placeholders - EVERY function must be fully implemented
2. For games: Generate COMPLETE game logic with physics, controls, collision, scoring, and game states
3. Always output complete file contents
4. For modifications, output the ENTIRE new file content
5. Use "action": "modify" for App.tsx, "create" for new files
6. For games: Use INLINE STYLES only (no CSS imports)
7. Test the logic in your head - if it wouldn't work, fix it`;

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

