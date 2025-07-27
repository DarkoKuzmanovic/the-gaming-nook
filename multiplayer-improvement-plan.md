# Vetrolisci Multiplayer Improvement Plan

## Executive Summary

This plan outlines the implementation of enhanced multiplayer features for Vetrolisci, including a game lobby system, user profiles, and improved matchmaking capabilities. The current system's simple name-entry and auto-matching will be expanded to support multiple concurrent games, persistent user accounts, and social features.

## Current State Analysis

### Existing Features
- Basic socket.io multiplayer connection
- Simple name entry and automatic 2-player matching
- Real-time game synchronization
- Draft and placement phase coordination

### Limitations
- No persistent user accounts
- Only one active game at a time
- No ability to choose opponents
- No game history or statistics
- No reconnection support

## Phase 1: User Authentication & Profiles

### 1.1 Database Setup
```
Technologies: PostgreSQL/MongoDB + Prisma ORM
```

**User Schema:**
```javascript
User {
  id: UUID
  username: String (unique)
  email: String (unique)
  passwordHash: String
  displayName: String
  avatar: String (URL)
  createdAt: DateTime
  lastLogin: DateTime
  stats: UserStats
}

UserStats {
  gamesPlayed: Int
  gamesWon: Int
  totalScore: Int
  highestScore: Int
  winStreak: Int
  favoriteColor: String
}
```

### 1.2 Authentication System

**Implementation Steps:**
1. Add authentication endpoints to server
   - `/api/auth/register`
   - `/api/auth/login`
   - `/api/auth/logout`
   - `/api/auth/refresh`

2. Implement JWT-based authentication
3. Add password hashing (bcrypt)
4. Create login/register components
5. Add persistent session management

**Frontend Components:**
- `LoginModal.jsx` - Login form with validation
- `RegisterModal.jsx` - Registration with username/email
- `UserProfile.jsx` - Display user stats and avatar
- `ProfileSettings.jsx` - Edit profile information

### 1.3 Guest Mode Support
- Allow playing without registration
- Convert guest to registered user
- Limited features for guests (no stats, no friends)

## Phase 2: Game Lobby System

### 2.1 Lobby Architecture

**Game Room Schema:**
```javascript
GameRoom {
  id: String (6-char code)
  name: String
  hostId: String (User ID)
  players: Player[]
  status: 'waiting' | 'starting' | 'in_progress' | 'finished'
  isPrivate: Boolean
  password: String (optional)
  settings: GameSettings
  createdAt: DateTime
  startedAt: DateTime
}

GameSettings {
  timeLimit: Int (seconds per turn)
  roundCount: Int (default: 3)
  spectatorAllowed: Boolean
}
```

### 2.2 Lobby Features

**Core Components:**
1. **Main Lobby (`Lobby.jsx`)**
   - List of available games
   - Quick match button
   - Create game button
   - Friends list sidebar
   - Active games section

2. **Game Room (`GameRoom.jsx`)**
   - Player slots (2 players + spectators)
   - Ready status indicators
   - Game settings (host only)
   - Chat functionality
   - Start game button

3. **Room Browser (`RoomBrowser.jsx`)**
   - Filter by: Public/Private, In Progress/Waiting
   - Search by room name or player
   - Room info preview
   - Join button with password prompt

### 2.3 Socket Events Enhancement

**New Events:**
```javascript
// Lobby events
'lobby:enter'
'lobby:leave'
'lobby:rooms-update'

// Room events  
'room:create'
'room:join'
'room:leave'
'room:update-settings'
'room:player-ready'
'room:start-game'
'room:chat-message'

// Friend events
'friend:add'
'friend:remove'
'friend:online-status'
```

## Phase 3: Social Features

### 3.1 Friends System

**Friend Schema:**
```javascript
Friendship {
  id: UUID
  userId: String
  friendId: String
  status: 'pending' | 'accepted' | 'blocked'
  createdAt: DateTime
}
```

**Features:**
- Add/remove friends
- See online status
- Invite to game
- View friend's profile and stats
- Recent games together

### 3.2 Game History

**Match Schema:**
```javascript
Match {
  id: UUID
  roomId: String
  players: PlayerResult[]
  winner: String (User ID)
  startedAt: DateTime
  endedAt: DateTime
  rounds: RoundData[]
}

PlayerResult {
  userId: String
  finalScore: Int
  roundScores: Int[]
  placement: Int
}
```

**Features:**
- View past games
- Replay viewer (stretch goal)
- Statistics dashboard
- Achievement system

### 3.3 Chat System

**Implementation:**
- In-game chat
- Lobby chat
- Private messages
- Emoji support
- Chat history (last 50 messages)

## Phase 4: Matchmaking Improvements

### 4.1 Skill-Based Matchmaking

**ELO Rating System:**
```javascript
UserRating {
  userId: String
  rating: Int (default: 1200)
  gamesPlayed: Int
  uncertainty: Float
}
```

