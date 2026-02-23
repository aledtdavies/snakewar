# SnakeWar

A neon-infused, massively-scaled browser arcade game built in vanilla HTML5, CSS, and JavaScript. 

In SnakeWar, you must eat to survive, grow, and dominate the arena. The simple rule is: **Bigger snakes eat smaller snakes!** Keep moving, avoid larger enemies, outmaneuver smaller ones, and use power-ups to tip the scales in your favor.

## Features

- **Massive Arena**: The game board scales up automatically each time you reach a new level!
- **AI Bots**: Challenge up to 30 bot-controlled snakes that roam the arena.
- **Dynamic Growth**: Eat glowing orbs or the remains of your enemies to grow.
- **Power-Ups**:
  - **Shield (⛨)**: Prevents you from dying if you collide with a bigger snake.
  - **Magnet (🧲)**: Pulls nearby food towards you.
  - **Star (★)**: Grants temporary invincibility—collide with anyone to instantly destroy them.
- **Boost Mechanics**: Hold `Space` or left-click to trade length for speed and execute aggressive maneuvers.
- **Responsive UI**: Works seamlessly on desktop and mobile browsers, equipped with an on-screen mini-map to track nearby opponents!

## Setup

No complicated build systems, bundlers, or frameworks! SnakeWar runs completely natively in any modern web browser.

1. Clone or download this repository.
2. Open `index.html` directly in your browser.
3. *Optional*: Serve the directory using a simple local web server (e.g. `npx serve` or `python -m http.server`) if you want to prevent CORS warnings or run it on your local network.

## How to Play

1. **Controls**:
   - **Steer**: Simply move your mouse (or touch the screen). Your snake will follow the pointer.
   - **Boost**: Hold `Space`, left-click your mouse, or press the mobile boost button to sprint. *Warning: Boosting drains your length steadily!*
   - **Pause**: Press `P` or `ESC` during gameplay.
2. **Rules**:
   - Touch a snake that is **bigger** than you head-on, and you die!
   - Touch a snake that is **smaller** than you head-on, and they die!
   - Unlike classic snake, colliding with another snake's body doesn't kill you unless you hit their head.
3. Eat food to grow larger and conquer the arena. Expand your level to face more challenging crowds.

## Tech Stack

- **HTML5 Canvas** for rendering
- **Vanilla JavaScript** (ES6 Modules) for game logic and physics
- **CSS3** for UI, styling, and glassmorphic menus
