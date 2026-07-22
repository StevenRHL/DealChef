import assert from "node:assert/strict";
import test from "node:test";
import { refreshRetailerDeals } from "../lib/retailer-sources.ts";
import { sendWatchedDealAlerts } from "../lib/notifications.ts";
import { recommendRecipes } from "../lib/recipes.ts";
import {
  addWatchlist,
  hasNotificationBeenSent,
  updateProfile,
} from "../lib/store.ts";

function withEnv(vars, fn) {
  const previous = {};
  for (const key of Object.keys(vars)) previous[key] = process.env[key];
  Object.assign(process.env, vars);
  return Promise.resolve(fn()).finally(() => {
    for (const key of Object.keys(vars)) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  });
}

function withFetch(mockFetch, fn) {
  const original = globalThis.fetch;
  globalThis.fetch = mockFetch;
  return Promise.resolve(fn()).finally(() => {
    globalThis.fetch = original;
  });
}

test("adapter: filters malformed provider items and falls back per-retailer", async () => {
  await withEnv({ DEALCHEF_DEMO_MODE: "false", PARSE_API_KEY: "test-key", APIFY_API_TOKEN: "" }, () =>
    withFetch(async (url) => {
      const target = String(url);
      if (target.includes("get_specials")) {
        // Coles: mix of a valid item and malformed rows (no price, non-numeric price, no name).
        return new Response(
          JSON.stringify({
            products: [
              { name: "Valid Pasta", price: "$2.50", was_price: "$5.00", id: "c1" },
              { name: "Missing price" },
              { price: "not-a-number", name: "Bad price" },
              { price: 3 },
            ],
          }),
          { status: 200 },
        );
      }
      if (target.includes("search_products")) {
        // Woolworths provider is down / rate-limited.
        return new Response("rate limited", { status: 429 });
      }
      throw new Error(`unexpected fetch to ${target}`);
    }, async () => {
      const result = await refreshRetailerDeals();
      assert.equal(result.mode, "live");
      const coles = result.deals.filter((deal) => deal.retailer === "coles");
      assert.equal(coles.length, 1, "malformed coles rows should be dropped");
      assert.equal(coles[0].name, "Valid Pasta");
      const woolworths = result.deals.filter((deal) => deal.retailer === "woolworths");
      assert.ok(woolworths.length > 0, "woolworths should fall back to fixtures when its provider fails");
    }),
  );
});

test("adapter: falls back to fixtures entirely when every provider is unreachable", async () => {
  await withEnv({ DEALCHEF_DEMO_MODE: "false", PARSE_API_KEY: "test-key", APIFY_API_TOKEN: "test-token" }, () =>
    withFetch(async () => {
      throw new Error("network timeout");
    }, async () => {
      const result = await refreshRetailerDeals();
      assert.equal(result.mode, "fixture");
      assert.ok(result.deals.length > 0);
    }),
  );
});

test("notifications: dedupes by session_id + watchlist_item + deal observation", async () => {
  const sessionId = `test-session-${crypto.randomUUID()}`;
  updateProfile(sessionId, { email: "friend@example.com", alerts_enabled: true });
  const dealId = "coles:coles-pasta-001";
  addWatchlist(sessionId, dealId);
  const deal = { id: dealId, retailer: "coles", name: "Spaghetti No. 5", current_price: 2.5, discount_percent: 50, captured_at: "2026-07-22T00:00:00.000Z" };

  const first = await sendWatchedDealAlerts(sessionId, [deal]);
  assert.equal(first.sent, 1);

  const second = await sendWatchedDealAlerts(sessionId, [deal]);
  assert.equal(second.sent, 0, "the same deal observation should not alert twice");

  const key = `${sessionId}:${deal.id}:${deal.captured_at}`;
  assert.equal(hasNotificationBeenSent(key), true);
});

test("notifications: does not alert when the discount is below 50%", async () => {
  const sessionId = `test-session-${crypto.randomUUID()}`;
  updateProfile(sessionId, { email: "friend@example.com", alerts_enabled: true });
  const dealId = "aldi:aldi-eggs-001";
  addWatchlist(sessionId, dealId);
  const deal = { id: dealId, retailer: "aldi", name: "Free Range Eggs", current_price: 5, discount_percent: 30, captured_at: "2026-07-22T00:00:00.000Z" };

  const result = await sendWatchedDealAlerts(sessionId, [deal]);
  assert.equal(result.sent, 0);
});

test("recipes: falls back to the local library when Spoonacular fails", async () => {
  await withEnv({ SPOONACULAR_API_KEY: "test-key" }, () =>
    withFetch(async () => new Response("service unavailable", { status: 503 }), async () => {
      const result = await recommendRecipes(
        [{ id: "coles:coles-pasta-001", name: "Spaghetti No. 5", retailer: "coles" }],
        ["garlic"],
      );
      assert.equal(result.source, "fixture");
      assert.ok(result.recipes.length > 0);
    }),
  );
});

test("recipes: falls back to the local library when Spoonacular times out/errors", async () => {
  await withEnv({ SPOONACULAR_API_KEY: "test-key" }, () =>
    withFetch(async () => {
      throw new Error("network timeout");
    }, async () => {
      const result = await recommendRecipes(
        [{ id: "coles:coles-tomato-001", name: "Truss Tomatoes", retailer: "coles" }],
        ["basil"],
      );
      assert.equal(result.source, "fixture");
      assert.ok(result.recipes.length > 0);
    }),
  );
});
