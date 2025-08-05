# The Gaming Nook - Multi-Game Platform Plan

## Vision
Transform Vetrolisci into "The Gaming Nook" - a comprehensive 2-player game platform featuring user profiles, game selection, matchmaking, and multiple classic/custom games.

## Platform Architecture

### Core System Changes

#### 1. User Authentication & Profiles
- **User Registration/Login**: JWT-based authentication with persistent sessions
- **Player Profiles**: Username, avatar, game statistics, win/loss records per game
- **Profile Dashboard**: Personal stats, recent games, achievements
- **Guest Play**: Allow anonymous play with temporary usernames

#### 2. Game Selection Hub
- **Main Menu**: Game catalog with thumbnails, descriptions, and player counts
- **Game Categories**: 
  - Card Games (Vetrolisci/Pixies, UNO variants)
  - Strategy Games (Connect 4, Tic-Tac-Toe variants)
  - Board Games (Mancala, Checkers)
  - Custom Games (original creations)

#### 3. Enhanced Matchmaking System
- **Game Rooms**: Players join specific game lobbies
- **Quick Match**: Automatic pairing for any available game
- **Private Rooms**: Room codes for playing with friends
- **Spectator Mode**: Watch ongoing games (future enhancement)

#### 4. Unified Game Framework
- **Abstract Game Interface**: Common structure for all games
- **Shared Components**: Standardized UI elements across games
- **Game State Management**: Generic state handling for any 2-player game
- **Standardized Events**: Common socket events for all game types

## Technical Implementation Plan

### Phase 1: Foundation (Weeks 1-2)
**Transform current architecture to support multiple games**

#### Backend Changes
- **User Management Service**: 
  - User registration/authentication endpoints
  - Profile management (CRUD operations)
  - Session handling with JWT tokens
- **Game Registry**: 
  - Central game catalog with metadata
  - Game-specific configuration management
- **Enhanced Matchmaking**:
  - Room-based system instead of simple pairing
  - Support for different game types
  - Queue management for multiple game types

#### Database Integration
- **User Storage**: PostgreSQL/SQLite for user profiles, stats
- **Game History**: Store completed games for statistics
- **Persistent Sessions**: Redis/memory store for active games

#### Frontend Architecture
- **App Shell**: Main navigation with game selection
- **Game Launcher**: Dynamic game loading system
- **Shared UI Library**: Reusable components for all games
- **Profile Management**: User dashboard and settings

### Phase 2: Game Framework (Weeks 3-4)
**Create standardized game development framework**

#### Abstract Game System
```javascript
// Base game structure that all games implement
class BaseGame {
  constructor(gameConfig) {
    this.id = gameConfig.id;
    this.name = gameConfig.name;
    this.minPlayers = 2;
    this.maxPlayers = 2;
  }
  
  // Standard methods all games must implement
  initializeGame(players) {}
  processMove(playerId, move) {}
  checkWinCondition() {}
  getGameState() {}
  validateMove(playerId, move) {}
}
```

#### Game Registration System
- **Game Manifest**: Each game defines its metadata and components
- **Dynamic Loading**: Load game-specific logic and UI on demand
- **Standardized Events**: Common socket structure for all games

#### Shared Components Library
- **Game Board Framework**: Generic grid/board components
- **Player Info Panels**: Standardized player status displays
- **Modal System**: Shared dialogs and notifications
- **Timer Components**: Turn timers and game clocks

### Phase 3: First Additional Games (Weeks 5-6)
**Implement 2-3 classic games using the new framework**

#### Game 1: Connect 4
- **Game Logic**: 6x7 grid, gravity-based piece placement
- **Win Condition**: 4 in a row (horizontal, vertical, diagonal)
- **UI**: Animated piece dropping, win highlighting

#### Game 2: Mancala
- **Game Logic**: Traditional Kalah rules with seed distribution
- **Win Condition**: Most seeds captured
- **UI**: Animated seed movement, pit selection

#### Game 3: Tic-Tac-Toe Plus
- **Game Logic**: Enhanced 3x3 with power-ups or larger grids
- **Win Condition**: Traditional or variant rules
- **UI**: Simple but polished interface

### Phase 4: Advanced Features (Weeks 7-8)
**Enhance platform with advanced functionality**

#### Enhanced Matchmaking
- **Skill-Based Matching**: ELO rating system
- **Tournament Mode**: Single-elimination brackets
- **Daily Challenges**: Special game modes or objectives

#### Social Features
- **Friends System**: Add friends, see online status
- **Chat System**: In-game and lobby chat
- **Achievements**: Game-specific and platform-wide achievements

#### Analytics & Statistics
- **Game Analytics**: Track popular games, session length
- **Player Statistics**: Detailed stats per game type
- **Leaderboards**: Global and friend rankings

## Directory Structure

