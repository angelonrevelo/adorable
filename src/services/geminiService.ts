import { supabase } from "@/integrations/supabase/client";
import { GenerateVibeResponse, FileOperation } from "@/types";
import { ProjectFile } from "@/types/projectTypes";

interface HistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function generateVibe(
  prompt: string,
  history: HistoryMessage[],
  projectFiles?: ProjectFile[]
): Promise<GenerateVibeResponse> {
  // Format project files as context if provided
  const filesContext = projectFiles?.map(f => ({
    path: f.path,
    content: f.content.slice(0, 2000), // Limit content size for context
  }));

  const { data, error } = await supabase.functions.invoke('generate-vibe', {
    body: {
      prompt,
      history: history.map(m => ({ role: m.role, content: m.content })),
      projectFiles: filesContext,
      type: 'generate-multifile' // New type for multi-file generation
    }
  });

  if (error) {
    console.error('Error calling generate-vibe:', error);
    throw new Error(error.message || 'Failed to generate vibe');
  }

  if (data.error) {
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

