# Frontend Guide - The Gaming Nook

This document maps out all screens, components, and UI elements in the project for easy reference during development.

## 🎯 Navigation Flow

```
Browser Load → Main Menu → Game Selection → Waiting Room → Game Play
                    ↓           ↑              ↑
                Join Game  ← Back Button  ← Leave Room
```

---

## 📱 Screens & Views

### 1. **Main Menu** (`currentView === "menu"`)
**Location**: `src/App.jsx` line ~325  
**CSS**: `.menu`, `.menu-title`, `.menu-buttons` in `src/App.css`

**Elements**:
- **Menu Title**: "🎮 Gaming Nook" (h1) with gaming emoji
- **Menu Subtitle**: "Choose your next adventure" (p)  
- **Create Game Button** - Green success variant, leads to Game Selection
- **Join Game Button** - Blue primary variant, leads to Join Game Screen
- **Connection Status** - Red warning indicator (only when disconnected)

**Current State**: 400px centered glassmorphism container with visual hierarchy, no App Header
**Recent Changes**: Added centered container design, title/subtitle, hidden header for cleaner focus

---

### 2. **Game Selection Screen** (`currentView === "create"`)
**Location**: `src/App.jsx` line ~351  
**CSS**: `.create-game`, `.create-game-title`, `.game-selection`, `.game-card` in `src/App.css`

**Elements**:
- **Page Title**: "Select Game Type" (h2) with styled title section
- **Page Subtitle**: "Pick your game and create a room to play with friends" (p)
- **Game Cards Container**: Grid layout with glassmorphism cards
  - **Vetrolisci Card**: Glassmorphism card with hover effects and shine animation
  - **Connect 4 Card**: Glassmorphism card with hover effects and shine animation
- **Back Button**: Outline variant, returns to Main Menu

**Current State**: 600px centered glassmorphism container with enhanced game cards, no App Header
**Recent Changes**: Added title/subtitle section, glassmorphism cards with hover animations, hidden header for consistency

---

### 3. **Join Game Screen** (`currentView === "join"`)
**Location**: `src/App.jsx` line ~371  
**CSS**: `.join-game`, `.join-form` in `src/App.css`

**Elements**:
- **Page Title**: "Join Game" (h2)
- **Room Code Input**: 6-character uppercase input field
- **Join Game Button**: Primary variant, disabled until valid room code entered
- **Back Button**: Outline variant, returns to Main Menu

---

### 4. **Waiting Room** (`currentView === "waiting"`)
**Location**: `src/App.jsx` line ~399  
**CSS**: `.waiting-room` in `src/App.css`

**Elements**:
- **Room Code Display**: Large prominent room code with copy button
- **Game Type Info**: Shows selected game (Vetrolisci/Connect 4)
- **Player Counter**: "Players: X/2" indicator
- **Share Instructions**: "Share this code with your friend"
- **Loading Spinner**: With "Waiting for another player to join..." text
- **Leave Room Button**: Outline variant, returns to Main Menu

---

### 5. **Game Screen** (`currentView === "game"`)
**Location**: `src/App.jsx` line ~434

**Conditional Rendering**:
- **Vetrolisci Game**: `VetrolisciGameBoard` component
- **Connect 4 Game**: `Connect4GameBoard` component

---

## 🎮 Game-Specific Screens

### **Vetrolisci Game Screen**
**Location**: `src/games/vetrolisci/client/components/GameBoard.jsx`  
**CSS**: `src/games/vetrolisci/client/components/GameBoard.css`

**Key Elements**:
- **Game Grid**: 3x3 card placement grid
- **Draft Area**: Shows 4 cards to choose from
- **Score Display**: Current round scores
- **Card Choice Modal**: When duplicate cards need resolution
- **Placement Choice Modal**: When validated cards need face-down placement
- **Round Complete Modal**: End-of-round summary with scores
- **Back to Menu Button**: Returns to main menu

---

### **Connect 4 Game Screen**
**Location**: `src/games/connect4/client/components/GameBoard.jsx`  
**CSS**: `src/games/connect4/client/components/GameBoard.css`

**Key Elements**:
- **Column Headers**: Clickable column selectors (1-7)
- **Game Grid**: 6×7 Connect 4 grid with animated disc drops
- **Turn Indicator**: Shows whose turn it is
- **Win/Draw Message**: Game result display
- **Play Again Button**: Restart game (host only)
- **Back to Menu Button**: Returns to main menu

---

## 🏗️ Shared Components

### **App Header** 
**Location**: `src/App.jsx` line ~247  
**CSS**: `.app-header` in `src/App.css`

**Structure**: 3-column grid layout
- **Header Left**: Game title and room code
- **Header Center**: Turn indicator (during gameplay)
- **Header Right**: Round progress (Vetrolisci) or game status (Connect 4)

### **Button Component**
**Location**: `src/shared/client/components/Button.jsx`

**Variants**:
- `primary` - Blue button
- `success` - Green button  
- `danger` - Red button
- `outline` - White with border

**Sizes**: `small`, `medium`, `large`

### **Modal Component**
**Location**: `src/shared/client/components/Modal.jsx`

**Props**: `isOpen`, `onClose`, `title`, `children`

### **Loading Spinner**
**Location**: `src/shared/client/components/LoadingSpinner.jsx`

**Usage**: Used in waiting room and loading states

---

## 🎨 Styling System

### **CSS Organization**
**Main Styles**: `src/App.css` - organized in sections:
- App Layout
- Header Layout  
- Turn Indicator
- Round Progress
- Menu System
- Game Selection
- Forms
- Waiting Room
- Modals
- Mobile Responsive

### **Theme System**
**Location**: `src/shared/client/styles/theme.css`
- CSS custom properties for colors, spacing, typography
- Imported globally in `main.jsx`

---

## 🎯 Key Interaction Patterns

### **Room Management**
1. **Create Room**: Main Menu → Game Selection → Waiting Room → Game
2. **Join Room**: Main Menu → Join Game → Waiting Room → Game
3. **Leave/Back**: Any screen can return to Main Menu

### **Game State Management**
- **Socket.IO Events**: Real-time multiplayer synchronization
- **Turn-based Logic**: Players alternate turns
- **Modal Interactions**: Card/disc placement decisions

### **Responsive Design**
- **Desktop**: Side-by-side game cards, full header
- **Mobile**: Stacked cards, collapsed header elements

---

## 🔧 Development Notes

### **File Structure**
```
src/
├── App.jsx                 # Main app with routing logic
├── App.css                 # Global styles
├── shared/client/
│   ├── components/         # Reusable UI components
│   └── styles/theme.css   # CSS variables
└── games/
    ├── vetrolisci/client/components/
    └── connect4/client/components/
```

### **Current State**
- ✅ Connect 4 fully implemented and working
- ✅ Simple, clean UI without enhanced animations
- ✅ Responsive design for mobile/desktop
- ✅ Real-time multiplayer via Socket.IO

---

## 📋 Quick Reference

**To target a specific element in our discussions:**
- Use the **bold element names** from this guide
- Reference the **screen name** + **element name**
- Example: "Let's update the **Game Selection Screen** → **Vetrolisci Card**"

**Common Terminology**:
- **Screen/View** = Top-level page (Menu, Game Selection, etc.)
- **Element** = Specific UI component (button, input, modal, etc.)
- **Component** = Reusable React component (Button, Modal, etc.)