import { getFixtureDeals } from "./deals";
import type { Deal, NormalizedProduct, Retailer } from "./types";

function cleanNumber(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;
  const parsed = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalize(retailer: Retailer, item: Record<string, unknown>, index: number): NormalizedProduct | null {
  const current = cleanNumber(item.price ?? item.current_price ?? item.salePrice);
  if (!current) return null;
  const name = String(item.name ?? item.title ?? item.productName ?? "").trim();
  if (!name) return null;
  return {
    retailer,
    external_id: String(item.id ?? item.sku ?? item.stockcode ?? `${retailer}-${index}`),
    name,
    brand: String(item.brand ?? "").trim() || undefined,
    size: String(item.size ?? item.pack_size ?? "").trim() || undefined,
    category: String(item.category ?? item.department ?? "Pantry").trim(),
    current_price: current,
    was_price: cleanNumber(item.was_price ?? item.wasPrice ?? item.original_price) || undefined,
    unit_price: cleanNumber(item.unit_price ?? item.unitPrice) || undefined,
    image_url: String(item.image_url ?? item.image ?? "").trim() || undefined,
    product_url: String(item.product_url ?? item.url ?? "").trim() || undefined,
    captured_at: new Date().toISOString(),
  };
}

function wrapProducts(retailer: Retailer, payload: unknown) {
  const root = payload as Record<string, unknown>;
  const values = Array.isArray(payload) ? payload : Array.isArray(root.products) ? root.products : Array.isArray(root.items) ? root.items : Array.isArray(root.data) ? root.data : [];
  return values.map((item, index) => normalize(retailer, item as Record<string, unknown>, index)).filter(Boolean) as NormalizedProduct[];
}

function normalizeLiveProducts(products: NormalizedProduct[]) {
  return products.map((product) => {
    const baseline = product.was_price && product.was_price > product.current_price ? product.was_price : null;
    const discount = baseline ? ((baseline - product.current_price) / baseline) * 100 : 0;
    return {
      ...product,
      id: `${product.retailer}:${product.external_id}`,
      discount_percent: Math.round(discount * 10) / 10,
      baseline_source: baseline ? "retailer_was_price" : "insufficient_history",
      unit_price_label: product.unit_price ? `$${product.unit_price.toFixed(2)} / unit` : "unit price unavailable",
      image_emoji: product.retailer === "aldi" ? "🛒" : product.retailer === "coles" ? "🥕" : "🍎",
      confidence: baseline && discount >= 50 ? "verified" : "unverified",
    } satisfies Deal;
  });
}

async function parseFetch(url: string, apiKey: string) {
  const response = await fetch(url, { headers: { "X-API-Key": apiKey }, signal: AbortSignal.timeout(7000) });
  if (!response.ok) throw new Error(`provider returned ${response.status}`);
  return response.json();
}

export async function refreshRetailerDeals() {
  if (process.env.DEALCHEF_DEMO_MODE !== "false") return { mode: "fixture" as const, deals: getFixtureDeals() };
  const live: NormalizedProduct[] = [];
  const parseKey = process.env.PARSE_API_KEY;
  const apifyKey = process.env.APIFY_API_TOKEN;

  if (parseKey) {
    const colesUrl = "https://api.parse.bot/scraper/dd2897d9-0135-464a-b16a-54ccc10e02e4/get_specials?page=1";
    const wooliesUrl = "https://api.parse.bot/scraper/d5aff3d6-33c4-431f-bf9d-6191efaec2e6/search_products?page=1&page_size=100&is_special=true&search_term=groceries";
    await Promise.allSettled([parseFetch(colesUrl, parseKey).then((payload) => live.push(...wrapProducts("coles", payload))), parseFetch(wooliesUrl, parseKey).then((payload) => live.push(...wrapProducts("woolworths", payload)))]);
  }
  if (apifyKey) {
    try {
      const response = await fetch(`https://api.apify.com/v2/acts/abotapi~aldi-com-au-scraper/run-sync-get-dataset-items?token=${encodeURIComponent(apifyKey)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "search", categories: ["Lower Prices", "Super Savers", "Special Buys"], maxItems: 100 }), signal: AbortSignal.timeout(15000) });
      if (response.ok) live.push(...wrapProducts("aldi", await response.json()));
    } catch {
      // Keep partial live results and use fixtures for missing retailers below.
    }
  }
  if (!live.length) return { mode: "fixture" as const, deals: getFixtureDeals() };
  const liveDeals = normalizeLiveProducts(live);
  const liveRetailers = new Set(liveDeals.map((deal) => deal.retailer));
  const fallbacks = getFixtureDeals().filter((deal) => !liveRetailers.has(deal.retailer));
  return { mode: "live" as const, deals: [...liveDeals, ...fallbacks] };
}
