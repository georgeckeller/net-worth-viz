import { renderHook } from '@testing-library/react';
import { useNetWorthData } from './useNetWorthData';
import { Asset } from '../types';

const makeAsset = (overrides: Partial<Asset> = {}): Asset => ({
  name: 'Test Asset',
  category: 'savings',
  value: 1000,
  debit: 1000,
  credit: 0,
  date: '2024-01-01',
  ...overrides,
});

describe('useNetWorthData', () => {
  test('returns null for null assets', () => {
    const { result } = renderHook(() => useNetWorthData(null));
    expect(result.current).toBeNull();
  });

  test('returns null for empty array', () => {
    const { result } = renderHook(() => useNetWorthData([]));
    expect(result.current).toBeNull();
  });

  test('calculates total net worth from asset values', () => {
    const assets: Asset[] = [
      makeAsset({ value: 5000 }),
      makeAsset({ value: 3000 }),
      makeAsset({ value: -1000, debit: 0, credit: -1000 }),
    ];
    const { result } = renderHook(() => useNetWorthData(assets));
    expect(result.current!.totalNetWorth).toBe(7000);
  });

  test('groups assets by category', () => {
    const assets: Asset[] = [
      makeAsset({ name: 'Checking', category: 'savings', debit: 5000 }),
      makeAsset({ name: 'Savings', category: 'savings', debit: 10000 }),
      makeAsset({ name: 'BTC', category: 'crypto', debit: 3000 }),
    ];
    const { result } = renderHook(() => useNetWorthData(assets));
    const data = result.current!;

    expect(data.categories).toHaveLength(2);
    const savingsCat = data.categories.find(c => c.category === 'savings');
    expect(savingsCat).toBeDefined();
    expect(savingsCat!.assets).toHaveLength(2);
    expect(savingsCat!.totalValue).toBe(15000);
  });

  test('separates debits (assets) from credits (debts)', () => {
    const assets: Asset[] = [
      makeAsset({ name: 'House', category: 'real estate', value: 300000, debit: 500000, credit: -200000 }),
    ];
    const { result } = renderHook(() => useNetWorthData(assets));
    const data = result.current!;

    // Asset side: debit of 500000
    const assetCat = data.categories.find(c => c.category === 'real estate');
    expect(assetCat).toBeDefined();
    expect(assetCat!.totalValue).toBe(500000);

    // Debt side: credit of -200000
    const debtCat = data.debtCategories.find(c => c.category === 'real estate');
    expect(debtCat).toBeDefined();
    expect(debtCat!.totalValue).toBe(200000);
  });

  test('calculates percentages correctly', () => {
    const assets: Asset[] = [
      makeAsset({ category: 'savings', debit: 7500 }),
      makeAsset({ category: 'stocks', debit: 2500 }),
    ];
    const { result } = renderHook(() => useNetWorthData(assets));
    const data = result.current!;

    const savings = data.categories.find(c => c.category === 'savings');
    const stocks = data.categories.find(c => c.category === 'stocks');
    expect(savings!.percentage).toBe(75);
    expect(stocks!.percentage).toBe(25);
  });

  test('sorts categories by total value descending', () => {
    const assets: Asset[] = [
      makeAsset({ category: 'crypto', debit: 1000 }),
      makeAsset({ category: 'savings', debit: 5000 }),
      makeAsset({ category: 'stocks', debit: 3000 }),
    ];
    const { result } = renderHook(() => useNetWorthData(assets));
    const data = result.current!;

    expect(data.categories[0].category).toBe('savings');
    expect(data.categories[1].category).toBe('stocks');
    expect(data.categories[2].category).toBe('crypto');
  });

  test('sorts assets within category by debit descending', () => {
    const assets: Asset[] = [
      makeAsset({ name: 'Small', category: 'savings', debit: 100 }),
      makeAsset({ name: 'Big', category: 'savings', debit: 5000 }),
      makeAsset({ name: 'Medium', category: 'savings', debit: 1000 }),
    ];
    const { result } = renderHook(() => useNetWorthData(assets));
    const savingsCat = result.current!.categories.find(c => c.category === 'savings')!;

    expect(savingsCat.assets[0].name).toBe('Big');
    expect(savingsCat.assets[1].name).toBe('Medium');
    expect(savingsCat.assets[2].name).toBe('Small');
  });

  test('filters out categories with zero total value', () => {
    const assets: Asset[] = [
      makeAsset({ category: 'savings', debit: 5000 }),
      makeAsset({ category: 'crypto', debit: 0, value: 0 }),
    ];
    const { result } = renderHook(() => useNetWorthData(assets));
    expect(result.current!.categories).toHaveLength(1);
    expect(result.current!.categories[0].category).toBe('savings');
  });

  test('handles single asset correctly', () => {
    const assets: Asset[] = [makeAsset({ debit: 10000 })];
    const { result } = renderHook(() => useNetWorthData(assets));
    const data = result.current!;

    expect(data.categories).toHaveLength(1);
    expect(data.categories[0].percentage).toBe(100);
    expect(data.categories[0].totalValue).toBe(10000);
  });

  test('provides color and icon from category config', () => {
    const assets: Asset[] = [makeAsset({ category: 'savings', debit: 1000 })];
    const { result } = renderHook(() => useNetWorthData(assets));
    const savings = result.current!.categories[0];

    expect(savings.color).toBeDefined();
    expect(savings.color).not.toBe('#6B7280'); // should get config color, not fallback
    expect(savings.icon).toBe('💰');
  });

  test('debt categories use absolute credit values', () => {
    const assets: Asset[] = [
      makeAsset({ category: 'real estate', debit: 0, credit: -150000 }),
      makeAsset({ category: 'real estate', debit: 0, credit: -50000 }),
    ];
    const { result } = renderHook(() => useNetWorthData(assets));
    const debtCat = result.current!.debtCategories[0];

    expect(debtCat.totalValue).toBe(200000);
    expect(debtCat.percentage).toBe(100);
  });

});
