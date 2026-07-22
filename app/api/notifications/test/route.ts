import { ensureSessionId, setSessionCookie } from "../../../../lib/session";
import { getProfile } from "../../../../lib/store";

export async function POST(request: Request) {
  const { sessionId } = await ensureSessionId();
  const payload = await request.json().catch(() => ({})) as { email?: string };
  const email = String(payload.email || getProfile(sessionId).email || "").trim();
  await setSessionCookie(sessionId);
  if (!email || !process.env.RESEND_API_KEY) return Response.json({ ok: true, demo: true, message: "Demo alert queued" });
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: process.env.RESEND_FROM_EMAIL || "DealChef <onboarding@resend.dev>", to: [email], subject: "DealChef test alert", html: "<p>Your DealChef alert channel is ready. We will let you know when a watched item hits half price.</p>" }) });
  if (!response.ok) return Response.json({ error: "Email provider rejected the request" }, { status: 502 });
  return Response.json({ ok: true, demo: false });
}
