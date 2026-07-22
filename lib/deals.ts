import { fixtureDeals } from "./fixtures";
import { computeDiscount, resolveBaseline } from "./discounts";
import type { Deal } from "./types";

export function getFixtureDeals() {
  return fixtureDeals.map((deal) => ({ ...deal }));
}

export function applyHistoricalBaselines(deals: Deal[], getHistory: (dealId: string) => { price: number; captured_at: string }[]) {
  return deals.map((deal) => {
    const baseline = resolveBaseline(deal.current_price, deal.was_price, getHistory(deal.id));
    if (!baseline.baseline) return { ...deal, baseline_source: baseline.source, confidence: "unverified" as const };
    const discount = computeDiscount(deal.current_price, baseline.baseline);
    return { ...deal, was_price: deal.was_price ?? baseline.baseline, discount_percent: discount, baseline_source: baseline.source, confidence: discount >= 50 ? "verified" as const : "unverified" as const };
  });
}

export function filterDeals(deals: Deal[], query: URLSearchParams) {
  const retailer = query.get("retailer");
  const category = query.get("category");
  return deals.filter((deal) => (!retailer || retailer === "all" || deal.retailer === retailer) && (!category || category === "All deals" || deal.category === category));
}

export function dealIngredients(deals: Deal[]) {
  return deals.flatMap((deal) => {
    const value = deal.name.toLowerCase();
    if (value.includes("spaghetti")) return ["spaghetti", "pasta"];
    if (value.includes("tomato")) return ["tomatoes"];
    if (value.includes("chicken")) return ["chicken"];
    if (value.includes("mince")) return ["beef mince"];
    if (value.includes("spinach")) return ["spinach"];
    if (value.includes("coconut")) return ["coconut milk"];
    if (value.includes("rice")) return ["rice"];
    if (value.includes("bean")) return ["kidney beans"];
    if (value.includes("capsicum")) return ["capsicum"];
    if (value.includes("taco")) return ["tortillas"];
    return [value];
  });
}
