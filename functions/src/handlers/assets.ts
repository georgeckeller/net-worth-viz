import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { validateSheetId } from '../middleware/validation.js';
import { logError, startTimer } from '../utils/logger.js';
import {
    getCorsHeaders,
    ALLOWED_ORIGINS,
    validateSession,
    validateCsrfProtection,
    validateRequestTimestamp
} from '../utils/security.js';

const serviceAccountKey = defineSecret('SERVICE_ACCOUNT_KEY');

import { transformRowsToAssets } from '../utils/transform.js';

export const getAssets = onRequest(
    {
        cors: ALLOWED_ORIGINS,
        region: 'us-central1',
        secrets: [serviceAccountKey],
    },
    async (request, response) => {
        const origin = request.headers.origin;
        const corsHeaders = getCorsHeaders(origin);

        const sendError = (status: number, message: string) => {
            response.set(corsHeaders);
            response.status(status).json({ error: message });
        };

        const timer = startTimer('getAssets');

        try {
            if (request.method === 'OPTIONS') {
                response.set(corsHeaders);
                response.status(204).send('');
                return;
            }

            if (request.method !== 'POST' || !validateCsrfProtection(request)) {
                sendError(403, 'Forbidden');
                return;
            }

            const sessionToken = request.headers['x-session-token'] as string;
            if (!await validateSession(sessionToken)) {
                sendError(401, 'Unauthorized');
                return;
            }

            if (!validateRequestTimestamp(request.body?.timestamp)) {
                sendError(400, 'Invalid request');
                return;
            }

            const { sheetId } = request.body || {};
            const sheetIdValue = sheetId || process.env.SHEET_ID;

            if (!sheetIdValue || !validateSheetId(sheetIdValue)) {
                sendError(400, 'Invalid Sheet ID');
                return;
            }

            // Auth with Google
            const auth = new JWT({
                email: process.env.SERVICE_ACCOUNT_EMAIL,
                key: serviceAccountKey.value().replace(/\\n/g, '\n'),
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });

            const doc = new GoogleSpreadsheet(sheetIdValue, auth);
            await doc.loadInfo();

            const sheet = doc.sheetsByIndex[0];
            if (!sheet) {
                sendError(404, 'No data');
                return;
            }

            const rows = await sheet.getRows();
            const assets = transformRowsToAssets(rows);

            timer.done();
            response.set(corsHeaders);
            response.status(200).json({ assets });
        } catch (error) {
            logError('getAssets error', error);
            sendError(500, 'Internal Server Error');
        }
    }
);
