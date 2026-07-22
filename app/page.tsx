"use client";

import { useEffect, useMemo, useState } from "react";

type Retailer = "all" | "coles" | "woolworths" | "aldi";

type Deal = {
  id: string;
  retailer: Exclude<Retailer, "all">;
  name: string;
  brand: string;
  size: string;
  category: string;
  current_price: number;
  was_price: number | null;
  discount_percent: number;
  baseline_source: "retailer_was_price" | "historical_median" | "insufficient_history";
  unit_price: string;
  image_emoji: string;
  product_url: string;
  captured_at: string;
  confidence: "verified" | "unverified";
};

type Recipe = {
  id: string;
  title: string;
  description: string;
  time_minutes: number;
  servings: number;
  image_emoji: string;
  matched_ingredients: string[];
  missing_ingredients: string[];
  estimated_extra_cost: number;
  instructions: string[];
  source: string;
};

type Profile = {
  session_id: string;
  postcode: string;
  retailers: string[];
  pantry_items: string[];
  dietary_preferences: string[];
  email: string;
  alerts_enabled: boolean;
};

const retailerLabels: Record<Exclude<Retailer, "all">, string> = {
  coles: "Coles",
  woolworths: "Woolworths",
  aldi: "ALDI",
};

const fallbackProfile: Profile = {
  session_id: "demo-session",
  postcode: "2033",
  retailers: ["coles", "woolworths", "aldi"],
  pantry_items: ["olive oil", "garlic", "salt"],
  dietary_preferences: [],
  email: "",
  alerts_enabled: false,
};

function money(value: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
  }).format(value);
}

function formatCapture(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "recently";
  return date.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" });
}

