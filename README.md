# ☕ Coffee Rush

A cozy pixel-art coffee-shop game for the browser. Take orders, make drinks by hand (grind, brew, steam, pour, add syrups, ice and toppings), serve them before customers lose patience, earn coins and tips, then upgrade and decorate your café across an open-ended series of business days.

Built with **Phaser 3 + Vite**. Everything (pixel art, animation, sound, music) is generated in code, so there are no asset downloads and the game runs offline once loaded.

## Run it

```bash
npm install
npm run dev        # play at http://localhost:5173
npm test           # unit tests (vitest)
npm run build      # production build -> dist/
npm run preview    # serve the production build
```

## How to play

1. **Click a customer's speech bubble** to take their order. A ticket appears at the bottom of the screen.
2. **Click the espresso machine** (or press **Space**, or click a ticket) to open the Preparation Station.
3. **Make the drink.** Press *Grind*, then *Brew* for espresso. **Hold** *Steam* until its bar fills, then *Pour milk* or *Pour foam* (one steam = two pours). Add hot water, chocolate, syrups, ice and toppings as the ticket asks. Espresso goes in first.
4. Press **Serve**. The drink is scored 0–100 and the customer pays (plus a tip) or leaves unhappy.
5. After each day, spend coins in the **Shop** (equipment upgrades + café decor), check the **Recipe Book** and **Achievements**, then start the next day.

The first New Game starts with a short guided, playable tutorial (also available from *How to Play*).

### Controls

| Action | Mouse / touch | Keyboard |
|---|---|---|
| Take order / open prep | click bubble / ticket / machine | Space |
| Prep buttons | click / tap (hold Steam) | shortcut letter printed on each button (G B S M F W C I V A H 1-4), R restart, Enter serve |
| Back to café | Back button | Esc |
| Pause | II button | Esc (café) |

Timers (customer patience, brewing, the business clock) freeze while paused, when the tab is hidden, or when a phone is held in portrait.

## Rules

- **Patience**: starts when a customer reaches their spot in line, drains for everyone waiting (queued customers lose patience too), and keeps draining while you are in the prep station. Bar goes green → yellow → red and the seconds are shown as a number. Pausing freezes everything. All timing runs off one central clock (`DayRun.update`), not per-customer timers.
- **Scoring (0–100)**: ingredients 45, quantities 20, order of steps 15, special request 10, speed 10. Perfect 90+, Great 75+, Acceptable 50+, otherwise Incorrect. A missing ingredient caps the score at 49 (never a success), an extra ingredient at 74, wrong quantities at 89 (one) / 74 (several). Incorrect drinks pay nothing and the explanation says what was wrong.
- **Economy**: you start with 100 coins. Sales + tips are revenue; each ingredient has a small cost (net profit = revenue − expenses). Balance can never go negative. Acceptable pays 70%, Perfect/Great pay full price, tips scale with quality, customer generosity, Premium Beans and reputation, and rush-hour combos (3+ good drinks in a row) add a bonus.
- **Mastery**: every 5/15/30 good drinks of a recipe adds +1 coin to that drink's price.
- **Days**: 1 First Brew (espresso, latte) · 2 americano · 3 caramel + special requests · 4 ice · 5 foam/cappuccino + first rush hour (larger queue) · 6 vanilla, iced caramel, extra shots · 7 chocolate/mocha · 8 hazelnut, iced mocha · 9 toppings + deluxe macchiato · 10+ toppings as special requests and an endless scaling curve (more customers, higher targets, rush hours).
- **Stars**: from satisfaction (average of customer reactions), minus one star if the earnings target is missed. Five stars only count toward *Café Legend* from Day 5 on.

## Features

Main menu with Continue / New Game (with overwrite confirmation) · loading screen with real progress · guided tutorial · 2D animated café with day-to-night lighting · 10 customers (distinct look, patience, tipping, favourite drinks, reaction animation) · 12 recipes driven by data · special requests · rush hours with faster music · 10 equipment upgrades that all change gameplay · 3 décor themes + 9 customization categories that are drawn in the world · recipe book with mastery · 9 achievements · results screen with animated counters and star reveal · settings (volumes, mute, reduced motion, game speed, fullscreen, reset save) · versioned autosave · synthesized music and sound effects · keyboard, mouse and touch support, landscape layout with a rotate hint for portrait phones.

### Upgrade effects

Espresso Machine −20% brew time/level · Better Grinder −35% grind time/level · Automated Grinding skips the grind step · Milk Steamer −20% steam time/level · Premium Beans +20% tips/level · Counter Expansion +1 queue slot/level · Cozy Decorations +8% patience/level · Premium Cups +1 coin per drink/level · Prep Tray Slots +1 simultaneous accepted order/level (starts at 2) · Efficient Equipment −25% ingredient cost/level.

## Saving

Saved to `localStorage` (`coffeerush.save`, schema version 2 with a v1→v2 migration and validation of every field; a corrupted save falls back to a fresh game). Progress is saved **at the end of each day and after every purchase/equip**. Quitting in the middle of a day restarts that day when you continue (so you can't bank partial earnings). Settings are saved immediately.

## Project structure

```
src/
  main.js                 entry: Phaser boot, audio unlock, rotate-pause
  game/
    config.js state.js    Phaser config; central state manager + state machine (States)
    CafeWorld.js          shared café environment (sky, lighting, plants, menu board)
    CustomerView.js       customer sprite / patience bar / speech bubble / reactions
    scenes/               Boot, Preload, Menu, Tutorial, Cafe, Preparation, Results, Shop
  systems/                pure game rules (no rendering): Recipe, Order, Customer (DayRun),
                          Economy, Progression, Achievement, Save, Audio
  data/                   recipes, customers, upgrades, achievements, progression, decor
  art/                    procedural pixel art: characters, cup, café, icons, textures
  ui/                     HUD, OrderTicket, DialogBox, GameButton (Phaser) + Modal, screens (DOM)
  styles/main.css
tests/                    vitest unit tests for the rules
```

Add a drink by adding one entry to `src/data/recipes.js`; add a customer in `src/data/customers.js`; the rest (scoring, ticket, recipe book, spawn) picks them up.

## Testing

`npm test` covers recipe validation and scoring, earnings and tips, upgrade purchases and effects, progression/unlocks, patience and pause behaviour, save serialization, migration and corruption handling, and achievement tracking.

End-to-end behaviour (new game → tutorial → order → correct/incorrect drink → payment → patience draining → pause freezing timers → completing Day 1 → buying an upgrade → upgrade effect → Continue restores the save → phone-sized landscape viewport → no console errors) was exercised by driving the game in a browser during development; there is no automated browser test suite in the repo.

## Design decisions & known limits

- Art, music and sound are procedural. Sprites are front-facing (no separate side-view walk cycle). Audio is synthesized, so it is simple rather than studio quality.
- Cup type (mug/glass) is chosen by the recipe, not by the player; "Premium serving cups" is a price upgrade, not a different sprite.
- One steam gives two pours (milk or foam) to keep prep brisk.
- Phaser text is rendered into a 960×540 canvas that is scaled to fit, so text is slightly soft on very large displays.
- Portrait phones show a rotate hint instead of a portrait layout.
- Window title/tab visibility pauses the game automatically.

## Deploying

`npm run build` outputs a static site to `dist/` (relative asset paths, so it works from any sub-path). Any static host works (Netlify, Vercel, Cloudflare Pages, S3). A GitHub Pages workflow is included in `.github/workflows/deploy.yml`: it runs the tests, builds, and deploys on every push to `main`.
