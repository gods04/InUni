import {
  campusMenuItems,
  seedFoodRecipes,
} from './foodTool';
import { isSupabaseConfigured, supabase } from './supabase';
import type {
  CampusMenuItem,
  CookingAccess,
  DietaryPreference,
  FoodRecipe,
  RecipeStep,
} from './foodTool';

interface FoodRecipeRow {
  cooking_access: CookingAccess;
  description: string;
  dietary: DietaryPreference;
  estimated_cost_zar: number;
  id: string;
  optional_ingredients: string[] | null;
  prep_minutes: number;
  required_ingredients: string[];
  steps: unknown;
  tags: string[] | null;
  title: string;
  total_minutes: number;
}

interface CampusMenuItemRow {
  category: string;
  id: string;
  name: string;
  notes: string | null;
  price_zar: number;
  vendor: string;
}

function normalizeRecipeStep(step: unknown, index: number): RecipeStep | null {
  if (typeof step === 'string') {
    return {
      cue: 'Continue when this step is complete.',
      heat: 'Use appropriate heat',
      instruction: step,
      minutes: 1,
      title: `Step ${index + 1}`,
    };
  }

  if (!step || typeof step !== 'object') {
    return null;
  }

  const candidate = step as Partial<RecipeStep>;
  const instruction =
    typeof candidate.instruction === 'string'
      ? candidate.instruction.trim()
      : '';

  if (!instruction) {
    return null;
  }

  return {
    cue:
      typeof candidate.cue === 'string' && candidate.cue.trim()
        ? candidate.cue.trim()
        : 'Continue when this step looks ready.',
    heat:
      typeof candidate.heat === 'string' && candidate.heat.trim()
        ? candidate.heat.trim()
        : 'Use appropriate heat',
    instruction,
    minutes:
      typeof candidate.minutes === 'number' && Number.isFinite(candidate.minutes)
        ? Math.max(1, Math.round(candidate.minutes))
        : 1,
    title:
      typeof candidate.title === 'string' && candidate.title.trim()
        ? candidate.title.trim()
        : `Step ${index + 1}`,
  };
}

function normalizeRecipeSteps(steps: unknown): RecipeStep[] {
  if (!Array.isArray(steps)) {
    return [];
  }

  return steps
    .map((step, index) => normalizeRecipeStep(step, index))
    .filter((step): step is RecipeStep => Boolean(step));
}

function mapRecipe(row: FoodRecipeRow): FoodRecipe {
  return {
    cookingAccess: row.cooking_access,
    description: row.description,
    dietary: row.dietary,
    estimatedCostZar: row.estimated_cost_zar,
    id: row.id,
    optionalIngredients: row.optional_ingredients ?? [],
    prepMinutes: row.prep_minutes,
    requiredIngredients: row.required_ingredients,
    steps: normalizeRecipeSteps(row.steps),
    tags: row.tags ?? [],
    title: row.title,
    totalMinutes: row.total_minutes,
  };
}

function mapMenuItem(row: CampusMenuItemRow): CampusMenuItem {
  return {
    category: row.category,
    id: row.id,
    name: row.name,
    notes: row.notes ?? '',
    priceZar: row.price_zar,
    vendor: row.vendor,
  };
}

function mergeWithSeedRecipes(recipes: FoodRecipe[]): FoodRecipe[] {
  const byId = new Map(
    seedFoodRecipes.map((recipe) => [recipe.id, recipe] as const),
  );

  for (const recipe of recipes) {
    if (recipe.steps.length > 0) {
      byId.set(recipe.id, recipe);
    }
  }

  return Array.from(byId.values());
}

export async function getFoodRecipes(): Promise<FoodRecipe[]> {
  if (!isSupabaseConfigured || !supabase) {
    return seedFoodRecipes;
  }

  const { data, error } = await supabase
    .from('food_recipes')
    .select(
      'id, title, description, required_ingredients, optional_ingredients, steps, total_minutes, prep_minutes, estimated_cost_zar, cooking_access, dietary, tags',
    )
    .order('title');

  if (error) {
    return seedFoodRecipes;
  }

  if (!data || data.length === 0) {
    return seedFoodRecipes;
  }

  return mergeWithSeedRecipes((data as FoodRecipeRow[]).map(mapRecipe));
}

export async function getCampusMenuItems(): Promise<CampusMenuItem[]> {
  if (!isSupabaseConfigured || !supabase) {
    return campusMenuItems;
  }

  const { data, error } = await supabase
    .from('campus_menu_items')
    .select('id, name, vendor, category, price_zar, notes')
    .order('price_zar');

  if (error) {
    return campusMenuItems;
  }

  if (!data || data.length === 0) {
    return campusMenuItems;
  }

  return (data as CampusMenuItemRow[]).map(mapMenuItem);
}
