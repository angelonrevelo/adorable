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
- Which are NEW files vs modifications to existing files?
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

### 5. FILE PLAN
- List EVERY file you will create or modify
- Use action: "create" for new files, "modify" for existing

## FILE STRUCTURE RULES (CRITICAL)

1. **ALWAYS create separate component files for new features:**
   - New pages → src/pages/PageName.tsx
   - New components → src/components/ComponentName.tsx
   - Utility functions → src/utils/utilName.ts
   - Hooks → src/hooks/useHookName.ts

2. **NEVER put more than 150 lines in App.tsx**
   - App.tsx should only contain routing/layout and imports
   - Extract complex logic into separate components

3. **When user asks for a new feature:**
   - Create the feature in its own file
   - Modify App.tsx to import and render it

4. **Return MULTIPLE files in the "files" array when needed**

## OUTPUT FORMAT

You MUST respond with this exact JSON structure:

{
  "thought": "## 1. COMPONENTS\\n- GalleryPage (new file)\\n- App (modify to import)\\n\\n## 2. STATE\\n- images array in GalleryPage\\n\\n## 3. FUNCTIONS\\n- handleImageClick\\n\\n## 4. STYLING\\n- Grid layout, glassmorphic cards\\n\\n## 5. FILE PLAN\\n- CREATE src/pages/GalleryPage.tsx\\n- MODIFY src/App.tsx",
  "message": "Created a gallery page component",
  "files": [
    {
      "path": "src/pages/GalleryPage.tsx",
      "content": "// Complete component code",
      "action": "create"
    },
    {
      "path": "src/App.tsx",
      "content": "// Updated App with import",
      "action": "modify"
    }
  ]
}

## CRITICAL RULES

1. The "thought" field MUST show your structured analysis (steps 1-5)
2. ALWAYS use "files" array, NEVER use "html" field
3. CREATE new files for new features - don't cram everything into App.tsx
4. Use Tailwind CSS for ALL styling
5. Use JSX comments {/* comment */} NOT HTML comments <!-- -->
6. Self-close tags: <img />, <input />, <br />
7. Use className not class
8. Make UI look PREMIUM with gradients, shadows, transitions
9. Export default the main component`;



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

    const model = "gemini-2.0-flash-001"; // Fast model to avoid timeout

    // =====================
    // STREAMING HANDLER (SSE)
    // =====================
    if (type === "generate-stream") {
      console.log("Starting SSE streaming response");

      // Build conversation history with file operation context
      const conversationHistory =
        history?.map((msg: { role: string; content: string; filesModified?: string[] }) => {
          let content = msg.content;
          // Include file operation context if available
          if (msg.filesModified && msg.filesModified.length > 0) {
            content += `\n[Files in this turn: ${msg.filesModified.join(', ')}]`;
          }
          return {
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: content }],
          };
        }) || [];

      // Build context with files - enhanced format
      let contextMessage = `
=== CRITICAL RULES ===
1. MODIFY, DON'T REPLACE existing code
2. PRESERVE existing design and structure
3. ADD new features without removing existing ones
4. You have ACCESS to conversation history showing what files were previously created/modified

=== TECH STACK ===
React 18 + TypeScript + Tailwind CSS

=== OUTPUT FORMAT ===
Respond with JSON: {"thought": "...", "message": "...", "files": [{"path": "...", "content": "...", "action": "create|modify|delete"}]}

