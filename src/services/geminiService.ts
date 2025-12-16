import { supabase } from "@/integrations/supabase/client";
import { GenerateVibeResponse, FileOperation } from "@/types";
import { ProjectFile, ConversationMessage } from "@/types/projectTypes";
import { useConsoleStore } from "@/stores/useConsoleStore";
import { selectRelevantFiles, buildEnrichedHistory } from "./fileSelectionService";

// Get console store methods (can be called from non-React code)
const getSysConsole = () => useConsoleStore.getState();

// Extended history message with file operations
export interface EnrichedHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
  filesModified?: string[];
}

// SSE Stream event types
export type StreamEventType = 'thinking' | 'token' | 'files' | 'done' | 'error';

export interface StreamEvent {
  type: StreamEventType;
  text?: string;
  total?: number;
  thought?: string;
  message?: string;
  files?: FileOperation[];
  error?: string;
}

// Streaming generator function for SSE with smart file selection
export async function* generateVibeStream(
  prompt: string,
  conversationHistory: ConversationMessage[],
  projectFiles?: ProjectFile[],
  context?: string
): AsyncGenerator<StreamEvent> {
  const sysConsole = getSysConsole();
  const startTime = Date.now();

  // Smart file selection - only send relevant files
  const relevantFiles = projectFiles
    ? selectRelevantFiles(projectFiles, prompt, conversationHistory, 15)
    : [];

  sysConsole.logSystem(`Smart selection: ${relevantFiles.length}/${projectFiles?.length || 0} files selected`);

  // Format selected files for context
  const filesContext = relevantFiles.map(f => ({
    path: f.path,
    content: f.content.length > 50000 ? f.content.slice(0, 50000) : f.content,
  }));

  // Build enriched history with file operation info
  const enrichedHistory = buildEnrichedHistory(conversationHistory);

  // Get the Supabase URL from env
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase env vars missing:', { supabaseUrl: !!supabaseUrl, supabaseKey: !!supabaseKey });
    yield { type: 'error', error: 'Supabase configuration missing' };
    return;
  }

  // Log files being sent
  relevantFiles.forEach(f => {
    sysConsole.logFileRead(f.path, f.content.length);
  });

  try {
    const bodyPayload = JSON.stringify({
      prompt: context ? `${prompt}\n\n=== CONTEXT / KNOWLEDGE ===\n${context}` : prompt,
      history: enrichedHistory,
      projectFiles: filesContext,
      type: 'generate-stream'
    });

    sysConsole.logApiRequest('generate-vibe (stream)', bodyPayload.length);

    const response = await fetch(`${supabaseUrl}/functions/v1/generate-vibe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: bodyPayload,
    });

    if (!response.ok) {
      const errorText = await response.text();
      sysConsole.logApiResponse(response.status, errorText, Date.now() - startTime);
      yield { type: 'error', error: errorText };
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      yield { type: 'error', error: 'No response body' };
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete SSE messages
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || ''; // Keep incomplete message in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const event = JSON.parse(line.slice(6)) as StreamEvent;

            // Log streaming events
            if (event.type === 'thinking') {
              sysConsole.logSystem('AI started thinking...');
            } else if (event.type === 'done') {
              sysConsole.logApiResponse(200, 'Stream complete', Date.now() - startTime);
              if (event.thought) {
                sysConsole.logAIThought(event.thought);
              }
              if (event.files) {
                sysConsole.logParsing('success', `${event.files.length} file operations`);
                sysConsole.logAIResponse(event.message || 'Done', event.files.length);
              }
            }

            yield event;
          } catch (e) {
            sysConsole.logError('Failed to parse SSE event', e instanceof Error ? e : undefined);
          }
        }
      }
    }

    // Process any remaining buffer
    if (buffer.startsWith('data: ')) {
      try {
        const event = JSON.parse(buffer.slice(6)) as StreamEvent;
        yield event;
      } catch (e) {
        sysConsole.logError('Failed to parse final SSE event', e instanceof Error ? e : undefined);
      }
    }
  } catch (error) {
    sysConsole.logError('Network error during streaming', error instanceof Error ? error : undefined);
    yield {
      type: 'error',
      error: error instanceof Error ? error.message : 'Network error'
    };
  }
}

export async function generateVibe(
  prompt: string,
  conversationHistory: ConversationMessage[],
  projectFiles?: ProjectFile[],
  context?: string
): Promise<GenerateVibeResponse> {
  const sysConsole = getSysConsole();

  // Smart file selection - only send relevant files  
  const relevantFiles = projectFiles
    ? selectRelevantFiles(projectFiles, prompt, conversationHistory, 15)
    : [];

  sysConsole.logSystem(`Smart selection: ${relevantFiles.length}/${projectFiles?.length || 0} files for non-streaming`);

  // Format selected files for context
  const filesContext = relevantFiles.map(f => ({
    path: f.path,
    content: f.content.length > 50000 ? f.content.slice(0, 50000) : f.content,
  }));

  // Build enriched history
  const enrichedHistory = buildEnrichedHistory(conversationHistory);

  const { data, error } = await supabase.functions.invoke('generate-vibe', {
    body: {
      prompt: context ? `${prompt}\n\n=== CONTEXT / KNOWLEDGE ===\n${context}` : prompt,
      history: enrichedHistory,
      projectFiles: filesContext,
      type: 'generate-multifile'
    }
  });

  if (error) {
    console.error('Error calling generate-vibe:', error);

    // Better error messages for common issues
    const errorMsg = error.message || '';
    if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError') || errorMsg.includes('network')) {
      throw new Error('Network error - please check your internet connection and try again');
    }
    if (errorMsg.includes('timeout') || errorMsg.includes('Timeout')) {
      throw new Error('Request timed out - the server may be busy, please try again');
    }
    if (errorMsg.includes('GEMINI_API_KEY') || errorMsg.includes('API key')) {
      throw new Error('AI service not configured - please check the GEMINI_API_KEY in Supabase secrets');
    }

    throw new Error(error.message || 'Failed to generate code');
  }

  if (data?.error) {
    console.error('API error:', data.error);
    throw new Error(data.error);
  }

  // Build debug info
  const debugInfo = {
    userPrompt: prompt,
    systemPrompt: data._systemPrompt || 'Not returned by server',
    rawResponse: JSON.stringify(data, null, 2),
    parsedResponse: {
      thought: data.thought,
      message: data.message,
      files: data.files?.map((f: { path: string; action: string }) => ({ path: f.path, action: f.action })),
      html: data.html ? 'HTML content (see raw response)' : undefined,
    },
    timestamp: new Date().toISOString(),
  };

  // Handle both legacy and new response formats
  const response: GenerateVibeResponse = {
    thought: data.thought || '',
    debugInfo,
  };

  // New multi-file format
  if (data.files && Array.isArray(data.files)) {
    response.files = data.files as FileOperation[];
    response.message = data.message || 'Generated files successfully.';
  }

  // Legacy single-file format - convert to multi-file
  else if (data.html) {
    response.html = data.html;
    response.title = data.title || 'Untitled';

    // Convert legacy HTML to a single-file operation
    response.files = [{
      path: 'src/App.tsx',
      content: convertHtmlToReact(data.html),
      action: 'modify',
    }];
    response.message = `Generated: ${data.title || 'New component'}`;
  }

  if (data.dependencies) {
    response.dependencies = data.dependencies;
  }

  return response;
}
// Convert standalone HTML to a React component
function convertHtmlToReact(html: string): string {
  // Check if it's already a React component
  if (html.includes('export default') || html.includes('function App')) {
    return html;
  }

  // Extract style tag content if present
  const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  const styles = styleMatch ? styleMatch[1] : '';

  // Extract body content or use the whole HTML
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let content = bodyMatch ? bodyMatch[1] : html;

  // Remove script tags
  content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

  // === CRITICAL JSX FIXES ===

  // 1. Fix HTML comments to JSX comments
  content = content.replace(/<!--\s*([\s\S]*?)\s*-->/g, '{/* $1 */}');

  // 2. Fix self-closing tags (CRITICAL - causes "Expected closing tag" error)
  content = content.replace(/<(img|br|input|hr|meta|link|area|base|col|embed|keygen|param|source|track|wbr)(\s+[^>]*)?>/gi, (match, tag, attrs) => {
    if (match.endsWith('/>')) return match;
    return `<${tag}${attrs || ''} />`;
  });

  // 3. Fix class= to className=
  content = content.replace(/\bclass=/g, 'className=');

  // 4. Fix for= to htmlFor=
  content = content.replace(/\bfor=/g, 'htmlFor=');

  // 5. Fix event handlers
  content = content.replace(/\bonclick=/gi, 'onClick=');
  content = content.replace(/\bonchange=/gi, 'onChange=');
  content = content.replace(/\bonsubmit=/gi, 'onSubmit=');
  content = content.replace(/\bonkeydown=/gi, 'onKeyDown=');
  content = content.replace(/\bonkeyup=/gi, 'onKeyUp=');
  content = content.replace(/\bonfocus=/gi, 'onFocus=');
  content = content.replace(/\bonblur=/gi, 'onBlur=');

  // 6. Fix other attributes
  content = content.replace(/\btabindex=/gi, 'tabIndex=');
  content = content.replace(/\bcolspan=/gi, 'colSpan=');
  content = content.replace(/\browspan=/gi, 'rowSpan=');
  content = content.replace(/\breadonly\b/gi, 'readOnly');
  content = content.replace(/\bmaxlength=/gi, 'maxLength=');
  content = content.replace(/\bminlength=/gi, 'minLength=');
  content = content.replace(/\bautocomplete=/gi, 'autoComplete=');
  content = content.replace(/\bautofocus\b/gi, 'autoFocus');
  content = content.replace(/\bplaceholder=/gi, 'placeholder=');

  return `import { useState } from 'react';

function App() {
  return (
    <>
      ${content.trim()}
    </>
  );
}

export default App;
`;
}

export async function generateRandomIdea(): Promise<string> {
  const { data, error } = await supabase.functions.invoke('generate-vibe', {
    body: { type: 'random' }
  });

  if (error) {
    console.error('Error calling generate-vibe for random idea:', error);
    throw new Error(error.message || 'Failed to generate random idea');
  }

  if (data.error) {
    console.error('API error:', data.error);
    throw new Error(data.error);
  }

  return data.idea || 'Build something amazing!';
}

// Generate an execution plan for Plan Mode
export interface AgentPlanResponse {
  id: string;
  summary: string;
  reasoning: string;
  phases: Array<{
    id: string;
    name: string;
    description: string;
    status: 'pending' | 'in-progress' | 'complete' | 'failed';
    filesToCreate: string[];
    filesToModify: string[];
    validationCriteria: string[];
  }>;
  estimatedComplexity: 'simple' | 'moderate' | 'complex';
  suggestedDependencies: string[];
}

export async function generatePlan(
  prompt: string,
  projectFiles?: ProjectFile[]
): Promise<AgentPlanResponse> {
  const sysConsole = getSysConsole();
  sysConsole.logSystem('Generating execution plan...');

  const { data, error } = await supabase.functions.invoke('generate-vibe', {
    body: {
      type: 'generate-plan',
      prompt,
      projectFiles: projectFiles?.map(f => ({
        path: f.path,
        content: f.content.slice(0, 10000) // Limit for planning
      }))
    }
  });

  if (error) {
    console.error('Error generating plan:', error);
    throw new Error(error.message || 'Failed to generate plan');
  }

  if (!data.success || !data.plan) {
    throw new Error(data.error || 'Failed to generate plan');
  }

  sysConsole.logSystem(`Plan generated: ${data.plan.phases?.length || 0} phases`);

  // Add unique ID to plan
  return {
    id: `plan-${Date.now()}`,
    ...data.plan
  };
}
