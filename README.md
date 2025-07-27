# Vetrolisci - Digital Pixies Card Game

A real-time multiplayer implementation of the strategic card game Pixies for 2 players. Built with React, Node.js, and Socket.IO.

## 🎮 Game Overview

Vetrolisci brings the Pixies card game to life with an intuitive digital interface. Players strategically place cards in a 3×3 grid across 3 rounds, scoring points through validated card numbers, symbols, and color zones.

### Key Features

- **Real-time Multiplayer**: Instant synchronization between players
- **Strategic Gameplay**: Multiple placement scenarios with tactical decisions
- **Visual Feedback**: Animations, confetti effects, and glow indicators
- **Audio Experience**: Sound effects and background music
- **Responsive Design**: Works on desktop and mobile devices
- **Performance Optimized**: Image preloading, lazy loading, and state caching

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd vetrolisci
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

This starts both the backend server (port 8001) and frontend development server (port 5173).

### Available Scripts

```bash
# Start both client and server in development mode
npm run dev

# Run only the backend server
npm run server

# Run only the frontend client
npm run client

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm test

# Lint code
npm run lint

# Type checking
npm run typecheck
```

## 🎯 How to Play

### Game Structure

- **3 Rounds**: Each round consists of multiple turns
- **Turn-based Draft**: Players alternate picking cards from revealed sets
- **Strategic Placement**: Cards must be placed according to specific rules
- **Scoring**: Points awarded for validated numbers, symbols, and color zones

### Card Placement Scenarios

1. **Empty/Face-down**: Place card on its number position (1-9)
2. **Duplicate Number**: Choose which card stays face-up
3. **Already Validated**: Place face-down on any empty space (strategic choice)

### Scoring System

- **Validated Numbers**: Sum of face-up validated card values
- **Symbols**: +1 per spiral (🌀), -1 per cross (✖️), special card bonuses
- **Color Zones**: Largest connected color group × round multiplier (2x/3x/4x)

For complete rules, see [vetrolisci-ruleset.md](./vetrolisci-ruleset.md).

## 🏗️ Architecture

### Frontend (React + Vite)
- **Components**: Modular React components for game UI
- **State Management**: React hooks with real-time synchronization
- **Styling**: CSS modules with animations and responsive design
- **Audio**: Web Audio API integration for sounds and music

### Backend (Node.js + Express)
- **Real-time Communication**: Socket.IO for multiplayer functionality
- **Game Logic**: Server-authoritative game state management
- **Card System**: 70-card deck with strategic placement validation
- **Session Management**: In-memory game and player storage

### Key Technologies

- **React 18**: Modern React with hooks and concurrent features
- **Socket.IO**: Real-time bidirectional communication
- **Vite**: Fast development server and build tool
- **Express**: Backend web framework
- **CSS3**: Modern styling with animations and effects

## 📁 Project Structure

```
src/
├── components/          # React UI components
│   ├── GameBoard.jsx   # Main game container
│   ├── GameGrid.jsx    # 3×3 card grid display
│   ├── DraftPhase.jsx  # Card picking interface
│   ├── Card.jsx        # Individual card component
│   ├── ScoreBoard.jsx  # Score tracking display
│   └── ...             # Modal and utility components
├── game/               # Game logic modules
│   ├── draft.js        # Draft phase mechanics
│   ├── placement.js    # Card placement logic
│   ├── scoring.js      # Scoring calculations
│   └── validation.js   # Card validation rules
├── data/
│   └── cards.js        # 70-card game deck definition
└── services/
    ├── socket.js       # Socket.IO client wrapper
    ├── gameStateCache.js # Game state persistence
    └── imagePreloader.js # Asset optimization
```

## 🎨 Features

### Visual Polish
- **Smooth Animations**: Card placement, hover effects, and transitions
- **Confetti Effects**: Celebration animations for card validation
- **Glow Indicators**: 5-second highlighting for newly placed cards
- **Loading States**: Skeleton screens and progress indicators
- **Responsive UI**: Adaptive layout for different screen sizes

### User Experience
- **Keyboard Shortcuts**: ESC to close modals, Enter to confirm
- **Persistent Settings**: localStorage for player name and preferences
- **Error Handling**: Graceful connection recovery and user feedback
- **Accessibility**: Focus indicators and ARIA-friendly design

### Performance
- **Image Preloading**: All card images loaded on game start
- **Lazy Loading**: Progressive image loading with placeholders
- **State Caching**: Game state persistence across page refreshes
- **Optimized Rendering**: React.memo and efficient re-render patterns

## 🔧 Development

### Code Style
- **ESLint**: Configured for React and modern JavaScript
- **TypeScript**: Type checking without migration complexity
- **CSS Modules**: Component-scoped styling
- **Git Hooks**: Pre-commit validation and formatting

### Testing
```bash
npm test          # Run test suite
npm run lint      # Check code style
npm run typecheck # Validate types
```

### Debugging
- **Console Logging**: Comprehensive debug output for game events
- **React DevTools**: Component inspection and profiling
- **Network Tab**: Socket.IO message monitoring
- **Performance Profiler**: Animation and rendering optimization

## 🌐 Deployment

### Production Build
```bash
npm run build
npm run preview  # Test production build locally
```

### Environment Configuration
- **Development**: Hot reload with source maps
- **Production**: Optimized bundle with compression
- **Socket.IO**: Configurable server endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Darko Kuzmanovic** - *Initial work and development*

## 🎯 Roadmap

See [small-tweaks-todo.md](./small-tweaks-todo.md) for planned features and improvements:

- **Gameplay**: Card hover previews, drag-and-drop, tutorial mode
- **UI/UX**: How-to-play modal, timer indicators, chat emotes
- **Performance**: Additional optimizations and error handling
- **Mobile**: Enhanced touch controls and responsive design
- **Audio**: Multiple music tracks and dynamic sound effects

## 🐛 Bug Reports

Found a bug? Please create an issue with:
- Steps to reproduce
- Expected vs actual behavior
- Browser and device information
- Console errors (if any)

---

*Experience the strategic depth of Pixies in a beautifully crafted digital environment. Every card placement matters!*