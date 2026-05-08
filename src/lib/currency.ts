/**
 * Format currency to Indonesian Rupiah (IDR)
 * @param amount - The amount in number
 * @returns Formatted string in IDR with Rp prefix
 */
export const formatCurrency = (amount: number | string): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numAmount);
};
