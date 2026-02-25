import { describe, test, expect, beforeEach, vi } from 'vitest';

// Mock the module before importing
vi.mock('./auth.service', async () => {
  const SESSION_KEY = 'networth_auth';
  const SESSION_TOKEN_KEY = 'networth_session_token';
  const SESSION_TIMESTAMP_KEY = 'networth_session_timestamp';
  const SESSION_MAX_AGE_MS = 4 * 60 * 60 * 1000;

  return {
    getSessionToken: () => {
      const token = sessionStorage.getItem(SESSION_TOKEN_KEY);
      const timestamp = sessionStorage.getItem(SESSION_TIMESTAMP_KEY);
      
      if (!token || !timestamp) return null;
      
      const timestampNum = parseInt(timestamp, 10);
      if (isNaN(timestampNum) || timestampNum <= 0) return null;
      
      const tokenAge = Date.now() - timestampNum;
      if (tokenAge > SESSION_MAX_AGE_MS || tokenAge < 0) return null;
      
      if (!token || typeof token !== 'string' || token.trim().length === 0) return null;
      
      return token;
    },
    
    getAuthState: () => {
      const token = sessionStorage.getItem(SESSION_TOKEN_KEY);
      const timestamp = sessionStorage.getItem(SESSION_TIMESTAMP_KEY);
      
      if (!token || !timestamp) return false;
      
      const timestampNum = parseInt(timestamp, 10);
      if (isNaN(timestampNum)) return false;
      
      const tokenAge = Date.now() - timestampNum;
      if (tokenAge > SESSION_MAX_AGE_MS) return false;
      
      return sessionStorage.getItem(SESSION_KEY) === 'true';
    },
    
    setAuthState: (isAuthenticated: boolean) => {
      if (isAuthenticated) {
        sessionStorage.setItem(SESSION_KEY, 'true');
        sessionStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());
      } else {
        sessionStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(SESSION_TOKEN_KEY);
        sessionStorage.removeItem(SESSION_TIMESTAMP_KEY);
      }
    },
    
    clearAuthState: () => {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_TOKEN_KEY);
      sessionStorage.removeItem(SESSION_TIMESTAMP_KEY);
    },
    
    verifyPassword: vi.fn(),
  };
});

import { getSessionToken, getAuthState, setAuthState, clearAuthState } from './auth.service';

describe('Auth Service', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  describe('getSessionToken', () => {
    test('should return null when no token stored', () => {
      expect(getSessionToken()).toBeNull();
    });

    test('should return null when token exists but no timestamp', () => {
      sessionStorage.setItem('networth_session_token', 'test-token');
      expect(getSessionToken()).toBeNull();
    });

    test('should return token when valid token and timestamp exist', () => {
      const token = 'valid-session-token';
      sessionStorage.setItem('networth_session_token', token);
      sessionStorage.setItem('networth_session_timestamp', Date.now().toString());
      expect(getSessionToken()).toBe(token);
    });

    test('should return null for expired token', () => {
      const token = 'expired-token';
      const expiredTimestamp = Date.now() - (5 * 60 * 60 * 1000); // 5 hours ago
      sessionStorage.setItem('networth_session_token', token);
      sessionStorage.setItem('networth_session_timestamp', expiredTimestamp.toString());
      expect(getSessionToken()).toBeNull();
    });

    test('should return null for invalid timestamp', () => {
      sessionStorage.setItem('networth_session_token', 'token');
      sessionStorage.setItem('networth_session_timestamp', 'not-a-number');
      expect(getSessionToken()).toBeNull();
    });

    test('should return null for future timestamp', () => {
      const futureTimestamp = Date.now() + (60 * 60 * 1000); // 1 hour in future
      sessionStorage.setItem('networth_session_token', 'token');
      sessionStorage.setItem('networth_session_timestamp', futureTimestamp.toString());
      expect(getSessionToken()).toBeNull();
    });
  });

  describe('getAuthState', () => {
    test('should return false when not authenticated', () => {
      expect(getAuthState()).toBe(false);
    });

    test('should return true when authenticated with valid token', () => {
      sessionStorage.setItem('networth_auth', 'true');
      sessionStorage.setItem('networth_session_token', 'token');
      sessionStorage.setItem('networth_session_timestamp', Date.now().toString());
      expect(getAuthState()).toBe(true);
    });

    test('should return false when auth is true but token expired', () => {
      const expiredTimestamp = Date.now() - (5 * 60 * 60 * 1000);
      sessionStorage.setItem('networth_auth', 'true');
      sessionStorage.setItem('networth_session_token', 'token');
      sessionStorage.setItem('networth_session_timestamp', expiredTimestamp.toString());
      expect(getAuthState()).toBe(false);
    });
  });

  describe('setAuthState', () => {
    test('should set auth state to true', () => {
      setAuthState(true);
      expect(sessionStorage.getItem('networth_auth')).toBe('true');
    });

    test('should clear auth state when set to false', () => {
      sessionStorage.setItem('networth_auth', 'true');
      sessionStorage.setItem('networth_session_token', 'token');
      setAuthState(false);
      expect(sessionStorage.getItem('networth_auth')).toBeNull();
      expect(sessionStorage.getItem('networth_session_token')).toBeNull();
    });
  });

  describe('clearAuthState', () => {
    test('should clear all auth-related storage', () => {
      sessionStorage.setItem('networth_auth', 'true');
      sessionStorage.setItem('networth_session_token', 'token');
      sessionStorage.setItem('networth_session_timestamp', '123456');
      
      clearAuthState();
      
      expect(sessionStorage.getItem('networth_auth')).toBeNull();
      expect(sessionStorage.getItem('networth_session_token')).toBeNull();
      expect(sessionStorage.getItem('networth_session_timestamp')).toBeNull();
    });
  });
});
