// lib/currency.ts
export function formatMoneyUSD(valueUSD: number) {
  return `$${valueUSD.toFixed(2)}`;
}

export function formatMoneyPHP(valueUSD: number, usdToPhpRate: number, showUsdApprox = true) {
  const php = valueUSD * usdToPhpRate;
  return showUsdApprox
    ? `₱${php.toFixed(2)} (≈ $${valueUSD.toFixed(2)})`
    : `₱${php.toFixed(2)}`;
}
