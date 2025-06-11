/**
 * Formats a number as USD currency
 * @param amount The amount to format, can be undefined or null
 * @returns Formatted currency string or empty string if amount is undefined/null
 */
export function formatCurrency(amount?: number | null): string {
  if (amount === undefined || amount === null) {
    return "$0"
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount)
}
