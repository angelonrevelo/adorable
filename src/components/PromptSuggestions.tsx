import { Lightbulb, Sparkles } from 'lucide-react';
import { ProjectFile } from '@/types/projectTypes';

interface PromptSuggestionsProps {
  projectFiles: ProjectFile[];
  onSelectSuggestion: (prompt: string) => void;
}

/**
 * Generate contextual prompt suggestions based on the current project
 */
function generateSuggestions(files: ProjectFile[]): string[] {
  const suggestions: string[] = [];
  const filePaths = files.map(f => f.path.toLowerCase());
  const hasComponents = filePaths.some(p => p.includes('component'));
  const hasPages = filePaths.some(p => p.includes('page'));
  const hasStyles = filePaths.some(p => p.includes('.css') || p.includes('tailwind'));
  const hasHooks = filePaths.some(p => p.includes('hook'));
  const hasStores = filePaths.some(p => p.includes('store'));

  // General improvements
  suggestions.push('Add dark mode toggle');
  suggestions.push('Improve the UI with animations and transitions');

  // Component suggestions
  if (!hasComponents || files.length < 5) {
    suggestions.push('Create a reusable Button component');
    suggestions.push('Add a navigation header');
  }

  // Page suggestions
  if (!hasPages) {
    suggestions.push('Create an About page');
    suggestions.push('Add a contact form page');
  }

  // State management
  if (!hasStores) {
    suggestions.push('Add global state management with Zustand');
  }

  // Hooks
  if (!hasHooks) {
    suggestions.push('Create a useLocalStorage custom hook');
  }

  // Features based on project type
  if (files.length < 3) {
    // New project
    suggestions.push('Build a todo app with add/delete/toggle');
    suggestions.push('Create a weather dashboard with live API data');
    suggestions.push('Build an image gallery with grid layout');
  } else {
    // Existing project
    suggestions.push('Add error handling with retry logic');
    suggestions.push('Add loading states to async operations');
    suggestions.push('Create a modal dialog component');
    suggestions.push('Add form validation with Zod');
  }

  // Advanced features
  suggestions.push('Add drag and drop functionality');
  suggestions.push('Create a data visualization chart');
  suggestions.push('Add authentication flow');

  return suggestions.slice(0, 8); // Return top 8 suggestions
}

export function PromptSuggestions({ projectFiles, onSelectSuggestion }: PromptSuggestionsProps) {
  const suggestions = generateSuggestions(projectFiles);

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-4 h-4 text-amber-400" />
        <h3 className="text-sm font-semibold text-white">Suggestions</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {suggestions.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => onSelectSuggestion(suggestion)}
            className="text-left px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 hover:border-violet-500/50 transition-all group flex items-start gap-2"
          >
            <Sparkles className="w-3 h-3 text-violet-400 mt-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-slate-300 text-xs group-hover:text-white transition-colors">
              {suggestion}
            </span>
          </button>
        ))}
      </div>

      <p className="text-slate-500 text-xs mt-3">
        Click a suggestion to use it, or type your own prompt
      </p>
    </div>
  );
}

/**
 * Random idea generator for inspiration
 */
export function RandomIdeaButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg transition-all shadow-lg flex items-center gap-2 text-sm font-medium"
    >
      <Sparkles className="w-4 h-4" />
      Generate Random Idea
    </button>
  );
}
