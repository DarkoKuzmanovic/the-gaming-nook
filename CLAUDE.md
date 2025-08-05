# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# The Gaming Nook - Multiplayer Gaming Platform

## Project Overview

**The Gaming Nook** is a multiplayer gaming platform with isolated game architecture, currently featuring **Vetrolisci** (a Pixies card game implementation) as the primary game. The platform uses a fresh, simplified architecture starting from a clean foundation while preserving proven game logic from legacy implementations.

## Recent Development History

### Major Revamp (Current Implementation)
- **Started fresh** with clean isolated architecture after legacy multiplayer issues
- **Preserved working game logic** from `/legacy/` folder containing proven Vetrolisci implementation
- **Isolated game system**: Each game in `/src/games/` is self-contained with client/server/shared folders
- **Simple tech stack**: React + Vite (frontend) + Express + Socket.IO (backend) - no complex frameworks or databases

### Key Issues Resolved
1. **Card Validation Bug**: Fixed auto-validation logic that was incorrectly validating cards just for being in correct position
2. **Draft State Advancement**: Fixed critical bug where server advanced draft state before placement choices were made
3. **Modal System**: Fixed CardChoiceModal (duplicate cards) and PlacementChoiceModal (validated placement) scenarios  
4. **Player Indexing**: Fixed multiplayer synchronization issues with proper player index management
5. **React Hooks**: Fixed hooks ordering violations in GameBoard component
6. **Restricted Cards**: Implemented validation overlay system with visual restrictions for validated cards

### Current Status
- ✅ **Core multiplayer Vetrolisci working** with proper card validation rules
- ✅ **Room-based multiplayer** with host/guest system
- ✅ **All placement scenarios** working: empty/face-down, duplicate number, already validated
- ✅ **Modal system** for card choices and placement decisions
- ✅ **Restricted card overlays** showing which cards can't be picked and why
- ✅ **Real-time synchronization** between players
- ✅ **Complete game flow** from room creation to game completion

## Current Architecture (Post-Revamp)

### Isolated Game System
```
src/
├── shared/
│   ├── client/               # Shared client components (Modal, Button, etc.)
│   └── server/               # Main server with room management
│       └── main.js          # Express + Socket.IO server (port 8001)
└── games/
    └── vetrolisci/          # Self-contained Vetrolisci game
        ├── client/          # React components for Vetrolisci
        │   └── components/  # GameBoard, Card, modals, etc.
        ├── server/          # Vetrolisci server logic
        │   └── vetrolisci-server.js
        └── shared/          # Game logic shared between client/server
            ├── cards.js     # 70-card deck with image mapping
            ├── draft.js     # 4-card draft system
            ├── placement.js # Card placement scenarios + validation
            ├── scoring.js   # Complex scoring with color zones
            └── validation.js # Card validation rules
```

### Frontend (React + Vite)
- **Entry Point**: `src/index.html` → `src/main.jsx` → `src/App.jsx`
- **Room System**: Create/join rooms with room codes, host/guest roles
- **Game Integration**: Dynamic loading of game components based on room type
- **Real-time Communication**: Socket.IO client wrapper in `shared/client/utils/socket-client.js`

### Backend (Node.js + Express + Socket.IO)
- **Entry Point**: `src/shared/server/main.js` - handles room management and routing
- **Game Servers**: Individual game logic in `src/games/{game}/server/`
- **In-memory State**: Maps for rooms, players, game states
- **Real-time Features**: Socket.IO for live multiplayer with room isolation

### Vetrolisci Game Systems (Current Implementation)
- **Draft Phase**: 4-card alternating draft system with turn-based picking
- **Placement Scenarios**: 
  1. **Empty/Face-down**: Auto-place on target position (card.value - 1)
  2. **Duplicate Number**: Show CardChoiceModal to choose which card stays face-up  
  3. **Already Validated**: Show PlacementChoiceModal to place face-down on empty space
- **Card Validation**: Cards validate when placed correctly with face-down cards underneath
- **Restriction System**: Visual overlays prevent picking validated card numbers (unless all cards are validated)
- **Scoring Engine**: Complex scoring with validated numbers, symbols, and color zones

### Socket.IO Events (Current Implementation)

#### Room Management
- **Client → Server**: `create-room`, `join-room`, `check-room`
- **Server → Client**: `player-joined`, `game-started`

#### Vetrolisci Game Events  
- **Client → Server**: `vetrolisci-pick-card`, `vetrolisci-placement-choice`, `vetrolisci-get-state`
- **Server → Client**: `vetrolisci-card-placed`, `vetrolisci-round-complete`, `vetrolisci-game-complete`

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
src/
├── index.html                    # Entry point
├── main.jsx                      # React entry
├── App.jsx                       # Main app with room system
├── shared/
│   ├── client/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── Modal.jsx        # Modal wrapper
│   │   │   ├── Button.jsx       # Styled buttons  
│   │   │   └── LoadingSpinner.jsx
│   │   └── utils/
│   │       └── socket-client.js # Socket.IO wrapper
│   └── server/
│       └── main.js              # Express + Socket.IO server
├── games/
│   └── vetrolisci/              # Self-contained Vetrolisci game
│       ├── client/
│       │   └── components/      # Vetrolisci UI components
│       │       ├── GameBoard.jsx       # Main game interface
│       │       ├── GameGrid.jsx        # 3x3 card grid
│       │       ├── Card.jsx            # Individual cards
│       │       ├── CardChoiceModal.jsx # Duplicate card choices
│       │       ├── PlacementChoiceModal.jsx # Position selection
│       │       ├── RoundCompleteModal.jsx   # Round summaries
│       │       └── ScoreBoard.jsx      # Score tracking
│       ├── server/
│       │   └── vetrolisci-server.js    # Game server logic
│       └── shared/              # Shared game logic
│           ├── cards.js         # 70-card deck + images
│           ├── draft.js         # 4-card draft system
│           ├── placement.js     # Placement scenarios + validation
│           ├── scoring.js       # Complex scoring system
│           └── validation.js    # Card validation rules
├── public/
│   ├── vetrolisci/cards/       # Card images (moved from legacy)
│   └── shared/icons/           # UI icons including restricted.png
└── legacy/                     # Preserved working implementation
    └── src/                    # Reference for advanced features
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