import {
    getCorsHeaders,
    validateCsrfProtection,
    validateRequestTimestamp,
    ALLOWED_ORIGINS
} from './security';

describe('Security Utilities', () => {
    describe('getCorsHeaders', () => {
        test('should allow whitelisted origins', () => {
            const origin = ALLOWED_ORIGINS[0];
            const headers = getCorsHeaders(origin);
            expect(headers['Access-Control-Allow-Origin']).toBe(origin);
            expect(headers['Access-Control-Allow-Credentials']).toBe('true');
        });

        test('should NOT allow unknown origins', () => {
            const headers = getCorsHeaders('https://malicious-site.com');
            expect(headers['Access-Control-Allow-Origin']).toBeUndefined();
        });

        test('should include default headers', () => {
            const headers = getCorsHeaders(undefined);
            expect(headers['Access-Control-Allow-Methods']).toBeDefined();
            expect(headers['Access-Control-Allow-Headers']).toBeDefined();
        });
    });

    describe('validateCsrfProtection', () => {
        test('should accept valid headers', () => {
            const req = {
                headers: {
                    'x-requested-with': 'XMLHttpRequest',
                    'content-type': 'application/json'
                }
            };
            expect(validateCsrfProtection(req)).toBe(true);
        });

        test('should reject missing header', () => {
            const req = { headers: { 'content-type': 'application/json' } };
            expect(validateCsrfProtection(req)).toBe(false);
        });

        test('should reject wrong content-type', () => {
            const req = {
                headers: {
                    'x-requested-with': 'XMLHttpRequest',
                    'content-type': 'text/plain'
                }
            };
            expect(validateCsrfProtection(req)).toBe(false);
        });
    });

    describe('validateRequestTimestamp', () => {
        test('should accept recent timestamp', () => {
            expect(validateRequestTimestamp(Date.now())).toBe(true);
        });

        test('should reject old timestamp', () => {
            const old = Date.now() - 10 * 60 * 1000;
            expect(validateRequestTimestamp(old)).toBe(false);
        });

        test('should reject future timestamp', () => {
            const future = Date.now() + 2 * 60 * 1000;
            expect(validateRequestTimestamp(future)).toBe(false);
        });
    });
});
