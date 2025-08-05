# Missing Features Analysis - Legacy vs Current Vetrolisci Implementation

This document outlines features present in the legacy implementation (`/legacy/`) that are missing from the current multiplayer Vetrolisci implementation.

## High Priority Features

### Audio System
- **Complete audio service** with background music and sound effects
- **5 different sound effects**: place_cards.mp3, play_card.mp3, win.mp3, lose.mp3, validate.mp3
- **Background music** with volume controls and looping
- **Audio toggle controls** for both music and sound effects
- **Audio loading/error handling** with graceful fallbacks

### Enhanced Draft Experience
- **Dedicated draft phase UI** with visual pick order display
- **Turn indicators** showing whose turn it is with visual highlighting
- **Player hands display** showing cards each player has drafted
- **Pick counter** (Pick X of 4) with remaining cards indicator
- **Card restriction overlays** in draft phase with tooltips explaining why cards can't be picked

## Medium Priority Features

### Game State Management
- **Auto-save game state** to localStorage every 30 minutes
- **Recovery from page refresh** - restores full game state including draft phase
- **Cache expiration management** with automatic cleanup
- **Cache validation** and error handling for corrupted data

### Image Loading & Performance
- **Preload all card images** on app startup to prevent loading delays
- **Intersection Observer integration** for lazy loading optimization
- **Loading statistics and progress tracking**
- **Failed image retry logic** and error recovery

### UI Components
- **Skeleton loaders** for loading states (card, grid, hand, score variants)
- **Lazy image loading** with intersection observer and shimmer effects
- **Card hand display** for showing available cards in player's hand
- **Back to Menu modal** with confirmation dialog

### User Experience
- **Player name persistence** in localStorage
- **Connection status monitoring** with visual indicators

## Low Priority Features

### Visual Polish
- **Confetti animation** for card validation celebrations
- **Background image system** with repeating pattern
- **Visual overlay effects** with backdrop blur and transparency
- **Enhanced font system** using "Grandstander" font family

### Navigation & Accessibility
- **Keyboard shortcuts support** with help overlay
- **Fullscreen toggle** functionality with dedicated button
- **Arrow key navigation** through cards and grid positions
- **Accessibility features** for keyboard-only play

### Animation & Feedback
- **Tilt-wobble animations** for turn indicators
- **Smooth transitions** between game states
- **Enhanced loading states** with progress indicators
- **Turn phrase variety** with randomized "waiting for" synonyms ("Summoning", "Consulting the oracle", etc.)

### Quality of Life
- **Dynamic page title updates** based on game state and turn
- **Enhanced header layout** with logo integration and game info display

## Implementation Considerations

### Architecture Differences
The legacy implementation has a **single-game focus** with integrated services, while the current implementation has an **isolated multi-game architecture**. Missing features would need adaptation:

- **Audio service** - Needs game-specific integration within the new modular structure
- **Caching** - Must work with room-based multiplayer system
- **Image preloading** - Handle new asset organization in `/public/vetrolisci/`
- **UI components** - Integrate with new `shared/games` folder structure

### Asset Requirements
- **Audio files**: 6 audio files (1 music + 5 sound effects) need to be moved from legacy
- **Background images**: `background.jpg` and `background3.jpg` for visual theming
- **Icons**: Additional UI icons for fullscreen, keyboard help, etc.

### Development Priority Recommendation
1. **Start with audio system** - Highest user impact for gameplay experience
2. **Add enhanced draft UI** - Core gameplay improvement
3. **Implement caching/recovery** - Prevents frustration from lost progress
4. **Polish with animations/visuals** - Final enhancement layer

## File Mapping Reference

### Legacy Services → Current Structure
- `legacy/src/services/audio.js` → `src/games/vetrolisci/client/services/audio.js`
- `legacy/src/services/gameStateCache.js` → `src/shared/client/services/gameStateCache.js`
- `legacy/src/services/imagePreloader.js` → `src/games/vetrolisci/client/services/imagePreloader.js`

### Legacy Components → Current Structure
- `legacy/src/components/DraftPhase.jsx` → `src/games/vetrolisci/client/components/DraftPhase.jsx`
- `legacy/src/components/Confetti.jsx` → `src/games/vetrolisci/client/components/Confetti.jsx`
- `legacy/src/components/BackToMenuModal.jsx` → `src/shared/client/components/BackToMenuModal.jsx`

### Legacy Assets → Current Structure
- `legacy/public/audio/` → `public/vetrolisci/audio/`
- `legacy/public/background*.jpg` → `public/vetrolisci/backgrounds/`