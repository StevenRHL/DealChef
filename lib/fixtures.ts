import type { Deal, NormalizedProduct, RecipeRecommendation } from "./types";

const capturedAt = new Date().toISOString();

const products: Array<NormalizedProduct & { category: string; image_emoji: string; unit_label: string }> = [
  { retailer: "coles", external_id: "coles-pasta-001", name: "Spaghetti No. 5", brand: "Barilla", size: "500g", category: "Pantry", current_price: 2.5, was_price: 5, unit_price: 5, unit_label: "$5.00 / kg", image_emoji: "🍝", product_url: "https://www.coles.com.au/", captured_at: capturedAt },
  { retailer: "coles", external_id: "coles-chicken-001", name: "Chicken Breast Fillets", brand: "Coles", size: "1kg", category: "Meat", current_price: 12.5, was_price: 25, unit_price: 12.5, unit_label: "$12.50 / kg", image_emoji: "🍗", product_url: "https://www.coles.com.au/", captured_at: capturedAt },
  { retailer: "coles", external_id: "coles-yogurt-001", name: "Greek Style Yoghurt", brand: "Jalna", size: "1kg", category: "Dairy", current_price: 3.5, was_price: 7, unit_price: 3.5, unit_label: "$3.50 / kg", image_emoji: "🥣", product_url: "https://www.coles.com.au/", captured_at: capturedAt },
  { retailer: "coles", external_id: "coles-tomato-001", name: "Truss Tomatoes", brand: "Coles", size: "500g", category: "Produce", current_price: 2.75, was_price: 5.5, unit_price: 5.5, unit_label: "$5.50 / kg", image_emoji: "🍅", product_url: "https://www.coles.com.au/", captured_at: capturedAt },
  { retailer: "woolworths", external_id: "woolies-oats-001", name: "Traditional Rolled Oats", brand: "Woolworths", size: "1kg", category: "Breakfast", current_price: 2.5, was_price: 5, unit_price: 2.5, unit_label: "$2.50 / kg", image_emoji: "🌾", product_url: "https://www.woolworths.com.au/", captured_at: capturedAt },
  { retailer: "woolworths", external_id: "woolies-mince-001", name: "Lean Beef Mince", brand: "Woolworths", size: "500g", category: "Meat", current_price: 6, was_price: 12, unit_price: 12, unit_label: "$12.00 / kg", image_emoji: "🥩", product_url: "https://www.woolworths.com.au/", captured_at: capturedAt },
  { retailer: "woolworths", external_id: "woolies-spinach-001", name: "Baby Spinach", brand: "Woolworths", size: "120g", category: "Produce", current_price: 2, was_price: 4, unit_price: 16.67, unit_label: "$16.67 / kg", image_emoji: "🥬", product_url: "https://www.woolworths.com.au/", captured_at: capturedAt },
  { retailer: "woolworths", external_id: "woolies-coconut-001", name: "Coconut Milk", brand: "Ayam", size: "400ml", category: "Pantry", current_price: 1.75, was_price: 3.5, unit_price: 4.38, unit_label: "$4.38 / L", image_emoji: "🥥", product_url: "https://www.woolworths.com.au/", captured_at: capturedAt },
  { retailer: "aldi", external_id: "aldi-rice-001", name: "Long Grain Rice", brand: "Sunrice", size: "1kg", category: "Pantry", current_price: 2.5, was_price: 5, unit_price: 2.5, unit_label: "$2.50 / kg", image_emoji: "🍚", product_url: "https://www.aldi.com.au/", captured_at: capturedAt },
  { retailer: "aldi", external_id: "aldi-milk-001", name: "Full Cream Milk", brand: "Farmdale", size: "2L", category: "Dairy", current_price: 2, was_price: 4, unit_price: 1, unit_label: "$1.00 / L", image_emoji: "🥛", product_url: "https://www.aldi.com.au/", captured_at: capturedAt },
  { retailer: "aldi", external_id: "aldi-beans-001", name: "Red Kidney Beans", brand: "Coles", size: "420g", category: "Pantry", current_price: 1.25, was_price: 2.5, unit_price: 2.98, unit_label: "$2.98 / kg", image_emoji: "🫘", product_url: "https://www.aldi.com.au/", captured_at: capturedAt },
  { retailer: "aldi", external_id: "aldi-peppers-001", name: "Trio of Capsicums", brand: "Fresh", size: "3 pack", category: "Produce", current_price: 2.49, was_price: 4.99, unit_price: 0.83, unit_label: "$0.83 each", image_emoji: "🫑", product_url: "https://www.aldi.com.au/", captured_at: capturedAt },
  { retailer: "coles", external_id: "coles-coffee-001", name: "Ground Coffee", brand: "Moccona", size: "200g", category: "Breakfast", current_price: 8.5, was_price: 15, unit_price: 42.5, unit_label: "$42.50 / kg", image_emoji: "☕", product_url: "https://www.coles.com.au/", captured_at: capturedAt },
  { retailer: "woolworths", external_id: "woolies-tortilla-001", name: "Soft Taco Shells", brand: "Old El Paso", size: "350g", category: "Pantry", current_price: 2.75, was_price: 5.5, unit_price: 7.86, unit_label: "$7.86 / kg", image_emoji: "🌮", product_url: "https://www.woolworths.com.au/", captured_at: capturedAt },
  { retailer: "aldi", external_id: "aldi-eggs-001", name: "Free Range Eggs", brand: "Lodge Farms", size: "12 pack", category: "Dairy", current_price: 3.5, was_price: 7, unit_price: 0.29, unit_label: "$0.29 each", image_emoji: "🥚", product_url: "https://www.aldi.com.au/", captured_at: capturedAt },
  { retailer: "coles", external_id: "coles-avocado-001", name: "Hass Avocados", brand: "Fresh", size: "2 pack", category: "Produce", current_price: 3.5, was_price: undefined, unit_price: 1.75, unit_label: "$1.75 each", image_emoji: "🥑", product_url: "https://www.coles.com.au/", captured_at: capturedAt },
];