=== CURRENT CODE (Smart Selection - Most Relevant Files) ===
`;

      if (projectFiles && projectFiles.length > 0) {
        console.log(`Processing ${projectFiles.length} files for context`);
        for (const file of projectFiles) {
          contextMessage += `\n--- ${file.path} ---\n${file.content}\n`;
        }
      }

      contextMessage += `\n=== USER REQUEST ===\n${prompt}`;

      const messages = [
        ...conversationHistory,
        { role: "user", parts: [{ text: contextMessage }] },
      ];

      // Create SSE stream
      const stream = new ReadableStream({
        async start(controller) {
          const encoder = new TextEncoder();

          // Send initial "thinking" event
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "thinking" })}\n\n`));

          try {
            // Call Gemini streaming API
            const response = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${GEMINI_API_KEY}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: messages,
                  systemInstruction: { parts: [{ text: multiFileSystemPrompt }] },
                  generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 32768,
                  },
                }),
              }
            );

            if (!response.ok) {
              const errorText = await response.text();
              console.error("Gemini streaming error:", response.status, errorText);
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message: errorText })}\n\n`));
              controller.close();
              return;
            }

            const reader = response.body!.getReader();
            let rawChunks = "";

            // Just accumulate all chunks - Gemini sends complete JSON objects per chunk
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              rawChunks += new TextDecoder().decode(value);
            }

            console.log("Stream complete, raw chunks length:", rawChunks.length);

            // Gemini streaming returns JSON array: [{"candidates":[...]},{"candidates":[...]}]
            // Each element contains a partial text response
            let fullText = "";
            try {
              // The response is a JSON array of objects
              const parsed = JSON.parse(rawChunks);
              if (Array.isArray(parsed)) {
                for (const item of parsed) {
                  const text = item.candidates?.[0]?.content?.parts?.[0]?.text;
                  if (text) {
                    fullText += text;
                  }
                }
              } else if (parsed.candidates) {
                // Single object response
                fullText = parsed.candidates?.[0]?.content?.parts?.[0]?.text || "";
              }
            } catch {
              // If not valid JSON array, try to extract text from raw chunks
              console.log("Raw parsing failed, trying regex extraction");
              const textMatches = rawChunks.match(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/g);
              if (textMatches) {
                for (const match of textMatches) {
                  const textValue = match.match(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/)?.[1];
                  if (textValue) {
                    // Unescape the JSON string
                    fullText += JSON.parse(`"${textValue}"`);
                  }
                }
              }
            }

            console.log("Extracted text length:", fullText.length);
            console.log("First 500 chars:", fullText.slice(0, 500));

            // Send token event with accumulated text
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: "token",
              total: fullText.length
            })}\n\n`));

            // Now parse the AI's JSON response from fullText
            let aiResponse;
            try {
              const jsonStart = fullText.indexOf('{');
              const jsonEnd = fullText.lastIndexOf('}');

              if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
                const jsonStr = fullText.slice(jsonStart, jsonEnd + 1);
                aiResponse = JSON.parse(jsonStr);
              } else {
                console.error("No JSON object found in AI response");
                throw new Error("No JSON found in AI response");
              }
            } catch (e) {
              console.error("Failed to parse AI response:", e);
              console.error("Full text was:", fullText.slice(0, 2000));
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: "error",
                message: "Failed to parse AI response"
              })}\n\n`));
              controller.close();
              return;
            }

            // Apply self-fixing for JSX issues
            if (aiResponse.files && Array.isArray(aiResponse.files)) {
              aiResponse.files = aiResponse.files.map((file: { path: string; content: string; action: string }) => {
                if (file.path.endsWith('.tsx') || file.path.endsWith('.jsx')) {
                  let fixedContent = file.content;
                  // Strip markdown code blocks
                  fixedContent = fixedContent
                    .replace(/^```(?:tsx|typescript|jsx|ts|js|javascript)?\n?/gm, '')
                    .replace(/\n?```$/gm, '')
                    .trim();
                  // Fix HTML comments to JSX
                  fixedContent = fixedContent.replace(/<!--\s*([\s\S]*?)\s*-->/g, '{/* $1 */}');
                  // Fix class= to className=
                  fixedContent = fixedContent.replace(/\bclass=/g, 'className=');
                  return { ...file, content: fixedContent };
                }
                return file;
              });
            }

            // Send the final "done" event with parsed data
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: "done",
              thought: aiResponse.thought || "",
              message: aiResponse.message || "Generated successfully",
              files: aiResponse.files || []
            })}\n\n`));

            controller.close();
          } catch (error) {
            console.error("Streaming error:", error);
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: "error",
              message: error instanceof Error ? error.message : "Unknown error"
            })}\n\n`));
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      });
    }

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
        history?.map((msg: { role: string; content: string; filesModified?: string[] }) => {
          let content = msg.content;
          // Include file operation context if available
          if (msg.filesModified && msg.filesModified.length > 0) {
            content += `\n[Files in this turn: ${msg.filesModified.join(', ')}]`;
          }
          return {
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: content }],
          };
        }) || [];

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

=== FILE STRUCTURE (REQUIRED) ===
- Pages go in: src/pages/PageName.tsx
- Components go in: src/components/ComponentName.tsx  
- Hooks go in: src/hooks/useHookName.ts
- Utils go in: src/utils/utilName.ts
- App.tsx should ONLY import and compose components, not contain all logic

=== WHEN TO CREATE NEW FILES ===
- New page requested → CREATE src/pages/PageName.tsx
- New reusable component → CREATE src/components/ComponentName.tsx
- Custom hook needed → CREATE src/hooks/useHookName.ts
- ALWAYS return MULTIPLE files in the "files" array when creating features

=== TECH STACK ===
- React 18 with TypeScript
- Tailwind CSS (ALL classes available)
- useState/useEffect for state

=== COMPLETE LIBRARY REFERENCE ===

=== COMPLETE LIBRARY REFERENCE ===

✅ INSTALLED & READY TO USE:

UI COMPONENTS:
- lucide-react: Icons
- @radix-ui/*: Headless UI primitives
- class-variance-authority, clsx, tailwind-merge

3D & GRAPHICS:
- three, @react-three/fiber, @react-three/drei:
  import { Canvas } from '@react-three/fiber';
  import { OrbitControls, Sphere } from '@react-three/drei';
  <Canvas><OrbitControls /><Sphere /></Canvas>

ANIMATION:
- framer-motion:
  import { motion } from 'framer-motion';

CHARTS:
- recharts:
  import { LineChart, BarChart, PieChart } from 'recharts';

DATA & RESEARCH (INTERNET ACCESS SIMULATION):
- axios & native fetch:
  You have "internet access" via public APIs.
  - Weather: https://api.open-meteo.com/v1/forecast?latitude={lat}&longitude={lon}&current=temperature_2m
  - Crypto: https://api.coincap.io/v2/assets
  - Jokes: https://official-joke-api.appspot.com/random_joke
  - IP Info: https://ipapi.co/json/
  
  When user asks for "Research" or "Real Data":
  1. Identify a public API (no key required preferred)
  2. Create a React component that fetches this data using useEffect + axios/fetch
  3. Display it beautifully

DATES:
- date-fns: format, parseISO, etc.

STATE:
- zustand: Global state management

FORMS:
- react-hook-form + zod

NOTIFICATIONS:
- sonner

❌ NOT INSTALLED - DO NOT USE:

MAPS (do NOT import - use window.L instead, see MAPS section below):
- import 'leaflet' ❌ (use window.L instead)
- react-leaflet ❌

STATE (use zustand or useState instead):
- redux, mobx ❌

STYLING (use Tailwind CSS instead):
- styled-components, emotion ❌

ANIMATION (use framer-motion instead):
- gsap, anime.js ❌


FORMS (use react-hook-form instead):
- formik ❌

=== SMART ALTERNATIVES ===

When user asks for... → Use this:
- "Add a map" → OpenStreetMap iframe (see MAPS section below)
- "Make API call" → Native fetch with async/await
- "Add notifications" → sonner toast()
- "Add drag and drop" → @dnd-kit/core
- "Form validation" → zod + react-hook-form
- "Global state" → zustand
- "Data caching" → @tanstack/react-query

=== MAPS (TWO OPTIONS) ===

OPTION 1: Simple Static Map (OpenStreetMap iframe) - BEST FOR SIMPLE DISPLAYS

<iframe
  src="https://www.openstreetmap.org/export/embed.html?bbox=120.9,14.4,121.2,14.8&layer=mapnik"
  className="w-full h-[400px] rounded-xl border-0"
  title="Map"
/>

Common bbox coordinates:
- Metro Manila: bbox=120.9,14.4,121.2,14.8
- New York: bbox=-74.1,40.6,-73.8,40.9
- London: bbox=-0.2,51.4,0.1,51.6
- San Francisco: bbox=-122.5,37.7,-122.3,37.85

For markers, append: ?mlat={lat}&mlon={lon}

OPTION 2: Interactive Map (Leaflet via CDN) - FOR MARKERS, PAN, ZOOM

Leaflet is loaded globally via CDN. Access it via window.L (NOT import!).

CRITICAL RULES FOR MAPS:
1. NEVER writes \`import L from 'leaflet'\` (this package is NOT installed)
2. NEVER writes \`import 'leaflet/dist/leaflet.css'\`
3. ALWAYS define \`const L = (window as any).L;\` inside useEffect
4. ALWAYS add this to your component:
   \`\`\`tsx
   declare global {
     interface Window { L: any; }
   }
   \`\`\`

Example MapComponent.tsx:
\`\`\`tsx
import { useEffect, useRef } from 'react';

declare global {
  interface Window { L: any; }
}

interface MapProps {
  center?: [number, number];
  zoom?: number;
  markers?: Array<{ lat: number; lng: number; popup?: string }>;
}

export function MapComponent({ center = [14.5995, 120.9842], zoom = 13, markers = [] }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;
    
    const L = window.L;
    if (!L) {
      console.error('Leaflet not loaded');
      return;
    }

    const map = L.map(mapRef.current).setView(center, zoom);
    mapInstanceRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    markers.forEach(({ lat, lng, popup }) => {
      const marker = L.marker([lat, lng]).addTo(map);
      if (popup) marker.bindPopup(popup);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return <div ref={mapRef} className="w-full h-[400px] rounded-xl" />;
}
\`\`\`

=== IMAGES ===

NEVER use external image URLs from imgur, i.imgur.com, or random hosts (they will break!).

For placeholder images, use:
- https://picsum.photos/800/600 (random photo)
- https://picsum.photos/seed/nature/800/600 (seeded photo - consistent)
- https://placehold.co/800x600/1e293b/8b5cf6?text=Placeholder (colored placeholder)

For icons, use lucide-react instead of images:
import { MapPin, Navigation, Building, Image, Camera } from 'lucide-react';

=== TYPESCRIPT RULES (REQUIRED) ===

1. Define interfaces for ALL data shapes:
   interface User { id: string; name: string; email: string; }
   interface Todo { id: string; text: string; completed: boolean; }

2. Type ALL component props:
   interface CardProps { title: string; children: React.ReactNode; }
   function Card({ title, children }: CardProps) { ... }

3. Type ALL state:
   const [users, setUsers] = useState<User[]>([]);
   const [count, setCount] = useState<number>(0);
   const [isOpen, setIsOpen] = useState<boolean>(false);

4. Use proper event types:
   const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {}
   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {}
   const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {}

=== IMPORT RULES (CRITICAL) ===
- NEVER use @/ import aliases (like @/components/...)
- ALWAYS use relative imports (like ./components/... or ../utils/...)
- The bundler does not support path aliases

=== DESIGN REQUIREMENTS ===
- PREMIUM DESIGN: Use gradients, shadows, rounded corners, transitions
- Dark mode: Use slate-900, slate-800 backgrounds
- Accent colors: Use violet, purple, amber gradients
- Glassmorphism: bg-white/10 backdrop-blur-xl
- NEVER use plain gray backgrounds or unstyled forms

=== OUTPUT FORMAT (STREAMING) ===

You must respond with a STREAM of JSON objects. Each object must be on a new line.

1. Start with \`{"type": "thinking", "content": "Analyzing request..."}\`
2. Stream tokens: \`{"type": "token", "content": "..."}\`
3. End with a single JSON object containing the \`thought\` and \`files\` array.

CRITICAL: The final response MUST be consistent with this schema:
\`\`\`json
{
  "thought": "Brief explanation of your plan...",
  "message": "User-facing message...",
  "files": [
    {
      "type": "create" | "update",
      "path": "src/components/Example.tsx",
      "content": "..."
    }
  ]
}
\`\`\`

IMPORTANT:
- Do NOT wrap the final JSON in markdown code blocks.
- Ensure all JSON is valid and properly escaped.
- When fixing errors, carefully analyze the error message provided in the prompt.
- If you import a library, ensure it is in the allowed list.
- NEVER leave placeholders like \`// ... rest of code\`. ALWAYS write the full file content.

  "thought": "## FILE PLAN\\n- CREATE src/pages/GalleryPage.tsx\\n- MODIFY src/App.tsx to import it",
  "message": "Created gallery page", 
  "files": [
    {"path": "src/pages/GalleryPage.tsx", "content": "...", "action": "create"},
    {"path": "src/App.tsx", "content": "...", "action": "modify"}
  ]
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

      // FEW-SHOT EXAMPLES: 5 diverse examples to teach different patterns
      const fewShotExamples = [
        // Example 1: Basic Counter Component
        {
          role: "user",
          parts: [{ text: "Create a counter with + and - buttons" }]
        },
        {
          role: "model",
          parts: [{
            text: JSON.stringify({
              thought: "## 1. COMPONENTS\n- Counter component (new file in src/components/)\n- App (modify to import Counter)\n\n## 2. STATE\n- count: number in Counter.tsx\n\n## 3. FUNCTIONS\n- increment/decrement handlers\n\n## 4. STYLING\n- Glassmorphic card, gradient buttons\n\n## 5. FILE PLAN\n- CREATE src/components/Counter.tsx\n- MODIFY src/App.tsx",
              message: "Created a modular counter component",
              files: [
                {
                  path: "src/components/Counter.tsx",
                  content: `import { useState } from 'react';

