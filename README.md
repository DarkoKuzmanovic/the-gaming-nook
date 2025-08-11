# The Gaming Nook

Simple, in-memory multiplayer game platform. Each game is fully isolated and kept minimal on purpose. Current games:
- Connect 4 (fully playable)
- Vetrolisci (Pixies) card game

## Features
- Two-player rooms with 6‑char room codes
- Real-time sync with Socket.IO
- React + Vite front-end, Express back-end
- In-memory storage (no database)
- Clean, responsive UI

## Tech Stack
- Client: React 18, Vite
- Server: Node.js + Express + Socket.IO
- Build/Dev: Vite, concurrently

## Quick Start
Prerequisites: Node.js 16+

Install and run both client and server:
```bash
npm install
npm run dev
```
- Client: http://localhost:5173
- Server: http://localhost:8001 (health: GET /api/health)

Individual scripts:
```bash
npm run server   # start Express + Socket.IO
npm run client   # start Vite dev server
npm run build    # production build (client)
npm run preview  # preview production build
```

## Project Structure
```
src/
├── App.jsx, App.css              # App shell and views
├── shared/                       # Shared client/server utils
│   └── server/main.js            # Express + Socket.IO entry
└── games/
    ├── connect4/                 # Isolated game
    │   ├── client/components/
    │   ├── server/
    │   └── shared/
    └── vetrolisci/               # Isolated game
        ├── client/components/
        ├── server/
        └── shared/
```

## Architecture (High Level)
- One Express + Socket.IO server manages rooms and events
- Each game registers its own server logic and client UI
- Rooms and players are stored in memory (cleared on restart)

Server entry and ports are defined in:
- src/shared/server/main.js (PORT 8001, health endpoint)

## Multiplayer Flow
1) Create room → Share code
2) Second player joins → Game starts
3) Leave room → Return to menu

Tip for testing: open two browser windows and join the same room code.

## Add a New Game (keep it simple)
1) Create folder: src/games/yourgame/{client,server,shared}
2) Client: add a GameBoard component and any needed UI
3) Server: expose socket event handlers for your game
4) Register the game in the app menu/selection and wire up routing
5) Keep logic self‑contained; share only minimal utilities

## Useful Docs
- Frontend overview: frontend-guide.md
- Vetrolisci rules: vetrolisci-ruleset.md

## License
MIT — see LICENSE

## Author
Darko Kuzmanovic