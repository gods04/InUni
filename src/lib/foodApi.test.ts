import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getFoodRecipes } from './foodApi';
import { seedFoodRecipes } from './foodTool';

const mocks = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock('./supabase', () => ({
  isSupabaseConfigured: true,
  supabase: {
    from: (...args: unknown[]) => mocks.from(...args),
  },
}));

function createFoodRecipeQuery(data: unknown[]) {
  const order = vi.fn().mockResolvedValue({ data, error: null });
  const select = vi.fn(() => ({ order }));

  return { order, select };
}

describe('foodApi', () => {
  beforeEach(() => {
    mocks.from.mockReset();
  });

  it('keeps the starter recipe database when Supabase only has a few rows', async () => {
    const query = createFoodRecipeQuery([
      {
        cooking_access: 'stove',
        description: 'A custom campus pasta row from Supabase.',
        dietary: 'vegetarian',
        estimated_cost_zar: 37,
        id: 'campus-tomato-pasta',
        optional_ingredients: ['cheese'],
        prep_minutes: 5,
        required_ingredients: ['pasta', 'tomato'],
        steps: [
          {
            cue: 'Pasta is tender and sauce clings to it.',
            heat: 'Medium heat',
            instruction: 'Boil pasta, simmer tomato, then toss together.',
            minutes: 15,
            title: 'Cook pasta',
          },
        ],
        tags: ['campus', 'stove'],
        title: 'Campus tomato pasta',
        total_minutes: 20,
      },
    ]);

    mocks.from.mockReturnValue(query);

    const recipes = await getFoodRecipes();

    expect(recipes.length).toBeGreaterThan(seedFoodRecipes.length);
    expect(recipes.map((recipe) => recipe.title)).toContain(
      'Campus tomato pasta',
    );
    expect(recipes.map((recipe) => recipe.title)).toContain(
      'Bean curry and rice',
    );
  });
});
