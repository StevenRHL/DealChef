import { fixtureRecipes } from "./fixtures";
import { dealIngredients } from "./deals";
import type { Deal } from "./types";

async function generateInstructionsWithQwen(title: string, ingredients: string[]) {
  const key = process.env.QWEN_API_KEY;
  if (!key) return [];
  try {
    const baseUrl = process.env.QWEN_BASE_URL || "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
    const model = process.env.QWEN_MODEL || "qwen-plus";
    const prompt = `Write 3-5 short cooking steps for "${title}" using these ingredients: ${ingredients.join(", ")}. Reply with one step per line and no numbering or extra commentary.`;
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], max_tokens: 300 }),
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) return [];
    const payload = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const text = payload.choices?.[0]?.message?.content ?? "";
    return text.split("\n").map((line) => line.replace(/^[\d.\-\s]+/, "").trim()).filter(Boolean).slice(0, 6);
  } catch {
    return [];
  }
}

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
        const recipes = await Promise.all(items.slice(0, 6).map(async (item) => {
          const matched = item.usedIngredients?.map((ingredient) => ingredient.name) ?? [];
          const missing = item.missedIngredients?.map((ingredient) => ingredient.name) ?? [];
          const instructions = await generateInstructionsWithQwen(item.title, [...matched, ...missing]);
          return { id: `spoonacular-${item.id}`, title: item.title, description: "A recipe matched to ingredients already on your deal board.", time_minutes: 30, servings: 4, image_emoji: "🍽️", matched_ingredients: matched, missing_ingredients: missing, estimated_extra_cost: missing.length * 2.5, instructions, source: `Spoonacular · https://spoonacular.com/recipes/${item.id}` };
        }));
        return { source: "spoonacular", recipes };
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
