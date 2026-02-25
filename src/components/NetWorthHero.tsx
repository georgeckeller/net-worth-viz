import React, { useState } from 'react';
import { formatCurrency } from '../utils/formatters';
import './NetWorthHero.css';

interface Props {
  totalNetWorth: number;
  netWorthMinusHome: number;
  totalDebit: number;
  totalCredit: number;
  onRefresh: () => void;
}

export const NetWorthHero: React.FC<Props> = ({
  totalNetWorth,
  netWorthMinusHome,
  totalDebit,
  totalCredit,
  onRefresh
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="hero-container">
      <div className="hero-layout">
        <div className="hero-stat-item">
          <p className="hero-stat-label">Net-Worth</p>
          <div className={`hero-stat-value ${totalNetWorth >= 0 ? 'is-positive' : 'is-negative'}`}>
            {formatCurrency(totalNetWorth)}
          </div>
        </div>

        <div className="hero-stat-item">
          <p className="hero-stat-label">-House</p>
          <div className={`hero-stat-value ${netWorthMinusHome >= 0 ? 'is-positive' : 'is-negative'}`}>
            {formatCurrency(netWorthMinusHome)}
          </div>
        </div>

        <div className="hero-stat-item">
          <p className="hero-stat-label">Assets</p>
          <div className="hero-stat-value is-positive">
            {formatCurrency(totalDebit)}
          </div>
        </div>

        <div className="hero-stat-item">
          <p className="hero-stat-label">Debt</p>
          <div className="hero-stat-value is-negative">
            {formatCurrency(totalCredit)}
          </div>
        </div>

        <button
          className="hero-refresh-btn"
          onClick={handleRefresh}
          disabled={isRefreshing}
          title="Refresh Data"
        >
          {isRefreshing ? '⋯' : '↻'}
        </button>
      </div>
    </div>
  );
};
