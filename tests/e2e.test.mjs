import assert from "node:assert/strict";
import test from "node:test";

async function workerForTest() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("e2e", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker;
}

test("guest workflow reaches deals, watchlist, recipes, and notification demo", async () => {
  const worker = await workerForTest();
  const env = { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } };
  const ctx = { waitUntil() {}, passThroughOnException() {} };
  const call = (path, init = {}) => worker.fetch(new Request(`http://localhost${path}`, { ...init, headers: { ...(init.headers ?? {}), accept: "application/json" } }), env, ctx);

  const sessionResponse = await call("/api/session");
  assert.equal(sessionResponse.status, 200);
  const session = await sessionResponse.json();
  const cookie = sessionResponse.headers.get("set-cookie").split(";", 1)[0];
  assert.ok(session.session_id);

  const profileResponse = await call("/api/profile", { method: "POST", headers: { cookie, "content-type": "application/json" }, body: JSON.stringify({ postcode: "2033", email: "demo@example.com", alerts_enabled: true, pantry_items: ["garlic"] }) });
  assert.equal(profileResponse.status, 200);

  const dealsResponse = await call("/api/deals", { headers: { cookie } });
  const deals = await dealsResponse.json();
  assert.ok(deals.deals.length >= 5);
  const dealId = deals.deals.find((deal) => deal.discount_percent >= 50).id;

  const watchResponse = await call("/api/watchlist", { method: "POST", headers: { cookie, "content-type": "application/json" }, body: JSON.stringify({ deal_id: dealId }) });
  assert.equal(watchResponse.status, 201);

  const recipesResponse = await call(`/api/recommendations?deal_ids=${encodeURIComponent(dealId)}`, { headers: { cookie } });
  const recipes = await recipesResponse.json();
  assert.ok(recipes.recipes.length > 0);

  const notificationResponse = await call("/api/notifications/test", { method: "POST", headers: { cookie, "content-type": "application/json" }, body: JSON.stringify({ email: "demo@example.com" }) });
  const notification = await notificationResponse.json();
  assert.equal(notificationResponse.status, 200);
  assert.equal(notification.demo, true);
});
