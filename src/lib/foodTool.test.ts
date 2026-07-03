import { describe, expect, it } from 'vitest';
import {
  campusMenuItems,
  filterCampusMenuItemsByBudget,
  getRandomFoodRecipe,
  matchRecipesByIngredients,
  parseIngredientInput,
  seedFoodRecipes,
} from './foodTool';

describe('foodTool', () => {
  it('ships a broad starter recipe database with structured cooking method details', () => {
    expect(seedFoodRecipes.length).toBeGreaterThanOrEqual(20);

    for (const recipe of seedFoodRecipes) {
      expect(recipe.steps.length).toBeGreaterThanOrEqual(3);

      for (const step of recipe.steps) {
        expect(step.heat).toBeTruthy();
        expect(step.minutes).toBeGreaterThan(0);
        expect(step.cue).toBeTruthy();
        expect(step.instruction).toBeTruthy();
      }
    }
  });

  it('draws a random recipe from the available recipe database', () => {
    const recipe = getRandomFoodRecipe(seedFoodRecipes.slice(0, 3), 0.5);

    expect(recipe?.title).toBe('Pap and chakalaka bowl');
    expect(getRandomFoodRecipe([], 0.5)).toBeNull();
  });

  it('parses fridge ingredients from comma and newline separated input', () => {
    expect(parseIngredientInput('Rice, beans\nTomato')).toEqual([
      'rice',
      'beans',
      'tomato',
    ]);
  });

  it('matches recipes to ingredients the user already has', () => {
    const matches = matchRecipesByIngredients(seedFoodRecipes, [
      'rice',
      'beans',
      'tomato',
      'curry powder',
    ]);

    expect(matches[0].recipe.title).toBe('Bean curry and rice');
    expect(matches[0].missingRequiredIngredients).toEqual([]);
    expect(matches[0].matchCount).toBeGreaterThan(0);
    expect(matches[0].recipe.steps[0]).toMatchObject({
      heat: 'Medium-high heat',
      minutes: 12,
    });
  });

  it('keeps possible recipes visible when only some ingredients match', () => {
    const matches = matchRecipesByIngredients(seedFoodRecipes, ['rice', 'tuna']);
    const tunaMatch = matches.find(
      (match) => match.recipe.title === 'Tuna rice bowl',
    );

    expect(tunaMatch?.missingRequiredIngredients).toContain('mayo');
  });

  it('filters campus menu items by the student budget', () => {
    const menuItems = filterCampusMenuItemsByBudget(campusMenuItems, 50);

    expect(menuItems.map((item) => item.name)).toContain('Chicken mayo sandwich');
    expect(menuItems.map((item) => item.name)).not.toContain('Chicken schnitzel plate');
    expect(menuItems.every((item) => item.priceZar <= 50)).toBe(true);
  });
});
