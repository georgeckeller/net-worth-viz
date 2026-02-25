import React from 'react';
import { CombinedCategory } from '../../hooks/useChartData';

interface ChartLegendProps {
  categories: CombinedCategory[];
  hoveredCategoryKey: string | null;
  selectedCategory: string | null;
  drilledCategory: string | null;
  onHover: (categoryKey: string) => void;
  onHoverLeave: () => void;
  onClick: (categoryKey: string) => void;
}

export const ChartLegend: React.FC<ChartLegendProps> = ({
  categories,
  hoveredCategoryKey,
  selectedCategory,
  drilledCategory,
  onHover,
  onHoverLeave,
  onClick,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
        justifyContent: 'center',
        marginBottom: selectedCategory ? '8px' : '0',
        marginTop: '4px',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {categories.map((entry) => {
        const isHovered = hoveredCategoryKey === entry.categoryKey;
        return (
          <div
            key={entry.categoryKey}
            role="button"
            tabIndex={0}
            aria-label={`${entry.name}, ${entry.percentage}% of portfolio. Double-click to drill down.`}
            onClick={() => onClick(entry.categoryKey)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(entry.categoryKey); } }}
            onMouseEnter={() => onHover(entry.categoryKey)}
            onMouseLeave={onHoverLeave}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '6px',
              cursor: 'pointer',
              background: drilledCategory === entry.categoryKey
                ? `${entry.color}30`
                : isHovered
                ? 'rgba(148, 163, 184, 0.15)'
                : 'rgba(148, 163, 184, 0.05)',
              border: `1px solid ${drilledCategory === entry.categoryKey || selectedCategory === entry.categoryKey ? entry.color : 'transparent'}`,
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: entry.color }} />
            <span style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: 500 }}>{entry.name}</span>
            <span style={{ fontSize: '10px', color: '#64748b', marginLeft: '2px' }}>{entry.percentage}%</span>
          </div>
        );
      })}
    </div>
  );
};
