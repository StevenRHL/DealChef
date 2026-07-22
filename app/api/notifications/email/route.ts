import { ensureSessionId, setSessionCookie } from "../../../../lib/session";

export async function POST(request: Request) {
  const { sessionId } = await ensureSessionId();
  const payload = await request.json() as { to?: string; subject?: string; html?: string };
  if (!payload.to) return Response.json({ error: "to is required" }, { status: 400 });
  if (!process.env.RESEND_API_KEY) return Response.json({ ok: true, demo: true });
  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: process.env.RESEND_FROM_EMAIL || "DealChef <onboarding@resend.dev>", to: [payload.to], subject: payload.subject || "DealChef deal alert", html: payload.html || "<p>A watched grocery item is on special.</p>" }) });
  await setSessionCookie(sessionId);
  return response.ok ? Response.json({ ok: true }) : Response.json({ error: "Email provider rejected the request" }, { status: 502 });
}
