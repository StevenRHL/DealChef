import type { Deal, UserProfile, WatchlistItem, WorkflowSession } from "./types";
import type { HistoricalObservation } from "./discounts";

type Store = {
  profiles: Map<string, UserProfile>;
  watchlists: Map<string, WatchlistItem[]>;
  workflows: WorkflowSession[];
  lastRefresh: Map<string, number>;
  notificationLog: Set<string>;
  observations: Map<string, HistoricalObservation[]>;
  pushSubscriptions: Map<string, Array<Record<string, unknown>>>;
  activeRefresh: Promise<{ mode: "fixture" | "live"; deals: Deal[] }> | null;
};

const globalStore = globalThis as typeof globalThis & { __dealChefStore?: Store };

const store: Store = globalStore.__dealChefStore ?? {
  profiles: new Map(),
  watchlists: new Map(),
  workflows: [],
  lastRefresh: new Map(),
  notificationLog: new Set(),
  observations: new Map(),
  pushSubscriptions: new Map(),
  activeRefresh: null,
};

globalStore.__dealChefStore = store;

export function defaultProfile(sessionId: string): UserProfile {
  return { session_id: sessionId, postcode: "2033", retailers: ["coles", "woolworths", "aldi"], pantry_items: ["olive oil", "garlic", "salt"], dietary_preferences: [], email: "", alerts_enabled: false };
}

export function getProfile(sessionId: string) {
  if (!store.profiles.has(sessionId)) store.profiles.set(sessionId, defaultProfile(sessionId));
  return store.profiles.get(sessionId)!;
}

export function updateProfile(sessionId: string, patch: Partial<UserProfile>) {
  const next = { ...getProfile(sessionId), ...patch, session_id: sessionId };
  store.profiles.set(sessionId, next);
  return next;
}

export function getWatchlist(sessionId: string) {
  return store.watchlists.get(sessionId) ?? [];
}

export function addWatchlist(sessionId: string, dealId: string) {
  const current = getWatchlist(sessionId);
  const existing = current.find((item) => item.deal_id === dealId);
  if (existing) return existing;
  const item: WatchlistItem = { id: crypto.randomUUID(), session_id: sessionId, deal_id: dealId, created_at: new Date().toISOString() };
  store.watchlists.set(sessionId, [...current, item]);
  return item;
}

export function removeWatchlist(sessionId: string, dealId: string) {
  store.watchlists.set(sessionId, getWatchlist(sessionId).filter((item) => item.deal_id !== dealId));
}

export function getLastRefresh(sessionId: string) {
  return store.lastRefresh.get(sessionId) ?? 0;
}

export function setLastRefresh(sessionId: string) {
  const timestamp = Date.now();
  store.lastRefresh.set(sessionId, timestamp);
  return timestamp;
}

export function saveWorkflow(workflow: WorkflowSession) {
  store.workflows.push(workflow);
  return workflow;
}

export function hasNotificationBeenSent(key: string) {
  return store.notificationLog.has(key);
}

export function markNotificationSent(key: string) {
  store.notificationLog.add(key);
}

export function recordObservations(deals: Deal[]) {
  for (const deal of deals) {
    const current = store.observations.get(deal.id) ?? [];
    store.observations.set(deal.id, [...current, { price: deal.current_price, captured_at: deal.captured_at }].slice(-30));
  }
}

export function getObservations(dealId: string) {
  return store.observations.get(dealId) ?? [];
}

export function savePushSubscription(sessionId: string, subscription: Record<string, unknown>) {
  const current = store.pushSubscriptions.get(sessionId) ?? [];
  const endpoint = String(subscription.endpoint ?? "");
  const next = [...current.filter((item) => item.endpoint !== endpoint), subscription];
  store.pushSubscriptions.set(sessionId, next);
  return subscription;
}

export function getActiveRefresh() {
  return store.activeRefresh;
}

export function setActiveRefresh(promise: Promise<{ mode: "fixture" | "live"; deals: Deal[] }>) {
  store.activeRefresh = promise;
}

export function clearActiveRefresh() {
  store.activeRefresh = null;
}
