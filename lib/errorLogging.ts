/**
 * Error logging utility for centralized error handling
 * Can be extended to send errors to monitoring services like Sentry, LogRocket, etc.
 */

type ErrorSeverity = "low" | "medium" | "high" | "critical";

interface ErrorContext {
  userId?: string | undefined;
  route?: string | undefined;
  action?: string | undefined;
  metadata?: Record<string, any> | undefined;
}

class ErrorLogger {
  private static instance: ErrorLogger;
  private isProduction: boolean;

  private constructor() {
    this.isProduction = process.env.NODE_ENV === "production";
  }

  static getInstance(): ErrorLogger {
    if (!ErrorLogger.instance) {
      ErrorLogger.instance = new ErrorLogger();
    }
    return ErrorLogger.instance;
  }

  /**
   * Log an error with contextual information
   */
  logError(
    error: Error,
    severity: ErrorSeverity = "medium",
    context: ErrorContext = {}
  ): void {
    const timestamp = new Date().toISOString();
    const errorData = {
      timestamp,
      message: error.message,
      stack: error.stack,
      severity,
      ...context,
    };

    // Always log to console in development
    if (!this.isProduction) {
      console.error("[ERROR]", errorData);
    }

    // In production, we would send to a logging service
    if (this.isProduction) {
      this.sendToLoggingService(errorData);
    }

    // For critical errors, we might want to take additional actions
    if (severity === "critical") {
      this.handleCriticalError(errorData);
    }
  }

  /**
   * Track a user action that resulted in an error
   */
  trackUserError(
    error: Error,
    action: string,
    userId?: string | undefined
  ): void {
    this.logError(error, "medium", {
      userId,
      action,
      metadata: {
        userAgent:
          typeof window !== "undefined" ? window.navigator.userAgent : "server",
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Log API or external service errors
   */
  logAPIError(
    error: Error,
    endpoint: string,
    params?: object | undefined
  ): void {
    this.logError(error, "high", {
      action: "api_call",
      metadata: {
        endpoint,
        params,
        statusCode: (error as any).statusCode || (error as any).status,
      },
    });
  }

  /**
   * Send error data to an external logging service
   * This would typically integrate with Sentry, LogRocket, or a custom backend
   */
  private sendToLoggingService(errorData: any): void {
    // Example implementation - in a real app, this would send to a service like Sentry
    try {
      // Comment out the fetch call until we have a real endpoint
      /*
      fetch('/api/log-error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorData)
      });
      */
      // If using Sentry, it would look like:
      // Sentry.captureException(errorData.originalError);
    } catch (e) {
      // Fallback to console if the logging service fails
      console.error("[Logging Service Failed]", errorData, e);
    }
  }

  /**
   * Handle critical errors that require immediate attention
   */
  private handleCriticalError(errorData: any): void {
    // Critical errors might:
    // 1. Show a specific UI to the user
    // 2. Send immediate alerts to the dev team
    // 3. Attempt recovery actions

    // Example - Create an alert for the dev team
    if (this.isProduction) {
      try {
        /*
        fetch('/api/critical-alert', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(errorData)
        });
        */
      } catch (e) {
        console.error("[Critical Alert Failed]", e);
      }
    }
  }

  /**
   * Measure performance of a function and log if it exceeds threshold
   */
  async measurePerformance<T>(
    fn: () => Promise<T>,
    name: string,
    thresholdMs: number = 1000
  ): Promise<T> {
    const start = performance.now();
    try {
      return await fn();
    } finally {
      const duration = performance.now() - start;
      if (duration > thresholdMs) {
        console.warn(
          `[Performance] ${name} took ${duration.toFixed(2)}ms to execute`
        );

        // In production, we might log this to our performance monitoring system
        if (this.isProduction && duration > thresholdMs * 2) {
          this.logError(
            new Error(`Performance threshold exceeded: ${name}`),
            "low",
            {
              action: "performance_measurement",
              metadata: {
                functionName: name,
                duration,
                threshold: thresholdMs,
              },
            }
          );
        }
      }
    }
  }
}

export const logger = ErrorLogger.getInstance();

/**
 * Higher-order function to wrap async functions with error logging
 */
export function withErrorLogging<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: {
    name?: string | undefined;
    severity?: ErrorSeverity | undefined;
    rethrow?: boolean | undefined;
  } = {}
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  const { name = fn.name, severity = "medium", rethrow = true } = options;

  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args);
    } catch (error) {
      logger.logError(
        error instanceof Error ? error : new Error(String(error)),
        severity,
        {
          action: name,
          metadata: { args },
        }
      );

      if (rethrow) {
        throw error;
      }

      // Return a default value or error object if not rethrowing
      return undefined as unknown as ReturnType<T>;
    }
  };
}

export default logger;