interface CounterProps {
  initialValue?: number;
}

export function Counter({ initialValue = 0 }: CounterProps) {
  const [count, setCount] = useState<number>(initialValue);
  
  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/10">
      <h2 className="text-2xl font-bold text-white mb-6">Counter</h2>
      <div className="text-6xl font-bold text-white mb-8 text-center">{count}</div>
      <div className="flex gap-4 justify-center">
        <button 
          onClick={() => setCount(c => c - 1)} 
          className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors"
        >
          -
        </button>
        <button 
          onClick={() => setCount(c => c + 1)} 
          className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors"
        >
          +
        </button>
      </div>
    </div>
  );
}`,
                  action: "create"
                },
                {
                  path: "src/App.tsx",
                  content: `import { Counter } from './components/Counter';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Counter />
    </div>
  );
}

export default App;`,
                  action: "modify"
                }
              ]
            })
          }]
        },
        // Example 2: Page with State-Based Navigation
        {
          role: "user",
          parts: [{ text: "Create an about page with company info" }]
        },
        {
          role: "model",
          parts: [{
            text: JSON.stringify({
              thought: "## 1. COMPONENTS\n- AboutPage (new page in src/pages/)\n- App (modify to add state-based routing)\n\n## 2. STATE\n- currentPage: string in App.tsx for navigation\n\n## 3. FUNCTIONS\n- setCurrentPage handler for nav\n\n## 4. STYLING\n- Glassmorphic cards, gradient text, nav bar\n\n## 5. FILE PLAN\n- CREATE src/pages/AboutPage.tsx\n- MODIFY src/App.tsx with navigation",
              message: "Created an About page with state-based navigation",
              files: [
                {
                  path: "src/pages/AboutPage.tsx",
                  content: `import { ChevronRight } from 'lucide-react';

