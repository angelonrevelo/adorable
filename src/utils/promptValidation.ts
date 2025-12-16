/**
 * Prompt Validation Utility
 * Validates and sanitizes prompts before sending to AI
 */

import { estimateTokens, TOKEN_LIMITS } from './tokenCounter';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitized: string;
  complexity: 'simple' | 'moderate' | 'complex';
  estimatedTokens: number;
}

/**
 * Validates a user prompt before sending to the AI
 */
export function validatePrompt(prompt: string, contextTokens: number = 0): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let sanitized = prompt;

  // 1. Check if prompt is empty (allow short conversational prompts)
  if (!prompt || prompt.trim().length === 0) {
    errors.push('Prompt cannot be empty');
  }
  // Note: Removed minimum length check to allow conversational prompts like "hi", "ok", etc.
  // The backend will handle these gracefully

  // 2. Check if prompt is too long
  const estimatedTokens = estimateTokens(prompt);
  const totalTokens = estimatedTokens + contextTokens;

  if (estimatedTokens > 10000) {
    errors.push('Prompt is too long. Please break it into smaller requests.');
  } else if (estimatedTokens > 5000) {
    warnings.push('Very long prompt. Consider breaking it into smaller requests for better results.');
  }

  // 3. Check total token budget
  if (totalTokens > TOKEN_LIMITS['safe-limit']) {
    errors.push('Total context size exceeds safe limit. Please reduce prompt length or clear conversation.');
  } else if (totalTokens > TOKEN_LIMITS['safe-limit'] * 0.8) {
    warnings.push('Approaching token limit. Consider clearing conversation history soon.');
  }

  // 4. Sanitize prompt (remove excessive whitespace, special characters that could break parsing)
  sanitized = prompt
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[^\x00-\x7F\u0080-\uFFFF]/g, ''); // Remove non-printable characters

  // 5. Check for potentially problematic patterns
  if (sanitized.includes('```') && !sanitized.includes('```\n')) {
    warnings.push('Code blocks detected. Make sure they are properly formatted.');
  }

  // 6. Check for very large file content pasted (common mistake)
  if (sanitized.length > 5000 && !sanitized.includes(' ')) {
    warnings.push('Prompt appears to contain large blocks of code without spaces. Consider describing what you want instead.');
  }

  // 7. Determine complexity
  const complexity = determineComplexity(sanitized);

  // 8. Check for vague requests
  const vaguePatterns = [
    /^make it better$/i,
    /^fix it$/i,
    /^improve$/i,
    /^help$/i,
    /^do something$/i,
  ];

  if (vaguePatterns.some(pattern => pattern.test(sanitized))) {
    warnings.push('Request is vague. Please be more specific about what you want.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    sanitized,
    complexity,
    estimatedTokens,
  };
}

/**
 * Determines the complexity of a prompt
 */
function determineComplexity(prompt: string): 'simple' | 'moderate' | 'complex' {
  const lowerPrompt = prompt.toLowerCase();

  // Count complexity indicators
  let complexityScore = 0;

  // Multiple files or components mentioned
  const componentMatches = prompt.match(/(?:component|page|hook|util|service|store)/gi);
  if (componentMatches && componentMatches.length > 1) complexityScore += 2;

  // Advanced features
  const advancedFeatures = [
    'authentication', 'auth', 'login', 'database', 'api', 'websocket',
    'real-time', 'animation', 'chart', 'graph', '3d', 'map', 'payment',
    'drag and drop', 'upload', 'download', 'export', 'import'
  ];
  advancedFeatures.forEach(feature => {
    if (lowerPrompt.includes(feature)) complexityScore += 1;
  });

  // State management
  if (lowerPrompt.includes('state') || lowerPrompt.includes('zustand') || lowerPrompt.includes('context')) {
    complexityScore += 1;
  }

  // Forms and validation
  if ((lowerPrompt.includes('form') && lowerPrompt.includes('validation')) || lowerPrompt.includes('zod')) {
    complexityScore += 1;
  }

  // Multiple pages/routes
  if (lowerPrompt.includes('page') && lowerPrompt.includes('route')) {
    complexityScore += 2;
  }

  // Length-based scoring
  if (prompt.length > 500) complexityScore += 1;
  if (prompt.length > 1000) complexityScore += 2;

  // Determine final complexity
  if (complexityScore <= 2) return 'simple';
  if (complexityScore <= 5) return 'moderate';
  return 'complex';
}

/**
 * Checks if a prompt contains potentially harmful content
 */
export function checkForHarmfulContent(prompt: string): { safe: boolean; reason?: string } {
  const lowerPrompt = prompt.toLowerCase();

  // Check for attempts to manipulate the system prompt
  const systemPromptPatterns = [
    'ignore previous instructions',
    'ignore all instructions',
    'system prompt',
    'you are now',
    'forget everything',
    'new instructions',
  ];

  for (const pattern of systemPromptPatterns) {
    if (lowerPrompt.includes(pattern)) {
      return { safe: false, reason: 'Prompt appears to contain system prompt manipulation' };
    }
  }

  // Check for injection attempts
  if (lowerPrompt.includes('<script>') || lowerPrompt.includes('javascript:')) {
    return { safe: false, reason: 'Prompt contains potentially malicious code' };
  }

  return { safe: true };
}

/**
 * Suggests improvements to a prompt
 */
export function suggestPromptImprovements(prompt: string): string[] {
  const suggestions: string[] = [];
  const lowerPrompt = prompt.toLowerCase();

  // Too short
  if (prompt.length < 20) {
    suggestions.push('Add more detail about what you want to build');
  }

  // No mention of styling
  if (!lowerPrompt.includes('style') && !lowerPrompt.includes('design') && !lowerPrompt.includes('look')) {
    suggestions.push('Consider specifying the visual style you want');
  }

  // No mention of functionality
  if (prompt.length < 50 && !lowerPrompt.includes('should') && !lowerPrompt.includes('can')) {
    suggestions.push('Describe what the component should do');
  }

  // Vague sizing
  if (lowerPrompt.includes('button') && !lowerPrompt.includes('big') && !lowerPrompt.includes('small') && !lowerPrompt.includes('size')) {
    suggestions.push('Specify the size or style of UI elements');
  }

  return suggestions;
}

/**
 * Enriches a prompt with context to help the AI
 */
export function enrichPromptWithContext(
  prompt: string,
  options: {
    hasExistingCode?: boolean;
    fileCount?: number;
    framework?: string;
  }
): string {
  let enriched = prompt;

  // Add context hints
  if (options.hasExistingCode && !prompt.toLowerCase().includes('modify') && !prompt.toLowerCase().includes('add to')) {
    enriched += '\n[Context: This is an existing project with code already written]';
  }

  return enriched;
}
