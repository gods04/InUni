export type FoodToolMode = 'random' | 'make' | 'budget';
export type CookingAccess = 'no-cook' | 'microwave' | 'stove' | 'full-kitchen';
export type DietaryPreference = 'meat' | 'vegetarian' | 'vegan';

export interface RecipeStep {
  cue: string;
  heat: string;
  instruction: string;
  minutes: number;
  title: string;
}

export interface FoodRecipe {
  cookingAccess: CookingAccess;
  description: string;
  dietary: DietaryPreference;
  estimatedCostZar: number;
  id: string;
  optionalIngredients: string[];
  prepMinutes: number;
  requiredIngredients: string[];
  steps: RecipeStep[];
  tags: string[];
  title: string;
  totalMinutes: number;
}

export interface RecipeMatch {
  matchCount: number;
  missingRequiredIngredients: string[];
  recipe: FoodRecipe;
}

export interface CampusMenuItem {
  category: string;
  id: string;
  name: string;
  notes: string;
  priceZar: number;
  vendor: string;
}

export const seedFoodRecipes: FoodRecipe[] = [
  {
    cookingAccess: 'no-cook',
    description:
      'A cheap campus-day backup when you have bread, peanut butter, and one piece of fruit.',
    dietary: 'vegetarian',
    estimatedCostZar: 18,
    id: 'peanut-butter-banana-sandwich',
    optionalIngredients: ['honey', 'cinnamon'],
    prepMinutes: 5,
    requiredIngredients: ['bread', 'peanut butter', 'banana'],
    steps: [
      {
        cue: 'Bread is evenly covered to the edges.',
        heat: 'No heat',
        instruction: 'Spread peanut butter over two slices of bread.',
        minutes: 2,
        title: 'Build the base',
      },
      {
        cue: 'Banana slices cover the bread in a single layer.',
        heat: 'No heat',
        instruction: 'Slice the banana thinly and lay it over the peanut butter.',
        minutes: 2,
        title: 'Add fruit',
      },
      {
        cue: 'Sandwich holds together when lifted.',
        heat: 'No heat',
        instruction: 'Close the sandwich, press lightly, and cut if you want to pack it.',
        minutes: 1,
        title: 'Pack it',
      },
    ],
    tags: ['breakfast', 'budget', 'no-cook', 'quick'],
    title: 'Peanut butter banana sandwich',
    totalMinutes: 5,
  },
  {
    cookingAccess: 'stove',
    description:
      'A warm South African-inspired bowl using pap and chakalaka for a filling budget meal.',
    dietary: 'vegan',
    estimatedCostZar: 22,
    id: 'pap-and-chakalaka-bowl',
    optionalIngredients: ['spinach', 'fried egg'],
    prepMinutes: 5,
    requiredIngredients: ['pap', 'chakalaka'],
    steps: [
      {
        cue: 'Pap is thick, smooth, and pulls away slightly from the pot.',
        heat: 'Medium heat',
        instruction:
          'Whisk maize meal into simmering water, then stir often so it does not catch at the bottom.',
        minutes: 10,
        title: 'Cook the pap',
      },
      {
        cue: 'Chakalaka is bubbling gently and smells cooked through.',
        heat: 'Low heat',
        instruction: 'Warm chakalaka in a small pot, stirring every minute.',
        minutes: 5,
        title: 'Warm the chakalaka',
      },
      {
        cue: 'Spinach is wilted but still green.',
        heat: 'Residual heat',
        instruction: 'Fold in spinach if using it, then spoon chakalaka over the pap.',
        minutes: 3,
        title: 'Finish the bowl',
      },
    ],
    tags: ['budget', 'chakalaka', 'south-african', 'vegan'],
    title: 'Pap and chakalaka bowl',
    totalMinutes: 18,
  },
  {
    cookingAccess: 'stove',
    description:
      'A batch-friendly curry that turns pantry basics into a proper dinner.',
    dietary: 'vegan',
    estimatedCostZar: 35,
    id: 'bean-curry-and-rice',
    optionalIngredients: ['onion', 'spinach', 'chilli'],
    prepMinutes: 8,
    requiredIngredients: ['rice', 'beans', 'tomato', 'curry powder'],
    steps: [
      {
        cue: 'Rice is tender and most water is absorbed.',
        heat: 'Medium-high heat',
        instruction:
          'Rinse rice, add water, bring to a boil, then cover and cook until tender.',
        minutes: 12,
        title: 'Start the rice',
      },
      {
        cue: 'Tomato darkens slightly and the curry smells fragrant.',
        heat: 'Medium heat',
        instruction:
          'Cook tomato with curry powder and a pinch of salt, stirring so the spice does not burn.',
        minutes: 6,
        title: 'Build the curry base',
      },
      {
        cue: 'Beans are hot and the sauce coats a spoon.',
        heat: 'Low heat',
        instruction: 'Add beans and simmer gently until the curry thickens.',
        minutes: 10,
        title: 'Simmer the beans',
      },
      {
        cue: 'Rice is fluffed and curry sits on top without running everywhere.',
        heat: 'Off heat',
        instruction: 'Fluff rice, spoon curry over it, and add spinach or chilli if available.',
        minutes: 2,
        title: 'Serve',
      },
    ],
    tags: ['batch', 'budget', 'curry', 'vegan'],
    title: 'Bean curry and rice',
    totalMinutes: 30,
  },
  {
    cookingAccess: 'microwave',
    description:
      'A dorm-friendly bowl when you have pantry rice and a tin of tuna.',
    dietary: 'meat',
    estimatedCostZar: 42,
    id: 'tuna-rice-bowl',
    optionalIngredients: ['cucumber', 'sweetcorn', 'hot sauce'],
    prepMinutes: 5,
    requiredIngredients: ['rice', 'tuna', 'mayo'],
    steps: [
      {
        cue: 'Rice is steaming and loose, not cold in the middle.',
        heat: 'Microwave high',
        instruction: 'Heat microwave rice or leftover rice with a splash of water.',
        minutes: 2,
        title: 'Warm the rice',
      },
      {
        cue: 'Tuna is creamy and evenly mixed.',
        heat: 'No heat',
        instruction: 'Drain tuna and mix it with mayo, salt, and pepper.',
        minutes: 3,
        title: 'Mix the tuna',
      },
      {
        cue: 'Bowl has rice at the bottom and tuna on top.',
        heat: 'No heat',
        instruction: 'Add tuna to the rice and finish with cucumber, sweetcorn, or hot sauce.',
        minutes: 5,
        title: 'Assemble',
      },
    ],
    tags: ['microwave', 'protein', 'quick', 'rice'],
    title: 'Tuna rice bowl',
    totalMinutes: 10,
  },
  {
    cookingAccess: 'stove',
    description:
      'Eggs, tomato, and toast make a quick meal that still feels cooked.',
    dietary: 'vegetarian',
    estimatedCostZar: 24,
    id: 'tomato-egg-toast',
    optionalIngredients: ['cheese', 'chilli flakes'],
    prepMinutes: 4,
    requiredIngredients: ['bread', 'egg', 'tomato'],
    steps: [
      {
        cue: 'Bread is crisp and lightly browned.',
        heat: 'Medium heat',
        instruction: 'Toast bread in a pan or toaster.',
        minutes: 3,
        title: 'Toast the bread',
      },
      {
        cue: 'Tomato is soft and glossy.',
        heat: 'Medium heat',
        instruction: 'Cook chopped tomato with a little oil and salt.',
        minutes: 4,
        title: 'Soften the tomato',
      },
      {
        cue: 'Egg is just set, still soft, and not dry.',
        heat: 'Low heat',
        instruction: 'Add egg and stir slowly, then spoon the mixture onto toast.',
        minutes: 5,
        title: 'Finish with egg',
      },
    ],
    tags: ['breakfast', 'quick', 'stove', 'vegetarian'],
    title: 'Tomato egg toast',
    totalMinutes: 12,
  },
  {
    cookingAccess: 'microwave',
    description:
      'A quick warm lunch using bread, cooked chicken, mayo, and any melting cheese.',
    dietary: 'meat',
    estimatedCostZar: 38,
    id: 'chicken-mayo-toastie',
    optionalIngredients: ['cheese', 'lettuce', 'pepper'],
    prepMinutes: 6,
    requiredIngredients: ['bread', 'chicken', 'mayo'],
    steps: [
      {
        cue: 'Chicken is shredded and coated, not swimming in mayo.',
        heat: 'No heat',
        instruction: 'Mix cooked chicken with mayo and pepper.',
        minutes: 4,
        title: 'Make the filling',
      },
      {
        cue: 'Sandwich is full but can still close.',
        heat: 'No heat',
        instruction: 'Spread the chicken mayo between two slices of bread.',
        minutes: 2,
        title: 'Build the toastie',
      },
      {
        cue: 'Filling is hot and cheese melts if added.',
        heat: 'Microwave high',
        instruction: 'Warm the sandwich, or press it in a pan if you have one.',
        minutes: 4,
        title: 'Heat through',
      },
    ],
    tags: ['lunch', 'microwave', 'protein', 'toastie'],
    title: 'Chicken mayo toastie',
    totalMinutes: 12,
  },
  {
    cookingAccess: 'no-cook',
    description:
      'A cool bowl for hot campus days using amasi, oats, fruit, and a little crunch.',
    dietary: 'vegetarian',
    estimatedCostZar: 28,
    id: 'amasi-fruit-bowl',
    optionalIngredients: ['peanut butter', 'cinnamon', 'nuts'],
    prepMinutes: 6,
    requiredIngredients: ['amasi', 'oats', 'fruit'],
    steps: [
      {
        cue: 'Oats are covered but not soupy.',
        heat: 'No heat',
        instruction: 'Spoon amasi into a bowl and stir in oats.',
        minutes: 2,
        title: 'Mix the base',
      },
      {
        cue: 'Fruit is bite-sized.',
        heat: 'No heat',
        instruction: 'Slice banana, apple, or any fruit you have.',
        minutes: 3,
        title: 'Add fruit',
      },
      {
        cue: 'Bowl has a creamy base and crunchy topping.',
        heat: 'No heat',
        instruction: 'Top with nuts, cereal, or cinnamon.',
        minutes: 1,
        title: 'Finish',
      },
    ],
    tags: ['breakfast', 'cold', 'south-african', 'no-cook'],
    title: 'Amasi fruit bowl',
    totalMinutes: 6,
  },
  {
    cookingAccess: 'no-cook',
    description:
      'A simple wrap for using hummus, carrots, cucumber, and greens before they go soft.',
    dietary: 'vegan',
    estimatedCostZar: 32,
    id: 'hummus-salad-wrap',
    optionalIngredients: ['chilli sauce', 'seeds', 'pickles'],
    prepMinutes: 8,
    requiredIngredients: ['wrap', 'hummus', 'carrot', 'cucumber'],
    steps: [
      {
        cue: 'Wrap is covered with a thin even layer.',
        heat: 'No heat',
        instruction: 'Spread hummus over the wrap, leaving a small border.',
        minutes: 2,
        title: 'Spread',
      },
      {
        cue: 'Vegetables are thin enough to fold easily.',
        heat: 'No heat',
        instruction: 'Slice carrot and cucumber into thin strips.',
        minutes: 4,
        title: 'Slice veg',
      },
      {
        cue: 'Wrap holds together without tearing.',
        heat: 'No heat',
        instruction: 'Add vegetables, fold the sides in, and roll tightly.',
        minutes: 2,
        title: 'Roll',
      },
    ],
    tags: ['campus', 'lunch', 'no-cook', 'vegan'],
    title: 'Hummus salad wrap',
    totalMinutes: 8,
  },
  {
    cookingAccess: 'stove',
    description:
      'A fast noodle bowl that uses cabbage, egg, and soy sauce for a filling dinner.',
    dietary: 'vegetarian',
    estimatedCostZar: 30,
    id: 'egg-cabbage-noodles',
    optionalIngredients: ['spring onion', 'chilli oil', 'peanuts'],
    prepMinutes: 6,
    requiredIngredients: ['noodles', 'egg', 'cabbage', 'soy sauce'],
    steps: [
      {
        cue: 'Noodles are flexible but not mushy.',
        heat: 'High heat',
        instruction: 'Boil noodles, then drain and keep a little cooking water.',
        minutes: 5,
        title: 'Boil noodles',
      },
      {
        cue: 'Cabbage softens at the edges but keeps some crunch.',
        heat: 'Medium-high heat',
        instruction: 'Stir-fry sliced cabbage with a little oil.',
        minutes: 4,
        title: 'Cook cabbage',
      },
      {
        cue: 'Egg is just set and noodles are coated.',
        heat: 'Low heat',
        instruction: 'Add noodles, soy sauce, and egg, then toss gently.',
        minutes: 5,
        title: 'Combine',
      },
    ],
    tags: ['noodles', 'quick', 'stove', 'vegetarian'],
    title: 'Egg cabbage noodles',
    totalMinutes: 14,
  },
  {
    cookingAccess: 'full-kitchen',
    description:
      'A tray-style meal using potatoes, wors, and onions when you have an oven or air fryer.',
    dietary: 'meat',
    estimatedCostZar: 48,
    id: 'wors-potato-tray',
    optionalIngredients: ['peppers', 'chakalaka', 'mustard'],
    prepMinutes: 10,
    requiredIngredients: ['wors', 'potato', 'onion'],
    steps: [
      {
        cue: 'Potatoes are coated and spread in one layer.',
        heat: 'Oven 200C',
        instruction: 'Cut potatoes small, toss with oil and salt, and spread on a tray.',
        minutes: 5,
        title: 'Prep potatoes',
      },
      {
        cue: 'Potatoes are browned at the edges.',
        heat: 'Oven 200C',
        instruction: 'Roast potatoes before adding the wors.',
        minutes: 20,
        title: 'Roast first',
      },
      {
        cue: 'Wors is cooked through and onions are soft.',
        heat: 'Oven 200C',
        instruction: 'Add sliced onion and wors, then roast until cooked.',
        minutes: 18,
        title: 'Finish tray',
      },
    ],
    tags: ['batch', 'meat', 'oven', 'south-african'],
    title: 'Wors and potato tray',
    totalMinutes: 43,
  },
  {
    cookingAccess: 'stove',
    description:
      'A tomato-based pilchard meal that works with pap, rice, or bread.',
    dietary: 'meat',
    estimatedCostZar: 40,
    id: 'pilchard-tomato-stew',
    optionalIngredients: ['onion', 'chilli', 'spinach'],
    prepMinutes: 6,
    requiredIngredients: ['pilchards', 'tomato', 'rice'],
    steps: [
      {
        cue: 'Rice is cooked and resting.',
        heat: 'Medium-high heat',
        instruction: 'Cook rice first so the stew can go on top when ready.',
        minutes: 12,
        title: 'Cook rice',
      },
      {
        cue: 'Tomato sauce is bubbling and slightly thicker.',
        heat: 'Medium heat',
        instruction: 'Simmer tomato with onion or chilli if you have it.',
        minutes: 8,
        title: 'Make sauce',
      },
      {
        cue: 'Fish is hot but still in chunks.',
        heat: 'Low heat',
        instruction: 'Fold in pilchards gently and warm through without breaking them too much.',
        minutes: 5,
        title: 'Warm fish',
      },
    ],
    tags: ['protein', 'rice', 'stew', 'south-african'],
    title: 'Pilchard tomato stew',
    totalMinutes: 25,
  },
  {
    cookingAccess: 'microwave',
    description:
      'A warm sweet potato meal with beans and yoghurt when you have a microwave.',
    dietary: 'vegetarian',
    estimatedCostZar: 36,
    id: 'loaded-sweet-potato',
    optionalIngredients: ['cheese', 'spring onion', 'hot sauce'],
    prepMinutes: 4,
    requiredIngredients: ['sweet potato', 'beans', 'yoghurt'],
    steps: [
      {
        cue: 'Sweet potato is soft when pierced with a fork.',
        heat: 'Microwave high',
        instruction: 'Pierce sweet potato and microwave, turning halfway.',
        minutes: 8,
        title: 'Cook potato',
      },
      {
        cue: 'Beans are hot and saucy.',
        heat: 'Microwave high',
        instruction: 'Warm beans in a bowl, covered loosely.',
        minutes: 3,
        title: 'Heat beans',
      },
      {
        cue: 'Potato is split open and filling sits inside.',
        heat: 'No heat',
        instruction: 'Split the potato, add beans, and top with yoghurt.',
        minutes: 3,
        title: 'Load it',
      },
    ],
    tags: ['microwave', 'vegetarian', 'filling'],
    title: 'Loaded sweet potato',
    totalMinutes: 14,
  },
  {
    cookingAccess: 'stove',
    description:
      'A simple lentil soup for several servings when you need cheap food for the week.',
    dietary: 'vegan',
    estimatedCostZar: 34,
    id: 'lentil-tomato-soup',
    optionalIngredients: ['carrot', 'celery', 'chilli'],
    prepMinutes: 8,
    requiredIngredients: ['lentils', 'tomato', 'onion', 'stock'],
    steps: [
      {
        cue: 'Onion is soft and translucent.',
        heat: 'Medium heat',
        instruction: 'Cook chopped onion in a little oil with salt.',
        minutes: 6,
        title: 'Soften onion',
      },
      {
        cue: 'Lentils are covered by liquid.',
        heat: 'High heat',
        instruction: 'Add lentils, tomato, and stock, then bring to a boil.',
        minutes: 5,
        title: 'Bring up heat',
      },
      {
        cue: 'Lentils are tender and soup thickens.',
        heat: 'Low simmer',
        instruction: 'Simmer gently, stirring now and then.',
        minutes: 22,
        title: 'Simmer',
      },
    ],
    tags: ['batch', 'soup', 'vegan', 'budget'],
    title: 'Lentil tomato soup',
    totalMinutes: 33,
  },
  {
    cookingAccess: 'stove',
    description:
      'A simple pasta bowl for nights when tomato and cheese are the only exciting things left.',
    dietary: 'vegetarian',
    estimatedCostZar: 34,
    id: 'tomato-cheese-pasta',
    optionalIngredients: ['garlic', 'chilli flakes', 'spinach'],
    prepMinutes: 5,
    requiredIngredients: ['pasta', 'tomato', 'cheese'],
    steps: [
      {
        cue: 'Pasta bends easily but still has a little bite.',
        heat: 'High heat',
        instruction: 'Boil pasta in salted water and save a little cooking water before draining.',
        minutes: 10,
        title: 'Boil pasta',
      },
      {
        cue: 'Tomato sauce looks glossy and slightly thicker.',
        heat: 'Medium heat',
        instruction: 'Cook chopped tomato with oil, salt, and garlic if you have it.',
        minutes: 7,
        title: 'Make sauce',
      },
      {
        cue: 'Cheese melts into the sauce and coats the pasta.',
        heat: 'Low heat',
        instruction: 'Add pasta, a splash of cooking water, and cheese, then toss gently.',
        minutes: 3,
        title: 'Toss together',
      },
    ],
    tags: ['pasta', 'quick', 'stove', 'vegetarian'],
    title: 'Tomato cheese pasta',
    totalMinutes: 20,
  },
  {
    cookingAccess: 'stove',
    description:
      'A peanut sauce noodle bowl that is cheap, filling, and easy to adjust with chilli.',
    dietary: 'vegan',
    estimatedCostZar: 28,
    id: 'spicy-peanut-noodles',
    optionalIngredients: ['chilli', 'spring onion', 'cabbage'],
    prepMinutes: 5,
    requiredIngredients: ['noodles', 'peanut butter', 'soy sauce'],
    steps: [
      {
        cue: 'Noodles are soft enough to separate with a fork.',
        heat: 'High heat',
        instruction: 'Boil noodles, then drain and keep a few spoons of the cooking water.',
        minutes: 5,
        title: 'Cook noodles',
      },
      {
        cue: 'Sauce is smooth and pourable.',
        heat: 'No heat',
        instruction:
          'Stir peanut butter with soy sauce and warm noodle water until it loosens.',
        minutes: 3,
        title: 'Mix sauce',
      },
      {
        cue: 'Noodles are evenly coated and shiny.',
        heat: 'Low heat',
        instruction: 'Return noodles to the pot, add sauce, and toss gently with chilli if using.',
        minutes: 3,
        title: 'Coat noodles',
      },
    ],
    tags: ['budget', 'noodles', 'quick', 'vegan'],
    title: 'Spicy peanut noodles',
    totalMinutes: 11,
  },
  {
    cookingAccess: 'microwave',
    description:
      'A quick couscous bowl using tinned chickpeas and tomato for a no-stress lunch.',
    dietary: 'vegan',
    estimatedCostZar: 36,
    id: 'chickpea-couscous-bowl',
    optionalIngredients: ['cucumber', 'lemon juice', 'parsley'],
    prepMinutes: 6,
    requiredIngredients: ['couscous', 'chickpeas', 'tomato'],
    steps: [
      {
        cue: 'Couscous grains are fluffy and no dry patches remain.',
        heat: 'Kettle or microwave high',
        instruction:
          'Cover couscous with hot water, cover the bowl, and let it steam.',
        minutes: 6,
        title: 'Steam couscous',
      },
      {
        cue: 'Chickpeas are warm and seasoned.',
        heat: 'Microwave high',
        instruction: 'Warm chickpeas with tomato, salt, and a small splash of oil.',
        minutes: 3,
        title: 'Warm chickpeas',
      },
      {
        cue: 'Bowl is fluffy, warm, and not watery.',
        heat: 'No heat',
        instruction: 'Fluff couscous with a fork, then spoon chickpeas and tomato over it.',
        minutes: 2,
        title: 'Assemble bowl',
      },
    ],
    tags: ['campus', 'microwave', 'vegan'],
    title: 'Chickpea couscous bowl',
    totalMinutes: 11,
  },
  {
    cookingAccess: 'stove',
    description:
      'A useful way to turn leftover rice, egg, and frozen vegetables into a proper meal.',
    dietary: 'vegetarian',
    estimatedCostZar: 32,
    id: 'egg-fried-rice',
    optionalIngredients: ['spring onion', 'chilli oil', 'peas'],
    prepMinutes: 6,
    requiredIngredients: ['rice', 'egg', 'frozen veg', 'soy sauce'],
    steps: [
      {
        cue: 'Rice grains separate instead of clumping together.',
        heat: 'Medium-high heat',
        instruction: 'Fry leftover rice with a little oil, breaking up clumps as it heats.',
        minutes: 5,
        title: 'Fry rice',
      },
      {
        cue: 'Vegetables are hot and bright.',
        heat: 'Medium-high heat',
        instruction: 'Add frozen vegetables and keep stirring so the rice does not stick.',
        minutes: 4,
        title: 'Add veg',
      },
      {
        cue: 'Egg is set in small soft pieces and rice tastes seasoned.',
        heat: 'Low heat',
        instruction: 'Push rice aside, scramble in the egg, then toss everything with soy sauce.',
        minutes: 4,
        title: 'Finish with egg',
      },
    ],
    tags: ['leftovers', 'rice', 'stove', 'vegetarian'],
    title: 'Egg fried rice',
    totalMinutes: 13,
  },
  {
    cookingAccess: 'stove',
    description:
      'A filling pan meal with mince, cabbage, and rice when you want dinner plus leftovers.',
    dietary: 'meat',
    estimatedCostZar: 55,
    id: 'mince-cabbage-rice',
    optionalIngredients: ['onion', 'chilli', 'carrot'],
    prepMinutes: 8,
    requiredIngredients: ['mince', 'cabbage', 'rice', 'tomato'],
    steps: [
      {
        cue: 'Rice is tender and resting with the lid on.',
        heat: 'Medium-high heat',
        instruction: 'Cook rice first so it is ready when the mince is done.',
        minutes: 12,
        title: 'Cook rice',
      },
      {
        cue: 'Mince is browned with no pink patches.',
        heat: 'Medium-high heat',
        instruction: 'Brown mince in a pan, breaking it up with a spoon.',
        minutes: 7,
        title: 'Brown mince',
      },
      {
        cue: 'Cabbage is soft at the edges and tomato coats the mince.',
        heat: 'Medium heat',
        instruction: 'Add sliced cabbage and tomato, then cook until saucy.',
        minutes: 8,
        title: 'Simmer filling',
      },
    ],
    tags: ['batch', 'meat', 'rice', 'stove'],
    title: 'Mince cabbage rice',
    totalMinutes: 27,
  },
  {
    cookingAccess: 'microwave',
    description:
      'A mug-style mac and cheese for res kitchens when you only have a microwave.',
    dietary: 'vegetarian',
    estimatedCostZar: 30,
    id: 'microwave-mac-and-cheese',
    optionalIngredients: ['pepper', 'mustard', 'chilli flakes'],
    prepMinutes: 3,
    requiredIngredients: ['macaroni', 'milk', 'cheese'],
    steps: [
      {
        cue: 'Macaroni is just tender and most liquid is absorbed.',
        heat: 'Microwave high',
        instruction:
          'Microwave macaroni with water in a large bowl, stopping to stir every few minutes.',
        minutes: 8,
        title: 'Cook macaroni',
      },
      {
        cue: 'Milk is hot but not boiling over.',
        heat: 'Microwave medium',
        instruction: 'Stir in milk and microwave briefly to warm it through.',
        minutes: 2,
        title: 'Warm milk',
      },
      {
        cue: 'Cheese melts into a creamy sauce.',
        heat: 'Residual heat',
        instruction: 'Stir in cheese until smooth, then season with pepper or chilli.',
        minutes: 2,
        title: 'Melt cheese',
      },
    ],
    tags: ['comfort', 'microwave', 'quick', 'vegetarian'],
    title: 'Microwave mac and cheese',
    totalMinutes: 12,
  },
  {
    cookingAccess: 'stove',
    description:
      'A small-batch pancake option using oats, banana, and egg for breakfast or a study snack.',
    dietary: 'vegetarian',
    estimatedCostZar: 26,
    id: 'banana-oat-pancakes',
    optionalIngredients: ['cinnamon', 'peanut butter', 'honey'],
    prepMinutes: 5,
    requiredIngredients: ['oats', 'banana', 'egg'],
    steps: [
      {
        cue: 'Batter is thick but spoonable.',
        heat: 'No heat',
        instruction: 'Mash banana, then mix with egg and oats.',
        minutes: 4,
        title: 'Mix batter',
      },
      {
        cue: 'Edges look set and small bubbles appear on top.',
        heat: 'Low-medium heat',
        instruction: 'Spoon small pancakes into a lightly oiled pan.',
        minutes: 4,
        title: 'Cook first side',
      },
      {
        cue: 'Both sides are golden and the middle feels set.',
        heat: 'Low heat',
        instruction: 'Flip gently and cook the second side, then serve warm.',
        minutes: 3,
        title: 'Flip and finish',
      },
    ],
    tags: ['breakfast', 'stove', 'vegetarian'],
    title: 'Banana oat pancakes',
    totalMinutes: 11,
  },
];

