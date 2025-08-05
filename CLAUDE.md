# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# The Gaming Nook - Multiplayer Gaming Platform

## Project Overview

**The Gaming Nook** is a multiplayer gaming platform with isolated game architecture, currently featuring **Vetrolisci** (a Pixies card game implementation) as the primary game. The platform uses a fresh, simplified architecture starting from a clean foundation while preserving proven game logic from legacy implementations.

## Recent Development History

### Major Revamp (Current Implementation)
- **Started fresh** with clean isolated architecture after legacy multiplayer issues
- **Preserved working game logic** from `/legacy/` folder containing proven Vetrolisci implementation
- **Isolated game system**: Each game in `/client/games/` and `/server/games/` is self-contained
- **Simple tech stack**: React + Vite (frontend) + Express + Socket.IO (backend) - no complex frameworks or databases

### Frontend (React + Vite + ES Modules)
- **Entry Point**: `client/main.jsx` → `client/App.jsx`
- **State Management**: React state with localStorage persistence via `gameStateCache`
- **Components**: Comprehensive React component library in `client/components/`
- **Game Logic**: Client-side game logic in `client/games/`
- **Services**: Modular services for audio, caching, image preloading, and socket communication
- **Real-time Communication**: Socket.IO client wrapper in `client/services/socket.js`

### Backend (Node.js + Express + ES Modules)
- **Entry Point**: `server/main.js` - handles both HTTP and WebSocket connections
- **Module System**: Full ES module support with `"type": "module"` in package.json
- **Game State**: In-memory storage using Maps for games and players
- **Real-time Features**: Socket.IO for live multiplayer functionality
- **Card System**: 70-card deck with image mapping in `client/games/vetrolisci/cards.js`

### Key Game Systems
- **Draft Phase**: `client/games/vetrolisci/draft.js` - card picking mechanics with turn-based logic
- **Placement Logic**: `client/games/vetrolisci/placement.js` - sophisticated card placement validation
- **Scoring Engine**: `client/games/vetrolisci/scoring.js` - complex scoring with validated cards, symbols, and color zones
- **Validation**: `client/games/vetrolisci/validation.js` - card validation rules and adjacency checks

### Enhanced Services
- **Audio Service**: `client/services/audio.js` - background music and sound effects management
- **Game State Cache**: `client/services/gameStateCache.js` - localStorage persistence for game recovery
- **Image Preloader**: `client/services/imagePreloader.js` - preloads all card images for smooth gameplay
- **Socket Service**: `client/services/socket.js` - WebSocket communication wrapper with error handling

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

## Enhanced UI Components

### UI Components (Current Implementation)

#### Shared Components (`src/shared/client/components/`)
- **Modal**: Reusable modal wrapper with overlay and close handling
- **Button**: Styled button component with variants (primary, outline, disabled)
- **LoadingSpinner**: Loading animation component

#### Vetrolisci Components (`src/games/vetrolisci/client/components/`)
- **GameBoard**: Main game container with socket integration and state management
- **GameGrid**: 3x3 card grid with placement logic and animations  
- **Card**: Individual card component with image loading and validation states
- **CardChoiceModal**: Modal for choosing between duplicate cards (keep existing vs use new)
- **PlacementChoiceModal**: Modal for choosing grid position for face-down placement
- **RoundCompleteModal**: Round end summary with scores and continue option
- **ScoreBoard**: Score tracking and breakdown display

#### Key Features
- **Restricted Card Overlays**: Visual indicators for cards that can't be picked
- **Real-time Animations**: Card placement, validation, and turn transitions
- **Error Handling**: User-friendly error messages and recovery
- **Responsive Design**: Works across different screen sizes

## Critical Implementation Details

### Card Validation Rules (FIXED)
- **Cards do NOT auto-validate** just for being in correct position
- **Cards validate ONLY when**:
  1. Placed face-up on top of a face-down card, OR
  2. Result of a duplicate card choice (both cards become validated)
- **Validation checking**: `hasValidatedCardWithNumber()` and `canPickCard()` in `placement.js`

### Placement Scenarios (WORKING)
1. **Empty/Face-down**: Place on target position (card.value - 1), validates if face-down card underneath
2. **Duplicate Number**: CardChoiceModal appears, player chooses which card stays face-up, both become validated
3. **Already Validated**: PlacementChoiceModal appears, card placed face-down on chosen empty space

### Restriction System (IMPLEMENTED)  
- **Visual overlays** with restricted.png icon for cards that can't be picked
- **Rule**: Can't pick card if you already have validated card with that number
- **Exception**: If ALL revealed cards would violate rule, can pick any card (goes face-down)
- **Error messages** explain why cards are restricted

## Known Working State & Next Steps