interface AboutPageProps {
  onNavigate: (page: string) => void;
}

export function AboutPage({ onNavigate }: AboutPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 text-violet-400 hover:text-violet-300 mb-8 transition-colors"
        >
          <ChevronRight className="w-4 h-4 rotate-180" />
          Back to Home
        </button>
        
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/10">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent mb-6">
            About Us
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed mb-6">
            We are a forward-thinking company dedicated to building innovative solutions 
            that make a difference. Our team of experts works tirelessly to deliver 
            exceptional products and services.
          </p>
          <div className="grid md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-2">Our Mission</h3>
              <p className="text-slate-400">To innovate and inspire through technology.</p>
            </div>
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-2">Our Vision</h3>
              <p className="text-slate-400">A world connected through elegant solutions.</p>
            </div>
            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-2">Our Values</h3>
              <p className="text-slate-400">Integrity, innovation, and excellence.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}`,
                  action: "create"
                },
                {
                  path: "src/App.tsx",
                  content: `import { useState } from 'react';
import { AboutPage } from './pages/AboutPage';

function App() {
  const [currentPage, setCurrentPage] = useState<string>('home');
  
  if (currentPage === 'about') {
    return <AboutPage onNavigate={setCurrentPage} />;
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold text-white mb-8">Welcome Home</h1>
      <button 
        onClick={() => setCurrentPage('about')}
        className="px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white rounded-xl transition-all shadow-lg"
      >
        Learn About Us
      </button>
    </div>
  );
}

