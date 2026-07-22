import { getFixtureDeals } from "../../../lib/deals";
import { recommendRecipes } from "../../../lib/recipes";
import { ensureSessionId, setSessionCookie } from "../../../lib/session";
import { getProfile } from "../../../lib/store";

export async function GET(request: Request) {
  const { sessionId } = await ensureSessionId();
  const ids = new Set((new URL(request.url).searchParams.get("deal_ids") ?? "").split(",").filter(Boolean));
  const deals = getFixtureDeals().filter((deal) => ids.has(deal.id));
  const result = await recommendRecipes(deals.length ? deals : getFixtureDeals().slice(0, 4), getProfile(sessionId).pantry_items);
  await setSessionCookie(sessionId);
  return Response.json(result);
}
