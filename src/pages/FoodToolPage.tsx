import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ChefHat,
  Clock,
  Coins,
  Dice5,
  Flame,
  ListRestart,
  ShoppingBasket,
  Sparkles,
  Utensils,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { Seo } from '../components/Seo';
import { getCampusMenuItems, getFoodRecipes } from '../lib/foodApi';
import {
  campusMenuItems,
  filterCampusMenuItemsByBudget,
  getRandomFoodRecipe,
  matchRecipesByIngredients,
  parseIngredientInput,
  seedFoodRecipes,
} from '../lib/foodTool';
import type {
  CampusMenuItem,
  FoodRecipe,
  FoodToolMode,
  RecipeStep,
  RecipeMatch,
} from '../lib/foodTool';

const modeOptions: Array<{
  detail: string;
  icon: typeof Dice5;
  mode: FoodToolMode;
  title: string;
}> = [
  {
    detail: 'Spin a simple meal wheel and let InUni choose from the recipe database.',
    icon: Dice5,
    mode: 'random',
    title: 'What should I eat today?',
  },
  {
    detail: 'Type what is left in your fridge and get recipes you can actually make.',
    icon: ChefHat,
    mode: 'make',
    title: 'What can I make?',
  },
  {
    detail: 'Enter a rand amount and see campus menu items inside that budget.',
    icon: Coins,
    mode: 'budget',
    title: 'Budget meals',
  },
];

function formatCookingAccess(value: FoodRecipe['cookingAccess']) {
  return value
    .split('-')
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(' ');
}

