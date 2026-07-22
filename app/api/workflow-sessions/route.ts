import { ensureSessionId, setSessionCookie } from "../../../lib/session";
import { saveWorkflow } from "../../../lib/store";

export async function POST(request: Request) {
  const { sessionId } = await ensureSessionId();
  const payload = await request.json() as { session_id?: string; manual_seconds?: number[]; app_seconds?: number[] };
  if (!payload.session_id || payload.session_id !== sessionId) return Response.json({ error: "session_id does not match the signed cookie" }, { status: 403 });
  if (!Array.isArray(payload.manual_seconds) || !Array.isArray(payload.app_seconds)) return Response.json({ error: "manual_seconds and app_seconds are required" }, { status: 400 });
  const workflow = saveWorkflow({ id: crypto.randomUUID(), session_id: sessionId, manual_seconds: payload.manual_seconds.map(Number), app_seconds: payload.app_seconds.map(Number), created_at: new Date().toISOString() });
  await setSessionCookie(sessionId);
  return Response.json({ workflow }, { status: 201 });
}
