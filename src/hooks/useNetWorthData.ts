import { useMemo } from 'react';
import { Asset, Category, CategoryData, NetWorthData } from '../types';
import { getCategoryConfig } from '../config/categories';

export const useNetWorthData = (assets: Asset[] | null): NetWorthData | null => {
  return useMemo(() => {
    if (!assets || assets.length === 0) {
      return null;
    }

    // Calculate total net worth
    const totalNetWorth = assets.reduce((sum, asset) => sum + asset.value, 0);

    // Separate assets (debits) and debts (credits) completely
    // Left pie chart: Only DEBITS (assets)
    // Right pie chart: Only CREDITS (liabilities/debts)

    // Group ASSETS (items with debits > 0) by category
    const assetCategoryMap = new Map<Category, Asset[]>();
    // Group DEBTS (items with credits < 0) by category
    const debtCategoryMap = new Map<Category, Asset[]>();

    assets.forEach((asset) => {
      // Assets: items with debit > 0 (ignore credits for asset chart)
      if (asset.debit > 0) {
        const existing = assetCategoryMap.get(asset.category) || [];
        assetCategoryMap.set(asset.category, [...existing, asset]);
      }
      // Debts: items with credit < 0 (ignore debits for debt chart)
      if (asset.credit < 0) {
        const existing = debtCategoryMap.get(asset.category) || [];
        debtCategoryMap.set(asset.category, [...existing, asset]);
      }
    });

    // Calculate total DEBITS (assets only - sum of debit column)
    const totalAssets = assets.reduce((sum, asset) => sum + (asset.debit > 0 ? asset.debit : 0), 0);
    // Calculate total CREDITS (debts only - sum of credit column, which are negative)
    const totalDebts = assets.reduce((sum, asset) => {
      const credit = asset.credit || 0;
      return sum + (credit < 0 ? Math.abs(credit) : 0);
    }, 0);

    // Create CategoryData array for ASSET categories (debits only)
    const categories: CategoryData[] = Array.from(assetCategoryMap.entries())
      .map(([category, categoryAssets]) => {
        const config = getCategoryConfig(category);
        // Sum only DEBITS for this category (assets)
        const totalDebitValue = categoryAssets.reduce((sum, asset) => sum + (asset.debit > 0 ? asset.debit : 0), 0);

        // Sort by debit value
        const sortedAssets = [...categoryAssets].sort((a, b) => (b.debit || 0) - (a.debit || 0));

        return {
          category,
          totalValue: totalDebitValue,
          percentage: totalAssets > 0 ? (totalDebitValue / totalAssets) * 100 : 0,
          assets: sortedAssets,
          color: config?.color || '#6B7280',
          icon: config?.icon || '📊',
        };
      })
      .filter(cat => cat.totalValue > 0)
      .sort((a, b) => b.totalValue - a.totalValue);

    // Create CategoryData array for DEBT categories (credits only)
    const debtCategories: CategoryData[] = Array.from(debtCategoryMap.entries())
      .map(([category, categoryDebts]) => {
        // Sum only CREDITS for this category (liabilities - they're negative, so take abs)
        const totalCreditValue = categoryDebts.reduce((sum, asset) => {
          const credit = asset.credit || 0;
          return sum + (credit < 0 ? Math.abs(credit) : 0);
        }, 0);

        // Sort by absolute credit value
        const sortedDebts = [...categoryDebts].sort((a, b) => Math.abs(b.credit || 0) - Math.abs(a.credit || 0));

        return {
          category,
          totalValue: totalCreditValue,
          percentage: totalDebts > 0 ? (totalCreditValue / totalDebts) * 100 : 0,
          assets: sortedDebts,
          color: '#FF0000',
          icon: '💸',
        };
      })
      .filter(cat => cat.totalValue > 0)
      .sort((a, b) => b.totalValue - a.totalValue);

    return {
      totalNetWorth,
      categories,
      debtCategories,
    };
  }, [assets]);
};