```
the-gaming-nook/
├── server/
│   ├── auth/                  # Authentication services
│   ├── games/                 # Game-specific server logic
│   │   ├── base/             # Abstract game framework
│   │   ├── vetrolisci/       # Existing Vetrolisci logic
│   │   ├── connect4/         # Connect 4 implementation
│   │   └── mancala/          # Mancala implementation
│   ├── matchmaking/          # Room and queue management
│   ├── database/             # Database models and migrations
│   └── server.js             # Main server entry point
├── client/
│   ├── components/
│   │   ├── shared/           # Reusable UI components
│   │   ├── games/            # Game-specific components
│   │   ├── profile/          # User profile components
│   │   └── lobby/            # Matchmaking and room components
│   ├── services/             # API and socket services
│   ├── games/                # Game-specific client logic
│   │   ├── base/             # Abstract game classes
│   │   ├── vetrolisci/       # Existing Vetrolisci
│   │   ├── connect4/         # Connect 4 client
│   │   └── mancala/          # Mancala client
│   └── App.jsx               # Main app shell
└── shared/                   # Common utilities and types
```

## Data Models

### User Profile
```javascript
{
  id: string,
  username: string,
  email: string,
  avatar: string,
  createdAt: Date,
  lastLogin: Date,
  statistics: {
    totalGames: number,
    totalWins: number,
    gameStats: {
      [gameId]: {
        games: number,
        wins: number,
        elo: number
      }
    }
  }
}
```

### Game Room
```javascript
{
  id: string,
  gameType: string,
  players: [
    {
      userId: string,
      username: string,
      isReady: boolean
    }
  ],
  status: 'waiting' | 'playing' | 'finished',
  gameState: Object, // Game-specific state
  createdAt: Date,
  settings: Object   // Game-specific settings
}
```

## Socket.IO Event Structure

### Platform Events
- `user-authenticated` - User login confirmation
- `game-list-updated` - Available games changed
- `room-joined` - Successfully joined a game room
- `room-left` - Left a game room
- `player-joined-room` - Another player joined your room
- `player-left-room` - Player left your room

### Universal Game Events
- `game-started` - Game begins (any game type)
- `game-move` - Player made a move (game-agnostic)
- `game-state-updated` - Game state changed
- `game-ended` - Game finished with results
- `turn-changed` - Active player changed

## Migration Strategy

### From Vetrolisci to The Gaming Nook

#### Week 1: Infrastructure
1. **Rename and restructure project**
2. **Add user authentication system**
3. **Create game selection interface**
4. **Migrate Vetrolisci to new game framework**

#### Week 2: Framework Development
1. **Implement abstract game classes**
2. **Create shared UI component library**
3. **Enhance matchmaking for multiple games**
4. **Add user profile management**

#### Weeks 3-4: First New Games
1. **Implement Connect 4 using framework**
2. **Add Mancala using framework**
3. **Test multi-game functionality**
4. **Polish user experience**

## Development Priorities

### High Priority (MVP)
- [x] User authentication and profiles
- [x] Game selection hub
- [x] Abstract game framework
- [x] Migrate Vetrolisci to new system
- [x] Add one additional game (Connect 4)

### Medium Priority (V1.1)
- [ ] Friend system and social features
- [ ] Game statistics and leaderboards
- [ ] Private rooms with codes
- [ ] Tournament mode

### Low Priority (Future)
- [ ] Spectator mode
- [ ] In-game chat
- [ ] Achievement system
- [ ] Mobile app version

## Success Metrics

### Technical Metrics
- Support for 5+ different game types
- Sub-500ms response time for game moves
- 99% uptime for game sessions
- Support for 100+ concurrent games

### User Experience Metrics
- Average session length > 15 minutes
- User retention rate > 60% after 1 week
- Games completed rate > 80%
- User rating > 4.2/5

## Risk Assessment

### Technical Risks
- **Performance**: Multiple games may strain server resources
  - *Mitigation*: Horizontal scaling, game session optimization
- **Complexity**: Abstract framework may be over-engineered
  - *Mitigation*: Start simple, iterate based on actual needs

### User Experience Risks
- **Learning Curve**: New interface may confuse existing Vetrolisci users
  - *Mitigation*: Gradual rollout, clear onboarding flow
- **Game Balance**: Different games may have varying popularity
  - *Mitigation*: Analytics-driven game development, user feedback

## Technology Stack

### Backend
- **Node.js + Express**: Web server and API (existing)
- **Socket.IO**: Real-time game communication (existing)
- **PostgreSQL**: User profiles and game history
- **Redis**: Session storage and game state caching
- **JWT**: Authentication tokens

### Frontend
- **React + Vite**: UI framework (existing)
- **React Router**: Multi-page navigation
- **Context API**: Global state management
- **CSS Modules**: Component styling

### Infrastructure
- **Docker**: Containerization for deployment
- **Apache HTTP Server**: Reverse proxy and static file serving
- **PM2**: Process management for Node.js

This plan provides a comprehensive roadmap for transforming Vetrolisci into The Gaming Nook while preserving the excellent foundation you've built. The phased approach ensures manageable development cycles while maintaining the high-quality user experience of the original game.