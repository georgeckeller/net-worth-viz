import { useMemo } from 'react';
import { CategoryData, Asset } from '../types';
import { getCategoryColor } from '../utils/colors';

export interface PieSlice {
  name: string;
  categoryKey: string;
  value: number;
  debit: number;
  credit: number;
  netValue: number;
  percentage: string;
  color: string;
  assets: Asset[];
  debts: Asset[];
  allAssets: Asset[];
  isDebt: boolean;
  isEquity?: boolean;
}

export interface CombinedCategory {
  name: string;
  categoryKey: string;
  value: number;
  debit: number;
  credit: number;
  netValue: number;
  percentage: string;
  color: string;
  assets: Asset[];
  debts: Asset[];
  allAssets: Asset[];
}

export interface DrillSlice {
  name: string;
  categoryKey: string;
  value: number;
  assetValue: number;
  debtValue: number;
  percentage: string;
  color: string;
  baseColor: string;
  assetIndex: number;
  assetCount: number;
  assets: Asset[];
  hasDebt: boolean;
  isDebt: boolean;
}

/** Generate a brightness-shaded variant of a hex color */
export function shadeColor(hexColor: string, index: number, total: number): string {
  const brightnessFactor = 0.4 + (index * 0.6 / Math.max(total - 1, 1));
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const newR = Math.min(255, Math.round(r * brightnessFactor + 255 * (1 - brightnessFactor) * 0.2));
  const newG = Math.min(255, Math.round(g * brightnessFactor + 255 * (1 - brightnessFactor) * 0.2));
  const newB = Math.min(255, Math.round(b * brightnessFactor + 255 * (1 - brightnessFactor) * 0.2));
  return `rgb(${newR}, ${newG}, ${newB})`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ');
}

export function useChartData(categories: CategoryData[], debtCategories: CategoryData[]) {
  return useMemo(() => {
    // Merge asset and debt categories by key
    const categoryMap = new Map<string, { assets: CategoryData | null; debts: CategoryData | null }>();

    categories.forEach(cat => {
      const existing = categoryMap.get(cat.category) || { assets: null, debts: null };
      existing.assets = cat;
      categoryMap.set(cat.category, existing);
    });

    debtCategories.forEach(cat => {
      const existing = categoryMap.get(cat.category) || { assets: null, debts: null };
      existing.debts = cat;
      categoryMap.set(cat.category, existing);
    });

    const totalDebits = categories.reduce((sum, cat) =>
      sum + cat.assets.reduce((s, a) => s + (a.debit || 0), 0), 0);

    // Pie chart slices: equity + debt per category
    const pieChartData: PieSlice[] = [];

    Array.from(categoryMap.entries()).forEach(([categoryKey, data]) => {
      const totalDebit = data.assets?.assets.reduce((s, a) => s + (a.debit || 0), 0) || 0;
      const totalCredit = data.debts?.assets.reduce((s, a) => {
        const c = a.credit || 0;
        return s + (c < 0 ? Math.abs(c) : 0);
      }, 0) || 0;

      const categoryColor = getCategoryColor(categoryKey);
      const equity = totalDebit - totalCredit;
      const shared = {
        categoryKey,
        debit: totalDebit,
        credit: totalCredit,
        netValue: equity,
        assets: data.assets?.assets || [],
        debts: data.debts?.assets || [],
        allAssets: [...(data.assets?.assets || []), ...(data.debts?.assets || [])],
      };

      if (equity > 0) {
        pieChartData.push({
          ...shared,
          name: capitalize(categoryKey),
          value: equity,
          percentage: totalDebits > 0 ? ((equity / totalDebits) * 100).toFixed(1) : '0',
          color: categoryColor || '#6B7280',
          isDebt: false,
          isEquity: true,
        });
      }

      if (totalCredit > 0) {
        pieChartData.push({
          ...shared,
          name: `${capitalize(categoryKey)} Debt`,
          value: totalCredit,
          percentage: totalDebits > 0 ? ((totalCredit / totalDebits) * 100).toFixed(1) : '0',
          color: '#EF4444',
          isDebt: true,
        });
      }
    });

    pieChartData.sort((a, b) => b.value - a.value);

    // Combined category-level data (for bar chart and legend)
    const combinedChartData: CombinedCategory[] = Array.from(categoryMap.entries())
      .map(([categoryKey, data]) => {
        const totalDebit = data.assets?.assets.reduce((s, a) => s + (a.debit || 0), 0) || 0;
        const totalCredit = data.debts?.assets.reduce((s, a) => {
          const c = a.credit || 0;
          return s + (c < 0 ? Math.abs(c) : 0);
        }, 0) || 0;
        const netValue = totalDebit - totalCredit;
        const categoryColor = getCategoryColor(categoryKey);

        return {
          name: capitalize(categoryKey),
          categoryKey,
          value: netValue,
          debit: totalDebit,
          credit: totalCredit,
          netValue,
          percentage: totalDebits > 0 ? ((netValue / totalDebits) * 100).toFixed(1) : '0',
          color: categoryColor || '#6B7280',
          assets: data.assets?.assets || [],
          debts: data.debts?.assets || [],
          allAssets: [...(data.assets?.assets || []), ...(data.debts?.assets || [])],
        };
      })
      .filter(cat => cat.value > 0 || cat.credit > 0)
      .sort((a, b) => b.debit - a.debit);

    return { pieChartData, combinedChartData, totalDebits };
  }, [categories, debtCategories]);
}

