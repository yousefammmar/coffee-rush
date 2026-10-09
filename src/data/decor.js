// Café customization. Every option is drawn in art/cafeArt.js.
// `free` items are owned from the start.
export const DECOR_CATEGORIES = [
  { id: 'theme', name: 'Theme', items: [
    { id: 'classic', name: 'Classic Espresso', price: 0, desc: 'Warm cream walls, espresso wood.', palette: { wall: '#EAD3AE', wallDark: '#D8BC92', trim: '#674735', floorA: '#9b6a47', floorB: '#8a5b3b', counter: '#C68B59', counterDark: '#8a5a37', accent: '#CB6C62' } },
    { id: 'forest', name: 'Cozy Forest', price: 160, desc: 'Mossy greens and dark timber.', palette: { wall: '#BFD0B2', wallDark: '#A6BC98', trim: '#4a3526', floorA: '#7a5638', floorB: '#6a4a30', counter: '#7b5a3c', counterDark: '#553c27', accent: '#52735D' } },
    { id: 'sunset', name: 'Sunset Bakery', price: 200, desc: 'Peach walls and golden light.', palette: { wall: '#F4C9A8', wallDark: '#E5AF8A', trim: '#8a4f3a', floorA: '#b8805a', floorB: '#a67048', counter: '#E3A56C', counterDark: '#A9693D', accent: '#EDC56D' } },
  ] },
  { id: 'wall', name: 'Wall colour', items: [
    { id: 'theme', name: 'Theme colour', price: 0, desc: 'Use the theme wall.' },
    { id: 'sage', name: 'Sage', price: 40, color: '#C3D2B0', dark: '#AABE96' },
    { id: 'rose', name: 'Dusty rose', price: 40, color: '#EAC1B8', dark: '#D8A89E' },
    { id: 'sky', name: 'Sky blue', price: 40, color: '#C4DCE6', dark: '#A9C6D4' },
  ] },
  { id: 'floor', name: 'Floor', items: [
    { id: 'planks', name: 'Wood planks', price: 0, desc: 'Classic planks.' },
    { id: 'checker', name: 'Checker tiles', price: 60, desc: 'Cream & brown diner tiles.' },
    { id: 'herring', name: 'Herringbone', price: 80, desc: 'Tight wooden herringbone.' },
  ] },
  { id: 'counter', name: 'Counter', items: [
    { id: 'wood', name: 'Wood bar', price: 0, desc: 'Vertical wood panels.' },
    { id: 'marble', name: 'Marble top', price: 80, desc: 'Pale marble counter top.' },
    { id: 'stripe', name: 'Striped front', price: 100, desc: 'Cream & coral stripes.' },
  ] },
  { id: 'plants', name: 'Plants', items: [
    { id: 'few', name: 'A little green', price: 0, desc: 'One plant.' },
    { id: 'some', name: 'Plant corner', price: 50, desc: 'Plants on shelf and floor.' },
    { id: 'jungle', name: 'Jungle café', price: 90, desc: 'Hanging vines everywhere.' },
  ] },
  { id: 'lights', name: 'Lights', items: [
    { id: 'none', name: 'Ceiling spots', price: 0, desc: 'Simple lights.' },
    { id: 'bulbs', name: 'Edison bulbs', price: 70, desc: 'Warm hanging bulbs.' },
    { id: 'lanterns', name: 'Paper lanterns', price: 110, desc: 'Glowing paper lanterns.' },
  ] },
  { id: 'posters', name: 'Posters', items: [
    { id: 'none', name: 'Bare wall', price: 0, desc: 'No posters.' },
    { id: 'coffee', name: 'Coffee art', price: 45, desc: 'Two latte-art frames.' },
    { id: 'botanical', name: 'Botanical prints', price: 55, desc: 'Leafy prints.' },
  ] },
  { id: 'windows', name: 'Window', items: [
    { id: 'none', name: 'Plain window', price: 0, desc: 'Bright and open.' },
    { id: 'curtains', name: 'Curtains', price: 60, desc: 'Cozy cloth curtains.' },
    { id: 'fairy', name: 'Fairy lights', price: 80, desc: 'Twinkling window lights.' },
  ] },
  { id: 'machine', name: 'Machine skin', items: [
    { id: 'steel', name: 'Brushed steel', price: 0, desc: 'The original look.' },
    { id: 'copper', name: 'Copper', price: 90, desc: 'Vintage copper finish.' },
    { id: 'mint', name: 'Retro mint', price: 90, desc: 'Pastel retro mint.' },
  ] },
  { id: 'furniture', name: 'Furniture', items: [
    { id: 'stools', name: 'Bar stools', price: 0, desc: 'Wooden stools.' },
    { id: 'booth', name: 'Cozy bench', price: 120, desc: 'Upholstered bench seat & table.' },
  ] },
];
export const DECOR_DEFAULTS = { theme: 'classic', wall: 'theme', floor: 'planks', counter: 'wood', plants: 'few', lights: 'none', posters: 'none', windows: 'none', machine: 'steel', furniture: 'stools' };
export const decorItem = (cat, id) => DECOR_CATEGORIES.find((c) => c.id === cat)?.items.find((i) => i.id === id);
