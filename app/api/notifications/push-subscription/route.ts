import { ensureSessionId, setSessionCookie } from "../../../../lib/session";
import { savePushSubscription } from "../../../../lib/store";

export async function POST(request: Request) {
  const { sessionId } = await ensureSessionId();
  const payload = await request.json() as { endpoint?: string; expirationTime?: number | null; keys?: Record<string, string> };
  if (!payload.endpoint) return Response.json({ error: "endpoint is required" }, { status: 400 });
  const subscription = savePushSubscription(sessionId, { endpoint: payload.endpoint, expiration_time: payload.expirationTime ?? null, keys: payload.keys ?? {}, saved_at: new Date().toISOString() });
  await setSessionCookie(sessionId);
  return Response.json({ ok: true, session_id: sessionId, subscription, stretch: true });
}
