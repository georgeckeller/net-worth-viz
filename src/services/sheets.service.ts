import { Asset } from '../types';
import { getSessionToken, clearAuthState } from './auth.service';
import { validateSheetId, getSheetIdValidationError } from '../utils/validation';

// API endpoint for fetching assets
const API_URL = import.meta.env.VITE_API_URL || 'https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/getAssets';
const SHEET_ID = import.meta.env.VITE_SHEET_ID;

// Client-side cache for assets
let cache: { data: Asset[]; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Fetch assets from backend API
export const fetchAssets = async (): Promise<Asset[]> => {
  if (!SHEET_ID) {
    throw new Error('VITE_SHEET_ID not configured in .env.local');
  }

  // Validate Sheet ID format before making API call
  if (!validateSheetId(SHEET_ID)) {
    const validationError = getSheetIdValidationError(SHEET_ID);
    throw new Error(validationError || 'Invalid Sheet ID format');
  }

  // Check cache first
  if (cache && Date.now() - cache.timestamp < CACHE_DURATION) {
    return cache.data;
  }

  // Get session token for authentication
  const sessionToken = getSessionToken();
  if (!sessionToken) {
    // Clear auth state and throw error - will trigger redirect to login
    clearAuthState();
    throw new Error('Authentication required. Please log in again.');
  }

  // Call backend API with Sheet ID in request body (not URL) and session token in header
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'x-session-token': sessionToken,
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest', // CSRF protection
    },
    body: JSON.stringify({
      sheetId: SHEET_ID,
      timestamp: Date.now(), // Replay attack protection
    }),
  });

  if (!response.ok) {
    // Handle 401 Unauthorized - clear auth and let hook handle error
    if (response.status === 401) {
      clearAuthState();
      throw new Error('SESSION_EXPIRED');
    }

    // Don't expose detailed error messages from server
    const errorData = await response.json().catch(() => ({ error: 'An error occurred' }));
    // Use generic error message to prevent information leakage
    throw new Error(errorData.error || 'An error occurred while fetching data');
  }

  const data = await response.json();
  const assets = data.assets || [];

  // Update cache
  cache = { data: assets, timestamp: Date.now() };

  return assets;
};

/**
 * Clear the client-side cache (e.g., on manual refresh)
 */
export const clearSheetsCache = () => {
  cache = null;
};
