import type { BaselineSource } from "./types";

export type HistoricalObservation = { price: number; captured_at: string };

export function computeDiscount(current: number, baseline: number | null | undefined) {
  if (!baseline || baseline <= current || current < 0) return 0;
  return Math.round(((baseline - current) / baseline) * 1000) / 10;
}

function median(values: number[]) {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function resolveBaseline(current: number, wasPrice: number | null | undefined, observations: HistoricalObservation[], now = Date.now()): { baseline: number | null; source: BaselineSource } {
  if (wasPrice && wasPrice > current) return { baseline: wasPrice, source: "retailer_was_price" };
  const cutoff = now - 28 * 24 * 60 * 60 * 1000;
  const recentPrices = observations.filter((observation) => new Date(observation.captured_at).getTime() >= cutoff).map((observation) => observation.price).filter((price) => Number.isFinite(price) && price > 0);
  if (recentPrices.length >= 3) return { baseline: median(recentPrices), source: "historical_median" };
  return { baseline: null, source: "insufficient_history" };
}
