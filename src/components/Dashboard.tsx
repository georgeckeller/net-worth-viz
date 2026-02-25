import React, { useState, useMemo } from 'react';
import { useGoogleSheets } from '../hooks/useGoogleSheets';
import { useNetWorthData } from '../hooks/useNetWorthData';
import { LoadingSpinner } from './LoadingSpinner';
import { NetWorthHero } from './NetWorthHero';
import { PairedCategoryChart } from './charts/PairedCategoryChart';
import './Dashboard.css';

interface DashboardProps {
  isBiometricsAvailable?: boolean;
  isBiometricsEnabled?: boolean;
  onEnableBiometrics?: () => Promise<boolean>;
}

export const Dashboard: React.FC<DashboardProps> = ({
  isBiometricsAvailable,
  isBiometricsEnabled,
  onEnableBiometrics
}) => {
  const { data, loading, error, refetch } = useGoogleSheets();
  const netWorthData = useNetWorthData(data);
  const [enablingBio, setEnablingBio] = useState(false);

  // Hooks must be called unconditionally (before any early returns)
  const liquidNetWorth = useMemo(() => {
    if (!netWorthData || !data) return 0;

    const realEstateAssets = data.filter(a => a.category === 'real estate');
    const primaryResidence = realEstateAssets
      .filter(a => a.debit > 0)
      .sort((a, b) => b.debit - a.debit)[0];

    if (!primaryResidence) return netWorthData.totalNetWorth;

    const totalMortgages = realEstateAssets.reduce((sum, a) => sum + a.credit, 0);
    return netWorthData.totalNetWorth - primaryResidence.debit - totalMortgages;
  }, [netWorthData, data]);

  const { totalAssets, totalDebt } = useMemo(() => {
    const assets = data?.reduce((sum, a) => sum + (a.debit > 0 ? a.debit : 0), 0) || 0;
    const debt = data?.reduce((sum, a) => sum + (a.credit || 0), 0) || 0;
    return { totalAssets: assets, totalDebt: debt };
  }, [data]);

  const handleEnableBiometrics = async () => {
    if (!onEnableBiometrics) return;
    setEnablingBio(true);
    await onEnableBiometrics();
    setEnablingBio(false);
  };

  if (loading && !data) {
    return (
      <div className="container dashboard-loading">
        <LoadingSpinner />
        <p className="text-secondary mb-md">Loading your financial data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container dashboard-error-container">
        <div className="dashboard-message-box">
          <h2 className="text-error mb-lg">Error Loading Data</h2>
          <p className="text-secondary mb-lg">{error.message}</p>
          <button className="dashboard-btn-primary" onClick={refetch} aria-label="Retry loading financial data">Try Again</button>
        </div>
      </div>
    );
  }

  if (!netWorthData || netWorthData.categories.length === 0) {
    return (
      <div className="container dashboard-empty-container">
        <div className="dashboard-message-box">
          <h2 className="mb-lg">No Data Found</h2>
          <p className="text-secondary">Your Google Sheet appears to be empty. Add some assets to get started!</p>
        </div>
      </div>
    );
  }

  return (
    <main className="container" role="main" aria-label="Net Worth Dashboard" style={{ paddingTop: '8px', paddingBottom: '8px' }}>
      <NetWorthHero
        totalNetWorth={netWorthData.totalNetWorth}
        netWorthMinusHome={liquidNetWorth}
        totalDebit={totalAssets}
        totalCredit={totalDebt}
        onRefresh={refetch}
      />

      {isBiometricsAvailable && !isBiometricsEnabled && onEnableBiometrics && (
        <div className="biometric-setup-row">
          <button
            className="biometric-btn"
            onClick={handleEnableBiometrics}
            disabled={enablingBio}
          >
            <span aria-hidden="true">🔒 </span>{enablingBio ? 'Scanning...' : 'Enable Fingerprint Login'}
          </button>
        </div>
      )}

      <PairedCategoryChart
        categories={netWorthData.categories}
        debtCategories={netWorthData.debtCategories}
      />
      <footer className="dashboard-footer" style={{
        textAlign: 'center',
        padding: '32px 0 16px',
        opacity: 0.6,
        fontSize: '0.85rem',
        fontStyle: 'italic',
        borderTop: '1px solid rgba(255,255,255,0.05)',
        marginTop: '24px'
      }}>
        Vibe-coded by George Keller 🌊✨
      </footer>
    </main>
  );
};
