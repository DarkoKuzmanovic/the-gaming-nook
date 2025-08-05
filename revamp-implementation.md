# The Gaming Nook - Revamp Implementation Plan

## Overview
This document outlines the step-by-step implementation plan for transforming The Gaming Nook from a single-game implementation to a multi-game platform with isolated game architecture.

**Goal**: Create a simple, maintainable multiplayer gaming platform starting with a working Vetrolisci implementation.

**Timeline**: ~16 days (part-time development)

---

## Phase 1: Foundation Setup (Days 1-2)

### Day 1: Project Structure & Dependencies

#### Morning: Clean Slate Setup
- [ ] Revert repository to working commit `a4b2c36e463cbf52ca1275e534edd8b53a074bdd`
- [ ] Move current implementation to `/legacy/` folder (preserve as reference)
- [ ] Create fresh `/src/` folder structure:
  ```
  /src/
  ├── games/
  ├── shared/
  │   ├── client/
  │   └── server/
  └── public/
  ```

#### Afternoon: Basic Build Setup
- [ ] Create minimal `package.json` with only essential dependencies:
  - React, Vite (frontend)
  - Express, Socket.IO (backend)
  - No complex frameworks or tools
- [ ] Set up basic Vite configuration
- [ ] Create simple `npm run dev` script for concurrent client/server

#### Evening: Basic Server Foundation
- [ ] Create `/src/shared/server/main.js` - minimal Express + Socket.IO server
- [ ] Implement basic room management utilities in `/src/shared/server/utils/room-manager.js`
- [ ] Add simple health check endpoint
- [ ] Test server starts and responds

### Day 2: Shared Utilities & Basic UI

#### Morning: Shared Client Components
- [ ] Create `/src/shared/client/components/`:
  - `Modal.jsx` - generic modal component
  - `Button.jsx` - generic button component
  - `LoadingSpinner.jsx` - loading states
- [ ] Create `/src/shared/client/utils/socket-client.js` - Socket.IO wrapper
- [ ] Basic CSS setup for shared components

#### Afternoon: Main App Structure
- [ ] Create main `App.jsx` with routing to game selection
- [ ] Implement game selection UI:
  - "Create Game" button
  - "Join Game" with room code input
  - Simple, clean interface
- [ ] Test basic UI renders and navigation works

#### Evening: Room Code System
- [ ] Implement room code generation (6-character alphanumeric)
- [ ] Add room creation/joining logic
- [ ] Test room code flow (create → share → join)

---

## Phase 2: Legacy Migration (Days 3-7)

### Day 3: Asset Migration
- [ ] Copy card images from `/legacy/public/cards/` to `/src/public/vetrolisci/cards/`
- [ ] Copy audio files from `/legacy/public/audio/` to `/src/public/vetrolisci/audio/`
- [ ] Copy icons from `/legacy/public/icons/` to `/src/public/shared/icons/`
- [ ] Verify all assets load correctly

### Day 4: Core Game Logic Migration
- [ ] Create `/src/games/vetrolisci/shared/` folder
- [ ] Copy and adapt `/legacy/src/data/cards.js` → `cards.js`
- [ ] Copy `/legacy/src/game/draft.js` → `draft.js` (EXACT copy of logic)
- [ ] Copy `/legacy/src/game/placement.js` → `placement.js` (EXACT copy of logic)
- [ ] Copy `/legacy/src/game/scoring.js` → `scoring.js` (EXACT copy of logic)
- [ ] Copy `/legacy/src/game/validation.js` → `validation.js` (EXACT copy of logic)
- [ ] Test game logic functions work in isolation

### Day 5: Client Components Migration
- [ ] Create `/src/games/vetrolisci/client/` folder
- [ ] Copy and adapt key components from `/legacy/src/components/`:
  - `GameBoard.jsx` - main game container
  - `GameGrid.jsx` - 3x3 card grid
  - `Card.jsx` - individual card component
  - `ScoreBoard.jsx` - scoring display
  - `DraftPhase.jsx` - draft UI
- [ ] Adapt components for new folder structure (import paths)
- [ ] Copy associated CSS files

### Day 6: Server Logic Migration
- [ ] Create `/src/games/vetrolisci/server/vetrolisci-server.js`
- [ ] Extract multiplayer logic from `/legacy/server.js`
- [ ] Implement game-specific server class:
  - Game state management
  - Player actions (card picking, placement)
  - Turn management
  - Round progression
- [ ] **CRITICAL**: Use exact game logic from legacy shared files

### Day 7: Integration & Basic Testing
- [ ] Connect client components to server logic
- [ ] Implement Socket.IO events for Vetrolisci:
  - `create-vetrolisci-game`
  - `join-vetrolisci-game`  
  - `pick-card`
  - `card-picked-and-placed`
  - `round-complete`
  - `game-complete`