export default App;`,
                  action: "modify"
                }
              ]
            })
          }]
        },
        // Example 3: Custom Hook
        {
          role: "user",
          parts: [{ text: "Create a useLocalStorage hook" }]
        },
        {
          role: "model",
          parts: [{
            text: JSON.stringify({
              thought: "## 1. COMPONENTS\n- useLocalStorage hook (new in src/hooks/)\n- StorageDemo component to showcase usage\n- App (modify to use demo)\n\n## 2. STATE\n- Generic T value persisted to localStorage\n\n## 3. FUNCTIONS\n- setValue with localStorage sync\n- useEffect for initial load\n\n## 4. STYLING\n- Demo with input and display\n\n## 5. FILE PLAN\n- CREATE src/hooks/useLocalStorage.ts\n- CREATE src/components/StorageDemo.tsx\n- MODIFY src/App.tsx",
              message: "Created useLocalStorage hook with demo component",
              files: [
                {
                  path: "src/hooks/useLocalStorage.ts",
                  content: `import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error('Error reading localStorage:', error);
      return initialValue;
    }
  });

  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error writing to localStorage:', error);
    }
  };

  return [storedValue, setValue];
}`,
                  action: "create"
                },
                {
                  path: "src/components/StorageDemo.tsx",
                  content: `import { useLocalStorage } from '../hooks/useLocalStorage';

