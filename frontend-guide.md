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
**Location**: `src/App.jsx` line ~391  
**CSS**: `.join-game`, `.join-game-title`, `.join-form`, `.room-code-input` in `src/App.css`

**Elements**:
- **Page Title**: "Join Game" (h2) with styled title section
- **Page Subtitle**: "Enter your room code to join friends" (p)
- **Room Code Input**: Enhanced 6-character uppercase input with glassmorphism styling
- **Join Game Button**: Primary variant, disabled until valid room code entered
- **Back Button**: Outline variant, returns to Main Menu

**Current State**: 400px centered glassmorphism container with enhanced input styling, no App Header
**Recent Changes**: Added title/subtitle section, glassmorphism container and input, hidden header for consistency

---

### 4. **Waiting Room** (`currentView === "waiting"`)
**Location**: `src/App.jsx` line ~423  
**CSS**: `.waiting-room`, `.waiting-room-title`, `.room-code-share`, `.room-info` in `src/App.css`

**Elements**:
- **Page Title**: "Room Created!" (h2) with styled title section
- **Page Subtitle**: "Share your room code and wait for friends to join" (p)
- **Room Code Display**: Large prominent room code with glassmorphism styling and clipboard icon copy button (📋)
- **Enhanced Room Info Card**: Unified glassmorphism card with two sections:
  - **Game Section**: Game icon (🎴/🔴) + "Playing [GameName]" with visual hierarchy
  - **Players Section**: Visual player slots showing filled/waiting states + animated progress indicators
- **Loading Spinner**: With "Waiting for another player to join..." text
- **Leave Room Button**: Outline variant, returns to Main Menu

**Current State**: 500px centered glassmorphism container with enhanced room code display and info cards, no App Header
**Recent Changes**: Added title/subtitle section, glassmorphism container, enhanced room info card with game icons and player progress indicators, matched widths (380px) for room code and info card, clipboard icon for copy button, hidden header for consistency

---

### 5. **Game Screen** (`currentView === "game"`)
**Location**: `src/App.jsx` line ~434

**Conditional Rendering**:
- **Vetrolisci Game**: `VetrolisciGameBoard` component
- **Connect 4 Game**: `Connect4GameBoard` component

---

## 🎮 Game-Specific Screens

---

# 🎴 **VETROLISCI GAME - COMPREHENSIVE BREAKDOWN**

## **Main Game Container**
**Location**: `src/games/vetrolisci/client/components/GameBoard.jsx`  
**CSS**: `src/games/vetrolisci/client/components/GameBoard.css`

### **🏆 Enhanced Game Status Card**
**Purpose**: Top navigation and game state display
- **Game Icon & Title**: 🎴 Vetrolisci with room code display
- **Round Progress**: Current round number (no phase text)
- **Turn Indicator**: "Your Turn" vs "Opponent Turn" with proper tracking
- **Current State**: ✅ Unified glassmorphism styling with fixed turn logic

### **🎯 Game Content Container** 
**Purpose**: Main glassmorphism container holding all game elements
- **Background**: Unified glassmorphism with backdrop blur
- **Layout**: Flexbox column with proper spacing
- **Current State**: ✅ Enhanced styling matching other screens

---

## **🎴 CORE GAME COMPONENTS**

### **1. Draft Phase Component (Available Cards Section)**
**File**: `src/games/vetrolisci/client/components/DraftPhase.jsx`
**CSS**: `src/games/vetrolisci/client/components/DraftPhase.css`
- **Purpose**: Shows 4 cards to pick from during draft rounds in card-inspired container
- **Features**: 
  - **Card-inspired main container** with hover effects and card styling
  - **Available Cards display** with enhanced 3D card hover transforms
  - **Card restriction overlays** with improved styling and error borders
  - **Draft completion notices** using card-like styling with success accents
  - **Error handling** with card-inspired error banners
- **Current State**: ✅ **RECENTLY ENHANCED** - Complete card-inspired overhaul with 3D effects

### **2. Game Grid Component - COMPREHENSIVE ASSESSMENT**
**File**: `src/games/vetrolisci/client/components/GameGrid.jsx`
**CSS**: `src/games/vetrolisci/client/components/GameGrid.css`
- **Purpose**: 3x3 grid container displaying placed cards for player and opponent
- **Current Architecture**: CSS Grid layout with Framer Motion animations, responsive breakpoints
- **Features**: Card placement animations, state management (new/glowing/confetti), space numbering
- **Current State**: ⚠️ **NEEDS MAJOR UPDATES** - Multiple design and performance issues identified

