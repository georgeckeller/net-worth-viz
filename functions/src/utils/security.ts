import { getFirestore } from 'firebase-admin/firestore';
import * as crypto from 'crypto';

// ============================================================================
// CORS
// ============================================================================

// Hosting site names from ALLOWED_SITES env var (comma-separated)
// Each site gets both .web.app and .firebaseapp.com origins
const siteNames = (process.env.ALLOWED_SITES || '').split(',').map(s => s.trim()).filter(Boolean);
const hostingOrigins = siteNames.flatMap(site => [
    `https://${site}.web.app`,
    `https://${site}.firebaseapp.com`,
]);

export const ALLOWED_ORIGINS = [
    ...hostingOrigins,
    'http://localhost:8080',
    'http://localhost:5173',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:5173',
];

export function getCorsHeaders(origin: string | string[] | undefined): Record<string, string> {
    const defaultHeaders: Record<string, string> = {
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, x-session-token, x-requested-with',
        'Access-Control-Max-Age': '86400',
    };

    if (!origin) return defaultHeaders;

    const originStr = Array.isArray(origin) ? origin[0] : origin;
    const isAllowed = originStr && ALLOWED_ORIGINS.some(
        allowed => allowed.toLowerCase() === originStr.trim().toLowerCase()
    );

    if (isAllowed) {
        return {
            ...defaultHeaders,
            'Access-Control-Allow-Origin': originStr,
            'Access-Control-Allow-Credentials': 'true',
        };
    }

    return defaultHeaders;
}

// ============================================================================
// CSRF & Request Validation
// ============================================================================

export function validateCsrfProtection(request: any): boolean {
    const requestedWith = request.headers['x-requested-with'];
    if (requestedWith !== 'XMLHttpRequest') return false;

    const contentType = request.headers['content-type'];
    if (!contentType || !contentType.includes('application/json')) return false;

    return true;
}

const REQUEST_TIMESTAMP_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

export function validateRequestTimestamp(timestamp: number | undefined): boolean {
    if (!timestamp || typeof timestamp !== 'number') return false;

    const now = Date.now();
    const age = now - timestamp;

    if (age > REQUEST_TIMESTAMP_MAX_AGE_MS) return false;
    if (age < -60000) return false; // Future timestamp (clock skew)

    return true;
}

// ============================================================================
// Session Store
// ============================================================================

const SESSIONS_COLLECTION = 'sessions';
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface Session {
    createdAt: number;
    expiresAt: number;
    ip: string;
}

export async function createSession(ip: string): Promise<string> {
    const db = getFirestore();
    const token = crypto.randomBytes(32).toString('hex');
    const now = Date.now();

    const session: Session = {
        createdAt: now,
        expiresAt: now + SESSION_TTL_MS,
        ip,
    };

    await db.collection(SESSIONS_COLLECTION).doc(token).set(session);
    return token;
}

export async function validateSession(token: string | undefined): Promise<boolean> {
    if (!token || typeof token !== 'string') return false;

    const cleanToken = token.trim();
    if (cleanToken.length < 32 || cleanToken.length > 128 || !/^[a-f0-9]+$/i.test(cleanToken)) {
        return false;
    }

    const db = getFirestore();
    const docRef = db.collection(SESSIONS_COLLECTION).doc(cleanToken);
    const doc = await docRef.get();

    if (!doc.exists) return false;

    const session = doc.data() as Session;
    if (session.expiresAt < Date.now()) {
        await docRef.delete();
        return false;
    }

    return true;
}

// ============================================================================
// Rate Limiter
// ============================================================================

const RATE_LIMIT_COLLECTION = 'rateLimits';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;

interface RateLimitRecord {
    attempts: number;
    firstAttemptAt: number;
    lastAttemptAt: number;
    lockedUntil: number | null;
}

export async function checkRateLimit(ip: string): Promise<{ allowed: boolean; retryAfterMs?: number }> {
    const db = getFirestore();
    const docId = ip.replace(/[.:]/g, '-');
    const docRef = db.collection(RATE_LIMIT_COLLECTION).doc(docId);
    const doc = await docRef.get();

    if (!doc.exists) return { allowed: true };

    const record = doc.data() as RateLimitRecord;
    const now = Date.now();

    if (record.lockedUntil && record.lockedUntil > now) {
        return { allowed: false, retryAfterMs: record.lockedUntil - now };
    }

    if (now - record.firstAttemptAt > ATTEMPT_WINDOW_MS) {
        await docRef.delete();
        return { allowed: true };
    }

    if (record.attempts < MAX_ATTEMPTS) return { allowed: true };

    return { allowed: false, retryAfterMs: LOCKOUT_DURATION_MS };
}

export async function recordFailedAttempt(ip: string): Promise<void> {
    const db = getFirestore();
    const docId = ip.replace(/[.:]/g, '-');
    const docRef = db.collection(RATE_LIMIT_COLLECTION).doc(docId);
    const doc = await docRef.get();
    const now = Date.now();

    if (!doc.exists) {
        await docRef.set({
            attempts: 1,
            firstAttemptAt: now,
            lastAttemptAt: now,
            lockedUntil: null,
        });
        return;
    }

    const record = doc.data() as RateLimitRecord;

    if (now - record.firstAttemptAt > ATTEMPT_WINDOW_MS) {
        await docRef.set({
            attempts: 1,
            firstAttemptAt: now,
            lastAttemptAt: now,
            lockedUntil: null,
        });
        return;
    }

    const newAttempts = record.attempts + 1;
    const update: Partial<RateLimitRecord> = {
        attempts: newAttempts,
        lastAttemptAt: now,
    };

    if (newAttempts >= MAX_ATTEMPTS) {
        update.lockedUntil = now + LOCKOUT_DURATION_MS;
    }

    await docRef.update(update);
}

export async function clearRateLimit(ip: string): Promise<void> {
    const db = getFirestore();
    const docId = ip.replace(/[.:]/g, '-');
    await db.collection(RATE_LIMIT_COLLECTION).doc(docId).delete();
}
