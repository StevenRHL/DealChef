import { ensureSessionId, setSessionCookie } from "../../../lib/session";
import { getProfile, updateProfile } from "../../../lib/store";
import type { UserProfile } from "../../../lib/types";

export async function GET() {
  const { sessionId } = await ensureSessionId();
  await setSessionCookie(sessionId);
  return Response.json({ profile: getProfile(sessionId) });
}

export async function POST(request: Request) {
  const { sessionId } = await ensureSessionId();
  const payload = await request.json() as Record<string, unknown>;
  const profile = updateProfile(sessionId, {
    postcode: String(payload.postcode ?? "2033").slice(0, 10),
    email: String(payload.email ?? "").slice(0, 180),
    alerts_enabled: Boolean(payload.alerts_enabled),
    pantry_items: Array.isArray(payload.pantry_items) ? payload.pantry_items.map(String).slice(0, 20) : getProfile(sessionId).pantry_items,
    retailers: Array.isArray(payload.retailers) ? payload.retailers.map(String).filter((retailer) => ["coles", "woolworths", "aldi"].includes(retailer)) as UserProfile["retailers"] : getProfile(sessionId).retailers,
    dietary_preferences: Array.isArray(payload.dietary_preferences) ? payload.dietary_preferences.map(String).slice(0, 10) : getProfile(sessionId).dietary_preferences,
  });
  await setSessionCookie(sessionId);
  return Response.json({ profile });
}