#### **🔧 Issues Identified:**
1. **Design Inconsistency**: Dashed borders don't match card-inspired theme
2. **Animation Conflicts**: Layout props + complex 3D transforms causing performance issues  
3. **Styling Misalignment**: Hard-coded colors, missing CSS variables, no card aesthetic
4. **Visual Hierarchy**: Space numbers and opponent grid need better contrast/distinction
5. **Performance**: Multiple backdrop-filters and layout animations causing inefficiency

#### **💡 Priority Improvements Needed:**
- **Card-Inspired Redesign**: Replace dashed borders with card-like styling
- **Animation Optimization**: Remove layout conflicts, simplify card placement
- **Theme Integration**: Use CSS variables, match overall design system
- **Performance Optimization**: Reduce expensive effects, streamline animations

### **3. Individual Card Component - COMPREHENSIVE ASSESSMENT**
**File**: `src/games/vetrolisci/client/components/Card.jsx`
**CSS**: `src/games/vetrolisci/client/components/Card.css`
- **Purpose**: Core card display component handling front/back/empty/validated states
- **Current Architecture**: React memo component with LazyImage integration, Framer Motion support
- **Features**: Multiple card states, fallback system, validation animations, hover effects
- **Current State**: ✅ **RECENTLY OVERHAULED** - Complete transformation with all critical issues resolved

#### **🎉 OVERHAUL COMPLETED - All Critical Issues Fixed:**
1. **✅ Image Sizing Problem**: Fixed `object-fit: cover` → `contain` for proper image display
2. **✅ Animation Inconsistencies**: Unified all hover effects - removed complex 3D from validated cards
3. **✅ Performance Issues**: Optimized glow animations, added will-change properties
4. **✅ Styling Inconsistencies**: Integrated CSS variables throughout, removed hard-coded values
5. **✅ Visual Hierarchy**: Enhanced validation feedback, improved selected state design
6. **✅ Premium Polish**: Added subtle depth, inner shadows, improved fallback design

#### **🚀 Improvements Delivered:**
- **🎯 FIXED**: Card images now display perfectly without cropping
- **⚡ UNIFIED**: Consistent hover animations across all card states
- **🎨 INTEGRATED**: Full design system integration with CSS variables
- **🚀 OPTIMIZED**: Better performance with streamlined animations
- **✨ PREMIUM**: Enhanced visual depth and polish throughout

### **4. Score Board Component**
**File**: `src/games/vetrolisci/client/components/ScoreBoard.jsx`
**CSS**: `src/games/vetrolisci/client/components/ScoreBoard.css`
- **Purpose**: Live score display during gameplay
- **Features**: Player scores, round tracking
- **Current State**: ❓ Likely needs glassmorphism update

---

## **🎭 MODAL COMPONENTS**

### **5. Card Choice Modal**
**File**: `src/games/vetrolisci/client/components/CardChoiceModal.jsx`
**CSS**: `src/games/vetrolisci/client/components/CardChoiceModal.css`
- **Purpose**: Choose between duplicate cards when placing
- **Features**: Side-by-side card comparison
- **Current State**: ❓ May need glassmorphism modal styling

### **6. Placement Choice Modal**
**File**: `src/games/vetrolisci/client/components/PlacementChoiceModal.jsx`
**CSS**: `src/games/vetrolisci/client/components/PlacementChoiceModal.css`
- **Purpose**: Choose grid position for face-down placement
- **Features**: Grid position selection interface
- **Current State**: ❓ May need glassmorphism modal styling

### **7. Round Complete Modal**
**File**: `src/games/vetrolisci/client/components/RoundCompleteModal.jsx`
**CSS**: `src/games/vetrolisci/client/components/RoundCompleteModal.css`
- **Purpose**: Show round results and scores
- **Features**: Score breakdown, continue button
- **Current State**: ❓ Likely needs glassmorphism update

### **8. Turn Score Modal**
**File**: `src/games/vetrolisci/client/components/TurnScoreModal.jsx`
**CSS**: `src/games/vetrolisci/client/components/TurnScoreModal.css`
- **Purpose**: Show individual turn scoring details
- **Current State**: ❓ May need styling assessment

### **9. Scoreboard Modal**
**File**: `src/games/vetrolisci/client/components/ScoreboardModal.jsx`
**CSS**: `src/games/vetrolisci/client/components/ScoreboardModal.css`
- **Purpose**: Detailed scoreboard view (accessible via control button)
- **Current State**: ❓ Likely needs glassmorphism update

---

## **✨ VISUAL EFFECTS COMPONENTS**

