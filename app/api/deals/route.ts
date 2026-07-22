import { applyHistoricalBaselines, filterDeals } from "../../../lib/deals";
import { refreshRetailerDeals } from "../../../lib/retailer-sources";
import { ensureSessionId, setSessionCookie } from "../../../lib/session";
import { getObservations, recordObservations } from "../../../lib/store";

export async function GET(request: Request) {
  const { sessionId } = await ensureSessionId();
  const result = await refreshRetailerDeals();
  recordObservations(result.deals);
  const deals = filterDeals(applyHistoricalBaselines(result.deals, getObservations), new URL(request.url).searchParams);
  await setSessionCookie(sessionId);
  return Response.json({ deals, mode: result.mode, captured_at: new Date().toISOString() });
}