**Matchmaking Algorithm:**
1. Find players within ±200 ELO
2. Expand range every 10 seconds
3. Consider recent opponents
4. Balance wait time vs skill match

### 4.2 Quick Match Options

**Game Modes:**
- Ranked (affects ELO)
- Casual (no ELO change)
- Private (friends only)
- Tournament (future feature)

### 4.3 Reconnection Support

**Implementation:**
1. Store game state in database
2. Allow rejoining within 2 minutes
3. AI takeover for disconnected players
4. Pause game if both players agree

## Phase 5: UI/UX Improvements

### 5.1 New Screens

1. **Main Menu Redesign**
   ```
   - Play Now (Quick Match)
   - Create Game
   - Browse Games
   - Profile
   - Settings
   - Logout
   ```

2. **Profile Dashboard**
   ```
   - Stats Overview
   - Recent Matches
   - Achievements
   - Friends List
   - Customization Options
   ```

3. **Post-Game Screen**
   ```
   - Detailed Score Breakdown
   - Player Comparison
   - Add Friend Button
   - Rematch Option
   - Return to Lobby
   ```

### 5.2 Visual Enhancements

- Animated transitions between screens
- Loading states for async operations
- Toast notifications for events
- Presence indicators (online/in-game/away)
- Themed UI variations

## Technical Implementation Plan

### Backend Structure
```
server/
├── src/
│   ├── auth/
│   │   ├── auth.controller.js
│   │   ├── auth.service.js
│   │   └── jwt.middleware.js
│   ├── users/
│   │   ├── users.controller.js
│   │   ├── users.service.js
│   │   └── users.model.js
│   ├── lobby/
│   │   ├── lobby.controller.js
│   │   ├── lobby.service.js
│   │   └── room.manager.js
│   ├── game/
│   │   ├── game.controller.js
│   │   ├── game.service.js
│   │   └── game.state.js
│   ├── friends/
│   │   ├── friends.controller.js
│   │   └── friends.service.js
│   └── database/
│       ├── prisma.schema
│       └── migrations/
```

### Frontend Structure
```
src/
├── components/
│   ├── auth/
│   │   ├── LoginForm.jsx
│   │   ├── RegisterForm.jsx
│   │   └── AuthGuard.jsx
│   ├── lobby/
│   │   ├── Lobby.jsx
│   │   ├── RoomList.jsx
│   │   ├── CreateRoomModal.jsx
│   │   └── QuickMatch.jsx
│   ├── profile/
│   │   ├── UserProfile.jsx
│   │   ├── StatsDisplay.jsx
│   │   └── MatchHistory.jsx
│   ├── social/
│   │   ├── FriendsList.jsx
│   │   ├── Chat.jsx
│   │   └── OnlineStatus.jsx
│   └── game/
│       └── [existing components]
├── services/
│   ├── auth.service.js
│   ├── api.service.js
│   ├── lobby.service.js
│   └── [existing services]
├── contexts/
│   ├── AuthContext.jsx
│   ├── LobbyContext.jsx
│   └── SocketContext.jsx
└── hooks/
    ├── useAuth.js
    ├── useLobby.js
    └── useSocket.js
```

## Implementation Timeline

### Month 1: Foundation
- Week 1-2: Database setup and user authentication
- Week 3-4: Basic user profiles and login system

### Month 2: Lobby System
- Week 1-2: Game room creation and joining
- Week 3-4: Room browser and quick match

### Month 3: Social Features
- Week 1-2: Friends system
- Week 3-4: Chat implementation

### Month 4: Polish & Matchmaking
- Week 1-2: ELO system and matchmaking
- Week 3-4: UI improvements and testing

## Performance Considerations

### Scalability
- Use Redis for session management
- Implement room-based socket.io namespaces
- Database indexing on frequently queried fields
- CDN for static assets

### Security
- Rate limiting on API endpoints
- Input validation and sanitization
- HTTPS enforcement
- CORS configuration
- SQL injection prevention

### Monitoring
- Error tracking (Sentry)
- Performance monitoring
- User analytics
- Server health checks

## Testing Strategy

### Unit Tests
- Authentication logic
- Game state management
- Matchmaking algorithm
- Database operations

### Integration Tests
- Socket.io events
- API endpoints
- Database transactions
- Session management

### E2E Tests
- User registration flow
- Game creation and joining
- Complete game flow
- Friend interactions

## Future Enhancements

### Phase 6 (Future)
- Tournament system
- Spectator mode
- Mobile app
- AI opponents
- Custom game modes
- Leaderboards
- Seasonal events
- Achievements and rewards
- Replay system
- Voice chat

## Conclusion

This plan transforms Vetrolisci from a simple two-player game into a full-featured multiplayer platform. The phased approach allows for incremental development while maintaining a playable game at each stage. Priority should be given to user authentication and the lobby system as they form the foundation for all other features.