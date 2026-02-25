
import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import fs from 'fs';
import path from 'path';

// Configuration — set via environment variables or edit here
const SHEET_ID = process.env.SHEET_ID || 'YOUR_SHEET_ID';
const KEY_PATH = process.env.SERVICE_ACCOUNT_KEY_PATH || '../../service-accounts/service-account.json';


async function main() {
    try {
        const keyPath = path.resolve(process.cwd(), KEY_PATH);
        console.log(`Reading key from ${keyPath}...`);

        if (!fs.existsSync(keyPath)) {
            console.error(`Error: Key file not found at ${keyPath}`);
            return;
        }

        const keyContent = fs.readFileSync(keyPath, 'utf8');
        const key = JSON.parse(keyContent);

        console.log(`Authenticating as ${key.client_email}...`);
        const auth = new JWT({
            email: key.client_email,
            key: key.private_key,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        console.log(`Loading spreadsheet ${SHEET_ID}...`);
        const doc = new GoogleSpreadsheet(SHEET_ID, auth);
        await doc.loadInfo();
        console.log(`Spreadsheet title: ${doc.title}`);

        const sheet = doc.sheetsByIndex[0];
        console.log(`Sheet title: ${sheet.title}, Rows: ${sheet.rowCount}`);

        const rows = await sheet.getRows();
        console.log(`Fetched ${rows.length} rows.`);

        console.log('\n--- Analyzing Rows ---');
        let validAssets = 0;
        let validDebts = 0;
        let skipped = 0;

        let lastCategory = '';

        for (let index = 0; index < rows.length; index++) {
            const row = rows[index];
            let category = row.get('Category');
            const asset = row.get('Asset');
            const creditStr = row.get('Credit');
            const debitStr = row.get('Debit');

            // Fill down logic
            if (category) {
                lastCategory = category.toString();
            } else if (lastCategory) {
                // Use last valid category if current is empty
                category = lastCategory;
            }

            // Mimic the backend logic
            if (!asset || !category) {
                console.log(`[Row ${index + 2}] SKIPPED: Missing Asset or Category. Asset: "${asset}", Category: "${category}"`);
                skipped++;
                continue;
            }

            const credit = parseFloat((creditStr || '0').toString().replace(/[$,]/g, '')) || 0;
            const debit = parseFloat((debitStr || '0').toString().replace(/[$,]/g, '')) || 0;

            let finalCredit = credit;
            if (finalCredit > 0) finalCredit = -finalCredit; // Convert positive credit to negative liability

            const value = debit + finalCredit;

            if (debit > 0) {
                validAssets++;
                console.log(`[Row ${index + 2}] ASSET: ${asset} (${category}) | Value: ${value}`);
            } else if (finalCredit < 0) {
                validDebts++;
                console.log(`[Row ${index + 2}] DEBT : ${asset} (${category}) | Value: ${value}`);
            } else {
                console.log(`[Row ${index + 2}] ZERO : ${asset} (${category}) | Value: ${value}`);
            }
        }

        console.log('\n--- Summary ---');
        console.log(`Total Rows: ${rows.length}`);
        console.log(`Valid Assets (Debit > 0): ${validAssets}`);
        console.log(`Valid Debts (Credit != 0): ${validDebts}`);
        console.log(`Skipped Rows: ${skipped}`);

    } catch (error) {
        console.error('Error:', error);
    }
}

main();
