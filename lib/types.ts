export type Retailer = "coles" | "woolworths" | "aldi";
export type BaselineSource = "retailer_was_price" | "historical_median" | "insufficient_history";

export type NormalizedProduct = {
  retailer: Retailer;
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

export type Deal = NormalizedProduct & {
  id: string;
  discount_percent: number;
  baseline_source: BaselineSource;
  unit_price_label: string;
  image_emoji: string;
  confidence: "verified" | "unverified";
};

export type UserProfile = {
  session_id: string;
  postcode: string;
  retailers: Retailer[];
  pantry_items: string[];
  dietary_preferences: string[];
  email: string;
  alerts_enabled: boolean;
};

export type WatchlistItem = {
  id: string;
  session_id: string;
  deal_id: string;
  created_at: string;
};

export type RecipeRecommendation = {
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

export type WorkflowSession = {
  id: string;
  session_id: string;
  manual_seconds: number[];
  app_seconds: number[];
  created_at: string;
};
