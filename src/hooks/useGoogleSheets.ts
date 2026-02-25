import { useState, useEffect, useCallback } from 'react';
import { fetchAssets } from '../services/sheets.service';
import { reportError } from '../services/error.service';
import { Asset, UseGoogleSheetsResult } from '../types';

export const useGoogleSheets = (): UseGoogleSheetsResult => {
  const [data, setData] = useState<Asset[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshInterval = parseInt(import.meta.env.VITE_REFRESH_INTERVAL || '300000', 10);

  // Fetch data function
  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const assets = await fetchAssets();
      setData(assets);
    } catch (err) {
      reportError(err, { component: 'useGoogleSheets', action: 'fetchAssets' });
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and polling setup
  useEffect(() => {
    refetch();

    // Set up polling interval
    const intervalId = setInterval(refetch, refreshInterval);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [refetch, refreshInterval]);

  return {
    data,
    loading,
    error,
    refetch,
  };
};
