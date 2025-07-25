# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Vetrolisci - Digital Pixies Card Game

## Project Overview

Vetrolisci is a real-time multiplayer implementation of the Pixies card game for 2 players. Players strategically place cards in a 3x3 grid across 3 rounds, with scoring based on validated card numbers, symbols, and color zones.

## Architecture

### Frontend (React + Vite)
- **Entry Point**: `src/main.jsx` → `src/App.jsx`
- **Components**: React components in `src/components/`
- **Game Logic**: Client-side game logic in `src/game/`
- **Real-time Communication**: Socket.IO client in `src/services/socket.js`

### Backend (Node.js + Express)
- **Entry Point**: `server.js` - handles both HTTP and WebSocket connections
- **Game State**: In-memory storage using Maps for games and players
- **Real-time Features**: Socket.IO for live multiplayer functionality
- **Card System**: 70-card deck defined in `src/data/cards.js`

### Key Game Systems
- **Draft Phase**: `src/game/draft.js` - card picking mechanics
- **Placement Logic**: `src/game/placement.js` - card placement validation
- **Scoring Engine**: `src/game/scoring.js` - complex scoring with validated cards, symbols, and color zones
- **Validation**: `src/game/validation.js` - card validation rules

## Development Commands

```bash
# Install dependencies
npm install

# Start both server and client concurrently
npm run dev

# Run only server (backend on port 8001)
npm run server

# Run only client (frontend on port 5173)
npm run client

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Type checking
npm run typecheck
```

## Game Rules Implementation

Complete rules are in `vetrolisci-ruleset.md`. Key mechanics:

### Card Placement Scenarios
1. **Empty/Face-down**: Place on corresponding number position (value-1 index)
2. **Duplicate**: Player chooses which card stays face-up, other goes face-down underneath  
3. **Validated**: Must place face-down on any empty space

### Scoring Components
- **Validated Numbers**: Sum of face-up validated card values
- **Symbols**: +1 spiral, -1 cross, special card bonuses
- **Color Zones**: Largest connected color group × round multiplier (2x/3x/4x)

## Socket.IO Events

### Client → Server
- `join-game` - Join matchmaking with player name
- `pick-card` - Pick card during draft phase
- `place-card` - Place card on grid

### Server → Client  
- `game-joined` - Successful game join with gameId and playerIndex
- `game-started` - Game begins with 2 players
- `card-picked-and-placed` - Card picked and automatically placed
- `round-complete` - Round ended with scores
- `game-complete` - Game finished after 3 rounds

## Project Structure

```
src/
├── components/          # React UI components
│   ├── GameBoard.jsx   # Main game container
│   ├── GameGrid.jsx    # 3x3 card grid display
│   ├── DraftPhase.jsx  # Draft/pick phase UI
│   ├── Card.jsx        # Individual card component
│   └── ScoreBoard.jsx  # Score tracking
├── game/               # Game logic modules
│   ├── draft.js        # Draft phase mechanics
│   ├── placement.js    # Card placement logic
│   ├── scoring.js      # Scoring calculations
│   └── validation.js   # Card validation rules
├── data/
│   └── cards.js        # 70-card game deck
└── services/
    └── socket.js       # Socket.IO client wrapper
```

## Development Notes

- Game state is managed server-side with real-time sync to clients
- Cards have automatic reveal/placement for faster gameplay
- Player grids are 9-element arrays (0-8 indices mapping to grid positions 1-9)
- Vite dev server proxies `/socket.io` to backend on port 8001
- Uses concurrently to run both frontend and backend in development

## Game Assets

Card images are in `public/cards/fronts/` with naming pattern: `{color}-{value}.png` or `{color}-{value}-alt.png`