function RecipeSteps({ steps }: { steps: RecipeStep[] }) {
  const activeMinutes = steps.reduce((total, step) => total + step.minutes, 0);

  return (
    <section className="border-t border-line pt-3">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h4 className="text-sm font-semibold text-ink">Detailed method</h4>
        <span className="text-xs font-semibold text-slate-500">
          {activeMinutes} min active cooking
        </span>
      </div>
      <ol className="mt-3 grid gap-2">
        {steps.map((step, index) => (
          <li
            className="grid gap-3 rounded-lg border border-line bg-slate-50 p-3 sm:grid-cols-[2rem_minmax(0,1fr)]"
            key={`${step.title}-${index}`}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700">
              {index + 1}
            </span>
            <div className="min-w-0">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <h5 className="break-words text-sm font-semibold text-ink">
                  {step.title}
                </h5>
                <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1">
                    <Flame aria-hidden="true" size={13} strokeWidth={2.25} />
                    {step.heat}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1">
                    <Clock aria-hidden="true" size={13} strokeWidth={2.25} />
                    {step.minutes} min
                  </span>
                </div>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {step.instruction}
              </p>
              <p className="mt-2 rounded-lg bg-white px-3 py-2 text-xs leading-5 text-slate-600">
                <span className="font-semibold text-slate-700">Cue:</span>{' '}
                {step.cue}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function RecipeDetail({ recipe }: { recipe: FoodRecipe }) {
  return (
    <article className="panel grid gap-4 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="break-words text-lg font-semibold text-ink">
            {recipe.title}
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {recipe.description}
          </p>
        </div>
        <span className="badge shrink-0 bg-brand-50 text-brand-700">
          R{recipe.estimatedCostZar}
        </span>
      </div>
      <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">
          <Clock aria-hidden="true" size={14} strokeWidth={2.25} />
          {recipe.totalMinutes} min total
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1">
          {formatCookingAccess(recipe.cookingAccess)}
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1">
          {recipe.dietary}
        </span>
      </div>
      <RecipeSteps steps={recipe.steps} />
    </article>
  );
}

function RecipeMatchCard({ match }: { match: RecipeMatch }) {
  return (
    <article className="panel grid gap-4 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="break-words text-lg font-semibold text-ink">
            {match.recipe.title}
          </h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {match.recipe.description}
          </p>
        </div>
        <span
          className={
            match.missingRequiredIngredients.length === 0
              ? 'badge shrink-0 bg-brand-50 text-brand-700'
              : 'badge shrink-0 bg-amber-50 text-amber-800'
          }
        >
          {match.missingRequiredIngredients.length === 0
            ? 'You can make this'
            : `${match.missingRequiredIngredients.length} missing`}
        </span>
      </div>
      {match.missingRequiredIngredients.length > 0 ? (
        <p className="text-sm leading-6 text-slate-600">
          Missing: {match.missingRequiredIngredients.join(', ')}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
        <span className="rounded-full bg-slate-100 px-2.5 py-1">
          {match.recipe.totalMinutes} min total
        </span>
        <span className="rounded-full bg-slate-100 px-2.5 py-1">
          {match.matchCount} ingredient matches
        </span>
      </div>
      <RecipeSteps steps={match.recipe.steps} />
    </article>
  );
}

function MenuItemCard({ item }: { item: CampusMenuItem }) {
  return (
    <article className="panel grid gap-2 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="break-words text-lg font-semibold text-ink">
            {item.name}
          </h3>
          <p className="mt-1 text-sm text-slate-600">{item.vendor}</p>
        </div>
        <span className="badge shrink-0 bg-brand-50 text-brand-700">
          R{item.priceZar}
        </span>
      </div>
      <p className="text-sm leading-6 text-slate-600">{item.notes}</p>
      <span className="badge bg-slate-100 text-slate-600">{item.category}</span>
    </article>
  );
}

export function FoodToolPage() {
  const [mode, setMode] = useState<FoodToolMode | null>(null);
  const [recipes, setRecipes] = useState<FoodRecipe[]>(seedFoodRecipes);
  const [menuItems, setMenuItems] = useState<CampusMenuItem[]>(campusMenuItems);
  const [selectedRecipe, setSelectedRecipe] = useState<FoodRecipe | null>(null);
  const [ingredientInput, setIngredientInput] = useState('');
  const [ingredientSearchSubmitted, setIngredientSearchSubmitted] =
    useState(false);
  const [budgetAmount, setBudgetAmount] = useState('50');

  useEffect(() => {
    let active = true;

    void getFoodRecipes().then((nextRecipes) => {
      if (active) setRecipes(nextRecipes);
    });

    void getCampusMenuItems().then((nextMenuItems) => {
      if (active) setMenuItems(nextMenuItems);
    });

    return () => {
      active = false;
    };
  }, []);

  const ingredientMatches = useMemo(() => {
    if (!ingredientSearchSubmitted) {
      return [];
    }

    return matchRecipesByIngredients(
      recipes,
      parseIngredientInput(ingredientInput),
    );
  }, [ingredientInput, ingredientSearchSubmitted, recipes]);

  const budgetMatches = useMemo(
    () =>
      filterCampusMenuItemsByBudget(
        menuItems,
        Number.parseFloat(budgetAmount),
      ),
    [budgetAmount, menuItems],
  );

  function chooseMode(nextMode: FoodToolMode) {
    setMode(nextMode);
    setSelectedRecipe(null);
    setIngredientSearchSubmitted(false);
  }

  function spinMealWheel() {
    setSelectedRecipe(getRandomFoodRecipe(recipes));
  }

  function resetToChoices() {
    setMode(null);
    setSelectedRecipe(null);
    setIngredientSearchSubmitted(false);
  }

  return (
    <div className="grid gap-5">
      <Seo
        canonicalPath="/tools/food"
        description="Use InUni Food tools to pick a random meal, make recipes from leftover ingredients, or find campus menu items inside a budget."
        title="Food Tools | InUni"
      />

      <section className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-4">
          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
            <Utensils aria-hidden="true" size={24} strokeWidth={2.25} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-brand-700">UCT food</p>
            <h1 className="section-title">Food tools</h1>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              Choose what to eat, turn fridge leftovers into a recipe, or check
              what your campus budget can buy.
            </p>
          </div>
        </div>
        <Link className="secondary-button shrink-0" to="/tools">
          <ArrowLeft aria-hidden="true" size={16} strokeWidth={2.25} />
          Tools
        </Link>
      </section>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Food tool choices">
        {modeOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = mode === option.mode;

          return (
            <button
              aria-label={option.title}
              className={
                isSelected
                  ? 'panel grid min-h-40 gap-3 border-brand-100 bg-brand-50 p-4 text-left ring-4 ring-brand-100'
                  : 'panel grid min-h-40 gap-3 p-4 text-left transition hover:border-brand-100 hover:bg-brand-50 focus:outline-none focus:ring-4 focus:ring-brand-100'
              }
              key={option.mode}
              onClick={() => chooseMode(option.mode)}
              type="button"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <Icon aria-hidden="true" size={20} strokeWidth={2.25} />
              </span>
              <span className="grid gap-1">
                <span className="text-lg font-semibold text-ink">
                  {option.title}
                </span>
                <span className="text-sm leading-6 text-slate-600">
                  {option.detail}
                </span>
              </span>
            </button>
          );
        })}
      </section>

      {mode === 'random' ? (
        <section className="grid gap-4" aria-label="Meal wheel">
          <div className="panel grid gap-4 p-4 sm:grid-cols-[minmax(12rem,16rem)_minmax(0,1fr)] sm:items-center sm:p-5">
            <div className="mx-auto grid aspect-square w-full max-w-56 place-items-center rounded-full border-8 border-brand-100 bg-brand-50 p-5 text-center shadow-soft">
              <div>
                <Sparkles
                  aria-hidden="true"
                  className="mx-auto text-brand-700"
                  size={28}
                  strokeWidth={2.25}
                />
                <p className="mt-2 text-sm font-semibold text-brand-700">
                  Meal wheel
                </p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Database pick
                </p>
              </div>
            </div>
            <div className="grid gap-3">
              <div>
                <h2 className="text-xl font-semibold text-ink">
                  {selectedRecipe?.title ?? 'Ready to spin'}
                </h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {selectedRecipe
                    ? selectedRecipe.description
                    : 'Spin when you do not want to make another food decision.'}
                </p>
              </div>
              {selectedRecipe ? (
                <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                  <span className="badge bg-brand-50 text-brand-700">
                    Estimated time: {selectedRecipe.totalMinutes} min
                  </span>
                  <span className="badge bg-slate-100 text-slate-600">
                    About R{selectedRecipe.estimatedCostZar}
                  </span>
                </div>
              ) : null}
              <div className="flex flex-col gap-2 sm:flex-row">
                <button className="primary-button gap-2" onClick={spinMealWheel} type="button">
                  <Dice5 aria-hidden="true" size={16} strokeWidth={2.25} />
                  Spin meal wheel
                </button>
                <button className="secondary-button gap-2" onClick={resetToChoices} type="button">
                  <ListRestart aria-hidden="true" size={16} strokeWidth={2.25} />
                  Change mode
                </button>
              </div>
            </div>
          </div>
          {selectedRecipe ? <RecipeDetail recipe={selectedRecipe} /> : null}
        </section>
      ) : null}

      {mode === 'make' ? (
        <section className="grid gap-4" aria-labelledby="make-heading">
          <div className="panel grid gap-4 p-4 sm:p-5">
            <div>
              <h2 className="text-xl font-semibold text-ink" id="make-heading">
                What can I make?
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Enter the ingredients left in your fridge, cupboard, or res room.
              </p>
            </div>
            <label className="grid gap-2">
              <span className="field-label">Ingredients I have</span>
              <textarea
                aria-label="Ingredients I have"
                className="field-input min-h-28 resize-y"
                onChange={(event) => {
                  setIngredientInput(event.target.value);
                  setIngredientSearchSubmitted(false);
                }}
                placeholder="rice, beans, tomato, curry powder"
                value={ingredientInput}
              />
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                className="primary-button gap-2"
                onClick={() => setIngredientSearchSubmitted(true)}
                type="button"
              >
                <ChefHat aria-hidden="true" size={16} strokeWidth={2.25} />
                Find recipes
              </button>
              <button className="secondary-button gap-2" onClick={resetToChoices} type="button">
                <ListRestart aria-hidden="true" size={16} strokeWidth={2.25} />
                Change mode
              </button>
            </div>
          </div>

          {ingredientSearchSubmitted && ingredientMatches.length === 0 ? (
            <EmptyState
              title="No recipe match yet"
              message="Try adding broader ingredients like rice, bread, egg, tomato, beans, tuna, or chicken."
            />
          ) : null}

          {ingredientMatches.length > 0 ? (
            <section className="grid gap-3" aria-labelledby="recipe-matches-heading">
              <div>
                <h2 className="text-base font-semibold text-ink" id="recipe-matches-heading">
                  Recipe matches
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Best matches are shown first, including anything you are still missing.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {ingredientMatches.map((match) => (
                  <RecipeMatchCard key={match.recipe.id} match={match} />
                ))}
              </div>
            </section>
          ) : null}
        </section>
      ) : null}

      {mode === 'budget' ? (
        <section className="grid gap-4" aria-labelledby="budget-heading">
          <div className="panel grid gap-4 p-4 sm:p-5">
            <div>
              <h2 className="text-xl font-semibold text-ink" id="budget-heading">
                Budget meals
              </h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Type a rand amount to see what the current campus menu data can buy.
              </p>
            </div>
            <label className="grid gap-2 sm:max-w-xs">
              <span className="field-label">Budget amount</span>
              <span className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-500">
                  R
                </span>
                <input
                  aria-label="Budget amount"
                  className="field-input pl-8"
                  min="1"
                  onChange={(event) => setBudgetAmount(event.target.value)}
                  type="number"
                  value={budgetAmount}
                />
              </span>
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button className="secondary-button gap-2" onClick={resetToChoices} type="button">
                <ListRestart aria-hidden="true" size={16} strokeWidth={2.25} />
                Change mode
              </button>
            </div>
          </div>

          {budgetMatches.length === 0 ? (
            <EmptyState
              title="No menu items inside this budget"
              message="Try a higher amount or add cheaper menu items once the real school menu is imported."
            />
          ) : (
            <section className="grid gap-3" aria-labelledby="budget-results-heading">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-semibold text-ink" id="budget-results-heading">
                    What you can buy
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {budgetMatches.length} option
                    {budgetMatches.length === 1 ? '' : 's'} at or under R
                    {Number.parseFloat(budgetAmount) || 0}.
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
                  <ShoppingBasket aria-hidden="true" size={16} strokeWidth={2.25} />
                  School menu
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {budgetMatches.map((item) => (
                  <MenuItemCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          )}
        </section>
      ) : null}
    </div>
  );
}
