export function formatVnd(value: number): string {
  return new Intl.NumberFormat("ja-JP", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatWeight(grams: number): string {
  return grams >= 1000 ? `${grams / 1000}kg` : `${grams}g`;
}

export function clampRating(rating: number): number {
  return Math.max(0, Math.min(5, Math.round(rating)));
}
