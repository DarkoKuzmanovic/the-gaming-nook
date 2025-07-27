# Small Tweaks Todo List for Vetrolisci

## 🎮 Gameplay Enhancements

### Card Interactions

- [ ] Add card hover preview - show enlarged card on hover with details
- [ ] Add drag-and-drop support for card placement (currently click-only)
- [ ] Show ghost/preview of where card will be placed when hovering over grid
- [ ] Add card flip animation when revealing face-down cards
- [ ] Highlight valid placement spots when a card is selected
- [ ] Add subtle shake animation when trying invalid moves

### Visual Feedback

- [x] Add confetti animation when validating a card
- [ ] Show "+X points" floating text when scoring happens
- [x] Add glow effect to newly placed cards for 5 seconds
- [ ] Pulse animation on cards that can be picked during draft
- [ ] Add victory fanfare sound and animation on game win
- [ ] Show streak indicator when placing multiple cards of same color

## 🎨 UI/UX Improvements

### Menu & Navigation

- [ ] Add "How to Play" button with rules modal on main menu
- [x] Save player name in localStorage for next session
- [x] Add keyboard shortcuts (Enter to confirm, Esc to cancel)
- [ ] Show connection quality indicator (ping/latency)
- [x] Add fullscreen toggle button
- [x] Remember sound/music preferences in localStorage

### In-Game Interface

- [ ] Add timer showing how long current turn is taking
- [ ] Show opponent's cursor/hover position in real-time
- [ ] Add chat emotes/reactions (thumbs up, thinking, well played)
- [ ] Compact mode toggle for smaller screens
- [ ] Show card count remaining in deck
- [ ] Add undo confirmation for critical moves

### Mobile Responsiveness

- [ ] Improve touch controls for mobile devices
- [ ] Add pinch-to-zoom for game board on mobile
- [ ] Optimize card size for mobile screens
- [ ] Add swipe gestures for card selection
- [ ] Bottom sheet pattern for mobile modals

## 📊 Information Display

### Game State Clarity

- [ ] Show mini preview of both grids in corner
- [ ] Add turn history log (collapsible sidebar)
- [ ] Highlight last opponent's move for 3 seconds
- [ ] Show potential score preview before placing
- [ ] Add color zone outline visualization
- [ ] Display "Best Move" hint button (optional aid)

### Statistics & Progress

- [ ] Add round timer with visual countdown
- [ ] Show cards picked/remaining counter during draft
- [ ] Display running score differential (+/- vs opponent)
- [ ] Add achievement notifications (first validation, perfect round)
- [ ] Show personal best score in corner
- [ ] Win/loss indicator after each round

## 🔊 Audio Improvements

### Sound Effects

- [ ] Add unique sound for each card color when placed
- [ ] Different sounds for validation vs regular placement
- [ ] Opponent move notification sound
- [ ] Timer warning sound (last 10 seconds)
- [ ] Round complete jingle
- [ ] Error/invalid move sound

### Music

- [ ] Add 2-3 additional background music tracks
- [ ] Music fade in/out on game state changes
- [ ] Victory and defeat themes
- [ ] Dynamic music intensity based on game phase
- [ ] Ambient sound option (nature sounds, etc.)

## ⚡ Performance & Polish

### Optimizations

- [x] Preload all card images on game start
- [x] Add loading skeleton screens
- [x] Implement card image lazy loading with placeholders
- [x] Cache game state for refresh recovery
- [x] Optimize animation frame rates
- [x] Reduce re-renders with React.memo

### Error Handling

- [ ] Add reconnection attempt indicator
- [ ] Show friendly error messages with retry options
- [ ] Add "Report Bug" button
- [ ] Implement crash recovery (save game state)
- [ ] Network error toast notifications
- [ ] Timeout handling with user feedback

## 🎯 Quick Wins (< 30 min each)

### Immediate Impact

- [x] Add tooltips to all buttons/icons
- [x] Increase click/tap target sizes on mobile
- [x] Add subtle box-shadow to modals
- [x] Implement Escape key to close modals
- [x] Add version number in footer
- [x] Loading spinner style improvements
- [x] Button hover state improvements
- [x] Focus indicators for accessibility
- [x] Smooth scroll animations
- [x] Page title updates based on game state

## 🌟 Player Experience

### Onboarding

- [ ] First-time player tutorial overlay
- [ ] Tooltips for game rules on first play
- [ ] Practice mode against AI (simple random moves)
- [ ] Highlight important UI elements for new players
- [ ] Progressive disclosure of advanced features

### Social Features (Lightweight)

- [ ] Copy game room link to clipboard
- [ ] "Invite Friend" button with shareable link
- [ ] Spectator count display
- [ ] Post-game "Play Again" with same opponent
- [ ] Good game button after match

## 🐛 Bug Fixes & Edge Cases

### Known Issues

- [ ] Handle browser back button during game
- [ ] Fix card image loading errors gracefully
- [ ] Prevent multiple rapid clicks on same action
- [ ] Handle tab switching during animations
- [ ] Fix z-index issues with overlapping elements
- [ ] Ensure proper cleanup on component unmount

### Accessibility

- [ ] Add ARIA labels to all interactive elements
- [ ] Keyboard navigation support for entire game
- [ ] Screen reader announcements for game events
- [ ] High contrast mode option
- [ ] Colorblind-friendly mode
- [ ] Font size adjustment option

## Priority Order

### High Priority (Do First)

1. How to Play modal
2. Card hover preview
3. Save player name
4. Reconnection handling
5. Mobile touch improvements

### Medium Priority

1. Turn timer
2. Achievement notifications
3. Sound effect variety
4. Visual feedback improvements
5. Chat emotes

### Low Priority

1. Multiple music tracks
2. Spectator mode prep
3. Practice AI
4. Advanced statistics
5. Replay system groundwork

## Implementation Tips

- Start with the "Quick Wins" section for immediate improvements
- Test each change on both desktop and mobile
- Get player feedback after implementing 3-5 changes
- Keep performance in mind - profile before/after changes
- Document any new features for future development
- Consider feature flags for experimental changes
