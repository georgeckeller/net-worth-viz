// Currency formatter for USD with abbreviations
export const formatCurrency = (value: number): string => {
  const isNegative = value < 0;
  const absValue = Math.abs(value);
  const sign = isNegative ? '-' : '';

  // For millions
  if (absValue >= 1000000) {
    return `${sign}$${(absValue / 1000000).toFixed(2)}M`;
  }
  // For thousands
  else if (absValue >= 1000) {
    return `${sign}$${(absValue / 1000).toFixed(2)}K`;
  }
  // For values under $1,000, round to nearest dollar (no cents)
  else {
    return `${sign}$${Math.round(absValue)}`;
  }
};
