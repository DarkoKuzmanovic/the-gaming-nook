# The Gaming Nook Revamp - Q&A Planning Document

## Overview

This document contains questions to clarify the vision and requirements for the simplified multi-game implementation. Please fill out your answers and we'll use this to create the detailed revamp plan.

**Starting Point**: Reverting to SHA1 `a4b2c36e463cbf52ca1275e534edd8b53a074bdd` (last working Vetrolisci version)

---

## Architecture & Game Isolation

### 1. Game Structure

Should each game be completely self-contained (separate files, separate socket events, separate game state handling)? Or do you want some minimal shared utilities (like card shuffling, basic game room management)?

**Your Answer:** I'd like to have minimal sharing of simple utilities. Such as array/card shuffling, basic room ID generation, socket broadcasting helpers, simple UI components (buttons, modals etc). Never share: game logic, game state manageent, game-specific socket events and complex UI components.

### 2. Client-Side Architecture

For the frontend, should each game have its own React component tree that's completely independent, or is it OK to share basic UI components (buttons, modals, etc.)?

**Your Answer:** Simple UI components can be shared. But more complex ones, no.

### 3. Server-Side Game Management

Should each game type have its own server file (like `vetrolisci-server.js`, `connect4-server.js`) with minimal shared code, or prefer a more modular approach?

**Your Answer:** I'd like to have minimal sharing of the code, such as room creation, player matching, disconnect handling. Anything specific, like game logic should never be shared.

### 4. Shared Code Philosophy

What's your tolerance for shared code vs duplication? For example:

- Completely isolated: Each game duplicates basic functions like room management
- Minimal sharing: Share only essential utilities (room creation, player matching)
- Moderate sharing: Share common game patterns but keep game logic separate

**Your Answer:** I'd like to have minimal sharing of the code, such as room creation, player matching, disconnect handling. Anything specific, like game logic should never be shared.

---

## User Experience & Authentication

### 5. Authentication Flow

For the simple auth (no email), what user info do we need? Just username + password? Should users be able to play as guests without accounts?

**Your Answer:** Username + password. But we can have guest playing as well. They should have random generated names with combination of two words from dictionary.

### 6. Guest vs Registered Users

If both guests and registered users are supported:

- Should guests have any limitations?
- Should there be any incentive to register (stats, game history)?
- Can registered and guest users play together?

**Your Answer:** Guests can play with each other and with registered users. But registered users can have more features, such as custom avatars, game history, stats, etc.

### 7. Game Joining Method

How should friends connect to play together?

- Share a simple game code/room ID?
- Username-based invites?
- Just "create game, share link"?
- Something else?

**Your Answer:** We wanna do it simple, so sharing a simple game code/room ID is the best option and would be sufficient. Room ID should be case insensitive, expire after 30 minutes,and we should have status, like "waiting", "in progress", "expired".

### 8. Game Selection UI

Should there be:

- A simple lobby showing available game types → pick → matchmake/create room?
- Direct "Play Vetrolisci" / "Play Connect4" buttons?
- A more elaborate game selection screen?

**Your Answer:** Simple lobby would be great. Here's what flow should look like:

Main Screen:

┌─────────────────────────────┐
│ The Gaming Nook │
│ │
│ ┌─────────────────────┐ │
│ │ Create Game │ │
│ └─────────────────────┘ │
│ │
│ ┌─────────────────────┐ │
│ │ Room Code: [______] │ │
│ │ [Join Game] │ │
│ └─────────────────────┘ │
│ │
│ [Guest] or [Sign In] │
└─────────────────────────────┘

Create Game Flow:

Create Game clicked:
┌─────────────────────────────┐
│ Select Game Type │
│ │
│ ┌─────────────────────┐ │
│ │ Vetrolisci │ │
│ │ (Card Strategy) │ │
│ └─────────────────────┘ │
│ │
│ ┌─────────────────────┐ │
│ │ Connect 4 │ │
│ │ (Drop & Connect) │ │
│ └─────────────────────┘ │
│ │
│ [Back] │
└─────────────────────────────┘

After selecting game:
┌─────────────────────────────┐
│ Room Code: H3K9M2 │
│ │
│ Share this code with │
│ your friend to start │
│ playing Vetrolisci! │
│ │
│ 👥 Waiting for player... │
│ │
│ [Copy Code] [Cancel] │
└─────────────────────────────┘

Join Game Flow:

After entering room code:
┌─────────────────────────────┐
│ Joining room H3K9M2... │
│ │
│ 🎮 You're about to join │
│ a Vetrolisci game │
│ │
│ 👤 Hosted by: Alice │
│ ⏱️ Game Status: Waiting │
│ │
│ [Join Game] [Back] │
└─────────────────────────────┘

