# Copilot Instructions for Vetrolisci

## Project Overview

Vetrolisci is a real-time multiplayer card game implementation of Pixies. It's a React frontend + Node.js backend with Socket.IO for real-time communication. Players place cards in a 3x3 grid across 3 rounds with complex scoring rules.

## Architecture Patterns

### ES Modules Throughout

- Use `import`/`export` syntax everywhere - `package.json` has `"type": "module"`
- Server uses ES modules: `import express from 'express'`
- Client uses ES modules: `import React from 'react'`

### State Management Pattern

- **Server**: Authoritative game state in `Map()` collections in `server.js`
- **Client**: React state + localStorage caching via `gameStateCache.js`
- **Sync**: Socket.IO events bridge server-client state
- Always trust server state over client predictions

### Game Logic Separation

The game logic is modularized in `src/game/`:

- `placement.js` - Card placement validation with 3 scenarios: empty/face-down, duplicate, validated
- `scoring.js` - Complex scoring: validated numbers + symbols + color zones
- `validation.js` - Card validation rules and adjacency checks
- `draft.js` - Turn-based card picking mechanics

### Service Layer Pattern

Key services in `src/services/`:

- `socket.js` - Socket.IO wrapper with dynamic server URL detection
- `audio.js` - Audio management with browser autoplay handling
- `gameStateCache.js` - localStorage persistence with 30min expiry
- `imagePreloader.js` - Preloads all 70 card images on app start

## Key Development Workflows

### Development Commands

```bash
npm run dev        # Starts both server (8001) and client (5173) concurrently
npm run server     # Server only with nodemon
npm run client     # Vite dev server only
```

### Card System

- 70-card deck defined in `src/data/cards.js` with id, value, color, scoring, special
- Images: `public/cards/fronts/{color}-{value}.png` with variants like `-alt`, `-special`
- Use `CARDS` array for game logic, image paths auto-resolve from card properties

### Socket.IO Event Patterns

Client → Server: `join-game`, `pick-card`, `place-card`
Server → Client: `game-started`, `card-picked-and-placed`, `round-complete`, `game-complete`

Always emit with error handling and validate server responses.

## Component Patterns

### Modal System

All modals follow the pattern:

```jsx
{
  showModal && <Modal onClose={() => setShowModal(false)} />;
}
```

Common modals: `CardChoiceModal`, `PlacementChoiceModal`, `RoundCompleteModal`

### Card Placement Logic

Use `placement.js` functions:

- `determinePlacementScenario(card, grid)` - Returns placement type
- `getValidPlacementPositions(card, grid)` - Returns valid positions array
- Three scenarios: empty/face-down (place on card.value-1), duplicate (choice dialog), validated (any empty)

### Lazy Loading Pattern

Cards use `LazyImage` component with `SkeletonLoader` fallback:

```jsx
<LazyImage src={imagePath} fallback={<SkeletonLoader />} />
```

### Audio Integration

```javascript
import audioService from "./services/audio";
audioService.playSound("play_card"); // For SFX
audioService.toggleMusic(); // For background music
```

## Critical Implementation Details

### Grid Indexing

- 3x3 grid uses 0-8 indices (top-left to bottom-right)
- Card values 1-9 map to preferred positions 0-8 (value-1)
- Grid state: `[null, cardObj, null, ...]` where cardObj has `{faceUp, validated, ...cardData}`

### Scoring Complexity

Use `calculatePlayerScore(grid, currentRound)` from `scoring.js`:

- Validated numbers: sum of face-up validated card values
- Symbols: scoring property from ALL face-up cards (+1 spiral, -1 cross)
- Color zones: largest connected same-color group × round multiplier (2x/3x/4x)

### Real-time Sync

- Server state is authoritative
- Client maintains optimistic state but reconciles on server events
- Use `gameStateCache` for persistence across browser refreshes
- Handle disconnections gracefully with reconnection logic

### Performance Considerations

- Preload all card images on app start
- Use React.memo for expensive components
- Debounce rapid state updates
- Lazy load non-critical components

## Common Gotchas

- Always use absolute imports for services: `import audioService from './services/audio'`
- Socket.IO server URL detection handles localhost vs network deployment
- Card validation requires checking both value existence and validated status
- Color zone calculation needs flood-fill algorithm for connected components