### **10. Validation Star Component**
**File**: `src/games/vetrolisci/client/components/ValidationStar.jsx`
**CSS**: `src/games/vetrolisci/client/components/ValidationStar.css`
- **Purpose**: Visual indicator for validated cards
- **Features**: Star animation on validation
- **Current State**: ❓ May need styling assessment

### **11. Confetti Component**
**File**: `src/games/vetrolisci/client/components/Confetti.jsx`
**CSS**: `src/games/vetrolisci/client/components/Confetti.css`
- **Purpose**: Celebration animation for game events
- **Current State**: ❓ Animation styling assessment needed

### **12. Lazy Image Component**
**File**: `src/games/vetrolisci/client/components/LazyImage.jsx`
- **Purpose**: Optimized image loading for card assets
- **Current State**: ✅ Likely fine as utility component

---

## **🎭 MODAL SYSTEM - CARD-INSPIRED DESIGN**

### **📦 Modal Base Component**
**File**: `src/shared/client/components/Modal.jsx`
**CSS**: `src/shared/client/components/Modal.css`
- **Purpose**: Reusable modal wrapper for all modals
- **Features**: Card-inspired styling with 3D perspective effects, fixed overlay positioning (z-index: 1000)
- **Design**: White card background, subtle shadows, card-like borders and hover effects
- **Current State**: ✅ **RECENTLY ENHANCED** - Card-inspired design matching Vetrolisci aesthetic

### **🎴 Vetrolisci Modal Components**

#### **1. CardChoiceModal**
**File**: `src/games/vetrolisci/client/components/CardChoiceModal.jsx`
**CSS**: `src/games/vetrolisci/client/components/CardChoiceModal.css`
- **Purpose**: Choose between existing/new card when duplicate numbers occur
- **Design**: Two-column grid layout with card-inspired choice options featuring 3D hover effects
- **Current State**: ✅ **RECENTLY ENHANCED** - Card-inspired design with 3D perspective and hover transforms

#### **2. PlacementChoiceModal**
**File**: `src/games/vetrolisci/client/components/PlacementChoiceModal.jsx`
**CSS**: `src/games/vetrolisci/client/components/PlacementChoiceModal.css`
- **Purpose**: Select grid position when placing face-down cards
- **Design**: 3x3 position grid with card-inspired buttons featuring subtle 3D effects
- **Current State**: ✅ **RECENTLY ENHANCED** - Card-like buttons with hover transforms and card styling

#### **3. RoundCompleteModal**
**File**: `src/games/vetrolisci/client/components/RoundCompleteModal.jsx`  
**CSS**: `src/games/vetrolisci/client/components/RoundCompleteModal.css`
- **Purpose**: Display round scores and progress between rounds
- **Design**: Card-inspired score panels with subtle hover effects and mini card-like badges
- **Current State**: ✅ **RECENTLY ENHANCED** - Full card aesthetic with score cards that have hover transforms

#### **4. TurnScoreModal**
**File**: `src/games/vetrolisci/client/components/TurnScoreModal.jsx`
**CSS**: `src/games/vetrolisci/client/components/TurnScoreModal.css` 
- **Purpose**: Show turn-by-turn scoring breakdown
- **Current State**: ❓ **NEEDS ASSESSMENT** - May need glassmorphism enhancement

#### **5. ScoreboardModal**
**File**: `src/games/vetrolisci/client/components/ScoreboardModal.jsx`
**CSS**: `src/games/vetrolisci/client/components/ScoreboardModal.css`
- **Purpose**: Detailed game scoreboard display with player scores and round breakdown
- **Design**: Card-inspired player score panels, mini card-like round items, and card-style total scores
- **Animations**: Beautiful Framer Motion entrance with spring physics, 3D transforms, and staggered content reveals
- **Current State**: ✅ **RECENTLY ENHANCED** - Complete card-inspired overhaul + smooth animations matching other modals

### **🔧 Modal Positioning Fix**
- **Issue Fixed**: Modals were appearing below game content in document flow
- **Solution**: Moved all modal components outside game container in `GameBoard.jsx`  
- **Result**: Proper overlay positioning with fixed z-index layering (z-modal: 1000)

---

## **🎮 CONTROL SYSTEM**

### **13. Glassmorphism Control Buttons**
**Location**: Within `GameBoard.jsx`
**CSS**: Styled in `GameBoard.css`
- **Audio Controls**: Sound/Music toggle buttons
- **Scoreboard Button**: Opens detailed scoreboard modal
- **Back to Menu Button**: Returns to main menu
- **Current State**: ✅ Already has unified glassmorphism styling

---

## **📊 VETROLISCI IMPROVEMENT ASSESSMENT**

