import React from 'react';
import { Asset } from '../../types';
import { getCategoryColor } from '../../utils/colors';
import { formatCurrency } from '../../utils/formatters';

interface CategoryDetailTableProps {
  categoryKey: string;
  assets: Asset[];
  selectedAsset: { categoryKey: string; assetName: string } | null;
  onSelectAsset: (assetName: string) => void;
}

export const CategoryDetailTable: React.FC<CategoryDetailTableProps> = ({
  categoryKey,
  assets,
  selectedAsset,
  onSelectAsset,
}) => {
  const categoryColor = getCategoryColor(categoryKey);
  const hasLiabilities = assets.some(a => (a.credit || 0) < 0);
  const gridColumns = hasLiabilities ? '2fr 1fr 1fr' : '2fr 1fr';

  return (
    <div
      style={{
        marginTop: '12px',
        padding: '12px',
        background: 'rgba(30, 41, 59, 0.4)',
        borderRadius: '8px',
        border: `1px solid ${categoryColor}40`,
        animation: 'fadeIn 0.3s ease',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9', marginBottom: '12px', textTransform: 'capitalize' }}>
        {categoryKey.replace(/-/g, ' ')}
      </h3>

      {/* Header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: gridColumns,
          gap: '8px',
          paddingBottom: '8px',
          borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
          marginBottom: '8px',
        }}
      >
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1' }}>Asset Name</div>
        <div style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1', textAlign: 'center' }}>Asset</div>
        {hasLiabilities && (
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1', textAlign: 'center' }}>Liability</div>
        )}
      </div>

      {/* Rows */}
      {assets.map((asset, idx) => {
        const isSelected = selectedAsset?.categoryKey === categoryKey && selectedAsset?.assetName === asset.name;

        return (
          <div
            key={idx}
            role="button"
            tabIndex={0}
            aria-label={`${asset.name}: asset ${formatCurrency(asset.debit || 0)}${(asset.credit || 0) < 0 ? `, liability ${formatCurrency(asset.credit || 0)}` : ''}`}
            onClick={() => onSelectAsset(asset.name)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelectAsset(asset.name); } }}
            style={{
              display: 'grid',
              gridTemplateColumns: gridColumns,
              gap: '8px',
              padding: '8px',
              borderRadius: '6px',
              cursor: 'pointer',
              background: isSelected ? `${categoryColor}20` : 'transparent',
              border: `1px solid ${isSelected ? categoryColor : 'transparent'}`,
              transition: 'all 0.2s ease',
              marginBottom: idx < assets.length - 1 ? '4px' : '0',
            }}
          >
            <div style={{ fontSize: '12px', color: '#e2e8f0', fontWeight: 500 }}>{asset.name}</div>
            <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 600, textAlign: 'center' }}>
              {formatCurrency(asset.debit || 0)}
            </div>
            {hasLiabilities && (
              <div style={{ fontSize: '12px', color: '#EF4444', fontWeight: 600, textAlign: 'center' }}>
                {formatCurrency(asset.credit || 0)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