If room doesn't exist:
┌─────────────────────────────┐
│ Room Not Found │
│ │
│ ❌ Room "H3K9M2" doesn't │
│ exist or has expired │
│ │
│ • Check the code │
│ • Ask for a new code │
│ │
│ [Try Again] │
└─────────────────────────────┘

Nice-to-Have Features:

Room Preview: Show game rules/description before joining
Recent Codes: Remember last few room codes entered
Quick Actions: "Copy room code" button
Status Updates: "Alice joined!" notifications

This UI flow perfectly matches the simplicity we're aiming for - create and share, or enter and join. No complex decisions for users!

### 9. Waiting for Players

When someone creates a game room, how should the waiting experience work?

- Show a room code to share?
- Automatic matchmaking with random players?
- Both options available?

**Your Answer:** Showing a room code to share. Don't want to have at th emoment automatic matchmaking.

---

## Technical Decisions

### 10. Data Storage

What minimal data do we need to persist?

- User accounts (username/password hash)?
- Game history/stats?
- Or keep everything in-memory for maximum simplicity?

**Your Answer:** User accounts (username/password hash). Game history/stats can be kept in-memory for maximum simplicity.

### 11. Session Management

For user sessions:

- Simple JWT tokens?
- Server-side sessions?
- Browser localStorage only?

**Your Answer:** Because we're gonna have a simple username/password login, we can use Sim JWT tokens.

### 12. Legacy Code Usage Strategy

Should we:

- Start by copying the working legacy Vetrolisci and then add other games?
- Rebuild Vetrolisci from scratch using the new isolated architecture?
- Use legacy as reference but write everything fresh?

**Your Answer:** We'll start from copying the working legacy Vetrolisci game and use that for a work folder and build from there.

### 13. Development Environment

Preferences for the development setup:

- Keep the current Vite + Express setup?
- Simplify to a single server file?
- Any specific technology changes?

**Your Answer:** Let's keep Vite + Express setup.

Development Commands (Keep These):

npm run dev # Start both frontend + backend
npm run server # Backend only
npm run client # Frontend only
npm run build # Production build

Small Improvements You Could Make:

Simplified package.json

Remove unused dependencies and keep only what you need for games.

Environment Variables

// Simple config
const PORT = process.env.PORT || 8001;
const NODE_ENV = process.env.NODE_ENV || 'development';

Single Build Output

Keep Vite building everything to one dist/ folder.

---

## Game-Specific Questions

### 14. Vetrolisci Features

Keep all current features (card validation, scoring system, 3 rounds, complex placement rules) or simplify anything?

**Your Answer:** Keep features as is. No changes there.

### 15. Future Games List

What other games are you planning to implement? This helps determine what (if anything) should be shared between games.

**Your Answer:** I want to implement some simple card games, 2 player focused, 15-30 min gameplays. Some ideas: Mancala, Sushi Go clone, 7 Wonders Duel clone, Connect 4, mayb eUltimate Tic Tac Toe. Games like that.

### 16. Game Complexity Target

Should all games aim for:

- Quick 5-10 minute games?
- Allow longer strategic games?
- Mix of both?

**Your Answer:** Aim is to have 15-30 min gameplay. That's the main focus for now.

### 17. Game State Persistence

Should games be resumable if players disconnect, or just end the game?

**Your Answer:** Let's start without game state persistence. We can add that later.

---

## Development Approach

### 18. Migration Strategy

Should we:

- Start completely fresh in a new folder structure?
- Gradually replace current files?
- Build alongside current implementation in a separate branch?

**Your Answer:** I planned to start fresh and have a Legacy folder with working Vatrolisci implementation inside the repo, for reference. Then we can start building new games from there.

### 19. Testing During Development

How do you want to test multiplayer functionality during development?

- Two browser windows on same machine?
- Need network testing capabilities?
- Any automated testing requirements?

**Your Answer:** Two browser windows on same machine and I do need network testing, e.g. In package.json or vite.config.js: "dev": "vite --host 0.0.0.0" then I can access from different computer http://192.168.1.xxx:5173

### 20. File Organization

Preferred folder structure approach:

- `/games/vetrolisci/`, `/games/connect4/` with everything game-specific inside?
- `/client/games/`, `/server/games/` separation?
- Completely flat structure?

**Your Answer:** I'd like to have game-centric structure. For example:

