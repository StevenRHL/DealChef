import assert from "node:assert/strict";
import test from "node:test";
import { computeDiscount, resolveBaseline } from "../lib/discounts.ts";

test("computes the exact half-price boundary", () => {
  assert.equal(computeDiscount(5, 10), 50);
  assert.equal(computeDiscount(5.01, 10), 49.9);
  assert.equal(computeDiscount(4, 10), 60);
});

test("prefers a valid current retailer was-price", () => {
  const result = resolveBaseline(5, 10, []);
  assert.deepEqual(result, { baseline: 10, source: "retailer_was_price" });
});

test("uses a 28-day median after three observations", () => {
  const now = Date.parse("2026-07-22T00:00:00Z");
  const result = resolveBaseline(5, null, [
    { price: 10, captured_at: "2026-07-01T00:00:00Z" },
    { price: 12, captured_at: "2026-07-08T00:00:00Z" },
    { price: 14, captured_at: "2026-07-15T00:00:00Z" },
  ], now);
  assert.deepEqual(result, { baseline: 12, source: "historical_median" });
});

test("withholds a half-price label when history is insufficient", () => {
  const now = Date.parse("2026-07-22T00:00:00Z");
  const result = resolveBaseline(5, null, [{ price: 10, captured_at: "2026-07-15T00:00:00Z" }], now);
  assert.deepEqual(result, { baseline: null, source: "insufficient_history" });
});

test("ignores stale history older than 28 days", () => {
  const now = Date.parse("2026-07-22T00:00:00Z");
  const result = resolveBaseline(5, null, [
    { price: 10, captured_at: "2026-06-01T00:00:00Z" },
    { price: 12, captured_at: "2026-06-02T00:00:00Z" },
    { price: 14, captured_at: "2026-06-03T00:00:00Z" },
  ], now);
  assert.deepEqual(result, { baseline: null, source: "insufficient_history" });
});
