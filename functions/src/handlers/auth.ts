import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import * as crypto from 'crypto';
import { logError, logWarning, startTimer } from '../utils/logger.js';
import {
    getCorsHeaders,
    ALLOWED_ORIGINS,
    createSession,
    checkRateLimit,
    recordFailedAttempt,
    clearRateLimit,
    validateCsrfProtection
} from '../utils/security.js';

const passwordHash = defineSecret('PASSWORD_HASH');

export const verifyPassword = onRequest(
    {
        cors: ALLOWED_ORIGINS,
        region: 'us-central1',
        secrets: [passwordHash],
    },
    async (request, response) => {
        const origin = request.headers.origin;
        const corsHeaders = getCorsHeaders(origin);

        const sendError = (status: number, message: string) => {
            response.set(corsHeaders);
            response.status(status).json({ error: message });
        };

        const timer = startTimer('verifyPassword');

        try {
            if (request.method === 'OPTIONS') {
                response.set(corsHeaders);
                response.status(204).send('');
                return;
            }

            if (request.method !== 'POST') {
                sendError(405, 'Method not allowed');
                return;
            }

            if (!validateCsrfProtection(request)) {
                sendError(403, 'Invalid request');
                return;
            }

            // Use request.ip which is set by the GCP load balancer (not client-spoofable).
            // Do NOT fall back to X-Forwarded-For which can be trivially spoofed.
            const clientIp = request.ip || 'unknown';
            const rateLimitResult = await checkRateLimit(clientIp);

            if (!rateLimitResult.allowed) {
                response.set(corsHeaders);
                response.status(429).json({ error: 'Too many attempts. Please try again later.' });
                return;
            }

            const { password } = request.body;

            if (!password || typeof password !== 'string') {
                response.set(corsHeaders);
                response.status(400).json({ error: 'Invalid request' });
                return;
            }

            const expectedHash = passwordHash.value()?.trim();
            if (!expectedHash) {
                sendError(500, 'Configuration error');
                return;
            }

            const providedPasswordHash = crypto
                .createHash('sha256')
                .update(password)
                .digest('hex');

            // Constant-time comparison to prevent timing attacks
            const expectedBuf = Buffer.from(expectedHash, 'hex');
            const providedBuf = Buffer.from(providedPasswordHash, 'hex');
            const isValid = expectedBuf.length === providedBuf.length &&
                crypto.timingSafeEqual(expectedBuf, providedBuf);

            if (isValid) {
                await clearRateLimit(clientIp);
                const sessionToken = await createSession(clientIp);

                timer.done();
                response.set(corsHeaders);
                response.status(200).json({
                    valid: true,
                    sessionToken
                });
            } else {
                await recordFailedAttempt(clientIp);
                logWarning('Failed password attempt', { endpoint: 'verifyPassword' });
                timer.done();
                response.set(corsHeaders);
                response.status(200).json({ valid: false });
            }
        } catch (error) {
            logError('Error in verifyPassword', error, { endpoint: 'verifyPassword' });
            sendError(500, 'An error occurred during verification');
        }
    }
);
