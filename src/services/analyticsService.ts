/**
 * Analytics Service
 * Tracks AI performance metrics and user interactions
 */

export interface PromptMetrics {
  id: string;
  prompt: string;
  promptTokens: number;
  responseTokens: number;
  totalTokens: number;
  duration: number; // milliseconds
  success: boolean;
  errorMessage?: string;
  filesGenerated: number;
  complexity: 'simple' | 'moderate' | 'complex';
  timestamp: number;
}

export interface SessionMetrics {
  sessionId: string;
  startTime: number;
  endTime?: number;
  totalPrompts: number;
  successfulPrompts: number;
  failedPrompts: number;
  totalTokensUsed: number;
  totalDuration: number;
  averageResponseTime: number;
}

export interface AnalyticsSummary {
  totalSessions: number;
  totalPrompts: number;
  successRate: number;
  averageTokensPerPrompt: number;
  averageResponseTime: number;
  mostCommonErrors: Array<{ error: string; count: number }>;
  complexityDistribution: { simple: number; moderate: number; complex: number };
  topPrompts: Array<{ prompt: string; count: number }>;
}

class AnalyticsService {
  private metrics: PromptMetrics[] = [];
  private currentSessionId: string;
  private sessionStartTime: number;
  private readonly MAX_METRICS = 1000; // Keep last 1000 entries

  constructor() {
    this.currentSessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    this.loadFromLocalStorage();
  }

  /**
   * Generate a unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Track a prompt request
   */
  trackPrompt(metric: Omit<PromptMetrics, 'id' | 'timestamp'>): void {
    const fullMetric: PromptMetrics = {
      ...metric,
      id: `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    this.metrics.push(fullMetric);

    // Keep only the most recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }

    this.saveToLocalStorage();
    this.logMetric(fullMetric);
  }

  /**
   * Log metric to console (development only)
   */
  private logMetric(metric: PromptMetrics): void {
    if (import.meta.env.DEV) {
      console.log('[Analytics]', {
        prompt: metric.prompt.slice(0, 50) + '...',
        duration: `${metric.duration}ms`,
        tokens: metric.totalTokens,
        success: metric.success,
        files: metric.filesGenerated,
      });
    }
  }

  /**
   * Get metrics for the current session
   */
  getCurrentSessionMetrics(): SessionMetrics {
    const sessionMetrics = this.metrics.filter(
      m => m.timestamp >= this.sessionStartTime
    );

    const successful = sessionMetrics.filter(m => m.success).length;
    const totalDuration = sessionMetrics.reduce((sum, m) => sum + m.duration, 0);

    return {
      sessionId: this.currentSessionId,
      startTime: this.sessionStartTime,
      totalPrompts: sessionMetrics.length,
      successfulPrompts: successful,
      failedPrompts: sessionMetrics.length - successful,
      totalTokensUsed: sessionMetrics.reduce((sum, m) => sum + m.totalTokens, 0),
      totalDuration,
      averageResponseTime: sessionMetrics.length > 0 ? totalDuration / sessionMetrics.length : 0,
    };
  }

  /**
   * Get overall analytics summary
   */
  getSummary(): AnalyticsSummary {
    if (this.metrics.length === 0) {
      return {
        totalSessions: 0,
        totalPrompts: 0,
        successRate: 0,
        averageTokensPerPrompt: 0,
        averageResponseTime: 0,
        mostCommonErrors: [],
        complexityDistribution: { simple: 0, moderate: 0, complex: 0 },
        topPrompts: [],
      };
    }

    const successful = this.metrics.filter(m => m.success).length;
    const totalTokens = this.metrics.reduce((sum, m) => sum + m.totalTokens, 0);
    const totalDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0);

    // Count errors
    const errorCounts = new Map<string, number>();
    this.metrics.forEach(m => {
      if (!m.success && m.errorMessage) {
        const count = errorCounts.get(m.errorMessage) || 0;
        errorCounts.set(m.errorMessage, count + 1);
      }
    });

    const mostCommonErrors = Array.from(errorCounts.entries())
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Complexity distribution
    const complexityDistribution = {
      simple: this.metrics.filter(m => m.complexity === 'simple').length,
      moderate: this.metrics.filter(m => m.complexity === 'moderate').length,
      complex: this.metrics.filter(m => m.complexity === 'complex').length,
    };

    // Top prompts (by similarity)
    const promptCounts = new Map<string, number>();
    this.metrics.forEach(m => {
      const normalized = m.prompt.slice(0, 50).toLowerCase().trim();
      const count = promptCounts.get(normalized) || 0;
      promptCounts.set(normalized, count + 1);
    });

    const topPrompts = Array.from(promptCounts.entries())
      .map(([prompt, count]) => ({ prompt, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalSessions: 1, // We only track current session for now
      totalPrompts: this.metrics.length,
      successRate: (successful / this.metrics.length) * 100,
      averageTokensPerPrompt: totalTokens / this.metrics.length,
      averageResponseTime: totalDuration / this.metrics.length,
      mostCommonErrors,
      complexityDistribution,
      topPrompts,
    };
  }

  /**
   * Get metrics for a specific time range
   */
  getMetricsInRange(startTime: number, endTime: number): PromptMetrics[] {
    return this.metrics.filter(
      m => m.timestamp >= startTime && m.timestamp <= endTime
    );
  }

  /**
   * Get recent failed prompts
   */
  getRecentFailures(limit: number = 10): PromptMetrics[] {
    return this.metrics
      .filter(m => !m.success)
      .slice(-limit)
      .reverse();
  }

  /**
   * Get slowest prompts
   */
  getSlowestPrompts(limit: number = 10): PromptMetrics[] {
    return [...this.metrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  /**
   * Get prompts with most tokens
   */
  getLargestPrompts(limit: number = 10): PromptMetrics[] {
    return [...this.metrics]
      .sort((a, b) => b.totalTokens - a.totalTokens)
      .slice(0, limit);
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.currentSessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
    this.saveToLocalStorage();
  }

  /**
   * Export metrics as JSON
   */
  export(): string {
    return JSON.stringify({
      metrics: this.metrics,
      session: this.getCurrentSessionMetrics(),
      summary: this.getSummary(),
      exportedAt: Date.now(),
    }, null, 2);
  }

  /**
   * Save metrics to localStorage
   */
  private saveToLocalStorage(): void {
    try {
      localStorage.setItem('adorable_analytics', JSON.stringify(this.metrics));
    } catch (error) {
      console.error('Failed to save analytics:', error);
    }
  }

  /**
   * Load metrics from localStorage
   */
  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem('adorable_analytics');
      if (stored) {
        this.metrics = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
      this.metrics = [];
    }
  }
}

// Singleton instance
export const analyticsService = new AnalyticsService();

/**
 * Helper to track a prompt with automatic timing
 */
export function createPromptTracker() {
  const startTime = Date.now();

  return {
    complete: (params: Omit<PromptMetrics, 'id' | 'timestamp' | 'duration'>) => {
      analyticsService.trackPrompt({
        ...params,
        duration: Date.now() - startTime,
      });
    },
  };
}