export const fixtureDeals: Deal[] = products.map((product) => {
  const baseline = product.was_price && product.was_price > product.current_price ? product.was_price : null;
  const discount = baseline ? ((baseline - product.current_price) / baseline) * 100 : 0;
  return {
    ...product,
    id: `${product.retailer}:${product.external_id}`,
    discount_percent: Math.round(discount * 10) / 10,
    baseline_source: baseline ? "retailer_was_price" : "insufficient_history",
    unit_price_label: product.unit_label,
    confidence: baseline && discount >= 50 ? "verified" : "unverified",
  };
});

export const fixtureRecipes: RecipeRecommendation[] = [
  { id: "recipe-pasta", title: "Creamy tomato pasta", description: "A fast pantry dinner built around the week’s best pasta and tomato deals.", time_minutes: 20, servings: 3, image_emoji: "🍝", matched_ingredients: ["spaghetti", "tomatoes", "garlic"], missing_ingredients: ["parmesan"], estimated_extra_cost: 4.5, instructions: ["Cook the pasta in salted water.", "Sauté garlic and tomatoes in olive oil.", "Toss with pasta and finish with parmesan."], source: "DealChef demo library" },
  { id: "recipe-tacos", title: "Half-price beef tacos", description: "Crisp, colourful tacos that use the discounted mince, capsicums and pantry beans.", time_minutes: 25, servings: 4, image_emoji: "🌮", matched_ingredients: ["beef mince", "capsicum", "kidney beans"], missing_ingredients: ["tortillas", "lime"], estimated_extra_cost: 5.75, instructions: ["Brown the mince with garlic and spices.", "Fold through beans and sliced capsicum.", "Serve in warmed tortillas with lime."], source: "DealChef demo library" },
  { id: "recipe-curry", title: "Coconut spinach curry", description: "A gentle, weeknight curry made from pantry rice, coconut milk and greens.", time_minutes: 30, servings: 3, image_emoji: "🍛", matched_ingredients: ["coconut milk", "spinach", "rice"], missing_ingredients: ["curry paste"], estimated_extra_cost: 3.25, instructions: ["Toast curry paste in a pan.", "Add coconut milk and simmer.", "Fold in spinach and serve with rice."], source: "DealChef demo library" },
];
