// Ingredient + recipe data. Adding a drink = adding one entry to RECIPES.
export const INGREDIENTS = {
  espresso: { name: 'Espresso', cost: 1, color: '#3a2216', group: 'base' },
  water: { name: 'Hot water', cost: 0, color: '#d9cfc2', group: 'base' },
  milk: { name: 'Steamed milk', cost: 1, color: '#f0dcbc', group: 'milk' },
  foam: { name: 'Milk foam', cost: 1, color: '#fbf3e4', group: 'milk' },
  chocolate: { name: 'Chocolate', cost: 1, color: '#4a2a1c', group: 'syrup' },
  vanilla: { name: 'Vanilla', cost: 1, color: '#efd68a', group: 'syrup' },
  caramel: { name: 'Caramel', cost: 1, color: '#c98a3e', group: 'syrup' },
  hazelnut: { name: 'Hazelnut', cost: 1, color: '#a8662f', group: 'syrup' },
  ice: { name: 'Ice', cost: 0, color: '#dff1f5', group: 'ice' },
  whip: { name: 'Whipped cream', cost: 1, color: '#fffaf0', group: 'topping' },
  cinnamon: { name: 'Cinnamon', cost: 1, color: '#9a5a2a', group: 'topping' },
  choc_powder: { name: 'Choc. powder', cost: 1, color: '#5a331f', group: 'topping' },
  caramel_drizzle: { name: 'Caramel drizzle', cost: 1, color: '#e0a04a', group: 'topping' },
};

// First day the station for an ingredient is available.
export const STATION_UNLOCK_DAY = {
  espresso: 1, milk: 1, water: 2, caramel: 3, ice: 4, foam: 5, vanilla: 6,
  chocolate: 7, hazelnut: 8, whip: 9, caramel_drizzle: 9, cinnamon: 10, choc_powder: 10,
};

export const LIQUID_GROUPS = ['base', 'milk', 'syrup'];
export const CUP_CAPACITY = 8; // liquid units

export const RECIPES = [
  { id: 'espresso', name: 'Espresso', price: 5, unlockDay: 1, iced: false, ingredients: { espresso: 1 }, sequence: [], blurb: 'A single, strong shot.' },
  { id: 'latte', name: 'Latte', price: 8, unlockDay: 1, iced: false, ingredients: { espresso: 1, milk: 1 }, sequence: ['espresso', 'milk'], blurb: 'Espresso topped with silky steamed milk.' },
  { id: 'americano', name: 'Americano', price: 6, unlockDay: 2, iced: false, ingredients: { espresso: 1, water: 1 }, sequence: ['espresso', 'water'], blurb: 'Espresso stretched with hot water.' },
  { id: 'caramel_latte', name: 'Caramel Latte', price: 11, unlockDay: 3, iced: false, ingredients: { espresso: 1, milk: 1, caramel: 1 }, sequence: ['espresso', 'milk'], blurb: 'A latte with a swirl of caramel.' },
  { id: 'iced_latte', name: 'Iced Latte', price: 10, unlockDay: 4, iced: true, ingredients: { espresso: 1, milk: 1, ice: 1 }, sequence: ['espresso', 'milk'], blurb: 'Cold, creamy and refreshing.' },
  { id: 'cappuccino', name: 'Cappuccino', price: 9, unlockDay: 5, iced: false, ingredients: { espresso: 1, milk: 1, foam: 1 }, sequence: ['espresso', 'milk', 'foam'], blurb: 'Espresso, milk, then a cloud of foam.' },
  { id: 'iced_caramel_latte', name: 'Iced Caramel Latte', price: 12, unlockDay: 6, iced: true, ingredients: { espresso: 1, milk: 1, caramel: 1, ice: 1 }, sequence: ['espresso', 'milk'], blurb: 'Sweet caramel over ice.' },
  { id: 'vanilla_latte', name: 'Vanilla Latte', price: 10, unlockDay: 6, iced: false, ingredients: { espresso: 1, milk: 1, vanilla: 1 }, sequence: ['espresso', 'milk'], blurb: 'Smooth vanilla comfort.' },
  { id: 'mocha', name: 'Mocha', price: 10, unlockDay: 7, iced: false, ingredients: { espresso: 1, milk: 1, chocolate: 1 }, sequence: ['espresso', 'milk'], blurb: 'Coffee meets chocolate.' },
  { id: 'hazelnut_latte', name: 'Hazelnut Latte', price: 11, unlockDay: 8, iced: false, ingredients: { espresso: 1, milk: 1, hazelnut: 1 }, sequence: ['espresso', 'milk'], blurb: 'Toasty, nutty and sweet.' },
  { id: 'iced_mocha', name: 'Iced Mocha', price: 12, unlockDay: 8, iced: true, ingredients: { espresso: 1, milk: 1, chocolate: 1, ice: 1 }, sequence: ['espresso', 'milk'], blurb: 'Chocolatey and chilled.' },
  { id: 'macchiato', name: 'Deluxe Macchiato', price: 14, unlockDay: 9, iced: false, ingredients: { espresso: 1, foam: 1, caramel_drizzle: 1 }, sequence: ['espresso', 'foam', 'caramel_drizzle'], blurb: 'Foam-marked espresso finished with caramel.' },
];

export const recipeById = (id) => RECIPES.find((r) => r.id === id);
export const syrupKeyOf = (r) => Object.keys(r.ingredients).find((k) => INGREDIENTS[k].group === 'syrup');

// Special requests: `mod` adds to the required quantities.
export const SPECIALS = [
  { id: 'extra_syrup', minDay: 3, applies: (r) => !!syrupKeyOf(r), mod: (r) => ({ [syrupKeyOf(r)]: 1 }), label: (r) => `Extra ${INGREDIENTS[syrupKeyOf(r)].name.toLowerCase()}`, extraPrice: 1 },
  { id: 'extra_ice', minDay: 4, applies: (r) => r.iced, mod: () => ({ ice: 1 }), label: () => 'Extra ice', extraPrice: 0 },
  { id: 'extra_shot', minDay: 6, applies: (r) => !!r.ingredients.espresso, mod: () => ({ espresso: 1 }), label: () => 'Extra shot', extraPrice: 2 },
  { id: 'add_cinnamon', minDay: 10, applies: (r) => !r.iced && r.id !== 'espresso', mod: () => ({ cinnamon: 1 }), label: () => 'Sprinkle of cinnamon', extraPrice: 1 },
  { id: 'add_whip', minDay: 10, applies: (r) => !r.iced && !!r.ingredients.milk, mod: () => ({ whip: 1 }), label: () => 'Whipped cream on top', extraPrice: 2 },
  { id: 'add_choc_powder', minDay: 10, applies: (r) => !!r.ingredients.foam || !!r.ingredients.milk, mod: () => ({ choc_powder: 1 }), label: () => 'Chocolate powder', extraPrice: 1 },
];
