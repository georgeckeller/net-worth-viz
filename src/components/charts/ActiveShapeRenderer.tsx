import React from 'react';
import { Sector } from 'recharts';
import { formatCurrency } from '../../utils/formatters';

/** Custom active shape for interactive donut — shows details inside the center */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const renderActiveShape = (props: any) => {
  // Props are injected by Recharts with the shape described by ActiveShapeProps
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;

  const hasDebtInfo = payload.assetValue !== undefined && payload.debtValue !== undefined;
  const debtValue = (payload.debtValue as number) || 0;

  return (
    <g>
      <text x={cx} y={cy} dy={hasDebtInfo ? -20 : -10} textAnchor="middle" fill="#f1f5f9" fontSize={13} fontWeight={600}>
        {payload.name as string}
      </text>

      {hasDebtInfo ? (
        <>
          <text x={cx} y={cy} dy={2} textAnchor="middle" fill="#10b981" fontSize={16} fontWeight={700}>
            {formatCurrency(value)}
          </text>
          {debtValue > 0 && (
            <text x={cx} y={cy} dy={18} textAnchor="middle" fill="#EF4444" fontSize={12} fontWeight={600}>
              Debt: {formatCurrency(debtValue)}
            </text>
          )}
          <text x={cx} y={cy} dy={debtValue > 0 ? 36 : 20} textAnchor="middle" fill="#64748b" fontSize={11}>
            {`${(percent * 100).toFixed(1)}%`}
          </text>
        </>
      ) : (
        <>
          <text x={cx} y={cy} dy={12} textAnchor="middle" fill="#10b981" fontSize={18} fontWeight={700}>
            {formatCurrency(value)}
          </text>
          <text x={cx} y={cy} dy={30} textAnchor="middle" fill="#64748b" fontSize={11}>
            {`${(percent * 100).toFixed(1)}%`}
          </text>
        </>
      )}

      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8}
        startAngle={startAngle} endAngle={endAngle} fill={fill} style={{ filter: 'brightness(1.1)' }} />

      <Sector cx={cx} cy={cy} startAngle={startAngle} endAngle={endAngle}
        innerRadius={outerRadius + 12} outerRadius={outerRadius + 15} fill={fill} opacity={0.7} />
    </g>
  );
};