### What's Currently Working ✅
- **Room creation/joining** with room codes and host/guest system
- **Complete multiplayer Vetrolisci game** with proper turn management  
- **All placement scenarios** including modals for duplicate/validated cards
- **Card validation system** with proper rules (no auto-validation)
- **Restricted card overlays** showing which cards can't be picked
- **Real-time synchronization** between players via Socket.IO
- **Error handling** with user-friendly messages
- **Responsive UI** that works on different screen sizes

### Legacy Reference
- **Complete working implementation** preserved in `/legacy/` folder
- **Asset compatibility**: Current implementation reuses proven card images and game logic
- **Reference for advanced features**: Audio, animations, keyboard shortcuts, fullscreen

### Potential Next Steps
- Audio system integration (music, sound effects)
- Keyboard shortcuts and accessibility features  
- Visual polish and animations
- Additional game modes or games
- Deployment configuration for production

## Current Project Structure (Post-Revamp)

```
client/                     # Frontend React application
├── components/             # React UI components
│   ├── games/             # Game-specific components
│   │   ├── GameBoard.jsx  # Main game container with state management
│   │   ├── GameGrid.jsx   # 3x3 card grid with placement logic
│   │   ├── Card.jsx       # Individual card with lazy loading
│   │   ├── LazyImage.jsx  # Optimized image loading
│   │   ├── Confetti.jsx   # Victory animations
│   │   ├── DraftPhase.jsx # Draft phase UI
│   │   └── PlacementChoiceModal.jsx # Grid position selection
│   ├── lobby/             # Lobby components
│   │   └── GameSelection.jsx # Game selection interface
│   └── shared/            # Shared components
│       └── GameCard.jsx   # Reusable game card component
├── games/                 # Game implementations
│   ├── base/              # Base game framework
│   │   ├── BaseGame.js    # Base game class
│   │   └── GameRegistry.js # Game registration system
│   └── vetrolisci/        # Vetrolisci game implementation
│       ├── VetrolisciGame.js # Main game logic
│       ├── cards.js       # Card definitions and mapping
│       ├── draft.js       # Draft phase mechanics
│       ├── placement.js   # Card placement validation
│       └── validation.js  # Card validation rules
├── services/              # Service modules
│   ├── socket.js         # Socket.IO client wrapper
│   ├── gameStateCache.js # localStorage game persistence
│   └── imagePreloader.js # Card image preloading
└── App.jsx               # Main application component

server/                    # Backend Node.js application
├── games/                # Server-side game logic
│   ├── base/             # Base server framework
│   │   ├── BaseGameServer.js # Base server game class
│   │   └── GameServerRegistry.js # Server game registration
│   └── vetrolisci/       # Vetrolisci server implementation
│       ├── VetrolisciServer.js # Server game logic
│       └── index.js      # Game server exports
└── main.js               # Server entry point

client/public/            # Static assets
├── cards/               # Card images
├── icons/               # UI icons
└── audio/               # Audio files

legacy/                   # Preserved working implementation
└── src/                 # Reference for advanced features
```

## Important Notes for Future Development

### Development Commands (Current)
```bash
npm install          # Install dependencies
npm run dev         # Start server (8001) + client (5173) concurrently
npm run server      # Server only
npm run client      # Client only (Vite dev server)
```

### Game Assets (Current Location)
- **Card Images**: `public/vetrolisci/cards/fronts/` and `public/vetrolisci/cards/backs/`
- **Icons**: `public/shared/icons/` (including `restricted.png` for card overlays)
- **Naming**: `{color}-{value}.png`, `{color}-{value}-alt.png`, `{color}-{value}-special.png`

### Key Files to Reference
- **Main server**: `src/shared/server/main.js` (Express + Socket.IO + room management)
- **Vetrolisci server**: `src/games/vetrolisci/server/vetrolisci-server.js` (game logic)
- **Main client**: `src/App.jsx` (room creation/joining interface)
- **Game client**: `src/games/vetrolisci/client/components/GameBoard.jsx` (main game UI)
- **Game logic**: `src/games/vetrolisci/shared/placement.js` (placement scenarios + validation)

### Critical Bug Fixes Applied
1. **Fixed auto-validation bug** in `validation.js` - cards only validate with face-down cards underneath
2. **Fixed draft state advancement** in `vetrolisci-server.js` - waits for placement choices
3. **Fixed React hooks ordering** in `GameBoard.jsx` - all hooks at component top
4. **Added restriction system** with visual overlays and validation logic
5. **Fixed modal data structures** for CardChoiceModal and PlacementChoiceModal

### Testing & Debugging
- **Server logs**: Watch for `🎯` prefixed debug messages showing placement scenarios
- **Browser console**: Client-side errors and socket connection status  
- **Room codes**: 6-character alphanumeric codes for joining games
- **Player indexing**: Host = player 0, Guest = player 1