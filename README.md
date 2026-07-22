# DealChef

DealChef is a guest-first grocery planning app for finding half-price deals at
Coles, Woolworths, and ALDI, watching products, and turning discounted
ingredients into recipe ideas.

## Quick start

Requires Node.js `>=22.13.0` (`node -v` to check).

```bash
npm install
npm run build
npm run start
```

Then open `http://localhost:3000`.

The app runs in fixture mode by default so the hackathon demo works without
external credentials.

### Troubleshooting

- **`sh: vinext: command not found`** — `npm install` didn't complete (or wasn't
  run) before `npm run build`/`npm run start`. `vinext` is installed as a
  dependency into `node_modules/.bin`, not a global tool. Run `npm install`
  first and check it finishes without errors; if `node_modules` may be
  corrupted from a previous interrupted install, run
  `rm -rf node_modules package-lock.json && npm install` and try again.
- **`npm run dev` fails to start** — on some machines (notably macOS) the dev
  server's `workerd` binary won't spawn (system error -88). Use
  `npm run build && npm run start` instead, which uses the same runtime
  without the dev-server-specific spawn path.

## Environment variables

Copy `.env.example` to `.env.local` when enabling live integrations:

```text
DEALCHEF_DEMO_MODE=true
SESSION_SECRET=replace-with-a-long-random-value
PARSE_API_KEY=
APIFY_API_TOKEN=
SPOONACULAR_API_KEY=
RESEND_API_KEY=
RESEND_FROM_EMAIL=DealChef <onboarding@resend.dev>
QWEN_API_KEY=
```

Set `QWEN_API_KEY` (a DashScope key, OpenAI-compatible `chat/completions` endpoint) to have
Qwen generate cooking steps for recipes sourced from Spoonacular, which doesn't return
instructions itself. Without a key, those recipe cards show no steps and the app still
works normally. `QWEN_BASE_URL` and `QWEN_MODEL` are optional overrides (default to
DashScope's international endpoint and `qwen-plus`).

Set `DEALCHEF_DEMO_MODE=false` to attempt the unofficial Coles/Woolworths
wrappers and ALDI Apify actor. Any provider that fails falls back to the local
fixture catalogue.

## Session model

The app creates a signed, `httpOnly`, `SameSite=Lax` cookie containing a random
session ID on first visit. It lasts 30 days and is refreshed on activity. User
profiles, watchlist items, push subscriptions, and workflow sessions are scoped
to that session. There are no passwords, OAuth flows, or account pages in the
MVP.

## Architecture

The app uses one Next.js/vinext runtime. Route handlers serve the API and the
same-origin frontend sends the session cookie automatically. Drizzle/D1 is the
hosting-compatible persistence schema, with an in-memory fixture store used for
the local demo fallback.

```text
Next.js UI
   ↓ same-origin route handlers
Session + profile + watchlist store
   ↓
Retailer adapters → normalized deals → half-price filter
   ↓
Spoonacular/local recipes + Resend email alerts
```

## Testing

```bash
npm run build
npm test
npm run db:generate
```

## Data limitations

Coles and Woolworths are accessed through independent unofficial third-party
wrappers, and ALDI is accessed through an independent Apify actor. These are
not retailer-sanctioned integrations. Data may be inaccurate, delayed,
incomplete, unavailable, or different from in-store stock. Use must follow the
terms and rate limits of each wrapper/provider rather than assuming permission
from Coles, Woolworths, or ALDI directly.

## Demo benchmark

The Time Saved panel uses the fixed task of finding five half-price products,
saving two, and finding a recipe using three ingredients. It only displays a
benchmark after three manual runs and three DealChef runs have been recorded,
labelled “Average of 3 timed runs”.

## Hackathon deliverables

- Live demo: https://dealchef-grocery-planner.stevenrhl.chatgpt.site
- Presentation deck: `outputs/dealchef-hackathon-deck.pptx`

The deck follows the same reproducible timing rule: it shows the measurement
method and a pending state until all six timed runs have been recorded in the
app.
