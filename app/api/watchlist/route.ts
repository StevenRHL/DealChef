import { ensureSessionId, setSessionCookie } from "../../../lib/session";
import { addWatchlist, getWatchlist } from "../../../lib/store";

export async function GET() {
  const { sessionId } = await ensureSessionId();
  await setSessionCookie(sessionId);
  return Response.json({ items: getWatchlist(sessionId) });
}

export async function POST(request: Request) {
  const { sessionId } = await ensureSessionId();
  const payload = await request.json() as { deal_id?: string };
  if (!payload.deal_id) return Response.json({ error: "deal_id is required" }, { status: 400 });
  const item = addWatchlist(sessionId, payload.deal_id);
  await setSessionCookie(sessionId);
  return Response.json({ item }, { status: 201 });
}