### **✅ RECENTLY COMPLETED ENHANCEMENTS:**
1. **✅ Modal System** - **COMPLETED** - All 4 main modals now have **card-inspired design + animations**:
   - **CardChoiceModal**: Card-like choice options with 3D perspective hover effects + Framer Motion animations
   - **PlacementChoiceModal**: Card-inspired position buttons with subtle 3D transforms + smooth entrance
   - **RoundCompleteModal**: Score cards with hover effects and card-like styling + animated appearance
   - **ScoreboardModal**: Complete overhaul with card-inspired panels + beautiful spring physics animations
   - **Modal Positioning**: Fixed overlay positioning (modals now properly float above game content)
   - **Base Modal Component**: Full card aesthetic + consistent animation system throughout
2. **✅ Game Status Card** - Unified glassmorphism styling with proper turn indicators
3. **✅ Draft Phase/Available Cards** - Complete card-inspired redesign + animation optimization:
   - **Main container**: Card-styled with optimized hover effects
   - **Available cards container**: Enhanced card styling replacing dashed borders
   - **Card interactions**: Simplified, performant hover animations (removed complex 3D transforms)
   - **Error handling**: Card-inspired error banners with left border accents
   - **Draft completion**: Success notices with card styling
   - **Animation performance**: Fixed janky animations with optimized Framer Motion settings

### **🔧 Remaining Areas for Enhancement:**
1. **⚠️ Game Grid** - **MAJOR UPDATES NEEDED** - Design inconsistency, animation conflicts, performance issues
2. **TurnScoreModal** - Still needs card-inspired design treatment  
3. **Score Display Components** - Typography/styling consistency review

### **✅ ANIMATION SYSTEM - RECENTLY OPTIMIZED:**
- **Performance Issues Fixed**: Removed janky animations throughout
- **Available Cards**: Optimized Framer Motion settings, reduced complex 3D transforms
- **Card Hover Effects**: Simplified from complex perspective transforms to smooth translate/scale
- **Layout Animations**: Changed from `popLayout` to `wait` mode to prevent conflicts
- **Transition Timing**: Reduced animation durations and optimized easing curves
- **Will-change Properties**: Added for better browser optimization

### **🎯 Next Steps:**
- ✅ **Modal System** - **COMPLETED** (4/5 modals enhanced, 1 remaining: TurnScoreModal)
- ✅ **Draft Phase/Available Cards** - **COMPLETED** 
- ✅ **Game Grid Assessment** - **COMPLETED** - Comprehensive analysis documented
- ✅ **Individual Card Component Assessment** - **COMPLETED** - Critical issues identified
- ✅ **🎉 Individual Card Component Overhaul** - **COMPLETED** - All critical issues resolved!
- **🚨 NEW PRIORITY**: Address Game Grid major updates (card-inspired redesign, animation optimization)
- Complete remaining component enhancements

---

### **Connect 4 Game Screen**
**Location**: `src/games/connect4/client/components/GameBoard.jsx`  
**CSS**: `src/games/connect4/client/components/GameBoard.css`

**Key Elements**:
- **Enhanced Game Content Container**: Large glassmorphism container with unified styling
- **Enhanced Game Status Card**: Glassmorphism status with enhanced player indicators (red/yellow gradient badges)
- **Column Headers**: Clickable column selectors (1-7) with hover effects
- **Game Grid**: 6×7 Connect 4 grid with animated disc drops within styled container
- **Enhanced Turn Indicator**: Player indicators with gradient backgrounds and glow effects
- **Win/Draw Message**: Game result display with enhanced typography
- **Glassmorphism Control Buttons**: Play Again and Back to Menu with unified styling
- **Professional Typography**: Enhanced text shadows and color consistency

**Current State**: Unified glassmorphism design, no App Header, enhanced player indicators, professional control buttons
**Recent Changes**: Applied unified glassmorphism styling, removed App Header, enhanced player indicators with gradients, unified color scheme and typography

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
- ✅ **Unified Glassmorphism Design**: All screens use consistent glassmorphism styling
- ✅ **No App Headers in Games**: Clean, focused game interfaces without distracting headers
- ✅ **Enhanced Status Cards**: Professional game status indicators with turn management
- ✅ **Consistent Control Buttons**: Unified button styling across all games and screens
- ✅ **Professional Typography**: Enhanced text shadows, consistent colors, proper hierarchy
- ✅ **Connect 4 & Vetrolisci**: Both games fully implemented with unified design language
- ✅ **Responsive Design**: Mobile/desktop optimized with consistent glassmorphism
- ✅ **Real-time Multiplayer**: Socket.IO integration with enhanced visual feedback

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