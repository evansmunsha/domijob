/**
 * Formats a number as USD currency
 * @param amount The number to format (can be undefined)
 * @returns Formatted currency string
 */
export function formatCurrency(amount?: number) {
  if (amount === undefined || amount === null) {
    return ""
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount)
}
