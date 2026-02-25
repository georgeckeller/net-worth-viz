// Password authentication service - server-side verification
// Note: Session tokens stored in sessionStorage (not httpOnly cookies) due to cross-origin architecture
// XSS protection provided by: strict CSP, input sanitization, and automatic token cleanup

const SESSION_KEY = 'networth_auth';
const SESSION_TOKEN_KEY = 'networth_session_token';
const SESSION_TIMESTAMP_KEY = 'networth_session_timestamp';
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days (matches server-side expiration)

// API endpoint for password verification
const VERIFY_PASSWORD_URL = import.meta.env.VITE_VERIFY_PASSWORD_URL ||
  'https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/verifyPassword';

// Verify password against server (hash no longer exposed in client)
export const verifyPassword = async (password: string): Promise<boolean> => {
  try {
    const response = await fetch(VERIFY_PASSWORD_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest', // CSRF protection
      },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Too many attempts. Please try again later.');
      }
      throw new Error('Password verification failed.');
    }

    const data = await response.json();

    if (data.valid && data.sessionToken) {
      storeSession(data.sessionToken);
      return true;
    }

    return false;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Network error: Unable to connect to server.');
    }
    throw error instanceof Error ? error : new Error('Password verification failed.');
  }
};

// Helper to store session details
const storeSession = (token: string) => {
  const timestamp = Date.now().toString();
  sessionStorage.setItem(SESSION_TOKEN_KEY, token);
  sessionStorage.setItem(SESSION_KEY, 'true');
  sessionStorage.setItem(SESSION_TIMESTAMP_KEY, timestamp);

  // Verification check
  if (sessionStorage.getItem(SESSION_TOKEN_KEY) !== token) {
    clearAuthState();
    throw new Error('Failed to store session token.');
  }
};

// Get session token for API calls with client-side expiration check
export const getSessionToken = (): string | null => {
  const token = sessionStorage.getItem(SESSION_TOKEN_KEY);
  const timestamp = sessionStorage.getItem(SESSION_TIMESTAMP_KEY);

  if (!token || !timestamp) {
    return null;
  }

  // Check client-side expiration (additional layer of security)
  const timestampNum = parseInt(timestamp, 10);
  if (isNaN(timestampNum) || timestampNum <= 0) {
    // Invalid timestamp - clear it
    clearAuthState();
    return null;
  }

  const tokenAge = Date.now() - timestampNum;
  if (tokenAge > SESSION_MAX_AGE_MS || tokenAge < 0) {
    // Token expired or timestamp is in future (clock skew) - clear it
    clearAuthState();
    return null;
  }

  // Validate token format - just check it exists and is a string
  // Server generates tokens, we trust the server
  if (!token || typeof token !== 'string' || token.trim().length === 0) {
    // Invalid token - clear it
    clearAuthState();
    return null;
  }

  return token;
};

// Store authentication state in sessionStorage
export const setAuthState = (isAuthenticated: boolean, isPasswordLogin: boolean = false): void => {
  if (isAuthenticated) {
    sessionStorage.setItem(SESSION_KEY, 'true');
    // Update timestamp if token exists
    if (sessionStorage.getItem(SESSION_TOKEN_KEY)) {
      sessionStorage.setItem(SESSION_TIMESTAMP_KEY, Date.now().toString());
    }
    // Mark that we just logged in with password (for biometric prompt)
    // Only set this flag if it's a password login, not biometric
    if (isPasswordLogin) {
      sessionStorage.setItem('networth_password_login', 'true');
    } else {
      // Clear the flag if logging in with biometrics
      sessionStorage.removeItem('networth_password_login');
    }
  } else {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    sessionStorage.removeItem(SESSION_TIMESTAMP_KEY);
    sessionStorage.removeItem('networth_password_login');
  }
};

// Get authentication state from sessionStorage with validation
export const getAuthState = (): boolean => {
  const token = getSessionToken(); // This includes expiration and format checks
  return sessionStorage.getItem(SESSION_KEY) === 'true' && token !== null;
};

// Clear authentication state
export const clearAuthState = (): void => {
  sessionStorage.removeItem(SESSION_KEY);
  sessionStorage.removeItem(SESSION_TOKEN_KEY);
  sessionStorage.removeItem(SESSION_TIMESTAMP_KEY);
  sessionStorage.removeItem('networth_password_login');
};
