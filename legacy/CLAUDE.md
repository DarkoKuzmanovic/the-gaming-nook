# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Vetrolisci - Digital Pixies Card Game

## Project Overview

Vetrolisci is a feature-rich real-time multiplayer implementation of the Pixies card game for 2 players. Players strategically place cards in a 3x3 grid across 3 rounds, with advanced scoring based on validated card numbers, symbols, and color zones. The game includes audio effects, state persistence, image preloading, and comprehensive modal interfaces.

## Architecture

### Frontend (React + Vite + ES Modules)
- **Entry Point**: `src/main.jsx` → `src/App.jsx`
- **State Management**: React state with localStorage persistence via `gameStateCache`
- **Components**: Comprehensive React component library in `src/components/`
- **Game Logic**: Client-side game logic in `src/game/`
- **Services**: Modular services for audio, caching, image preloading, and socket communication
- **Real-time Communication**: Socket.IO client wrapper in `src/services/socket.js`

### Backend (Node.js + Express + ES Modules)
- **Entry Point**: `server.js` - handles both HTTP and WebSocket connections
- **Module System**: Full ES module support with `"type": "module"` in package.json
- **Game State**: In-memory storage using Maps for games and players
- **Real-time Features**: Socket.IO for live multiplayer functionality
- **Card System**: 70-card deck with image mapping in `src/data/cards.js`

### Key Game Systems
- **Draft Phase**: `src/game/draft.js` - card picking mechanics with turn-based logic
- **Placement Logic**: `src/game/placement.js` - sophisticated card placement validation
- **Scoring Engine**: `src/game/scoring.js` - complex scoring with validated cards, symbols, and color zones
- **Validation**: `src/game/validation.js` - card validation rules and adjacency checks

### Enhanced Services
- **Audio Service**: `src/services/audio.js` - background music and sound effects management
- **Game State Cache**: `src/services/gameStateCache.js` - localStorage persistence for game recovery
- **Image Preloader**: `src/services/imagePreloader.js` - preloads all card images for smooth gameplay
- **Socket Service**: `src/services/socket.js` - WebSocket communication wrapper with error handling

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

### Modal System
- **CardChoiceModal**: Card replacement choice interface
- **PlacementChoiceModal**: Grid placement position selection
- **RoundCompleteModal**: Round end summary with scores and continue option
- **BackToMenuModal**: Confirmation dialog for leaving games

### Game Interface
- **GameBoard**: Main game container with integrated state management
- **GameGrid**: 3x3 card grid with visual feedback and hover states
- **CardHand**: Available cards display with selection capabilities
- **ScoreBoard**: Comprehensive scoring display with breakdown details
- **Card**: Individual card component with lazy loading and skeleton states
- **LazyImage**: Optimized image loading with fallback support
- **SkeletonLoader**: Loading state placeholders
- **Confetti**: Victory celebration animations

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
- `pick-card` - Pick card during draft phase with placement choice/position
- `place-card` - Place card on grid with validation

### Server → Client  
- `game-joined` - Successful game join with gameId and playerIndex
- `game-started` - Game begins with 2 players and initial state
- `card-picked-and-placed` - Card picked and placed with updated game state
- `card-picked-and-discarded` - Card picked but discarded due to placement rules
- `new-turn` - Turn advancement with draft state updates
- `round-complete` - Round ended with detailed scores and progression
- `game-complete` - Game finished after 3 rounds with final results
- `player-disconnected` - Handle player disconnection gracefully
- `error` - Server-side validation errors and messages

## Project Structure

```
src/
├── components/              # React UI components
│   ├── GameBoard.jsx       # Main game container with state management
│   ├── GameGrid.jsx        # 3x3 card grid with placement logic
│   ├── CardHand.jsx        # Available cards display
│   ├── Card.jsx            # Individual card with lazy loading
│   ├── ScoreBoard.jsx      # Score tracking and breakdown
│   ├── LazyImage.jsx       # Optimized image loading
│   ├── SkeletonLoader.jsx  # Loading state placeholders
│   ├── Confetti.jsx        # Victory animations
│   ├── CardChoiceModal.jsx # Card replacement selection
│   ├── PlacementChoiceModal.jsx # Grid position selection
│   ├── RoundCompleteModal.jsx   # Round end summary
│   └── BackToMenuModal.jsx      # Leave game confirmation
├── game/                   # Game logic modules
│   ├── draft.js           # Draft phase mechanics
│   ├── placement.js       # Card placement validation
│   ├── scoring.js         # Comprehensive scoring calculations
│   └── validation.js      # Card validation and adjacency rules
├── services/              # Service modules
│   ├── socket.js         # Socket.IO client wrapper
│   ├── audio.js          # Audio management (music + SFX)
│   ├── gameStateCache.js # localStorage game persistence
│   └── imagePreloader.js # Card image preloading
├── data/
│   └── cards.js          # 70-card deck with image mapping
└── utils/                # Utility functions (if any)
```

## Enhanced Features

### Audio System
- **Background Music**: Looping ambient music with volume control
- **Sound Effects**: Card placement, validation, win/lose sounds
- **Audio Controls**: Toggle music and sound effects independently
- **Auto-play Support**: Handles browser audio restrictions

### State Persistence
- **Game Recovery**: Automatic game state saving to localStorage
- **Cache Management**: 30-minute expiry with manual cache extension
- **Player Preferences**: Persistent player name storage
- **Connection Recovery**: Restore game state after disconnections

### Performance Optimizations
- **Image Preloading**: All card images loaded on app start
- **Lazy Loading**: Progressive image loading with skeleton states
- **Memory Management**: Efficient component rendering and cleanup
- **Error Boundaries**: Graceful error handling and recovery

### User Experience
- **Fullscreen Support**: Toggle fullscreen mode
- **Dynamic Titles**: Page title updates based on game state and turns
- **Visual Feedback**: Hover states, selections, and animations
- **Responsive Design**: Works across different screen sizes
- **Accessibility**: Keyboard navigation and screen reader support

## Development Notes

- **ES Modules**: Full ES module support throughout the codebase
- **Game State**: Server-side authoritative state with client-side caching
- **Real-time Sync**: Socket.IO maintains game synchronization
- **Asset Management**: Organized card images with fallback support
- **Error Handling**: Comprehensive error boundaries and user feedback
- **TypeScript Ready**: Development tooling includes TypeScript support
- **Network Resilience**: Handles disconnections and reconnections gracefully

## Game Assets

### Card Images
- **Location**: `public/cards/fronts/` and `public/cards/backs/`
- **Naming**: `{color}-{value}.png`, `{color}-{value}-alt.png`, `{color}-{value}-special.png`
- **Variants**: Multiple visual variants for same card values
- **Multi-color**: Special multi-color cards with `multi-` prefix

### Audio Assets
- **Location**: `public/audio/`
- **Background**: `music.mp3` - looping ambient music
- **Sound Effects**: `play_card.mp3`, `place_cards.mp3`, `validate.mp3`, `win.mp3`, `lose.mp3`

### UI Icons  
- **Location**: `public/icons/`
- **Controls**: Music, sound, fullscreen, back-to-menu, refresh icons
- **Game Elements**: Score, validation, restriction indicators

## Deployment Considerations

- **Static Assets**: All assets served from `public/` directory
- **Build Output**: Vite builds to `dist/` directory
- **Server Hosting**: Express serves both API and static files
- **CORS Configuration**: Configured for cross-origin development and production
- **Port Configuration**: Default port 8001 with environment variable override