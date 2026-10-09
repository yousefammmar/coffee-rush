// Each upgrade: levels[i] = cost of reaching level i+1. Effects are computed in EconomySystem.upgradeEffects.
export const UPGRADES = [
  { id: 'espresso', name: 'Espresso Machine', desc: 'A faster, hotter machine.', benefit: 'Brewing 20% faster per level', costs: [120, 200, 320] },
  { id: 'grinder', name: 'Better Grinder', desc: 'Sharper burrs.', benefit: 'Bean grinding 35% faster per level', costs: [90, 150] },
  { id: 'autogrind', name: 'Automated Grinding', desc: 'Beans are ground automatically.', benefit: 'Brewing skips the manual grind step', costs: [220] },
  { id: 'steamer', name: 'Milk Steamer', desc: 'Stronger steam wand.', benefit: 'Milk steaming 20% faster per level', costs: [110, 180, 280] },
  { id: 'beans', name: 'Premium Beans', desc: 'Customers notice the flavour.', benefit: 'Tips +20% per level', costs: [150, 250, 350] },
  { id: 'queue', name: 'Counter Expansion', desc: 'More space to wait.', benefit: 'Queue holds +1 customer per level', costs: [180, 300] },
  { id: 'decor', name: 'Cozy Decorations', desc: 'A warm, relaxing mood.', benefit: 'Customer patience +8% per level', costs: [75, 140, 210] },
  { id: 'cups', name: 'Premium Serving Cups', desc: 'Handsome ceramic cups.', benefit: 'Every drink sells for +1 coin per level', costs: [200, 360] },
  { id: 'tray', name: 'Prep Tray Slots', desc: 'More room for open orders.', benefit: 'Accept +1 simultaneous order per level', costs: [130, 230, 330] },
  { id: 'efficiency', name: 'Efficient Equipment', desc: 'Less waste, lower costs.', benefit: 'Ingredient costs -25% per level', costs: [160, 280] },
];
export const upgradeById = (id) => UPGRADES.find((u) => u.id === id);