interface UserPrefs {
  theme: string;
  name: string;
}

export function StorageDemo() {
  const [prefs, setPrefs] = useLocalStorage<UserPrefs>('user-prefs', { theme: 'dark', name: '' });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrefs({ ...prefs, name: e.target.value });
  };

  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/10 max-w-md">
      <h2 className="text-2xl font-bold text-white mb-6">LocalStorage Demo</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-slate-300 mb-2">Your Name (persisted)</label>
          <input
            type="text"
            value={prefs.name}
            onChange={handleNameChange}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
            placeholder="Enter your name..."
          />
        </div>
        <p className="text-slate-400 text-sm">
          Refresh the page - your name will persist!
        </p>
      </div>
    </div>
  );
}`,
                  action: "create"
                },
                {
                  path: "src/App.tsx",
                  content: `import { StorageDemo } from './components/StorageDemo';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <StorageDemo />
    </div>
  );
}

export default App;`,
                  action: "modify"
                }
              ]
            })
          }]
        },
        // Example 4: Data Fetching with Loading/Error States
        {
          role: "user",
          parts: [{ text: "Create a user list that fetches from an API" }]
        },
        {
          role: "model",
          parts: [{
            text: JSON.stringify({
              thought: "## 1. COMPONENTS\n- UserList component with fetch logic\n- App (modify to render UserList)\n\n## 2. STATE\n- users: User[] for data\n- loading: boolean for loading state\n- error: string | null for errors\n\n## 3. FUNCTIONS\n- useEffect with fetch\n- Error/loading handling\n\n## 4. STYLING\n- User cards with avatar, loading spinner\n\n## 5. FILE PLAN\n- CREATE src/components/UserList.tsx\n- MODIFY src/App.tsx",
              message: "Created UserList with loading and error states",
              files: [
                {
                  path: "src/components/UserList.tsx",
                  content: `import { useState, useEffect } from 'react';
import { User, AlertCircle } from 'lucide-react';

interface UserData {
  id: number;
  name: string;
  email: string;
  company: { name: string };
}

export function UserList() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('https://jsonplaceholder.typicode.com/users');
        if (!response.ok) throw new Error('Failed to fetch users');
        const data: UserData[] = await response.json();
        setUsers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 flex items-center gap-4">
        <AlertCircle className="w-6 h-6 text-red-400" />
        <p className="text-red-300">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-white mb-6">Users</h2>
      {users.map((user) => (
        <div key={user.id} className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/10 flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-500 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold">{user.name}</h3>
            <p className="text-slate-400 text-sm">{user.email}</p>
            <p className="text-slate-500 text-xs">{user.company.name}</p>
          </div>
        </div>
      ))}
    </div>
  );
}`,
                  action: "create"
                },
                {
                  path: "src/App.tsx",
                  content: `import { UserList } from './components/UserList';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-2xl mx-auto">
        <UserList />
      </div>
    </div>
  );
}

export default App;`,
                  action: "modify"
                }
              ]
            })
          }]
        },
        // Example 5: Form with Validation
        {
          role: "user",
          parts: [{ text: "Create a contact form with validation" }]
        },
        {
          role: "model",
          parts: [{
            text: JSON.stringify({
              thought: "## 1. COMPONENTS\n- ContactForm with validation\n- App (modify to render form)\n\n## 2. STATE\n- formData: object with name, email, message\n- errors: object with field errors\n- submitted: boolean for success state\n\n## 3. FUNCTIONS\n- handleChange for inputs\n- validate function\n- handleSubmit with validation\n\n## 4. STYLING\n- Styled inputs, error messages, submit button\n\n## 5. FILE PLAN\n- CREATE src/components/ContactForm.tsx\n- MODIFY src/App.tsx",
              message: "Created ContactForm with validation",
              files: [
                {
                  path: "src/components/ContactForm.tsx",
                  content: `import { useState } from 'react';
import { Send, Check } from 'lucide-react';

