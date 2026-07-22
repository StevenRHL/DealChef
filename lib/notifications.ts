import { getProfile, getWatchlist, hasNotificationBeenSent, markNotificationSent } from "./store";
import type { Deal } from "./types";

export async function sendWatchedDealAlerts(sessionId: string, deals: Deal[]) {
  const profile = getProfile(sessionId);
  if (!profile.alerts_enabled || !profile.email) return { sent: 0, demo: false };
  const watched = new Set(getWatchlist(sessionId).map((item) => item.deal_id));
  const matches = deals.filter((deal) => watched.has(deal.id) && deal.discount_percent >= 50);
  let sent = 0;
  let demo = false;
  for (const deal of matches) {
    const key = `${sessionId}:${deal.id}:${deal.captured_at}`;
    if (hasNotificationBeenSent(key)) continue;
    const html = `<p><strong>${deal.name}</strong> is half price at ${deal.retailer} for $${deal.current_price.toFixed(2)}.</p><p>DealChef found it for your watchlist.</p>`;
    if (process.env.RESEND_API_KEY) {
      const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" }, body: JSON.stringify({ from: process.env.RESEND_FROM_EMAIL || "DealChef <onboarding@resend.dev>", to: [profile.email], subject: `Half-price alert: ${deal.name}`, html }) });
      if (!response.ok) continue;
    } else {
      demo = true;
    }
    markNotificationSent(key);
    sent += 1;
  }
  return { sent, demo };
}