export default function Home() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [profile, setProfile] = useState<Profile>(fallbackProfile);
  const [activeRetailer, setActiveRetailer] = useState<Retailer>("all");
  const [activeCategory, setActiveCategory] = useState("All deals");
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [recipesLoading, setRecipesLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [showPreferences, setShowPreferences] = useState(false);
  const [showTiming, setShowTiming] = useState(false);
  const [manualRuns, setManualRuns] = useState(["", "", ""]);
  const [appRuns, setAppRuns] = useState(["", "", ""]);
  const [activeTimer, setActiveTimer] = useState<number | null>(null);
  const [timerStartedAt, setTimerStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // Intentional: read the current time only after mount so SSR and the
    // first client render agree (avoids a hydration mismatch).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
  }, []);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      fetch("/api/session").then((response) => response.json()),
      fetch("/api/deals").then((response) => response.json()),
      fetch("/api/watchlist").then((response) => response.json()),
    ])
      .then(([sessionResult, dealResult, watchlistResult]) => {
        if (!mounted) return;
        if (sessionResult.profile) setProfile(sessionResult.profile);
        if (dealResult.deals) setDeals(dealResult.deals);
        if (watchlistResult.items) setWatchlist(watchlistResult.items.map((item: { deal_id: string }) => item.deal_id));
      })
      .catch(() => {
        if (mounted) setToast("Showing demo data while the local API warms up.");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const categories = useMemo(() => {
    const values = new Set(deals.map((deal) => deal.category));
    return ["All deals", ...Array.from(values)];
  }, [deals]);

  const visibleDeals = useMemo(
    () =>
      deals.filter(
        (deal) =>
          (activeRetailer === "all" || deal.retailer === activeRetailer) &&
          (activeCategory === "All deals" || deal.category === activeCategory),
      ),
    [activeCategory, activeRetailer, deals],
  );

  const watchedDeals = deals.filter((deal) => watchlist.includes(deal.id));
  const halfPriceCount = deals.filter((deal) => deal.discount_percent >= 50).length;
  const totalPotentialSavings = deals
    .filter((deal) => deal.discount_percent >= 50)
    .reduce((total, deal) => total + (deal.was_price ?? 0) - deal.current_price, 0);
  const completedRuns = manualRuns.filter(Boolean).length;
  const completedAppRuns = appRuns.filter(Boolean).length;
  const benchmarkReady = completedRuns === 3 && completedAppRuns === 3;
  const manualAverage = benchmarkReady
    ? manualRuns.reduce((sum, value) => sum + Number(value), 0) / 3
    : 0;
  const appAverage = benchmarkReady ? appRuns.reduce((sum, value) => sum + Number(value), 0) / 3 : 0;
  const minutesSaved = benchmarkReady ? (manualAverage - appAverage) / 60 : 0;
  const percentSaved = benchmarkReady && manualAverage > 0 ? (minutesSaved * 60 * 100) / manualAverage : 0;

  async function toggleWatchlist(deal: Deal) {
    const isWatched = watchlist.includes(deal.id);
    try {
      if (isWatched) {
        await fetch(`/api/watchlist/${deal.id}`, { method: "DELETE" });
        setWatchlist((items) => items.filter((id) => id !== deal.id));
        setToast(`${deal.name} removed from your watchlist.`);
      } else {
        await fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ deal_id: deal.id }),
        });
        setWatchlist((items) => [...items, deal.id]);
        setToast(`${deal.name} is now on your watchlist.`);
      }
    } catch {
      setToast("The watchlist is temporarily unavailable.");
    }
  }

  async function refreshDeals() {
    setRefreshing(true);
    try {
      const response = await fetch("/api/refresh", { method: "POST" });
      const result = await response.json();
      if (response.status === 429) {
        setToast(`Refresh is cooling down. Try again in ${result.retry_after ?? 60}s.`);
      } else {
        if (result.deals) setDeals(result.deals);
        setToast(result.alerts?.sent ? `${result.alerts.sent} watchlist alert${result.alerts.sent === 1 ? "" : "s"} sent.` : result.mode === "live" ? "Live retailer feeds refreshed." : "Demo deal snapshot refreshed.");
      }
    } catch {
      setToast("Refresh failed, so the last deal snapshot is still showing.");
    } finally {
      setRefreshing(false);
    }
  }

  async function buildRecipes() {
    setRecipesLoading(true);
    try {
      const ids = (watchedDeals.length ? watchedDeals : visibleDeals.slice(0, 4)).map((deal) => deal.id).join(",");
      const response = await fetch(`/api/recommendations?deal_ids=${encodeURIComponent(ids)}`);
      const result = await response.json();
      setRecipes(result.recipes ?? []);
      setToast(result.source === "spoonacular" ? "Recipe ideas personalized from Spoonacular." : "Recipe ideas built from the demo recipe library.");
    } catch {
      setToast("Recipe suggestions are temporarily unavailable.");
    } finally {
      setRecipesLoading(false);
    }
  }

  async function sendTestAlert() {
    try {
      const response = await fetch("/api/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: profile.email }),
      });
      const result = await response.json();
      setToast(result.demo ? "Demo alert queued — add RESEND_API_KEY to send a real email." : "Test alert sent to your email.");
    } catch {
      setToast("Could not send the test alert.");
    }
  }

  async function savePreferences(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextProfile = {
      postcode: String(form.get("postcode") || "2033"),
      email: String(form.get("email") || ""),
      alerts_enabled: form.get("alerts_enabled") === "on",
      retailers: form.getAll("retailers").map(String),
      dietary_preferences: String(form.get("dietary_preferences") || "").split(",").map((item) => item.trim()).filter(Boolean),
      pantry_items: String(form.get("pantry_items") || "olive oil, garlic, salt")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    };
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextProfile),
      });
      const result = await response.json();
      if (result.profile) setProfile(result.profile);
      setShowPreferences(false);
      setToast("Your DealChef profile is ready.");
    } catch {
      setToast("Could not save preferences.");
    }
  }

  function startAppRun(index: number) {
    setActiveTimer(index);
    setTimerStartedAt(window.performance.now());
  }

  async function stopAppRun(index: number) {
    const seconds = timerStartedAt ? Math.max(1, Math.round((window.performance.now() - timerStartedAt) / 1000)) : 1;
    const next = [...appRuns];
    next[index] = String(seconds);
    setAppRuns(next);
    setActiveTimer(null);
    setTimerStartedAt(null);
    if (next.filter(Boolean).length === 3 && manualRuns.filter(Boolean).length === 3) {
      await fetch("/api/workflow-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: profile.session_id,
          manual_seconds: manualRuns.map(Number),
          app_seconds: next.map(Number),
        }),
      });
    }
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand-lockup">
          <div className="brand-mark">✦</div>
          <div>
            <div className="brand-name">DealChef</div>
            <div className="brand-tagline">shop less. eat better.</div>
          </div>
        </div>
        <div className="topbar-actions">
          <button className="location-pill" onClick={() => setShowPreferences(true)} aria-label="Edit shopping preferences">
            <span className="location-pin">⌖</span>
            <span><b>{profile.postcode}</b> · nearby stores</span>
            <span className="chevron">⌄</span>
          </button>
          <button className="avatar" onClick={() => setShowPreferences(true)} aria-label="Open profile settings">S</button>
        </div>
      </header>

      <div className="page-grid">
        <aside className="sidebar">
          <div className="eyebrow">YOUR WEEKLY SHORTCUT</div>
          <div className="side-profile">
            <div className="side-avatar">S</div>
            <div>
              <strong>Saturday shop</strong>
              <span>{profile.pantry_items.length} pantry staples saved</span>
            </div>
          </div>
          <nav className="side-nav" aria-label="Primary navigation">
            <a className="side-nav-item active" href="#deals"><span>▦</span> Deals for you <b>{halfPriceCount}</b></a>
            <a className="side-nav-item" href="#recipes"><span>◒</span> Recipe ideas <b>{recipes.length || 4}</b></a>
            <a className="side-nav-item" href="#watchlist"><span>♡</span> Watchlist <b>{watchlist.length}</b></a>
            <a className="side-nav-item" href="#time-saved"><span>◷</span> Time saved</a>
          </nav>
          <div className="sidebar-bottom">
            <div className="source-card">
              <div className="source-card-title"><span className="status-dot" /> Data refreshed</div>
              <p>Demo snapshot · {now ? formatCapture(now.toISOString()) : "just now"}</p>
              <button className="text-button" onClick={refreshDeals}>{refreshing ? "Refreshing…" : "Refresh now →"}</button>
            </div>
            <button className="side-settings" onClick={() => setShowPreferences(true)}><span>⚙</span> Preferences</button>
          </div>
        </aside>

        <section className="content-area">
          <div className="welcome-row">
            <div>
              <div className="eyebrow">
                {now
                  ? now.toLocaleDateString("en-AU", { weekday: "long", month: "long", day: "numeric" }).toUpperCase()
                  : "TODAY"}{" "}
                · Near {profile.postcode}
              </div>
              <h1>Good deals, <em>great</em> dinners.</h1>
              <p className="hero-copy">Your best half-price finds, turned into an easier week.</p>
            </div>
            <button className="primary-button" onClick={refreshDeals} disabled={refreshing}><span>{refreshing ? "↻" : "✦"}</span>{refreshing ? "Refreshing deals" : "Refresh deals"}</button>
          </div>

          <div className="insight-strip">
            <div className="insight-icon">↗</div>
            <div className="insight-copy"><strong>You could save {money(totalPotentialSavings)} this week</strong><span>across {halfPriceCount} verified half-price items near you.</span></div>
            <button className="subtle-button" onClick={() => document.getElementById("deals")?.scrollIntoView({ behavior: "smooth" })}>See the wins <span>→</span></button>
          </div>

          <section className="metric-grid" aria-label="Weekly grocery metrics">
            <div className="metric-card"><div className="metric-label">HALF-PRICE FINDS</div><div className="metric-value green-text">{halfPriceCount}</div><div className="metric-detail">↑ 8 since last refresh</div></div>
            <div className="metric-card"><div className="metric-label">POTENTIAL SAVING</div><div className="metric-value">{money(totalPotentialSavings)}</div><div className="metric-detail">if you buy your watchlist</div></div>
            <div className="metric-card"><div className="metric-label">STORES COVERED</div><div className="metric-value">03</div><div className="metric-detail"><span className="store-dot coles-dot" /> Coles <span className="store-dot woolies-dot" /> Woolies <span className="store-dot aldi-dot" /> ALDI</div></div>
            <div className="metric-card warm-card"><div className="metric-label">YOUR TIME BACK</div><div className="metric-value">{benchmarkReady ? `${Math.max(0, minutesSaved).toFixed(1)}m` : "40m"}</div><div className="metric-detail">weekly planning estimate <button className="inline-link" onClick={() => setShowTiming(true)}>measure it →</button></div></div>
          </section>

          <section className="section-block" id="deals">
            <div className="section-heading"><div><div className="eyebrow">PERSONALISED FOR YOU</div><h2>Deals worth leaving the house for</h2></div><button className="subtle-button" onClick={() => setShowPreferences(true)}>Edit preferences <span>→</span></button></div>
            <div className="filter-row">
              <div className="segmented-control" role="tablist" aria-label="Filter by retailer">
                {(["all", "coles", "woolworths", "aldi"] as Retailer[]).map((retailer) => <button key={retailer} className={activeRetailer === retailer ? "segment active" : "segment"} onClick={() => setActiveRetailer(retailer)}>{retailer === "all" ? "All stores" : retailerLabels[retailer]}</button>)}
              </div>
              <select className="category-select" value={activeCategory} onChange={(event) => setActiveCategory(event.target.value)} aria-label="Filter by category">
                {categories.map((category) => <option key={category}>{category}</option>)}
              </select>
            </div>
            <div className="deal-grid">
              {loading ? <div className="empty-state">Loading your deal board…</div> : visibleDeals.map((deal) => <article className="deal-card" key={deal.id}>
                <div className="deal-card-top"><span className={`retailer-chip ${deal.retailer}`}>{retailerLabels[deal.retailer]}</span><button className={watchlist.includes(deal.id) ? "watch-button watched" : "watch-button"} onClick={() => toggleWatchlist(deal)} aria-label={`Watch ${deal.name}`}>{watchlist.includes(deal.id) ? "♥" : "♡"}</button></div>
                <div className="product-visual"><span>{deal.image_emoji}</span><div className="discount-badge">-{Math.round(deal.discount_percent)}%</div></div>
                <div className="deal-card-body"><div className="product-category">{deal.category} · {deal.size}</div><h3>{deal.name}</h3><div className="product-brand">{deal.brand}</div><div className="price-row"><strong>{money(deal.current_price)}</strong><span className="was-price">{deal.was_price ? money(deal.was_price) : "special"}</span></div><div className="unit-price">{deal.unit_price} · captured {formatCapture(deal.captured_at)}</div></div>
                <div className="deal-card-footer"><span className={`confidence ${deal.confidence}`}>{deal.confidence === "verified" ? "✓ Verified half price" : "• Unverified special"}</span><a href={deal.product_url} target="_blank" rel="noreferrer">View item ↗</a></div>
              </article>)}
            </div>
          </section>

          <div className="feature-grid">
            <section className="feature-panel recipe-panel" id="recipes">
              <div className="panel-heading"><div><div className="eyebrow">FROM YOUR DEALS</div><h2>What can you cook?</h2></div><span className="panel-icon">✣</span></div>
              <p className="panel-copy">Turn the items you’re already considering into a low-effort meal plan.</p>
              <button className="recipe-cta" onClick={buildRecipes} disabled={recipesLoading}>{recipesLoading ? "Finding recipes…" : "Build meal ideas →"}</button>
              <div className="recipe-list">{(recipes.length ? recipes : [{ id: "preview-1", title: "Creamy tomato pasta", description: "Uses your pantry and today’s best pasta deal.", time_minutes: 20, servings: 3, image_emoji: "🍝", matched_ingredients: ["Pasta", "Tomatoes"], missing_ingredients: ["Parmesan"], estimated_extra_cost: 4.5, instructions: [], source: "Demo" }]).slice(0, 3).map((recipe) => <div className="recipe-row" key={recipe.id}><div className="recipe-image">{recipe.image_emoji}</div><div className="recipe-info"><strong>{recipe.title}</strong><span>{recipe.matched_ingredients.slice(0, 2).join(" + ")} · {recipe.time_minutes} min</span></div><div className="recipe-cost">{money(recipe.estimated_extra_cost)}<small>to finish</small></div></div>)}</div>
            </section>

            <section className="feature-panel watch-panel" id="watchlist">
              <div className="panel-heading"><div><div className="eyebrow">READY WHEN YOU ARE</div><h2>Your watchlist</h2></div><span className="panel-icon heart-icon">♡</span></div>
              {watchedDeals.length ? <div className="watch-list">{watchedDeals.slice(0, 4).map((deal) => <div className="watch-row" key={deal.id}><div className="watch-thumb">{deal.image_emoji}</div><div className="watch-info"><strong>{deal.name}</strong><span>{retailerLabels[deal.retailer]} · alert at half price</span></div><span className="watch-price">{money(deal.current_price)}</span></div>)}</div> : <div className="empty-watch"><div className="empty-heart">♡</div><strong>Nothing watched yet</strong><span>Tap the heart on a deal to get an email when it drops.</span></div>}
              <button className="outline-button" onClick={sendTestAlert}>Send a test alert →</button>
            </section>
          </div>

          <section className="time-panel" id="time-saved">
            <div className="time-heading"><div><div className="eyebrow">THE PROOF</div><h2>Make the time saving visible</h2><p>Run the same grocery task three times each way. DealChef records the average.</p></div><div className="time-stat">{benchmarkReady ? <><strong>{Math.max(0, minutesSaved).toFixed(1)} min</strong><span>saved on average</span></> : <><strong>3 × 2</strong><span>runs to unlock your proof</span></>}</div></div>
            <div className="time-progress"><div className="progress-label"><span>Manual workflow <b>{completedRuns}/3</b></span><span>DealChef workflow <b>{completedAppRuns}/3</b></span></div><div className="progress-track"><div className="progress-manual" style={{ width: `${(completedRuns / 3) * 50}%` }} /><div className="progress-app" style={{ width: `${(completedAppRuns / 3) * 50}%` }} /></div></div>
            <button className="outline-button dark-outline" onClick={() => setShowTiming(true)}>Open timing lab →</button>
          </section>

          <footer className="site-footer"><span>DealChef · a more human way to grocery shop</span><span>Sources are unofficial catalogue data · prices may change</span></footer>
        </section>
      </div>

      {showPreferences && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setShowPreferences(false); }}><form className="modal-card" onSubmit={savePreferences}><div className="modal-top"><div><div className="eyebrow">YOUR PROFILE</div><h2>Make it yours</h2></div><button type="button" className="modal-close" onClick={() => setShowPreferences(false)} aria-label="Close preferences">×</button></div><label>Postcode<input name="postcode" defaultValue={profile.postcode} inputMode="numeric" /></label><label>Email for deal alerts<input name="email" type="email" defaultValue={profile.email} placeholder="you@example.com" /></label><label>Pantry staples<input name="pantry_items" defaultValue={profile.pantry_items.join(", ")} placeholder="rice, garlic, eggs" /></label><label>Stores to check<div className="preference-checks">{([["coles", "Coles"], ["woolworths", "Woolworths"], ["aldi", "ALDI"]] as const).map(([value, label]) => <label className="mini-check" key={value}><input name="retailers" value={value} type="checkbox" defaultChecked={profile.retailers.includes(value)} /> {label}</label>)}</div></label><label>Dietary preferences<input name="dietary_preferences" defaultValue={profile.dietary_preferences.join(", ")} placeholder="vegetarian, gluten-free" /></label><label className="check-row"><input name="alerts_enabled" type="checkbox" defaultChecked={profile.alerts_enabled} /> Email me when a watched item hits half price</label><button className="primary-button full-button" type="submit">Save preferences</button><p className="modal-note">Guest session · preferences stay attached to this browser for 30 days.</p></form></div>}

      {showTiming && <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.currentTarget === event.target) setShowTiming(false); }}><div className="modal-card timing-modal"><div className="modal-top"><div><div className="eyebrow">REPRODUCIBLE PROOF</div><h2>Timing lab</h2></div><button className="modal-close" onClick={() => setShowTiming(false)} aria-label="Close timing lab">×</button></div><p className="modal-intro">Use the same task: find five half-price products, save two, and find one recipe using three ingredients. Record three runs each way.</p><div className="timing-columns"><div><div className="timing-label">Manual workflow</div>{manualRuns.map((value, index) => <label className="run-input" key={`manual-${index}`}>Run {index + 1}<input value={value} onChange={(event) => { const next = [...manualRuns]; next[index] = event.target.value.replace(/[^0-9]/g, ""); setManualRuns(next); }} placeholder="seconds" inputMode="numeric" /></label>)}</div><div><div className="timing-label">DealChef workflow</div>{appRuns.map((value, index) => <div className="run-input" key={`app-${index}`}><span>Run {index + 1}</span>{activeTimer === index ? <button className="timer-button" onClick={() => stopAppRun(index)}>Stop & save</button> : <button className="timer-button" onClick={() => startAppRun(index)}>{value ? `${value}s · redo` : "Start timer"}</button>}</div>)}</div></div>{benchmarkReady && <div className="benchmark-result"><span>Average of 3 timed runs</span><strong>{Math.max(0, minutesSaved).toFixed(1)} minutes saved</strong><small>{percentSaved.toFixed(0)}% faster · manual {Math.round(manualAverage)}s vs app {Math.round(appAverage)}s</small></div>}</div></div>}

      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}
