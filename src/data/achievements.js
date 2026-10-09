export const ACHIEVEMENTS = [
  { id: 'first_cup', name: 'First Cup', desc: 'Serve your first customer.', check: (d) => d.stats.served >= 1 },
  { id: 'perfect_barista', name: 'Perfect Barista', desc: 'Complete 10 perfect orders.', check: (d) => d.stats.perfect >= 10 },
  { id: 'coffee_lover', name: 'Coffee Lover', desc: 'Serve 100 drinks.', check: (d) => d.stats.served >= 100 },
  { id: 'rush_hero', name: 'Rush Hour Hero', desc: 'Serve 8 customers in a row without a mistake.', check: (d) => d.stats.bestStreak >= 8 },
  { id: 'golden_beans', name: 'Golden Beans', desc: 'Earn 1,000 coins in total.', check: (d) => d.stats.earnedTotal >= 1000 },
  { id: 'cafe_legend', name: 'Café Legend', desc: 'Achieve a five-star daily rating.', check: (d) => d.stats.bestStars >= 5 },
  { id: 'shopper', name: 'Upgrade!', desc: 'Buy your first equipment upgrade.', check: (d) => Object.values(d.upgrades).some((l) => l > 0) },
  { id: 'designer', name: 'Interior Designer', desc: 'Buy a café decoration.', check: (d) => d.decor.owned.length > 0 },
  { id: 'full_menu', name: 'Full Menu', desc: 'Unlock every recipe.', check: (d) => d.unlockedRecipes.length >= 12 },
];
