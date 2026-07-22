import { ensureSessionId, setSessionCookie } from "../../../lib/session";
import { getProfile } from "../../../lib/store";

export async function GET() {
  const { sessionId } = await ensureSessionId();
  await setSessionCookie(sessionId);
  return Response.json({ session_id: sessionId, profile: getProfile(sessionId), cookie: { max_age_days: 30, http_only: true, same_site: "lax" } });
}