- [ ] Test basic game flow with two browser windows

---

## Phase 3: New Architecture Implementation (Days 8-14)

### Day 8: Game Registration System
- [ ] Create game registration system in `/src/shared/server/main.js`
- [ ] Register Vetrolisci server
- [ ] Implement game type routing (prepare for multiple games)
- [ ] Test game selection → Vetrolisci works end-to-end

### Day 9: Enhanced UI Polish
- [ ] Add loading states for all network operations
- [ ] Implement "Copy room code" button with visual feedback
- [ ] Add recent room codes history (localStorage)
- [ ] Improve error messages and user feedback

### Day 10: Audio System
- [ ] Implement audio service from legacy
- [ ] Add background music toggle
- [ ] Add sound effects for game actions
- [ ] Add volume controls
- [ ] Test audio works across browsers

### Day 11: Visual Polish & Animations
- [ ] Add hover effects and visual feedback
- [ ] Implement card placement animations
- [ ] Add victory celebrations (confetti effect)
- [ ] Improve responsive design for mobile
- [ ] Test on mobile browsers

### Day 12: Error Handling Implementation
- [ ] Implement 3-tier error handling:
  - Tier 1: Help users fix mistakes (show valid moves)
  - Tier 2: End game gracefully with explanation
  - Tier 3: System errors with restart options
- [ ] Add comprehensive error messages
- [ ] Test error scenarios (invalid moves, disconnections)

### Day 13: Network Resilience
- [ ] Implement connection status monitoring  
- [ ] Add "Connection lost" UI feedback
- [ ] Handle graceful game termination on disconnect
- [ ] Test with poor network conditions
- [ ] Test rapid connect/disconnect scenarios

### Day 14: Game State & Performance
- [ ] Implement image preloading for cards
- [ ] Add lazy loading for better performance
- [ ] Optimize component rendering
- [ ] Add basic memory management
- [ ] Performance test with multiple games

---

## Phase 4: Testing & Polish (Days 15-16)

### Day 15: Comprehensive Testing
- [ ] **Two-browser testing**: Complete multiple full games
- [ ] **Network testing**: Test with second device on network
- [ ] **Mobile testing**: Test on phones and tablets  
- [ ] **Cross-browser testing**: Chrome, Firefox, Safari
- [ ] **Edge case testing**:
  - Browser refresh during game
  - Close tab and rejoin
  - Invalid room codes
  - Rapid actions
  - Connection drops

### Day 16: Final Polish & Documentation
- [ ] Fix any bugs found during testing
- [ ] Update `CLAUDE.md` with final architecture notes
- [ ] Create deployment instructions for VPS
- [ ] Add basic monitoring/health checks
- [ ] Performance optimization final pass
- [ ] **FINAL TEST**: Complete game session with friend over network

---

## Success Criteria

### Phase 1 Success:
- [x] Clean project structure exists
- [x] Basic server runs and responds
- [x] Room code system works
- [x] Basic UI navigates properly

### Phase 2 Success:
- [x] All legacy assets migrated
- [x] Game logic files copied exactly
- [x] Basic Vetrolisci game playable locally
- [x] Two-browser testing works

### Phase 3 Success:
- [x] Full multiplayer game works end-to-end
- [x] Audio and visual polish complete
- [x] Error handling robust
- [x] Mobile-friendly interface

### Phase 4 Success:
- [x] Bug-free multiplayer experience
- [x] Network play with friends works perfectly
- [x] Ready for VPS deployment
- [x] Foundation ready for additional games

---

## Development Guidelines

### Daily Workflow:
1. **Start each day**: Check `/legacy/` folder for reference
2. **Copy, don't rewrite**: Use proven legacy code wherever possible
3. **Test early, test often**: Two browser windows minimum
4. **Keep it simple**: Resist urge to over-engineer
5. **Game isolation**: Everything Vetrolisci-specific stays in `/src/games/vetrolisci/`

### Testing Protocol:
- **After each major change**: Two-browser test
- **End of each day**: Full game playthrough
- **End of each phase**: Network test with second device
- **Before any commit**: Ensure no regressions

### Rollback Plan:
- **If stuck**: Reference working `/legacy/` code
- **If broken**: Git revert to last working commit
- **If confused**: Simplify - remove complex features

---

## Post-Implementation: Adding Games

Once Vetrolisci is solid, adding new games follows this pattern:

1. **Create**: `/src/games/{newgame}/` folder structure
2. **Implement**: Game-specific logic in isolation  
3. **Register**: Add to game selection menu
4. **Test**: Same testing protocol
5. **Deploy**: No changes to existing games

This architecture ensures each game is independent and maintainable!

---

**Remember**: The goal is a working, maintainable platform - not perfect code. Keep it simple, test thoroughly, and build on proven foundations!