export const campusMenuItems: CampusMenuItem[] = [
  {
    category: 'Sandwiches',
    id: 'campus-chicken-mayo-sandwich',
    name: 'Chicken mayo sandwich',
    notes: 'Filling lunch option from the starter menu data.',
    priceZar: 38,
    vendor: 'Campus Cafe',
  },
  {
    category: 'Hot meals',
    id: 'campus-veg-curry-rice',
    name: 'Veg curry and rice',
    notes: 'Warm vegetarian plate with rice.',
    priceZar: 45,
    vendor: 'Upper Campus Canteen',
  },
  {
    category: 'Breakfast',
    id: 'campus-egg-toast-coffee',
    name: 'Egg toast and coffee',
    notes: 'Simple breakfast combo for early lectures.',
    priceZar: 32,
    vendor: 'Library Kiosk',
  },
  {
    category: 'Hot meals',
    id: 'campus-chicken-schnitzel',
    name: 'Chicken schnitzel plate',
    notes: 'Bigger plate for days when the budget can stretch.',
    priceZar: 68,
    vendor: 'Main Food Court',
  },
  {
    category: 'Snacks',
    id: 'campus-muffin-tea',
    name: 'Muffin and tea',
    notes: 'Small snack option between classes.',
    priceZar: 25,
    vendor: 'Campus Cafe',
  },
  {
    category: 'Drinks',
    id: 'campus-filter-coffee',
    name: 'Filter coffee',
    notes: 'Low-cost caffeine option for long study blocks.',
    priceZar: 18,
    vendor: 'Library Kiosk',
  },
  {
    category: 'Light meals',
    id: 'campus-soup-roll',
    name: 'Soup and roll',
    notes: 'Warm light lunch option for colder days.',
    priceZar: 42,
    vendor: 'Upper Campus Canteen',
  },
];

