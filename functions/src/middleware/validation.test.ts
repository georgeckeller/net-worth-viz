import { validateSheetId, sanitizeInput } from './validation';

// Read from environment (never committed to git)
const VALID_SHEET_ID = process.env.VITE_SHEET_ID || 'abcdefghij';

describe('validateSheetId', () => {
  test('should accept valid Google Sheet ID', () => {
    expect(validateSheetId(VALID_SHEET_ID)).toBe(true);
  });

  test('should accept minimum length sheet ID (10 chars)', () => {
    expect(validateSheetId('abcdefghij')).toBe(true);
  });

  test('should accept maximum length sheet ID (44 chars)', () => {
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

  test('should reject too short sheet ID (less than 10 chars)', () => {
    expect(validateSheetId('abcdefghi')).toBe(false);
  });

  test('should reject too long sheet ID (more than 44 chars)', () => {
    expect(validateSheetId('a'.repeat(45))).toBe(false);
  });

  test('should reject sheet ID with invalid characters', () => {
    expect(validateSheetId('abc!@#$%^&*()')).toBe(false);
  });

  test('should reject sheet ID with spaces', () => {
    expect(validateSheetId('abc def ghij')).toBe(false);
  });

  test('should trim whitespace and validate', () => {
    expect(validateSheetId('  abcdefghij  ')).toBe(true);
  });
});

describe('sanitizeInput', () => {
  test('should return empty string for null', () => {
    expect(sanitizeInput(null)).toBe('');
  });

  test('should return empty string for undefined', () => {
    expect(sanitizeInput(undefined)).toBe('');
  });

  test('should trim whitespace', () => {
    expect(sanitizeInput('  hello world  ')).toBe('hello world');
  });

  test('should remove null bytes', () => {
    expect(sanitizeInput('hello\x00world')).toBe('helloworld');
  });

  test('should remove control characters', () => {
    expect(sanitizeInput('hello\x01\x02\x03world')).toBe('helloworld');
  });

  test('should preserve newlines, tabs, and carriage returns', () => {
    expect(sanitizeInput('hello\n\t\rworld')).toBe('hello\n\t\rworld');
  });

  test('should truncate input longer than 1000 characters', () => {
    const longInput = 'a'.repeat(1500);
    expect(sanitizeInput(longInput).length).toBe(1000);
  });

  test('should handle normal input unchanged', () => {
    expect(sanitizeInput('Normal text 123')).toBe('Normal text 123');
  });
});
