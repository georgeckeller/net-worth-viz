/**
 * Secure logging utility for Cloud Functions.
 *
 * Uses GCP Cloud Logging structured format:
 * - `severity` field is recognized by Cloud Logging for log level filtering
 * - `console.error` with Error objects auto-reports to Cloud Error Reporting
 * - Sensitive data (tokens, passwords, IPs) is sanitized before logging
 *
 * @see https://cloud.google.com/logging/docs/structured-logging
 */

type Severity = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR';

interface LogContext {
  endpoint?: string;
  userId?: string;
  ip?: string;
  durationMs?: number;
  [key: string]: unknown;
}

/**
 * Sanitize error object to prevent information leakage
 */
function sanitizeError(error: unknown): { type: string; message: string; code?: string } {
  if (error instanceof Error) {
    return {
      type: error.constructor.name,
      message: error.message.substring(0, 200),
      code: (error as NodeJS.ErrnoException).code,
    };
  }

  if (typeof error === 'string') {
    return {
      type: 'StringError',
      message: error.substring(0, 200),
    };
  }

  return {
    type: 'UnknownError',
    message: 'An error occurred',
  };
}

/**
 * Sanitize context object to remove sensitive data
 */
function sanitizeContext(context: LogContext): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  if (context.endpoint) sanitized.endpoint = context.endpoint;
  if (context.durationMs !== undefined) sanitized.durationMs = context.durationMs;
  if (context.ip) {
    const ipParts = context.ip.split('.');
    if (ipParts.length === 4) {
      sanitized.ip = `***.***.***.${ipParts[3]}`;
    } else {
      sanitized.ip = '***';
    }
  }

  // Never log: tokens, passwords, keys, full errors, user data

  return sanitized;
}

function log(severity: Severity, message: string, context: LogContext, error?: unknown): void {
  const entry: Record<string, unknown> = {
    severity,
    message,
    context: sanitizeContext(context),
    timestamp: new Date().toISOString(),
  };

  if (error !== undefined) {
    entry.error = sanitizeError(error);
  }

  // Use console.error for ERROR severity so Cloud Error Reporting picks it up
  if (severity === 'ERROR') {
    console.error(JSON.stringify(entry));
  } else if (severity === 'WARNING') {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

/**
 * Log an error — appears in Cloud Error Reporting automatically
 */
export function logError(message: string, error: unknown, context: LogContext = {}): void {
  log('ERROR', message, context, error);
}

/**
 * Log a warning
 */
export function logWarning(message: string, context: LogContext = {}): void {
  log('WARNING', message, context);
}

/**
 * Log an info message
 */
export function logInfo(message: string, context: LogContext = {}): void {
  log('INFO', message, context);
}

/**
 * Create a request timer for measuring handler duration.
 * Usage:
 *   const timer = startTimer('verifyPassword');
 *   // ... handle request ...
 *   timer.done(); // logs duration
 */
export function startTimer(endpoint: string): { done: (context?: LogContext) => void } {
  const start = Date.now();
  return {
    done(context: LogContext = {}) {
      const durationMs = Date.now() - start;
      logInfo(`${endpoint} completed`, { ...context, endpoint, durationMs });
    },
  };
}
