/**
 * Client-side error reporting service.
 * Provides structured error logging in dev and production.
 * In production on GCP, errors flow through Cloud Functions
 * which use Cloud Error Reporting automatically.
 */

type ErrorSeverity = 'warning' | 'error';

interface ErrorContext {
  component?: string;
  action?: string;
  [key: string]: unknown;
}

interface StructuredError {
  severity: ErrorSeverity;
  message: string;
  type: string;
  context: ErrorContext;
  timestamp: string;
}

function formatError(error: unknown, context: ErrorContext, severity: ErrorSeverity): StructuredError {
  const message = error instanceof Error ? error.message : String(error);
  const type = error instanceof Error ? error.constructor.name : typeof error;

  return {
    severity,
    message,
    type,
    context,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Report an error with structured context.
 * Always logs in dev. In prod, logs to console (Terser strips console.debug/log
 * but preserves console.error and console.warn).
 */
export function reportError(error: unknown, context: ErrorContext): void {
  const structured = formatError(error, context, 'error');

  if (import.meta.env.DEV) {
    console.error(`[${structured.context.component}] ${structured.context.action}:`, error);
  } else {
    // In production, console.error is preserved (not stripped by Terser)
    // and will appear in browser dev tools if needed for support
    console.error(JSON.stringify(structured));
  }
}

/**
 * Report a warning — less severe than an error, but still worth logging.
 */
export function reportWarning(error: unknown, context: ErrorContext): void {
  const structured = formatError(error, context, 'warning');

  if (import.meta.env.DEV) {
    console.warn(`[${structured.context.component}] ${structured.context.action}:`, error);
  } else {
    console.warn(JSON.stringify(structured));
  }
}
