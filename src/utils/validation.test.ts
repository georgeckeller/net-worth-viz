import { describe, test, expect } from 'vitest';
import { validateSheetId, getSheetIdValidationError } from './validation';

// A realistic sample sheet ID for testing (not a real document)
const VALID_SHEET_ID = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms';

describe('validateSheetId', () => {
  test('should accept valid Google Sheet ID', () => {
    expect(validateSheetId(VALID_SHEET_ID)).toBe(true);
  });

  test('should accept minimum length sheet ID', () => {
    expect(validateSheetId('abcdefghij')).toBe(true);
  });

  test('should accept maximum length sheet ID', () => {
    expect(validateSheetId('a'.repeat(44))).toBe(true);
  });

  test('should accept sheet ID with hyphens and underscores', () => {
    expect(validateSheetId('abc-def_ghi-123')).toBe(true);
  });

  test('should reject null', () => {
    expect(validateSheetId(null)).toBe(false);
  });

  test('should reject undefined', () => {
    expect(validateSheetId(undefined)).toBe(false);
  });

  test('should reject empty string', () => {
    expect(validateSheetId('')).toBe(false);
  });

  test('should reject too short sheet ID', () => {
    expect(validateSheetId('abcdefghi')).toBe(false);
  });

  test('should reject too long sheet ID', () => {
    expect(validateSheetId('a'.repeat(45))).toBe(false);
  });

  test('should reject invalid characters', () => {
    expect(validateSheetId('abc!@#$%^&*()')).toBe(false);
  });
});

describe('getSheetIdValidationError', () => {
  test('should return null for valid sheet ID', () => {
    expect(getSheetIdValidationError(VALID_SHEET_ID)).toBeNull();
  });

  test('should return error for null', () => {
    expect(getSheetIdValidationError(null)).toBe('Sheet ID is required');
  });

  test('should return error for undefined', () => {
    expect(getSheetIdValidationError(undefined)).toBe('Sheet ID is required');
  });

  test('should return error for too short', () => {
    expect(getSheetIdValidationError('abc')).toBe('Sheet ID must be at least 10 characters long');
  });

  test('should return error for too long', () => {
    expect(getSheetIdValidationError('a'.repeat(50))).toBe('Sheet ID must be no more than 44 characters long');
  });

  test('should return error for invalid characters', () => {
    expect(getSheetIdValidationError('abcdefghij!')).toBe('Sheet ID can only contain letters, numbers, hyphens, and underscores');
  });
});