function normalizeIngredient(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, ' ');
}

export function parseIngredientInput(input: string): string[] {
  const seen = new Set<string>();

  return input
    .split(/[\n,;]+/)
    .map(normalizeIngredient)
    .filter(Boolean)
    .filter((ingredient) => {
      if (seen.has(ingredient)) {
        return false;
      }

      seen.add(ingredient);
      return true;
    });
}

function hasIngredient(availableIngredients: Set<string>, required: string) {
  const normalizedRequired = normalizeIngredient(required);

  return (
    availableIngredients.has(normalizedRequired) ||
    availableIngredients.has(normalizedRequired.replace(/s$/, '')) ||
    availableIngredients.has(`${normalizedRequired}s`)
  );
}

export function getRandomFoodRecipe(
  recipes: FoodRecipe[],
  randomValue = Math.random(),
) {
  if (recipes.length === 0) {
    return null;
  }

  const boundedRandomValue = Math.max(0, Math.min(randomValue, 0.999999));
  const index = Math.floor(boundedRandomValue * recipes.length);

  return recipes[index];
}

export function matchRecipesByIngredients(
  recipes: FoodRecipe[],
  availableIngredients: string[],
): RecipeMatch[] {
  const available = new Set(availableIngredients.map(normalizeIngredient));

  if (available.size === 0) {
    return [];
  }

  return recipes
    .map((recipe) => {
      const missingRequiredIngredients = recipe.requiredIngredients.filter(
        (ingredient) => !hasIngredient(available, ingredient),
      );
      const matchCount =
        recipe.requiredIngredients.length - missingRequiredIngredients.length;

      return {
        matchCount,
        missingRequiredIngredients,
        recipe,
      };
    })
    .filter((match) => match.matchCount > 0)
    .sort((a, b) => {
      const aCanMake = a.missingRequiredIngredients.length === 0 ? 1 : 0;
      const bCanMake = b.missingRequiredIngredients.length === 0 ? 1 : 0;

      return (
        bCanMake - aCanMake ||
        b.matchCount - a.matchCount ||
        a.missingRequiredIngredients.length - b.missingRequiredIngredients.length ||
        a.recipe.totalMinutes - b.recipe.totalMinutes
      );
    });
}

export function filterCampusMenuItemsByBudget(
  menuItems: CampusMenuItem[],
  budgetZar: number,
) {
  if (!Number.isFinite(budgetZar) || budgetZar <= 0) {
    return [];
  }

  return menuItems
    .filter((item) => item.priceZar <= budgetZar)
    .sort((a, b) => b.priceZar - a.priceZar || a.name.localeCompare(b.name));
}
