import { useState, useEffect, useCallback } from 'react';
import { verifyPassword, setAuthState, getAuthState, clearAuthState } from '../services/auth.service';
import {
  isBiometricsAvailable as checkBioAvailable,
  isBiometricsConfigured,
  registerBiometrics,
  loginWithBiometrics as bioLogin
} from '../services/biometric.service';
import { reportError, reportWarning } from '../services/error.service';
import { UseAuthResult } from '../types';

export const useAuth = (): UseAuthResult => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isBiometricsAvailable, setIsBiometricsAvailable] = useState<boolean>(false);
  const [isBiometricsEnabled, setIsBiometricsEnabled] = useState<boolean>(false);

  // Check auth state and biometrics on mount
  useEffect(() => {
    const authState = getAuthState();
    setIsAuthenticated(authState);

    // Check biometrics availability and status
    const checkBiometrics = async () => {
      const available = await checkBioAvailable();
      setIsBiometricsAvailable(available);

      const enabled = isBiometricsConfigured();
      setIsBiometricsEnabled(enabled);
    };

    checkBiometrics();
  }, []);

  // Login function
  const login = useCallback(async (password: string): Promise<boolean> => {
    try {
      if (await verifyPassword(password)) {
        setAuthState(true, true);
        setIsAuthenticated(true);
        refreshPersistentToken();
        return true;
      }
      return false;
    } catch (error) {
      setAuthState(false);
      setIsAuthenticated(false);
      throw error;
    }
  }, []);

  const refreshPersistentToken = () => {
    if (isBiometricsConfigured()) {
      const token = sessionStorage.getItem('networth_session_token');
      if (token) {
        localStorage.setItem('networth_persistent_token', token.trim());
        localStorage.setItem('networth_persistent_timestamp', Date.now().toString());
      }
    }
  };

  // Logout function
  const logout = useCallback(() => {
    clearAuthState();
    // Also clear persistent biometric session
    localStorage.removeItem('networth_persistent_token');
    localStorage.removeItem('networth_persistent_timestamp');
    setIsAuthenticated(false);
  }, []);

  // Enable biometrics - requires recent password login for security
  const enableBiometrics = useCallback(async (): Promise<boolean> => {
    try {
      // Security check: Only allow biometric setup immediately after password login
      // This prevents attackers from setting up biometrics without knowing the password
      const recentPasswordLogin = sessionStorage.getItem('networth_password_login');
      if (!recentPasswordLogin) {
        // User hasn't recently logged in with password - deny biometric setup
        return false;
      }

      const success = await registerBiometrics();
      if (success) {
        setIsBiometricsEnabled(true);
        // Clear the flag after successful setup to prevent re-registration without password
        sessionStorage.removeItem('networth_password_login');

        // PERSIST the current session token for future biometric logins
        const currentToken = sessionStorage.getItem('networth_session_token');
        if (currentToken) {
          const cleanToken = currentToken.replace(/^["']|["']$/g, '').trim();
          localStorage.setItem('networth_persistent_token', cleanToken);
          localStorage.setItem('networth_persistent_timestamp', Date.now().toString());
        }

        // Verify the persistent token was actually stored
        const verifyStored = localStorage.getItem('networth_persistent_token');
        if (!verifyStored) {
          // Token wasn't persisted — clear biometric config to avoid a broken state
          const { clearBiometrics } = await import('../services/biometric.service');
          clearBiometrics();
          setIsBiometricsEnabled(false);
          reportWarning('Persistent token not stored after biometric registration', {
            component: 'useAuth', action: 'enableBiometrics'
          });
          return false;
        }
      }
      return success;
    } catch (error) {
      reportError(error, { component: 'useAuth', action: 'enableBiometrics' });
      return false;
    }
  }, []);

  // Login with biometrics
  const loginWithBiometrics = useCallback(async (): Promise<boolean> => {
    try {
      const success = await bioLogin();
      if (success) {
        // Biometric login succeeded - retrieve persistent token
        const persistentToken = localStorage.getItem('networth_persistent_token');

        if (persistentToken) {
          const cleanToken = persistentToken.replace(/^["']|["']$/g, '').trim();

          if (!cleanToken) {
            // Token empty after cleanup? Invalid.
            return false;
          }

          // Restore the session to sessionStorage
          sessionStorage.setItem('networth_session_token', cleanToken);
          sessionStorage.setItem('networth_session_timestamp', Date.now().toString()); // Refresh timestamp to avoid immediate client timeout

          setAuthState(true, false);
          setIsAuthenticated(true);
          return true;
        }

        // If we have no persistent token, biometric auth is useless for the server
        // Return false to force password login
        reportWarning('Biometric login succeeded but no persistent token found', {
          component: 'useAuth', action: 'loginWithBiometrics'
        });
        return false;
      }
      return false;
    } catch (error) {
      reportError(error, { component: 'useAuth', action: 'loginWithBiometrics' });
      return false;
    }
  }, []);

  return {
    isAuthenticated,
    login,
    logout,
    isBiometricsAvailable,
    isBiometricsEnabled,
    enableBiometrics,
    loginWithBiometrics,
  };
};
