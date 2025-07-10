# Vetrolisci - Card Game Implementation

## Project Overview
Vetrolisci is a digital implementation of the board game Pixies, a strategic card placement game for 2 players. The game involves placing cards in a 3x3 grid across 3 rounds, with scoring based on validated card numbers, symbols, and color zones.

## Tech Stack
Based on DeskDuels2 architecture:
- **Frontend**: React with modern JavaScript
- **Backend**: Node.js with Express.js
- **Package Manager**: npm
- **Runtime**: Node.js

## Game Rules
Complete game rules are documented in `vetrolisci-ruleset.md`. Key features to implement:
- 3x3 grid card placement system
- 3-round game structure
- Card validation mechanics
- Real-time multiplayer support
- Scoring system with symbols and color zones

## Development Commands
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Lint code
npm run lint

# Type checking
npm run typecheck
```

## Project Structure
```
vetrolisci/
├── src/
│   ├── components/     # React components
│   ├── game/          # Game logic and state
│   ├── server/        # Backend API
│   └── utils/         # Utility functions
├── public/            # Static assets
├── package.json       # Dependencies and scripts
└── server.js          # Main server entry point
```

## Key Implementation Areas
1. **Game State Management**: Track player grids, card states, turn order
2. **Card Placement Logic**: Implement the 3 scenarios for card placement
3. **Validation System**: Track which cards are validated
4. **Scoring Engine**: Calculate points from numbers, symbols, and color zones
5. **Real-time Updates**: Synchronize game state between players
6. **UI Components**: Grid display, card rendering, game controls

## Next Steps
1. Initialize package.json and basic project structure
2. Set up React frontend with game components
3. Implement Node.js backend with game logic
4. Add real-time multiplayer support
5. Create card database and game assets