/** Get drilled-down slices for a specific category */
export function getDrilledSlices(
  combinedChartData: CombinedCategory[],
  drilledCategory: string,
): DrillSlice[] | null {
  const category = combinedChartData.find(cat => cat.categoryKey === drilledCategory);
  if (!category) return null;

  const categoryColor = category.color;
  const sortedAssets = [...category.assets].sort((a, b) => (b.debit || 0) - (a.debit || 0));
  const totalCategoryValue = sortedAssets.reduce((s, a) => s + (a.debit || 0), 0);

  const slices: DrillSlice[] = [];

  sortedAssets.forEach((asset, idx) => {
    const assetDebit = asset.debit || 0;
    const assetCredit = Math.abs(asset.credit || 0);
    const netValue = assetDebit - assetCredit;

    if (netValue > 0) {
      slices.push({
        name: asset.name,
        categoryKey: drilledCategory,
        value: netValue,
        assetValue: assetDebit,
        debtValue: assetCredit,
        percentage: ((netValue / totalCategoryValue) * 100).toFixed(1),
        color: shadeColor(categoryColor, idx, sortedAssets.length),
        baseColor: categoryColor,
        assetIndex: idx,
        assetCount: 1,
        assets: [asset],
        hasDebt: assetCredit > 0,
        isDebt: false,
      });
    }
  });

  return slices;
}

/** Build bar chart data for stacked equity+debt bars */
export function getBarChartData(
  combinedChartData: CombinedCategory[],
  drilledCategory: string | null,
): Record<string, unknown>[] {
  if (drilledCategory) {
    const category = combinedChartData.find(cat => cat.categoryKey === drilledCategory);
    if (!category) return [];

    return [...category.assets]
      .filter(a => (a.debit || 0) > 0)
      .sort((a, b) => (b.debit || 0) - (a.debit || 0))
      .map((asset, idx) => {
        const assetDebit = asset.debit || 0;
        const assetCredit = Math.abs(asset.credit || 0);
        const equity = assetDebit - assetCredit;

        const barData: Record<string, unknown> = {
          category: asset.name,
          categoryKey: drilledCategory,
          total: assetDebit,
          equity,
          debt: assetCredit,
          assetName: asset.name,
        };

        let stackIdx = 0;
        if (equity > 0) {
          barData[`asset_${stackIdx}`] = equity;
          barData[`asset_${stackIdx}_name`] = 'Equity';
          barData[`asset_${stackIdx}_isEquity`] = true;
          stackIdx++;
        }
        if (assetCredit > 0) {
          barData[`asset_${stackIdx}`] = assetCredit;
          barData[`asset_${stackIdx}_name`] = 'Debt';
          barData[`asset_${stackIdx}_isDebt`] = true;
          stackIdx++;
        }

        barData.assetCount = stackIdx;
        barData.assets = [asset];
        barData.hasDebt = assetCredit > 0;
        barData.assetIndex = idx;

        return barData;
      });
  }

  // Category-level bars
  return combinedChartData.map(cat => {
    const equity = cat.debit - cat.credit;
    const barData: Record<string, unknown> = {
      category: cat.name,
      categoryKey: cat.categoryKey,
      total: cat.debit,
      equity,
      debt: cat.credit,
      isDebt: false,
    };

    let assetIdx = 0;
    if (equity > 0) {
      barData[`asset_${assetIdx}`] = equity;
      barData[`asset_${assetIdx}_name`] = 'Equity';
      barData[`asset_${assetIdx}_isEquity`] = true;
      assetIdx++;
    }
    if (cat.credit > 0) {
      barData[`asset_${assetIdx}`] = cat.credit;
      barData[`asset_${assetIdx}_name`] = 'Debt';
      barData[`asset_${assetIdx}_isDebt`] = true;
      assetIdx++;
    }

    barData.assetCount = assetIdx;
    barData.assets = cat.allAssets;
    barData.hasDebt = cat.credit > 0;

    return barData;
  });
}
