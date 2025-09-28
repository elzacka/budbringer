export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN'
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
  resetTimeout: number;
}

export interface CircuitBreakerStats {
  state: CircuitState;
  failures: number;
  successes: number;
  lastFailureTime?: number;
  nextAttemptTime?: number;
}

const DEFAULT_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  successThreshold: 2,
  timeout: 10000,
  resetTimeout: 60000
};

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: number = 0;
  private successes: number = 0;
  private lastFailureTime?: number;
  private nextAttemptTime?: number;
  private config: CircuitBreakerConfig;

  constructor(
    private name: string,
    config?: Partial<CircuitBreakerConfig>
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() < (this.nextAttemptTime || 0)) {
        throw new Error(`Circuit breaker [${this.name}] is OPEN. Next attempt at ${new Date(this.nextAttemptTime!).toISOString()}`);
      }
      this.state = CircuitState.HALF_OPEN;
      console.log(`Circuit breaker [${this.name}] transitioning to HALF_OPEN`);
    }

    try {
      const result = await this.executeWithTimeout(fn);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private async executeWithTimeout<T>(fn: () => Promise<T>): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Circuit breaker [${this.name}] timeout after ${this.config.timeout}ms`)), this.config.timeout)
      )
    ]);
  }

  private onSuccess(): void {
    this.failures = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successes++;
      if (this.successes >= this.config.successThreshold) {
        console.log(`Circuit breaker [${this.name}] transitioning to CLOSED after ${this.successes} successes`);
        this.state = CircuitState.CLOSED;
        this.successes = 0;
      }
    }
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.state === CircuitState.HALF_OPEN) {
      console.log(`Circuit breaker [${this.name}] transitioning to OPEN after failure in HALF_OPEN state`);
      this.state = CircuitState.OPEN;
      this.nextAttemptTime = Date.now() + this.config.resetTimeout;
      this.successes = 0;
    }

    if (this.failures >= this.config.failureThreshold) {
      console.log(`Circuit breaker [${this.name}] transitioning to OPEN after ${this.failures} failures`);
      this.state = CircuitState.OPEN;
      this.nextAttemptTime = Date.now() + this.config.resetTimeout;
    }
  }

  getStats(): CircuitBreakerStats {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime,
      nextAttemptTime: this.nextAttemptTime
    };
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = undefined;
    this.nextAttemptTime = undefined;
    console.log(`Circuit breaker [${this.name}] manually reset to CLOSED`);
  }
}

export class CircuitBreakerRegistry {
  private breakers: Map<string, CircuitBreaker> = new Map();

  getOrCreate(name: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    if (!this.breakers.has(name)) {
      this.breakers.set(name, new CircuitBreaker(name, config));
    }
    return this.breakers.get(name)!;
  }

  get(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }

  getAllStats(): Record<string, CircuitBreakerStats> {
    const stats: Record<string, CircuitBreakerStats> = {};
    for (const [name, breaker] of this.breakers.entries()) {
      stats[name] = breaker.getStats();
    }
    return stats;
  }

  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
  }
}

export const circuitBreakerRegistry = new CircuitBreakerRegistry();

export async function executeWithFallbacks<T>(
  name: string,
  primaryFn: () => Promise<T>,
  fallbackFns: Array<() => Promise<T>>,
  config?: Partial<CircuitBreakerConfig>
): Promise<T> {
  const breaker = circuitBreakerRegistry.getOrCreate(name, config);

  try {
    return await breaker.execute(primaryFn);
  } catch (primaryError) {
    console.warn(`Primary function failed for [${name}]:`, primaryError);

    for (let i = 0; i < fallbackFns.length; i++) {
      const fallbackName = `${name}-fallback-${i + 1}`;
      const fallbackBreaker = circuitBreakerRegistry.getOrCreate(fallbackName, config);

      try {
        console.log(`Attempting fallback ${i + 1} for [${name}]`);
        return await fallbackBreaker.execute(fallbackFns[i]);
      } catch (fallbackError) {
        console.warn(`Fallback ${i + 1} failed for [${name}]:`, fallbackError);
        if (i === fallbackFns.length - 1) {
          throw new Error(`All attempts failed for [${name}]`);
        }
      }
    }

    throw primaryError;
  }
}