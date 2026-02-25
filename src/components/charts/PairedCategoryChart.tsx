import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { CategoryData } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import { useChartInteraction } from '../../hooks/useChartInteraction';
import { useChartData, getDrilledSlices, getBarChartData, shadeColor } from '../../hooks/useChartData';
import { renderActiveShape } from './ActiveShapeRenderer';
import { ChartLegend } from './ChartLegend';
import { CategoryDetailTable } from './CategoryDetailTable';

interface Props {
  categories: CategoryData[];
  debtCategories: CategoryData[];
}

export const PairedCategoryChart: React.FC<Props> = ({ categories, debtCategories }) => {
  const { state, hoverCategory, clearHover, clickCategory, drillInto, drillBack, hoverAsset, clearAssetHover, selectAsset, reset } = useChartInteraction();
  const { pieChartData, combinedChartData } = useChartData(categories, debtCategories);

  const { drilledCategory, hoveredCategoryKey, selectedCategory, activeIndex, selectedAsset, hoveredAsset, lastClickedCategory } = state;

  // Responsive mobile check
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Resolve displayed pie data: drilled slices or top-level
  const drilledSlices = drilledCategory ? getDrilledSlices(combinedChartData, drilledCategory) : null;
  const displayedChartData = drilledSlices || pieChartData;

  // Bar chart data
  const barChartData = getBarChartData(combinedChartData, drilledCategory);

  // --- Event handlers ---

  const handleBackgroundClick = () => {
    if (drilledCategory) {
      drillBack();
    } else {
      reset();
    }
  };

  const isBackgroundClick = (target: HTMLElement): boolean => {
    const tag = target.tagName;
    return tag !== 'path' && tag !== 'text' && tag !== 'circle' && tag !== 'rect' && tag !== 'line';
  };

  const handlePieClick = (_data: unknown, index: number, event: React.MouseEvent) => {
    event?.stopPropagation?.();
    const entry = displayedChartData[index];
    if (!entry) return;

    if (drilledCategory) {
      selectAsset(entry.categoryKey, entry.name.replace(' Debt', ''), index);
    } else {
      clickCategory(entry.categoryKey, index);
    }
  };

  const handlePieMouseEnter = (_data: unknown, index: number) => {
    const entry = displayedChartData[index];
    if (!entry) return;

    if (drilledCategory) {
      hoverAsset(entry.categoryKey, entry.name);
    } else if (entry.categoryKey) {
      hoverCategory(entry.categoryKey, index);
    }
  };

  const handleBarClick = (data: Record<string, unknown>, _index: number, event: React.MouseEvent) => {
    event?.stopPropagation?.();
    const categoryKey = data.categoryKey as string;

    if (drilledCategory) {
      const assetName = (data.assetName as string) || (data.category as string);
      if (assetName) {
        const pieIndex = displayedChartData.findIndex(e => e.name === assetName);
        selectAsset(categoryKey, assetName, pieIndex >= 0 ? pieIndex : 0);
      }
    } else {
      if (lastClickedCategory === categoryKey) {
        drillInto(categoryKey);
      } else {
        const pieIndex = displayedChartData.findIndex(e => e.categoryKey === categoryKey && !e.isDebt);
        clickCategory(categoryKey, pieIndex >= 0 ? pieIndex : 0);
      }
    }
  };

  const handleLegendClick = (categoryKey: string) => {
    if (drilledCategory === categoryKey) {
      drillBack();
    } else if (drilledCategory) {
      drillInto(categoryKey);
    } else if (lastClickedCategory === categoryKey) {
      drillInto(categoryKey);
    } else {
      const pieIndex = displayedChartData.findIndex(d => d.categoryKey === categoryKey && !d.isDebt);
      clickCategory(categoryKey, pieIndex >= 0 ? pieIndex : 0);
    }
  };

  const handleLegendHover = (categoryKey: string) => {
    if (!drilledCategory) {
      const pieIndex = displayedChartData.findIndex(d => d.categoryKey === categoryKey && !d.isDebt);
      hoverCategory(categoryKey, pieIndex >= 0 ? pieIndex : 0);
    }
  };

  const handleDetailSelectAsset = (assetName: string) => {
    if (!selectedCategory) return;
    const pieIndex = displayedChartData.findIndex(e =>
      e.categoryKey === selectedCategory && (e.name === assetName || e.name === `${assetName} Debt`)
    );
    selectAsset(selectedCategory, assetName, pieIndex >= 0 ? pieIndex : 0);
  };

  // --- Drill-down center text ---
  const drillCenterText = drilledCategory && !hoveredAsset ? (() => {
    const cat = combinedChartData.find(c => c.categoryKey === drilledCategory);
    if (!cat) return null;
    const equity = cat.debit - cat.credit;
    return (
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none', zIndex: 10 }}>
        <p style={{ fontSize: '13px', color: '#f1f5f9', fontWeight: 600, marginBottom: '2px' }}>{cat.name}</p>
        <p style={{ fontSize: '16px', color: '#10b981', fontWeight: 700, marginBottom: '2px' }}>{formatCurrency(equity)}</p>
        {cat.credit > 0 && <p style={{ fontSize: '11px', color: '#EF4444' }}>Debt: {formatCurrency(cat.credit)}</p>}
      </div>
    );
  })() : null;

  // --- Title ---
  const title = drilledCategory
    ? `${drilledCategory.charAt(0).toUpperCase() + drilledCategory.slice(1).replace(/-/g, ' ')} Assets`
    : 'Portfolio Distribution';

  // --- Resolve pie activeIndex ---
  const resolvedActiveIndex = drilledCategory
    ? (hoveredAsset ? displayedChartData.findIndex(e => e.name === hoveredAsset.assetName) : undefined)
    : (activeIndex ?? undefined);

  // --- Selected category detail data ---
  const selectedCatData = selectedCategory
    ? combinedChartData.find(c => c.categoryKey === selectedCategory)
    : null;

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
        borderRadius: '12px',
        padding: '12px',
        border: '1px solid rgba(148, 163, 184, 0.1)',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
      }}
      onMouseLeave={clearHover}
      onClick={(e) => { if (isBackgroundClick(e.target as HTMLElement)) handleBackgroundClick(); }}
    >
      <h2 style={{ marginBottom: '8px', fontSize: '16px', fontWeight: 700, color: '#f1f5f9', textAlign: 'center' }} aria-live="polite">
        {title}
      </h2>

      {/* Screen reader summary of chart data */}
      <div className="sr-only" role="status" aria-live="polite">
        {drilledCategory
          ? `Showing individual assets in ${drilledCategory} category`
          : `Portfolio has ${combinedChartData.length} categories. ${combinedChartData.map(c => `${c.name}: ${c.percentage}%`).join(', ')}`
        }
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '2px' }}>
        {/* Pie Chart */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ width: '100%', maxWidth: '100%', position: 'relative' }}>
            {drillCenterText}
            <div
              onClick={(e) => { if (isBackgroundClick(e.target as HTMLElement)) handleBackgroundClick(); }}
              style={{ width: '100%', height: '100%', cursor: 'default' }}
            >
              <ResponsiveContainer width="100%" height={260}>
                <PieChart onMouseLeave={() => drilledCategory ? clearAssetHover() : clearHover()}>
                  <Pie
                    activeIndex={resolvedActiveIndex}
                    activeShape={renderActiveShape}
                    data={displayedChartData}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={100}
                    fill="#8884d8" dataKey="value"
                    onClick={handlePieClick}
                    onMouseEnter={handlePieMouseEnter}
                    animationBegin={0} animationDuration={600} animationEasing="ease-out"
                    startAngle={90} endAngle={450}
                  >
                    {displayedChartData.map((entry, index) => {
                      const isHighlighted = drilledCategory
                        ? hoveredAsset?.assetName === entry.name
                        : (hoveredCategoryKey === entry.categoryKey || selectedCategory === entry.categoryKey ||
                          activeIndex === index ||
                          (selectedAsset?.categoryKey === entry.categoryKey &&
                            (entry.name === selectedAsset.assetName || entry.name === `${selectedAsset.assetName} Debt`)));

                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="rgba(15, 23, 42, 0.6)"
                          strokeWidth={2}
                          opacity={isHighlighted ? 1 : 0.65}
                          style={{ cursor: 'pointer', outline: 'none', transition: 'opacity 0.2s ease' }}
                        />
                      );
                    })}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Bar Chart */}
        <div
          onClick={(e) => { if (isBackgroundClick(e.target as HTMLElement)) handleBackgroundClick(); }}
          style={{ width: '100%', height: '100%', cursor: 'default' }}
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={barChartData} margin={{ top: 10, right: 10, left: 10, bottom: 65 }}>
              {(() => {
                let xAxisFontSize = 9;
                let xAxisAngle = -25;
                let xAxisHeight = 70;

                if (isMobile) {
                  if (barChartData.length > 15) {
                    xAxisFontSize = 6;
                    xAxisAngle = -90;
                    xAxisHeight = 120;
                  } else if (barChartData.length > 10) {
                    xAxisFontSize = 7;
                    xAxisAngle = -45;
                    xAxisHeight = 100;
                  } else if (barChartData.length > 5) {
                    xAxisFontSize = 8;
                    xAxisAngle = -35;
                    xAxisHeight = 85;
                  }
                }

                return (
                  <XAxis
                    dataKey="category"
                    stroke="#94a3b8"
                    tick={{ fill: '#cbd5e1', fontSize: xAxisFontSize }}
                    angle={xAxisAngle}
                    textAnchor="end"
                    height={xAxisHeight}
                    interval={0}
                  />
                );
              })()}
              <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 11 }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              {(() => {
                const maxStacks = Math.max(...barChartData.map(c => (c.assetCount as number) || 0), 0);
                const bars = [];

                for (let si = 0; si < maxStacks; si++) {
                  const isDebtStack = barChartData.some(e => e[`asset_${si}_isDebt`] === true);
                  const isEquityStack = barChartData.some(e => e[`asset_${si}_isEquity`] === true);
                  const stackId = drilledCategory ? 'drillStack' : 'stack';

                  bars.push(
                    <Bar
                      key={`asset_${si}`}
                      dataKey={`asset_${si}`}
                      stackId={stackId}
                      radius={[0, 0, 0, 0]}
                      animationDuration={drilledCategory ? 500 : 600}
                      animationBegin={si * 100}
                      animationEasing="ease-out"
                      onClick={(data: Record<string, unknown>, index: number, event: unknown) =>
                        handleBarClick(data, index, event as React.MouseEvent)}
                      onMouseEnter={(data: Record<string, unknown>) => {
                        if (drilledCategory) {
                          const name = (data.assetName as string) || (data.category as string);
                          if (name) hoverAsset(drilledCategory, name);
                        } else {
                          const key = data.categoryKey as string;
                          if (key) {
                            const idx = combinedChartData.findIndex(c => c.categoryKey === key);
                            hoverCategory(key, idx >= 0 ? idx : 0);
                          }
                        }
                      }}
                      onMouseLeave={() => drilledCategory ? clearAssetHover() : clearHover()}
                      style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                    >
                      {barChartData.map((entry, index) => {
                        const isHovered = drilledCategory
                          ? hoveredAsset?.assetName === entry.assetName
                          : hoveredCategoryKey === entry.categoryKey;

                        let color = '#888';
                        if (isDebtStack && entry[`asset_${si}_isDebt`]) {
                          color = '#EF4444';
                        } else if (isEquityStack && entry[`asset_${si}_isEquity`]) {
                          if (drilledCategory) {
                            const cat = combinedChartData.find(c => c.categoryKey === drilledCategory);
                            color = cat ? shadeColor(cat.color, index, barChartData.length) : '#888';
                          } else {
                            const cat = combinedChartData.find(c => c.categoryKey === entry.categoryKey);
                            color = cat?.color || '#888';
                          }
                        } else {
                          const cat = combinedChartData.find(c => c.categoryKey === entry.categoryKey);
                          color = cat?.color || '#888';
                        }

                        return (
                          <Cell key={`cell-${index}`} fill={color}
                            opacity={isHovered ? (drilledCategory ? 1 : 0.95) : (drilledCategory ? 0.75 : 0.5)}
                            style={{ transition: 'opacity 0.2s ease' }} />
                        );
                      })}
                    </Bar>
                  );
                }
                return bars;
              })()}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Legend */}
      <ChartLegend
        categories={combinedChartData}
        hoveredCategoryKey={hoveredCategoryKey}
        selectedCategory={selectedCategory}
        drilledCategory={drilledCategory}
        onHover={handleLegendHover}
        onHoverLeave={() => { if (!drilledCategory) clearHover(); }}
        onClick={handleLegendClick}
      />

      {/* Detail Table */}
      {selectedCatData && (
        <CategoryDetailTable
          categoryKey={selectedCategory!}
          assets={selectedCatData.assets}
          selectedAsset={selectedAsset}
          onSelectAsset={handleDetailSelectAsset}
        />
      )}
    </div>
  );
};
