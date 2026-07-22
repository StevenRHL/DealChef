# DealChef — Product Spec

Source of truth for scope. Do not paraphrase this into other docs — link here instead.
Last pasted by the user: 2026-07-22.

## Summary
Build a responsive Next.js web app that aggregates half-price grocery deals from Coles,
Woolworths, and ALDI, lets users track products, sends email alerts, and recommends
recipes using discounted and pantry ingredients. The MVP is guest-first: no passwords,
OAuth, or account system.

## Architecture
Use one runtime: Next.js with TypeScript, route handlers, server components, Tailwind
CSS, and PWA support. Prisma with SQLite locally and PostgreSQL-compatible schema. No
FastAPI and no CORS configuration. Frontend and API use the same origin, so the session
cookie is automatically sent with requests. Cookie settings: httpOnly, SameSite=Lax,
Secure in production, Path=/, 30-day expiry.

Unofficial retailer data sources must be labelled clearly:
- Coles and Woolworths use independent third-party wrappers, not retailer-sanctioned
  integrations.
- ALDI uses an ALDI Australia Apify data actor.
- Seeded fixtures remain available when external credentials or providers fail.

> **Deviation on record (accepted):** this repo is scaffolded on `vinext` +
> Cloudflare Workers/D1 (see `worker/index.ts`, `db/index.ts`, `drizzle.config.ts`),
> not Prisma. Swapping ORMs is out of scope unless the user asks for it — treat
> Drizzle+D1 as the persistence layer and keep the schema Postgres-portable in spirit.
> Log any further deviations in AGENTS.md under "Known deviations" rather than
> silently drifting.

## Session and Identity Model
On the first visit:
- Generate a cryptographically random `session_id`.
- Store a signed `dealchef_session` cookie containing that ID.
- Create a `UserProfile` row keyed by `session_id`.
- The cookie is refreshed on activity and expires after 30 days.

All user-owned records use `session_id`: UserProfile, WatchlistItem, PushSubscription,
WorkflowSession. Email is optional and stored only on UserProfile for alert delivery.
No password, OAuth, login, or account-management system is included in the MVP.

Add:
- `GET /api/session` — returns non-sensitive session context, including the opaque
  `session_id` needed by the timing UI.
- `POST /api/workflow-sessions` — requires `session_id`; the server validates it
  against the signed cookie and rejects mismatches.

The cookie remains the source of authentication. The exposed session ID is only an
opaque telemetry identifier.

## Core Features

### Deal ingestion
Normalize every source into:
```ts
type NormalizedProduct = {
  retailer: "coles" | "woolworths" | "aldi";
  external_id: string;
  name: string;
  brand?: string;
  size?: string;
  category?: string;
  current_price: number;
  was_price?: number;
  unit_price?: number;
  image_url?: string;
  product_url?: string;
  captured_at: string;
};
```
Support pagination and current-special feeds where available. Store historical
`PriceObservation` records for baseline calculations.

### Half-price rules
Precedence:
1. Use the current provider response's `was_price` only when it is greater than the
   current price and was captured during the current ingestion.
2. Otherwise use the rolling 28-day median only when at least 3 observations exist
   from separate refresh timestamps.
3. If neither condition is met, do not display a "Half Price" label. Display the item
   as "Unverified special" when appropriate.

```
discount_percent = (baseline_price - current_price) / baseline_price * 100
```
A deal is labelled "Half Price" only when `discount_percent >= 50`.

`baseline_source` is one of: `retailer_was_price`, `historical_median`,
`insufficient_history`.

### User experience
- Guest onboarding with postcode, selected retailers, pantry ingredients, dietary
  preferences, and optional email.
- Deal dashboard with retailer, price, previous price, discount, unit price,
  timestamp, and source status.
- Watchlist for products and categories.
- Email alert when a watched item becomes half price.
- Recipe recommendations based on deals plus pantry ingredients.
- Time-savings panel showing the reproducible benchmark.

### Recipe Recommendations
Use Spoonacular's ingredient-search API (used ingredients, missing ingredients, recipe
ranking). Display: recipe title and image, discounted ingredients used, missing
ingredients, estimated additional cost, cooking time and servings, instructions or
source link. Include a local recipe fixture set as a fallback when Spoonacular is
unavailable or quota is exhausted.

### Notifications
**Must-have**: Email alerts through Resend. Require an email only when the user
enables alerts. Deduplicate alerts by `session_id + watchlist_item_id +
deal_observation_id`. Provide a "Send test alert" button.

**Stretch**: Browser push notifications using the Web Push API — service-worker
registration, VAPID key generation and server-side storage, PushSubscription records
keyed by session_id, subscription expiry/renewal handling, removal of subscriptions
after HTTP 404/410 push responses.

## API Endpoints
- `GET /api/session`
- `GET /api/deals`
- `GET /api/deals/:id`
- `POST /api/profile`
- `POST /api/watchlist`
- `DELETE /api/watchlist/:id`
- `GET /api/recommendations`
- `POST /api/notifications/email`
- `POST /api/notifications/push-subscription` — stretch
- `POST /api/notifications/test`
- `POST /api/refresh`
- `POST /api/workflow-sessions`

`POST /api/refresh` must: limit each session to one request every 60 seconds; return
429 with `Retry-After` when exceeded; reuse an ingestion run already completed within
the last 60 seconds; prevent concurrent duplicate provider jobs.

## Reproducible Time-Savings Measurement
Fixed task for both workflows: find five half-price products across the three
retailers, save two products, and find one recipe using at least three available
ingredients. Record three timed runs for each workflow (manual vs. DealChef). Panel
shows all three raw run times, manual average, app average, minutes saved, percentage
reduction, labelled "Average of 3 timed runs". Do not show a final benchmark until all
three runs exist.

## Testing
**Must-have**: discount calculation tests; exact 50% boundary test; baseline fallback
tests (current valid was_price / three historical observations / fewer than three
observations / invalid or stale was_price); one end-to-end test covering onboarding →
deals → watchlist → recipes → email notification.

**Stretch**: adapter tests using saved provider fixtures; pagination/timeout/rate-limit
/malformed-price tests; watchlist notification deduplication tests; Spoonacular failure
and local recipe fallback tests; browser push subscription renewal tests.

## README and Hackathon Deliverables
README must include: installation/run commands, environment variables, database
setup, fixture/demo mode, Spoonacular/Resend/Parse/Apify setup, session model
explanation, architecture diagram, testing instructions, and a retailer/API
limitations paragraph (data may be inaccurate/delayed/unavailable/incomplete;
integrations are unofficial third-party services; usage follows each provider's terms
rather than Coles/Woolworths/ALDI directly).

7-slide deck (outside the codebase, not an agent deliverable) covering: manual
grocery-deal problem, personalized solution, live product demo, data/application
architecture, recipe and notification workflow, challenges and limitations, average
time saved from three timed runs.

## Assumptions
Default demo postcode is the UNSW area, but users can enter another postcode.
Catalogue prices are not guaranteed to represent real-time in-store stock. Email
alerts are the only required notification channel. External API keys are optional
because fixture mode must support the full demo. Checkout, payments, barcode
scanning, loyalty-only discounts, and full store inventory are out of scope for the
MVP.
