# Mini-Motorways Clone

A JavaScript clone of the game *Mini-Motorways*.

## Live Demo
You can try out the live demo [here](https://nawab-as.github.io/mini-motorways)!


## Features

All of the core Mini-Motorways gameplay mechanics:
- Houses that generate cars to deliver orders
- Stores that receive orders from houses
- Road building and editing system
- Dynamic pathfinding for cars using A* algorithm
- Order management with warning system
- Score tracking and high score persistence
- Procedurally generated levels
- Game over condition when stores are overwhelmed


## How to Play

- Connect houses to stores by building roads
- Cars will automatically spawn from houses and deliver orders to stores
- Each house can spawn up to 2 cars at a time
- Click "Edit Roads" to add or remove roads from your network
- Stores with more than 5 orders turn red with a countdown timer
- If a store stays red for 30 seconds, you lose
- Complete orders to earn points and beat your high score


## Installation

### Requirements
- A modern web browser (Chrome, Firefox, Safari, or Edge)
- Local development server

1. Clone this repository with git:
```bash
git clone https://github.com/Nawab-AS/mini-motorways.git
cd ./mini-motorways
```

2. Host using any web server

Since this is a static web page, you can host it with any web server. For example, using Python's built-in HTTP server:
```bash
python -m http.server -p 3000
```
Then visit `http://localhost:3000` in your browser

Alternatively, you can use Node.js http-server:
```bash
npx http-server -p 3000
```


## Tech Stack

- **Kaplay.js** - Game framework for rendering and game loop
- **Javascript**

All assets were inspired by the real game but were created by me.
