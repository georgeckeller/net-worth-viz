import { initializeApp } from 'firebase-admin/app';

// Initialize Firebase Admin
initializeApp();

// Export handlers
export { getAssets } from './handlers/assets.js';
export { verifyPassword } from './handlers/auth.js';
