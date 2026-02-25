/**
 * Validation middleware for input sanitization and validation
 */

/**
 * Validates Google Sheet ID format
 * Google Sheet IDs are typically alphanumeric strings of length 44
 * They can also be shorter (minimum 10 characters)
 */
export function validateSheetId(sheetId: string | null | undefined): boolean {
  if (!sheetId || typeof sheetId !== 'string') {
    return false;
  }
  
  // Google Sheet IDs are alphanumeric, hyphens, and underscores
  // Length typically between 10-44 characters
  const sheetIdPattern = /^[a-zA-Z0-9_-]{10,44}$/;
  return sheetIdPattern.test(sheetId.trim());
}

/**
 * Sanitizes user input to prevent XSS and injection attacks
 * Removes potentially dangerous characters and trims whitespace
 */
export function sanitizeInput(input: string | null | undefined): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  // Trim whitespace
  let sanitized = input.trim();
  
  // Remove null bytes and control characters (except newlines, tabs, carriage returns)
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  
  // Limit length to prevent DoS
  const MAX_LENGTH = 1000;
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH);
  }
  
  return sanitized;
}
