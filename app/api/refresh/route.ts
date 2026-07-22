import { applyHistoricalBaselines } from "../../../lib/deals";
import { clearActiveRefresh, getActiveRefresh, getLastRefresh, getObservations, recordObservations, setActiveRefresh, setLastRefresh } from "../../../lib/store";
import { ensureSessionId, setSessionCookie } from "../../../lib/session";
import { refreshRetailerDeals } from "../../../lib/retailer-sources";
import { sendWatchedDealAlerts } from "../../../lib/notifications";

export async function POST() {
  const { sessionId } = await ensureSessionId();
  const elapsed = Date.now() - getLastRefresh(sessionId);
  if (elapsed < 60_000) {
    const retryAfter = Math.ceil((60_000 - elapsed) / 1000);
    return Response.json({ error: "refresh_throttled", retry_after: retryAfter }, { status: 429, headers: { "Retry-After": String(retryAfter) } });
  }
  setLastRefresh(sessionId);
  let result = getActiveRefresh();
  if (!result) {
    const refreshPromise = refreshRetailerDeals();
    setActiveRefresh(refreshPromise);
    try {
      result = await refreshPromise;
    } finally {
      clearActiveRefresh();
    }
  } else {
    result = await result;
  }
  recordObservations(result.deals);
  const deals = applyHistoricalBaselines(result.deals, getObservations);
  const alerts = await sendWatchedDealAlerts(sessionId, deals);
  await setSessionCookie(sessionId);
  return Response.json({ mode: result.mode, deals, alerts, refreshed_at: new Date().toISOString() });
}
