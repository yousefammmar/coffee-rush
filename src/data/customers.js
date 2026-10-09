// look: used by the procedural sprite generator. react: happy animation style.
export const CUSTOMERS = [
  { id: 'mia', name: 'Mia', intro: 1, patience: 70, tip: 1.0, react: 'hop', fav: ['iced_latte', 'iced_caramel_latte', 'latte'], bio: 'Friendly university student. Loves iced lattes.',
    look: { skin: '#f2c9a0', hair: '#8a4b2a', style: 'long', shirt: '#cb6c62', pants: '#3f4d6b', extra: 'backpack' } },
  { id: 'oliver', name: 'Oliver', intro: 1, patience: 65, tip: 0.8, react: 'nod', fav: ['espresso', 'americano'], bio: 'Office worker. Espresso, no fuss.',
    look: { skin: '#e8b88c', hair: '#2f2a2a', style: 'short', shirt: '#4d6b8a', pants: '#2c2f3a', extra: 'tie' } },
  { id: 'noah', name: 'Noah', intro: 2, patience: 85, tip: 1.1, react: 'wiggle', fav: ['cappuccino', 'latte'], bio: 'Quiet regular who enjoys cappuccino.',
    look: { skin: '#d9a273', hair: '#4a3022', style: 'beanie', shirt: '#80AE73', pants: '#4b3b30', extra: 'none' } },
  { id: 'emma', name: 'Emma', intro: 3, patience: 70, tip: 1.3, react: 'spin', fav: ['caramel_latte', 'vanilla_latte', 'hazelnut_latte', 'mocha'], bio: 'Cheerful customer with a sweet tooth.',
    look: { skin: '#f6d3b0', hair: '#e0b050', style: 'bun', shirt: '#f0a8b8', pants: '#6a5a8a', extra: 'none' } },
  { id: 'leo', name: 'Leo', intro: 3, patience: 40, tip: 0.9, react: 'bounce', fav: ['espresso', 'latte', 'americano'], bio: 'Hurried commuter. Low patience!',
    look: { skin: '#c88c62', hair: '#1f1a1a', style: 'spiky', shirt: '#e2c04a', pants: '#2c3a2c', extra: 'headphones' } },
  { id: 'henry', name: 'Henry', intro: 4, patience: 90, tip: 1.4, react: 'nod', fav: ['americano', 'espresso', 'cappuccino'], bio: 'Values traditional coffee. Patient and generous.',
    look: { skin: '#eac4a0', hair: '#cfcfcf', style: 'bald', shirt: '#7a5a3a', pants: '#3a3a44', extra: 'glasses' } },
  { id: 'sophie', name: 'Sophie', intro: 5, patience: 80, tip: 1.2, react: 'wiggle', fav: ['cappuccino', 'latte', 'vanilla_latte'], bio: 'Book lover. Appreciates a perfect cup.',
    look: { skin: '#f0c8a8', hair: '#5a2a3a', style: 'long', shirt: '#6a8a6a', pants: '#5a4a3a', extra: 'glasses' } },
  { id: 'max', name: 'Max', intro: 5, patience: 65, tip: 0.8, react: 'hop', fav: ['espresso', 'americano', 'iced_latte'], bio: 'Fitness enthusiast. Keeps it simple.',
    look: { skin: '#b97d55', hair: '#201818', style: 'short', shirt: '#3a8ac0', pants: '#202a38', extra: 'headband' } },
  { id: 'luna', name: 'Luna', intro: 6, patience: 75, tip: 1.3, react: 'spin', fav: ['mocha', 'iced_mocha', 'macchiato'], bio: 'Artist who adores mocha.',
    look: { skin: '#e8b890', hair: '#7a4ab0', style: 'long', shirt: '#2f6a5a', pants: '#3a2a4a', extra: 'scarf' } },
  { id: 'ava', name: 'Ava', intro: 7, patience: 60, tip: 1.5, react: 'bounce', fav: ['iced_caramel_latte', 'iced_mocha', 'macchiato', 'vanilla_latte'], bio: 'Social media creator who loves colourful drinks.',
    look: { skin: '#f2c9a0', hair: '#4ac0b0', style: 'bun', shirt: '#f08a5a', pants: '#2a4a6a', extra: 'none' } },
];

export const LINES = {
  greet: ['Good morning! Can I get {a} {drink}?', 'Hi there! One {drink}, please.', 'Hello! I would love {a} {drink}.', 'Could I have {a} {drink}? Thanks!', 'Hey! {Drink} for me, please.'],
  perfect: ["That's exactly how I like it!", 'Perfect! You made my day.', 'Wow, barista of the year!'],
  great: ['Thank you! This is really good.', 'Lovely, just right.'],
  good: ['Thank you! This is pretty good.', 'Not bad at all, thanks.'],
  bad: ["Oops, I don't think this is what I ordered.", 'Hmm, this is not my drink...'],
  timeout: ["Sorry, I can't wait any longer."],
};