interface FormData {
  name: string;
  email: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

export function ContactForm() {
  const [formData, setFormData] = useState<FormData>({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState<boolean>(false);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.message.trim()) newErrors.message = 'Message is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validate()) {
      setSubmitted(true);
      // Handle form submission here
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  if (submitted) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-8 text-center">
        <Check className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-white mb-2">Thank You!</h3>
        <p className="text-slate-300">Your message has been sent successfully.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/10">
      <h2 className="text-2xl font-bold text-white mb-6">Contact Us</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-slate-300 mb-2">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={\`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 \${errors.name ? 'border-red-500' : 'border-white/10'}\`}
            placeholder="Your name"
          />
          {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-slate-300 mb-2">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={\`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 \${errors.email ? 'border-red-500' : 'border-white/10'}\`}
            placeholder="your@email.com"
          />
          {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="block text-slate-300 mb-2">Message</label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            rows={4}
            className={\`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none \${errors.message ? 'border-red-500' : 'border-white/10'}\`}
            placeholder="Your message..."
          />
          {errors.message && <p className="text-red-400 text-sm mt-1">{errors.message}</p>}
        </div>

        <button
          type="submit"
          className="w-full px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
        >
          <Send className="w-5 h-5" />
          Send Message
        </button>
      </div>
    </form>
  );
}`,
                  action: "create"
                },
                {
                  path: "src/App.tsx",
                  content: `import { ContactForm } from './components/ContactForm';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <ContactForm />
      </div>
    </div>
  );
}

export default App;`,
                  action: "modify"
                }
              ]
            })
          }]
        },
        // Example 6: Dashboard with Charts (recharts)
        {
          role: "user",
          parts: [{ text: "Create a sales dashboard with charts" }]
        },
        {
          role: "model",
          parts: [{
            text: JSON.stringify({
              thought: "## 1. COMPONENTS\n- Dashboard page with charts\n- StatCard component\n\n## 2. STATE\n- salesData array (static)\n\n## 3. FUNCTIONS\n- None needed (static display)\n\n## 4. STYLING\n- Grid layout, glassmorphic cards, responsive\n\n## 5. FILE PLAN\n- CREATE src/components/StatCard.tsx\n- CREATE src/pages/Dashboard.tsx\n- MODIFY src/App.tsx",
              message: "Created sales dashboard with LineChart and stats",
              files: [
                {
                  path: "src/components/StatCard.tsx",
                  content: `import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  positive: boolean;
}

export function StatCard({ title, value, change, positive }: StatCardProps) {
  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
      <p className="text-slate-400 text-sm">{title}</p>
      <p className="text-3xl font-bold text-white mt-2">{value}</p>
      <div className={\`flex items-center gap-1 text-sm mt-2 \${positive ? 'text-emerald-400' : 'text-red-400'}\`}>
        {positive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        {change}
      </div>
    </div>
  );
}`,
                  action: "create"
                },
                {
                  path: "src/pages/Dashboard.tsx",
                  content: `import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { StatCard } from '../components/StatCard';

const salesData = [
  { month: 'Jan', sales: 4000, orders: 240 },
  { month: 'Feb', sales: 3000, orders: 198 },
  { month: 'Mar', sales: 5000, orders: 300 },
  { month: 'Apr', sales: 4500, orders: 278 },
  { month: 'May', sales: 6000, orders: 389 },
  { month: 'Jun', sales: 5500, orders: 349 },
];

export function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <h1 className="text-3xl font-bold text-white mb-8">Sales Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total Revenue" value="$45,231" change="+20.1% from last month" positive={true} />
        <StatCard title="Active Users" value="2,350" change="+15.2% from last month" positive={true} />
        <StatCard title="Bounce Rate" value="12.5%" change="+2.3% from last month" positive={false} />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h2 className="text-xl font-semibold text-white mb-4">Sales Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
              <Line type="monotone" dataKey="sales" stroke="#8b5cf6" strokeWidth={2} dot={{ fill: '#8b5cf6' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
          <h2 className="text-xl font-semibold text-white mb-4">Orders by Month</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={salesData}>
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
              <Bar dataKey="orders" fill="#22d3ee" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}`,
                  action: "create"
                },
                {
                  path: "src/App.tsx",
                  content: `import { Dashboard } from './pages/Dashboard';

function App() {
  return <Dashboard />;
}

export default App;`,
                  action: "modify"
                }
              ]
            })
          }]
        },
        // Example 7: Animated Component with framer-motion
        {
          role: "user",
          parts: [{ text: "Create an animated card list with add/remove" }]
        },
        {
          role: "model",
          parts: [{
            text: JSON.stringify({
              thought: "## 1. COMPONENTS\n- AnimatedCardList with motion\n\n## 2. STATE\n- cards: Card[] array\n- nextId: number for unique keys\n\n## 3. FUNCTIONS\n- addCard, removeCard\n\n## 4. STYLING\n- Staggered animations, exit animations, glassmorphic cards\n\n## 5. FILE PLAN\n- CREATE src/components/AnimatedCardList.tsx\n- MODIFY src/App.tsx",
              message: "Created animated card list with staggered enter/exit animations",
              files: [
                {
                  path: "src/components/AnimatedCardList.tsx",
                  content: `import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X } from 'lucide-react';

interface Card {
  id: number;
  title: string;
}

export function AnimatedCardList() {
  const [cards, setCards] = useState<Card[]>([
    { id: 1, title: 'First Card' },
    { id: 2, title: 'Second Card' },
  ]);
  const [nextId, setNextId] = useState<number>(3);

  const addCard = () => {
    setCards([...cards, { id: nextId, title: \`Card \${nextId}\` }]);
    setNextId(nextId + 1);
  };

  const removeCard = (id: number) => {
    setCards(cards.filter(c => c.id !== id));
  };

  return (
    <div className="space-y-4">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={addCard}
        className="px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl flex items-center gap-2 shadow-lg"
      >
        <Plus className="w-5 h-5" />
        Add Card
      </motion.button>
      
      <AnimatePresence mode="popLayout">
        {cards.map((card, index) => (
          <motion.div
            key={card.id}
            layout
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: -100, scale: 0.95 }}
            transition={{ delay: index * 0.05, type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/10 flex justify-between items-center"
          >
            <span className="text-white font-medium">{card.title}</span>
            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => removeCard(card.id)} 
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </motion.div>
        ))}
      </AnimatePresence>
      
      {cards.length === 0 && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-slate-400 text-center py-8"
        >
          No cards yet. Add one!
        </motion.p>
      )}
    </div>
  );
}`,
                  action: "create"
                },
                {
                  path: "src/App.tsx",
                  content: `import { AnimatedCardList } from './components/AnimatedCardList';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-white mb-6">Animated Cards</h1>
        <AnimatedCardList />
      </div>
    </div>
  );
}

export default App;`,
                  action: "modify"
                }
              ]
            })
          }]
        }
      ];

      messages = [
        ...fewShotExamples,
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
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch (innerE) {
          console.error("Failed to parse extracted JSON:", innerE);
          // Return graceful error response for safety filter triggers
          return new Response(JSON.stringify({
            thought: "The AI couldn't process this request",
            message: "I can't help with that request. Please try rephrasing or ask for something different.",
            files: []
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } else {
        console.error("No JSON found in AI response, returning graceful error");
        // Return graceful error response instead of throwing
        return new Response(JSON.stringify({
          thought: "The AI response was not in the expected format",
          message: "I couldn't generate code for that request. Please try again with a different prompt.",
          files: []
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
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

          // MARKDOWN CLEANUP: Strip ```tsx, ```typescript, etc code block markers
          fixedContent = fixedContent
            .replace(/^```(?:tsx|typescript|jsx|ts|js|javascript)?\n?/gm, '')
            .replace(/\n?```$/gm, '')
            .trim();

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

          // Ensure file exports default - but detect the correct component name
          if (!fixedContent.includes('export default')) {
            // Try to extract the component name from the file
            const functionMatch = fixedContent.match(/(?:export\s+)?function\s+([A-Z][a-zA-Z0-9]*)\s*\(/);
            const constMatch = fixedContent.match(/(?:export\s+)?const\s+([A-Z][a-zA-Z0-9]*)\s*[=:]/);

            // Get component name from file path as fallback
            const pathParts = file.path.split('/');
            const fileName = pathParts[pathParts.length - 1];
            const fileBaseName = fileName.replace(/\.(tsx|jsx|ts|js)$/, '');

            // Priority: function name > const name > file name > 'App' only for App.tsx
            let componentName: string | null = functionMatch?.[1] || constMatch?.[1] || fileBaseName;

            // Only use 'App' as fallback if this is actually App.tsx
            if (!componentName || componentName.toLowerCase() === 'index') {
              if (file.path.includes('App.tsx') || file.path.includes('App.jsx')) {
                componentName = 'App';
              } else {
                // Skip adding export if we can't determine the name and it's not App.tsx
                componentName = null;
              }
            }

            if (componentName) {
              fixedContent += `\n\nexport default ${componentName};\n`;
            }
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
