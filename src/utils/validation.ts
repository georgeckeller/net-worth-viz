/**
 * Client-side validation utilities
 */

/**
 * Validates Google Sheet ID format
 * Google Sheet IDs are typically alphanumeric strings of length 10-44
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
 * Get user-friendly error message for invalid Sheet ID
 */
export function getSheetIdValidationError(sheetId: string | null | undefined): string | null {
  if (!sheetId || typeof sheetId !== 'string') {
    return 'Sheet ID is required';
  }
  
  const trimmed = sheetId.trim();
  
  if (trimmed.length < 10) {
    return 'Sheet ID must be at least 10 characters long';
  }
  
  if (trimmed.length > 44) {
    return 'Sheet ID must be no more than 44 characters long';
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return 'Sheet ID can only contain letters, numbers, hyphens, and underscores';
  }
  
  return null;
}
