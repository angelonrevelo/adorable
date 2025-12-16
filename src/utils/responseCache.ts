/**
 * Response Cache Utility
 * Caches AI responses to reduce API calls for similar prompts
 */

export interface CacheEntry<T> {
  key: string;
  value: T;
  timestamp: number;
  hits: number;
}

export interface CacheStats {
  size: number;
  hits: number;
  misses: number;
  hitRate: number;
}

/**
 * Simple in-memory cache with TTL and LRU eviction
 */
export class ResponseCache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private maxSize: number;
  private ttl: number; // Time to live in milliseconds
  private hits: number = 0;
  private misses: number = 0;

  constructor(maxSize: number = 100, ttl: number = 15 * 60 * 1000) { // 15 minutes default
    this.cache = new Map();
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  /**
   * Generate a cache key from a prompt and context
   */
  static generateKey(prompt: string, contextHash?: string): string {
    const normalized = prompt.trim().toLowerCase().replace(/\s+/g, ' ');
    const base = `${normalized}${contextHash || ''}`;
    return this.simpleHash(base);
  }

  /**
   * Simple string hashing function
   */
  private static simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get an item from the cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    // Update hit count and move to end (LRU)
    entry.hits++;
    this.hits++;
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  /**
   * Set an item in the cache
   */
  set(key: string, value: T): void {
    // If at capacity, remove least recently used (first item)
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      key,
      value,
      timestamp: Date.now(),
      hits: 0,
    });
  }

  /**
   * Check if a key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Remove expired entries
   */
  cleanup(): number {
    let removed = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
        removed++;
      }
    }

    return removed;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? (this.hits / total) * 100 : 0,
    };
  }

  /**
   * Get all cache entries (for debugging)
   */
  getEntries(): CacheEntry<T>[] {
    return Array.from(this.cache.values());
  }

  /**
   * Get the most frequently accessed entries
   */
  getTopEntries(limit: number = 10): CacheEntry<T>[] {
    return Array.from(this.cache.values())
      .sort((a, b) => b.hits - a.hits)
      .slice(0, limit);
  }
}

/**
 * Singleton cache instance for AI responses
 */
export const aiResponseCache = new ResponseCache<any>(50, 15 * 60 * 1000);

/**
 * Cache warming - preload common prompts
 */
export function warmCache(commonPrompts: Array<{ prompt: string; response: any }>): void {
  commonPrompts.forEach(({ prompt, response }) => {
    const key = ResponseCache.generateKey(prompt);
    aiResponseCache.set(key, response);
  });
}

/**
 * Export cache to JSON for persistence
 */
export function exportCache<T>(cache: ResponseCache<T>): string {
  return JSON.stringify({
    entries: cache.getEntries(),
    stats: cache.getStats(),
    timestamp: Date.now(),
  }, null, 2);
}

/**
 * Import cache from JSON
 */
export function importCache<T>(cache: ResponseCache<T>, json: string): void {
  try {
    const data = JSON.parse(json);
    cache.clear();

    data.entries.forEach((entry: CacheEntry<T>) => {
      cache.set(entry.key, entry.value);
    });
  } catch (error) {
    console.error('Failed to import cache:', error);
  }
}
