import { sanitizeInput } from '../middleware/validation.js';

interface Asset {
    name: string;
    category: string;
    value: number;
    credit: number;
    debit: number;
}

/**
 * Transforms raw Google Sheet rows into Asset objects.
 * Handles "fill-down" logic for categories and currency parsing.
 */
export function transformRowsToAssets(rows: any[]): Asset[] {
    let lastCategory = '';

    return rows
        .map((row) => {
            try {
                let category = row.get('Category');
                const asset = row.get('Asset');
                const creditStr = row.get('Credit') || '0';
                const debitStr = row.get('Debit') || '0';

                // Fill down logic: Use last valid category if current is empty
                if (category) {
                    lastCategory = category.toString();
                } else if (lastCategory) {
                    category = lastCategory;
                }
                // Parse currency strings (remove symbols, commas)
                const parseCurrency = (val: any) => parseFloat(val.toString().replace(/[$,]/g, '')) || 0;

                let credit = parseCurrency(creditStr);
                const debit = parseCurrency(debitStr);

                if (!asset || !category) return null;

                // Ensure credit is negative (liability)
                if (credit > 0) credit = -credit;

                return {
                    name: sanitizeInput(asset.toString()),
                    category: sanitizeInput(category.toString()),
                    value: debit + credit,
                    credit,
                    debit,
                };
            } catch {
                return null;
            }
        })
        .filter((asset): asset is Asset => asset !== null);
}
