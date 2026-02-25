import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Mock import.meta.env
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Vite's import.meta.env has no global type
(global as any).import = {
  meta: {
    env: {
      DEV: true,
      VITE_API_URL: 'https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/getAssets',
      VITE_VERIFY_PASSWORD_URL: 'https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/verifyPassword',
      VITE_SHEET_ID: 'YOUR_SHEET_ID',
    },
  },
};

// Mock fetch globally
global.fetch = vi.fn();
