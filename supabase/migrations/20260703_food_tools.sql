create table if not exists public.food_recipes (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (char_length(trim(title)) between 1 and 120),
  description text not null default '' check (char_length(description) <= 500),
  required_ingredients text[] not null default '{}',
  optional_ingredients text[] not null default '{}',
  steps jsonb not null default '[]'::jsonb check (jsonb_typeof(steps) = 'array'),
  total_minutes integer not null check (total_minutes between 1 and 360),
  prep_minutes integer not null check (prep_minutes between 0 and 360),
  estimated_cost_zar numeric(8, 2) not null check (estimated_cost_zar >= 0),
  cooking_access text not null check (
    cooking_access in ('no-cook', 'microwave', 'stove', 'full-kitchen')
  ),
  dietary text not null check (dietary in ('meat', 'vegetarian', 'vegan')),
  tags text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campus_menu_items (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (char_length(trim(name)) between 1 and 120),
  vendor text not null default '' check (char_length(vendor) <= 120),
  category text not null default '' check (char_length(category) <= 80),
  price_zar numeric(8, 2) not null check (price_zar >= 0),
  notes text not null default '' check (char_length(notes) <= 500),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists food_recipes_active_title_idx
on public.food_recipes (is_active, title);

create index if not exists campus_menu_items_active_price_idx
on public.campus_menu_items (is_active, price_zar);

alter table public.food_recipes enable row level security;
alter table public.campus_menu_items enable row level security;

drop policy if exists "Anyone can read active food recipes" on public.food_recipes;
create policy "Anyone can read active food recipes"
on public.food_recipes for select
to anon, authenticated
using (is_active);

drop policy if exists "Admins can manage food recipes" on public.food_recipes;
create policy "Admins can manage food recipes"
on public.food_recipes for all
to authenticated
using (public.current_profile_is_admin())
with check (public.current_profile_is_admin());

drop policy if exists "Anyone can read active campus menu items" on public.campus_menu_items;
create policy "Anyone can read active campus menu items"
on public.campus_menu_items for select
to anon, authenticated
using (is_active);

drop policy if exists "Admins can manage campus menu items" on public.campus_menu_items;
create policy "Admins can manage campus menu items"
on public.campus_menu_items for all
to authenticated
using (public.current_profile_is_admin())
with check (public.current_profile_is_admin());

insert into public.food_recipes (
  id,
  title,
  description,
  required_ingredients,
  optional_ingredients,
  steps,
  total_minutes,
  prep_minutes,
  estimated_cost_zar,
  cooking_access,
  dietary,
  tags
)
values
  (
    'pap-and-chakalaka-bowl',
    'Pap and chakalaka bowl',
    'A warm South African-inspired bowl using pap and chakalaka for a filling budget meal.',
    array['pap', 'chakalaka'],
    array['spinach', 'fried egg'],
    jsonb_build_array(
      jsonb_build_object(
        'title', 'Cook the pap',
        'heat', 'Medium heat',
        'minutes', 10,
        'instruction', 'Whisk maize meal into simmering water, then stir often so it does not catch at the bottom.',
        'cue', 'Pap is thick, smooth, and pulls away slightly from the pot.'
      ),
      jsonb_build_object(
        'title', 'Warm the chakalaka',
        'heat', 'Low heat',
        'minutes', 5,
        'instruction', 'Warm chakalaka in a small pot, stirring every minute.',
        'cue', 'Chakalaka is bubbling gently and smells cooked through.'
      ),
      jsonb_build_object(
        'title', 'Finish the bowl',
        'heat', 'Residual heat',
        'minutes', 3,
        'instruction', 'Fold in spinach if using it, then spoon chakalaka over the pap.',
        'cue', 'Spinach is wilted but still green.'
      )
    ),
    18,
    5,
    22,
    'stove',
    'vegan',
    array['budget', 'chakalaka', 'south-african', 'vegan']
  ),
  (
    'bean-curry-and-rice',
    'Bean curry and rice',
    'A batch-friendly curry that turns pantry basics into a proper dinner.',
    array['rice', 'beans', 'tomato', 'curry powder'],
    array['onion', 'spinach', 'chilli'],
    jsonb_build_array(
      jsonb_build_object(
        'title', 'Start the rice',
        'heat', 'Medium-high heat',
        'minutes', 12,
        'instruction', 'Rinse rice, add water, bring to a boil, then cover and cook until tender.',
        'cue', 'Rice is tender and most water is absorbed.'
      ),
      jsonb_build_object(
        'title', 'Build the curry base',
        'heat', 'Medium heat',
        'minutes', 6,
        'instruction', 'Cook tomato with curry powder and a pinch of salt, stirring so the spice does not burn.',
        'cue', 'Tomato darkens slightly and the curry smells fragrant.'
      ),
      jsonb_build_object(
        'title', 'Simmer the beans',
        'heat', 'Low heat',
        'minutes', 10,
        'instruction', 'Add beans and simmer gently until the curry thickens.',
        'cue', 'Beans are hot and the sauce coats a spoon.'
      ),
      jsonb_build_object(
        'title', 'Serve',
        'heat', 'Off heat',
        'minutes', 2,
        'instruction', 'Fluff rice, spoon curry over it, and add spinach or chilli if available.',
        'cue', 'Rice is fluffed and curry sits on top without running everywhere.'
      )
    ),
    30,
    8,
    35,
    'stove',
    'vegan',
    array['batch', 'budget', 'curry', 'vegan']
  ),
  (
    'tomato-cheese-pasta',
    'Tomato cheese pasta',
    'A simple pasta bowl for nights when tomato and cheese are the only exciting things left.',
    array['pasta', 'tomato', 'cheese'],
    array['garlic', 'chilli flakes', 'spinach'],
    jsonb_build_array(
      jsonb_build_object(
        'title', 'Boil pasta',
        'heat', 'High heat',
        'minutes', 10,
        'instruction', 'Boil pasta in salted water and save a little cooking water before draining.',
        'cue', 'Pasta bends easily but still has a little bite.'
      ),
      jsonb_build_object(
        'title', 'Make sauce',
        'heat', 'Medium heat',
        'minutes', 7,
        'instruction', 'Cook chopped tomato with oil, salt, and garlic if you have it.',
        'cue', 'Tomato sauce looks glossy and slightly thicker.'
      ),
      jsonb_build_object(
        'title', 'Toss together',
        'heat', 'Low heat',
        'minutes', 3,
        'instruction', 'Add pasta, a splash of cooking water, and cheese, then toss gently.',
        'cue', 'Cheese melts into the sauce and coats the pasta.'
      )
    ),
    20,
    5,
    34,
    'stove',
    'vegetarian',
    array['pasta', 'quick', 'stove', 'vegetarian']
  ),
  (
    'spicy-peanut-noodles',
    'Spicy peanut noodles',
    'A peanut sauce noodle bowl that is cheap, filling, and easy to adjust with chilli.',
    array['noodles', 'peanut butter', 'soy sauce'],
    array['chilli', 'spring onion', 'cabbage'],
    jsonb_build_array(
      jsonb_build_object(
        'title', 'Cook noodles',
        'heat', 'High heat',
        'minutes', 5,
        'instruction', 'Boil noodles, then drain and keep a few spoons of the cooking water.',
        'cue', 'Noodles are soft enough to separate with a fork.'
      ),
      jsonb_build_object(
        'title', 'Mix sauce',
        'heat', 'No heat',
        'minutes', 3,
        'instruction', 'Stir peanut butter with soy sauce and warm noodle water until it loosens.',
        'cue', 'Sauce is smooth and pourable.'
      ),
      jsonb_build_object(
        'title', 'Coat noodles',
        'heat', 'Low heat',
        'minutes', 3,
        'instruction', 'Return noodles to the pot, add sauce, and toss gently with chilli if using.',
        'cue', 'Noodles are evenly coated and shiny.'
      )
    ),
    11,
    5,
    28,
    'stove',
    'vegan',
    array['budget', 'noodles', 'quick', 'vegan']
  ),
  (
    'chickpea-couscous-bowl',
    'Chickpea couscous bowl',
    'A quick couscous bowl using tinned chickpeas and tomato for a no-stress lunch.',
    array['couscous', 'chickpeas', 'tomato'],
    array['cucumber', 'lemon juice', 'parsley'],
    jsonb_build_array(
      jsonb_build_object(
        'title', 'Steam couscous',
        'heat', 'Kettle or microwave high',
        'minutes', 6,
        'instruction', 'Cover couscous with hot water, cover the bowl, and let it steam.',
        'cue', 'Couscous grains are fluffy and no dry patches remain.'
      ),
      jsonb_build_object(
        'title', 'Warm chickpeas',
        'heat', 'Microwave high',
        'minutes', 3,
        'instruction', 'Warm chickpeas with tomato, salt, and a small splash of oil.',
        'cue', 'Chickpeas are warm and seasoned.'
      ),
      jsonb_build_object(
        'title', 'Assemble bowl',
        'heat', 'No heat',
        'minutes', 2,
        'instruction', 'Fluff couscous with a fork, then spoon chickpeas and tomato over it.',
        'cue', 'Bowl is fluffy, warm, and not watery.'
      )
    ),
    11,
    6,
    36,
    'microwave',
    'vegan',
    array['campus', 'microwave', 'vegan']
  ),
  (
    'egg-fried-rice',
    'Egg fried rice',
    'A useful way to turn leftover rice, egg, and frozen vegetables into a proper meal.',
    array['rice', 'egg', 'frozen veg', 'soy sauce'],
    array['spring onion', 'chilli oil', 'peas'],
    jsonb_build_array(
      jsonb_build_object(
        'title', 'Fry rice',
        'heat', 'Medium-high heat',
        'minutes', 5,
        'instruction', 'Fry leftover rice with a little oil, breaking up clumps as it heats.',
        'cue', 'Rice grains separate instead of clumping together.'
      ),
      jsonb_build_object(
        'title', 'Add veg',
        'heat', 'Medium-high heat',
        'minutes', 4,
        'instruction', 'Add frozen vegetables and keep stirring so the rice does not stick.',
        'cue', 'Vegetables are hot and bright.'
      ),
      jsonb_build_object(
        'title', 'Finish with egg',
        'heat', 'Low heat',
        'minutes', 4,
        'instruction', 'Push rice aside, scramble in the egg, then toss everything with soy sauce.',
        'cue', 'Egg is set in small soft pieces and rice tastes seasoned.'
      )
    ),
    13,
    6,
    32,
    'stove',
    'vegetarian',
    array['leftovers', 'rice', 'stove', 'vegetarian']
  ),
  (
    'mince-cabbage-rice',
    'Mince cabbage rice',
    'A filling pan meal with mince, cabbage, and rice when you want dinner plus leftovers.',
    array['mince', 'cabbage', 'rice', 'tomato'],
    array['onion', 'chilli', 'carrot'],
    jsonb_build_array(
      jsonb_build_object(
        'title', 'Cook rice',
        'heat', 'Medium-high heat',
        'minutes', 12,
        'instruction', 'Cook rice first so it is ready when the mince is done.',
        'cue', 'Rice is tender and resting with the lid on.'
      ),
      jsonb_build_object(
        'title', 'Brown mince',
        'heat', 'Medium-high heat',
        'minutes', 7,
        'instruction', 'Brown mince in a pan, breaking it up with a spoon.',
        'cue', 'Mince is browned with no pink patches.'
      ),
      jsonb_build_object(
        'title', 'Simmer filling',
        'heat', 'Medium heat',
        'minutes', 8,
        'instruction', 'Add sliced cabbage and tomato, then cook until saucy.',
        'cue', 'Cabbage is soft at the edges and tomato coats the mince.'
      )
    ),
    27,
    8,
    55,
    'stove',
    'meat',
    array['batch', 'meat', 'rice', 'stove']
  ),
  (
    'microwave-mac-and-cheese',
    'Microwave mac and cheese',
    'A mug-style mac and cheese for res kitchens when you only have a microwave.',
    array['macaroni', 'milk', 'cheese'],
    array['pepper', 'mustard', 'chilli flakes'],
    jsonb_build_array(
      jsonb_build_object(
        'title', 'Cook macaroni',
        'heat', 'Microwave high',
        'minutes', 8,
        'instruction', 'Microwave macaroni with water in a large bowl, stopping to stir every few minutes.',
        'cue', 'Macaroni is just tender and most liquid is absorbed.'
      ),
      jsonb_build_object(
        'title', 'Warm milk',
        'heat', 'Microwave medium',
        'minutes', 2,
        'instruction', 'Stir in milk and microwave briefly to warm it through.',
        'cue', 'Milk is hot but not boiling over.'
      ),
      jsonb_build_object(
        'title', 'Melt cheese',
        'heat', 'Residual heat',
        'minutes', 2,
        'instruction', 'Stir in cheese until smooth, then season with pepper or chilli.',
        'cue', 'Cheese melts into a creamy sauce.'
      )
    ),
    12,
    3,
    30,
    'microwave',
    'vegetarian',
    array['comfort', 'microwave', 'quick', 'vegetarian']
  ),
  (
    'banana-oat-pancakes',
    'Banana oat pancakes',
    'A small-batch pancake option using oats, banana, and egg for breakfast or a study snack.',
    array['oats', 'banana', 'egg'],
    array['cinnamon', 'peanut butter', 'honey'],
    jsonb_build_array(
      jsonb_build_object(
        'title', 'Mix batter',
        'heat', 'No heat',
        'minutes', 4,
        'instruction', 'Mash banana, then mix with egg and oats.',
        'cue', 'Batter is thick but spoonable.'
      ),
      jsonb_build_object(
        'title', 'Cook first side',
        'heat', 'Low-medium heat',
        'minutes', 4,
        'instruction', 'Spoon small pancakes into a lightly oiled pan.',
        'cue', 'Edges look set and small bubbles appear on top.'
      ),
      jsonb_build_object(
        'title', 'Flip and finish',
        'heat', 'Low heat',
        'minutes', 3,
        'instruction', 'Flip gently and cook the second side, then serve warm.',
        'cue', 'Both sides are golden and the middle feels set.'
      )
    ),
    11,
    5,
    26,
    'stove',
    'vegetarian',
    array['breakfast', 'stove', 'vegetarian']
  )
on conflict (id) do nothing;

insert into public.campus_menu_items (
  id,
  name,
  vendor,
  category,
  price_zar,
  notes
)
values
  (
    'campus-chicken-mayo-sandwich',
    'Chicken mayo sandwich',
    'Campus Cafe',
    'Sandwiches',
    38,
    'Filling lunch option from the starter menu data.'
  ),
  (
    'campus-veg-curry-rice',
    'Veg curry and rice',
    'Upper Campus Canteen',
    'Hot meals',
    45,
    'Warm vegetarian plate with rice.'
  ),
  (
    'campus-chicken-schnitzel',
    'Chicken schnitzel plate',
    'Main Food Court',
    'Hot meals',
    68,
    'Bigger plate for days when the budget can stretch.'
  )
on conflict (id) do nothing;