/src/
├── games/
│ ├── vetrolisci/
│ │ ├── client/
│ │ │ ├── VetrolisciGame.jsx
│ │ │ ├── VetrolisciBoard.jsx
│ │ │ ├── Card.jsx
│ │ │ └── vetrolisci.css
│ │ ├── server/
│ │ │ └── vetrolisci-server.js
│ │ ├── shared/
│ │ │ ├── cards.js
│ │ │ ├── rules.js
│ │ │ └── validation.js
│ │ └── README.md
│ │
│ └── connect4/
│ ├── client/
│ │ ├── Connect4Game.jsx
│ │ └── Connect4Board.jsx
│ ├── server/
│ │ └── connect4-server.js
│ └── shared/
│ └── connect4-rules.js
│
├── shared/
│ ├── client/
│ │ ├── components/
│ │ │ ├── Modal.jsx
│ │ │ └── Button.jsx
│ │ └── utils/
│ │ └── socket-client.js
│ └── server/
│ ├── utils/
│ │ └── room-manager.js
│ └── main.js
│
└── public/
├── cards/
├── icons/
└── audio/

Why this is perfect for us:

- ✅ True isolation: Everything for Vetrolisci is in one folder
- ✅ Easy debugging: Bug in Vetrolisci? Look in /games/vetrolisci/
- ✅ Self-contained: Could copy /games/vetrolisci/ to another project
- ✅ Clear ownership: Each game owns its files completely

### 21. Error Handling Philosophy

For multiplayer games, how should we handle errors:

- Graceful degradation (continue game with best effort)?
- Strict validation (end game on any error)?
- Player-friendly error recovery?

**Your Answer:** It should work like this:

Handle different types of errors differently:

Tier 1: Minor Errors (Graceful Recovery)

// User mistakes - help them fix it

- Invalid card selection → "Please pick a different card"
- Wrong grid position → "That spot is taken, try another"
- Out of turn action → "Wait for your turn"

// Response: Show helpful message, let them retry

Tier 2: Serious Errors (Controlled Ending)

// Game logic violations - end cleanly

- Impossible game state detected
- Player tries to cheat/exploit
- Server can't validate move

// Response: End game with clear explanation

Tier 3: System Errors (Immediate Termination)

// Technical failures - crash gracefully

- Database connection lost
- Server memory issues
- Network completely fails

---

## Additional Considerations

### 22. Mobile Support

Should the games work well on mobile browsers, or desktop-focused?

**Your Answer:** Desktop first, but it should work well on mobile too.

### 23. Performance Requirements

Any specific performance targets (number of concurrent games, response times, etc.)?

**Your Answer:** It's a simple game, so it should be I don't think we'll ever have more than 20-30 concurrent games on a single server.

### 24. Deployment Simplicity

Preferred deployment approach:

- Single server deployment?
- Docker containers?
- Cloud platform preference?
- Maximum simplicity for hosting costs?

**Your Answer:** I'd like to deploy on my own VPS server in future. For now I'll keep the workflow on local.

### 25. Future Extensibility

How important is it that the architecture can easily accommodate:

- More than 2 players per game?
- Real-time spectators?
- Game replays?
  (vs keeping it strictly 2-player focused)

**Your Answer:** At the moment I don't have any plans for these features, but I want to keep the architecture flexible enough to add them later.

---

## Open Questions

### 26. Any Other Requirements

Anything else important that wasn't covered above?

**Your Answer:**

- Audio system with toggleable background music and sound effects
- Copy room code button with visual feedback
- Recent room codes history for convenience
- Basic keyboard shortcuts (Enter to join, Escape to close modals)
- Loading states and visual feedback for all user actions
- Console logging with different levels for easier debugging
- Health check endpoint for server monitoring

### 27. Deal Breakers

Any approaches or technologies you definitely want to avoid?

**Your Answer:**

- No complex frameworks (Next.js, Redux, TypeScript) - keep it simple with Vite + React + Express
- No traditional databases or ORMs - in-memory storage fits our scale perfectly
- No heavy development tooling (complex webpack configs, testing frameworks, linters) - manual testing and simple
  builds
- No containerization or complex deployment (Docker, CI/CD) - direct VPS deployment is simpler
- No OAuth or complex authentication systems - simple username/password is sufficient
- No CSS frameworks or component libraries - custom styling gives us full control
- No microservices architecture - monolithic approach is easier to maintain and debug

### 28. Timeline Expectations

Rough timeline expectations for the revamp?

**Your Answer:** Doesn't matter. We can start with the most important features and then add more later.

---

**Please fill out this Q&A and we'll create a detailed revamp.md plan based on your answers!**
