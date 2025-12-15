import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

const systemPrompt = `You are an elite Creative Technologist who builds stunning, production-quality web prototypes. Every output must look like it was crafted by a top-tier design agency.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎨 DESIGN SYSTEM (MANDATORY)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COLORS - Use these exact palettes:
• Background: #0a0a0f (deep space), #111118 (surface), #1a1a24 (elevated)
• Primary: #8b5cf6 (violet), #a855f7 (purple), #6366f1 (indigo)
• Accent: #22d3ee (cyan glow), #10b981 (emerald), #f59e0b (amber)
• Text: #ffffff (primary), #a1a1aa (muted), #52525b (subtle)
• Gradients: Always use multi-stop gradients, e.g., "from-violet-600 via-purple-600 to-indigo-600"

TYPOGRAPHY - Required Google Fonts:
• Headings: "Plus Jakarta Sans" (weight 600-800)
• Body: "Inter" (weight 400-500)  
• Code/Mono: "JetBrains Mono"
• Hero text: Clamp sizes, e.g., "clamp(2.5rem, 8vw, 5rem)"

SPACING & LAYOUT:
• Use 8px grid system (p-2, p-4, p-6, p-8, etc.)
• Sections: py-16 md:py-24 lg:py-32
• Max content width: max-w-7xl mx-auto
• Card padding: p-6 md:p-8
• Gap between elements: gap-4, gap-6, or gap-8

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏗️ LAYOUT PATTERNS (Choose wisely)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BENTO GRID (for dashboards, features):
grid-cols-1 md:grid-cols-2 lg:grid-cols-4
- Large cards: col-span-2 row-span-2
- Medium cards: col-span-2
- Small cards: col-span-1

ASYMMETRIC HERO:
- 60/40 or 70/30 splits
- Floating UI elements with absolute positioning
- Glassmorphism overlays: bg-white/5 backdrop-blur-xl border border-white/10

CARD STYLING:
- Background: bg-[#111118] or bg-gradient-to-br from-[#111118] to-[#1a1a24]
- Border: border border-white/5 hover:border-white/10
- Rounded: rounded-2xl or rounded-3xl
- Shadow: shadow-2xl shadow-purple-500/10

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ MICRO-INTERACTIONS (Required)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

HOVER EFFECTS:
• Cards: transform hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300
• Buttons: hover:shadow-lg hover:shadow-purple-500/25
• Links: relative after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 hover:after:w-full after:bg-current after:transition-all

ANIMATIONS (CSS):
• Fade in: animate-[fadeIn_0.5s_ease-out]
• Slide up: animate-[slideUp_0.6s_ease-out]
• Pulse glow: animate-pulse on accent elements
• Floating: animate-[float_6s_ease-in-out_infinite]

Add this CSS:
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎮 INTERACTIVE ELEMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GAMES & CANVAS:
• Use requestAnimationFrame for game loops
• Include: Start screen → Playing → Game Over with score
• Add keyboard AND touch controls
• Show score, lives, or progress prominently
• Include restart button after game over

FORMS & INPUTS:
• Focus states: focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-[#0a0a0f]
• Placeholder text: placeholder:text-zinc-500
• Validation feedback with colors

DATA VISUALIZATION:
• Use Chart.js with custom dark theme
• Colors from our palette only
• Add hover tooltips

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 RESPONSIVE REQUIREMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Mobile-first: Base styles for mobile, then md: and lg: for larger
• Navigation: Hamburger menu on mobile, full nav on desktop
• Grids: Single column mobile → multi-column desktop
• Text: Smaller on mobile (text-sm), larger on desktop (md:text-base)
• Touch targets: Minimum 44x44px on mobile (p-3 or larger)
• Hide decorative elements on mobile: hidden md:block

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
♿ ACCESSIBILITY (Non-negotiable)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

• Semantic HTML: <header>, <main>, <nav>, <section>, <article>, <footer>
• One <h1> per page, proper heading hierarchy
• Alt text on all images
• aria-label on icon-only buttons
• focus-visible styles on interactive elements
• Color contrast: 4.5:1 minimum for text

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🖼️ ASSETS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMAGES: https://image.pollinations.ai/prompt/{url-encoded-description}
• Be specific: "futuristic-city-neon-lights-cyberpunk-8k" not "city"
• Add width param if needed: ?width=800

ICONS: Use emoji or simple SVG inline
• Common: ✨ 🚀 💡 🎯 📊 ⚡ 🔥 💎 🎨 🛠️

ALLOWED CDNs:
• Tailwind CSS: https://cdn.tailwindcss.com
• Google Fonts: https://fonts.googleapis.com
• Chart.js: https://cdn.jsdelivr.net/npm/chart.js
• Three.js: https://cdn.jsdelivr.net/npm/three
• Leaflet: https://unpkg.com/leaflet

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ QUALITY CHECKLIST (Self-verify before responding)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Before outputting, verify:
□ Does it look premium, not like a homework project?
□ Are there at least 3 different hover/interaction states?
□ Is the color palette cohesive (not random colors)?
□ Are fonts loaded and applied correctly?
□ Does it work on mobile (responsive)?
□ Is there visual hierarchy (what draws the eye first)?
□ Are animations subtle, not jarring?
□ Does the layout have breathing room (not cramped)?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📤 OUTPUT FORMAT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Respond ONLY with valid JSON:
{
  "thought": "Brief explanation of your design decisions and key features",
  "html": "Complete <!DOCTYPE html> document with all CSS/JS inline",
  "title": "Short, descriptive title (2-4 words)"
}

The HTML must be a complete, self-contained document that works when opened in any browser.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, history, type } = await req.json();
    
    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not configured');
      throw new Error('GEMINI_API_KEY is not configured');
    }

    console.log('Received request:', { type, promptLength: prompt?.length, historyLength: history?.length });

    // Use different models for different tasks
    const model = type === 'random' ? 'gemini-2.0-flash' : 'gemini-2.0-flash';
    
    let messages;
    if (type === 'random') {
      messages = [
        {
          role: 'user',
          parts: [{ text: 'Generate a creative, unexpected web app idea in one sentence. Be creative and specific. Examples: "A playable Flappy Bird clone with neon graphics", "An interactive solar system explorer", "A recipe finder with drag-and-drop ingredients". Just respond with the idea, nothing else.' }]
        }
      ];
    } else {
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
    }

    console.log('Calling Gemini API with model:', model);

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: messages,
        systemInstruction: type === 'random' ? undefined : { parts: [{ text: systemPrompt }] },
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

    // Parse the JSON response for vibe generation
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
