import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useAuth } from './useAuth';

// Mock dependencies
vi.mock('../services/auth.service', () => ({
  verifyPassword: vi.fn(),
  setAuthState: vi.fn(),
  getAuthState: vi.fn(() => false),
  clearAuthState: vi.fn(),
}));

vi.mock('../services/biometric.service', () => ({
  isBiometricsAvailable: vi.fn(async () => false),
  isBiometricsConfigured: vi.fn(() => false),
  registerBiometrics: vi.fn(async () => false),
  loginWithBiometrics: vi.fn(async () => false),
}));

vi.mock('../services/error.service', () => ({
  reportError: vi.fn(),
  reportWarning: vi.fn(),
}));

import { verifyPassword, setAuthState, getAuthState, clearAuthState } from '../services/auth.service';
import { isBiometricsAvailable, isBiometricsConfigured, registerBiometrics, loginWithBiometrics } from '../services/biometric.service';
import { reportError } from '../services/error.service';

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    localStorage.clear();
  });

  test('initializes as not authenticated', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isAuthenticated).toBe(false);
  });

  test('checks auth state on mount', () => {
    vi.mocked(getAuthState).mockReturnValue(true);
    const { result } = renderHook(() => useAuth());
    expect(result.current.isAuthenticated).toBe(true);
  });

  test('checks biometrics availability on mount', async () => {
    vi.mocked(isBiometricsAvailable).mockResolvedValue(true);
    vi.mocked(isBiometricsConfigured).mockReturnValue(true);

    const { result } = renderHook(() => useAuth());

    // Wait for async biometrics check
    await act(async () => { });

    expect(result.current.isBiometricsAvailable).toBe(true);
    expect(result.current.isBiometricsEnabled).toBe(true);
  });

  describe('login', () => {
    test('returns true on successful password verification', async () => {
      vi.mocked(verifyPassword).mockResolvedValue(true);

      const { result } = renderHook(() => useAuth());
      let success: boolean;

      await act(async () => {
        success = await result.current.login('correct-password');
      });

      expect(success!).toBe(true);
      expect(result.current.isAuthenticated).toBe(true);
      expect(setAuthState).toHaveBeenCalledWith(true, true);
    });

    test('returns false on failed password verification', async () => {
      vi.mocked(verifyPassword).mockResolvedValue(false);

      const { result } = renderHook(() => useAuth());
      let success: boolean;

      await act(async () => {
        success = await result.current.login('wrong-password');
      });

      expect(success!).toBe(false);
    });

    test('throws and clears auth on verification error', async () => {
      vi.mocked(verifyPassword).mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAuth());

      let thrownError: Error | undefined;
      await act(async () => {
        try {
          await result.current.login('any-password');
        } catch (e) {
          thrownError = e as Error;
        }
      });

      expect(thrownError?.message).toBe('Network error');
      expect(setAuthState).toHaveBeenCalledWith(false);
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('logout', () => {
    test('clears auth state and persistent storage', async () => {
      vi.mocked(getAuthState).mockReturnValue(true);
      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.logout();
      });

      expect(clearAuthState).toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
      expect(localStorage.getItem('networth_persistent_token')).toBeNull();
      expect(localStorage.getItem('networth_persistent_timestamp')).toBeNull();
    });
  });

  describe('enableBiometrics', () => {
    test('requires recent password login', async () => {
      const { result } = renderHook(() => useAuth());
      let success: boolean;

      await act(async () => {
        success = await result.current.enableBiometrics();
      });

      expect(success!).toBe(false);
      expect(registerBiometrics).not.toHaveBeenCalled();
    });

    test('registers biometrics after password login', async () => {
      sessionStorage.setItem('networth_password_login', 'true');
      sessionStorage.setItem('networth_session_token', 'test-session-token');
      vi.mocked(registerBiometrics).mockResolvedValue(true);

      const { result } = renderHook(() => useAuth());
      let success: boolean;

      await act(async () => {
        success = await result.current.enableBiometrics();
      });

      expect(success!).toBe(true);
      expect(result.current.isBiometricsEnabled).toBe(true);
    });

    test('reports error on registration failure', async () => {
      sessionStorage.setItem('networth_password_login', 'true');
      vi.mocked(registerBiometrics).mockRejectedValue(new Error('WebAuthn failed'));

      const { result } = renderHook(() => useAuth());
      let success: boolean;

      await act(async () => {
        success = await result.current.enableBiometrics();
      });

      expect(success!).toBe(false);
      expect(reportError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({ component: 'useAuth', action: 'enableBiometrics' })
      );
    });
  });

  describe('loginWithBiometrics', () => {
    test('returns false when biometric login fails', async () => {
      vi.mocked(loginWithBiometrics).mockResolvedValue(false);

      const { result } = renderHook(() => useAuth());
      let success: boolean;

      await act(async () => {
        success = await result.current.loginWithBiometrics();
      });

      expect(success!).toBe(false);
    });

    test('restores session from persistent storage on success', async () => {
      vi.mocked(loginWithBiometrics).mockResolvedValue(true);
      localStorage.setItem('networth_persistent_token', 'abc123hex');

      const { result } = renderHook(() => useAuth());
      let success: boolean;

      await act(async () => {
        success = await result.current.loginWithBiometrics();
      });

      expect(success!).toBe(true);
      expect(result.current.isAuthenticated).toBe(true);
      expect(sessionStorage.getItem('networth_session_token')).toBe('abc123hex');
    });

    test('returns false when no persistent token exists', async () => {
      vi.mocked(loginWithBiometrics).mockResolvedValue(true);
      // No persistent token set

      const { result } = renderHook(() => useAuth());
      let success: boolean;

      await act(async () => {
        success = await result.current.loginWithBiometrics();
      });

      expect(success!).toBe(false);
    });

    test('reports error on exception', async () => {
      vi.mocked(loginWithBiometrics).mockRejectedValue(new Error('Device error'));

      const { result } = renderHook(() => useAuth());
      let success: boolean;

      await act(async () => {
        success = await result.current.loginWithBiometrics();
      });

      expect(success!).toBe(false);
      expect(reportError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({ component: 'useAuth', action: 'loginWithBiometrics' })
      );
    });
  });
});
