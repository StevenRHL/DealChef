import { fixtureRecipes } from "./fixtures";
import { dealIngredients } from "./deals";
import type { Deal } from "./types";

export async function recommendRecipes(deals: Deal[], pantry: string[]) {
  const ingredients = Array.from(new Set([...dealIngredients(deals), ...pantry.map((item) => item.toLowerCase())])).slice(0, 12);
  const key = process.env.SPOONACULAR_API_KEY;
  if (key) {
    try {
      const url = new URL("https://api.spoonacular.com/recipes/findByIngredients");
      url.searchParams.set("ingredients", ingredients.join(","));
      url.searchParams.set("number", "6");
      url.searchParams.set("ranking", "1");
      url.searchParams.set("ignorePantry", "false");
      const response = await fetch(url, { headers: { "x-api-key": key }, signal: AbortSignal.timeout(5000) });
      if (response.ok) {
        const items = await response.json() as Array<{ id: number; title: string; image?: string; usedIngredients?: Array<{ name: string }>; missedIngredients?: Array<{ name: string }> }>;
        return { source: "spoonacular", recipes: items.slice(0, 6).map((item) => ({ id: `spoonacular-${item.id}`, title: item.title, description: "A recipe matched to ingredients already on your deal board.", time_minutes: 30, servings: 4, image_emoji: "🍽️", matched_ingredients: item.usedIngredients?.map((ingredient) => ingredient.name) ?? [], missing_ingredients: item.missedIngredients?.map((ingredient) => ingredient.name) ?? [], estimated_extra_cost: (item.missedIngredients?.length ?? 0) * 2.5, instructions: [], source: `Spoonacular · https://spoonacular.com/recipes/${item.id}` })) };
      }
    } catch {
      // Use the local library when the provider is unavailable.
    }
  }

  const normalized = new Set(ingredients.map((item) => item.toLowerCase()));
  const scoredRecipes = fixtureRecipes.map((recipe) => {
    const matched = recipe.matched_ingredients.filter((ingredient) => Array.from(normalized).some((item) => item.includes(ingredient) || ingredient.includes(item)));
    return { ...recipe, matched_ingredients: matched };
  }).sort((left, right) => right.matched_ingredients.length - left.matched_ingredients.length);
  const recipes = scoredRecipes.some((recipe) => recipe.matched_ingredients.length > 0)
    ? scoredRecipes.filter((recipe) => recipe.matched_ingredients.length > 0)
    : fixtureRecipes;
  return { source: "fixture", recipes };
}
