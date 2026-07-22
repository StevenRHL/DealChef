import { ensureSessionId, setSessionCookie } from "../../../../lib/session";
import { removeWatchlist } from "../../../../lib/store";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { sessionId } = await ensureSessionId();
  const { id } = await params;
  removeWatchlist(sessionId, decodeURIComponent(id));
  await setSessionCookie(sessionId);
  return Response.json({ ok: true });
}
