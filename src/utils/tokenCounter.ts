/**
 * Token Counter Utility
 * Estimates token count for text using a simple approximation algorithm
 * Based on OpenAI's token counting (roughly 1 token ≈ 4 characters for English text)
 */

export interface TokenEstimate {
  tokens: number;
  characters: number;
  words: number;
}

/**
 * Estimates the number of tokens in a text string
 * Uses a conservative estimate: 1 token ≈ 3.5 characters (to be safe)
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;

  // Remove extra whitespace
  const normalized = text.trim().replace(/\s+/g, ' ');

  // Base calculation: characters / 3.5
  const baseTokens = normalized.length / 3.5;

  // Adjust for code (code tends to use more tokens due to special characters)
  const hasCode = /[{}[\]();,.<>\/\\]/.test(text);
  const codeMultiplier = hasCode ? 1.2 : 1.0;

  return Math.ceil(baseTokens * codeMultiplier);
}

/**
 * Gets detailed token estimate with additional statistics
 */
export function getTokenEstimate(text: string): TokenEstimate {
  const characters = text.length;
  const words = text.split(/\s+/).filter(w => w.length > 0).length;
  const tokens = estimateTokens(text);

  return {
    tokens,
    characters,
    words,
  };
}

/**
 * Estimates tokens for an array of texts and returns the total
 */
export function estimateTokensForArray(texts: string[]): number {
  return texts.reduce((total, text) => total + estimateTokens(text), 0);
}

/**
 * Checks if the total tokens exceed a given limit
 */
export function exceedsTokenLimit(text: string, limit: number): boolean {
  return estimateTokens(text) > limit;
}

/**
 * Truncates text to fit within a token limit
 * Returns the truncated text and whether truncation occurred
 */
export function truncateToTokenLimit(
  text: string,
  limit: number
): { text: string; truncated: boolean } {
  const currentTokens = estimateTokens(text);

  if (currentTokens <= limit) {
    return { text, truncated: false };
  }

  // Calculate approximate characters to keep
  const targetChars = Math.floor((limit * 3.5) / 1.2); // Conservative
  const truncated = text.slice(0, targetChars) + '... [truncated]';

  return { text: truncated, truncated: true };
}

/**
 * Formats token count for display
 */
export function formatTokenCount(tokens: number): string {
  if (tokens < 1000) {
    return `${tokens} tokens`;
  }
  return `${(tokens / 1000).toFixed(1)}K tokens`;
}

/**
 * Token limits for different models
 */
export const TOKEN_LIMITS = {
  'gemini-2.0-flash': 1_000_000, // 1M input tokens
  'gemini-1.5-pro': 2_000_000,   // 2M input tokens
  'gemini-1.5-flash': 1_000_000, // 1M input tokens

  // Conservative limits for safety (50% of max)
  'safe-limit': 500_000,
} as const;

/**
 * Calculates remaining token budget
 */
export function getRemainingTokens(
  usedTokens: number,
  limit: number = TOKEN_LIMITS['safe-limit']
): number {
  return Math.max(0, limit - usedTokens);
}

/**
 * Gets token usage percentage
 */
export function getTokenUsagePercentage(
  usedTokens: number,
  limit: number = TOKEN_LIMITS['safe-limit']
): number {
  return Math.min(100, (usedTokens / limit) * 100);
}

/**
 * Determines if token usage is in warning zone (>70%)
 */
export function isTokenWarningZone(
  usedTokens: number,
  limit: number = TOKEN_LIMITS['safe-limit']
): boolean {
  return getTokenUsagePercentage(usedTokens, limit) > 70;
}

/**
 * Determines if token usage is in danger zone (>90%)
 */
export function isTokenDangerZone(
  usedTokens: number,
  limit: number = TOKEN_LIMITS['safe-limit']
): boolean {
  return getTokenUsagePercentage(usedTokens, limit) > 90;
}
