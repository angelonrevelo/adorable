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

  // Handle both legacy and new response formats
  const response: GenerateVibeResponse = {
    thought: data.thought || '',
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
  // Basic conversion - wrap HTML in a React component
  // This is a simplified version; a real implementation would parse and convert properly

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

  // Remove script tags for now (would need proper handling)
  content = content.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

  // Basic HTML to JSX conversions
  content = content
    .replace(/class=/g, 'className=')
    .replace(/for=/g, 'htmlFor=')
    .replace(/onclick=/gi, 'onClick=')
    .replace(/onchange=/gi, 'onChange=');

  return `import './App.css';

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

