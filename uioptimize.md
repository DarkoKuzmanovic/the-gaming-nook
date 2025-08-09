# Vetrolisci UI Modernization Plan

This document outlines a step-by-step guide to modernize the user interface of the Vetrolisci game. The plan is broken down into manageable chunks, starting with foundational changes and moving towards finer-grained polishing.

---

### Step 1: Establish a Design System with CSS Variables

The current CSS uses many hardcoded values for colors, shadows, and border radii. Introducing CSS variables (Design Tokens) will unify the visual language, improve consistency, and make future changes much easier.

**TODO:**
- [x] **Create a Global Stylesheet:** In `src/shared/client/styles/`, create a `variables.css` or `theme.css` file.
- [x] **Define Color Palette:** In the new file, define primary, secondary, accent, and neutral colors as CSS variables. Include specific colors for card types (blue, green, red, yellow, multi) and states (success, error, warning).
    ```css
    :root {
      --color-primary: #d97706;
      --color-success: #059669;
      --color-error: #dc2626;
      --color-card-blue: #3b82f6;
      /* ... 100+ variables defined */
    }
    ```
- [x] **Define Spacing & Sizing:** Create variables for consistent margins, paddings, and component sizes.
    ```css
    :root {
      --spacing-xs: 4px;
      --spacing-sm: 8px;
      --spacing-md: 12px;
      --spacing-lg: 16px;
      /* ... complete 8-point scale + component sizes */
    }
    ```
- [x] **Define Visual Effects:** Standardize `border-radius`, `box-shadow`, and `backdrop-filter` values. Create reusable variables for the glassmorphism effect.
    ```css
    :root {
      --border-radius-sm: 6px;
      --border-radius-md: 8px;
      --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
      --glass-bg: rgba(255, 255, 255, 0.15);
      --glass-blur: blur(14px);
      /* ... comprehensive visual effects system */
    }
    ```
- [x] **Refactor Existing CSS:** Go through all component CSS files (`Card.css`, `GameBoard.css`, etc.) and replace hardcoded values with the new CSS variables.

**✅ COMPLETED:** Design system established with 100+ CSS variables covering colors, spacing, typography, effects, and mobile optimizations. All major components (App, Card, GameBoard) refactored to use the new design tokens. Theme integrated globally via `main.jsx`.

---

### Step 2: Refine the Core `Card` Component

The `Card` is the most important visual element. Polishing it will have a major impact.

**TODO:**
- [x] **Refactor Validation Badge:** The current implementation uses multiple, inefficient data-URL background images in `Card.css`.
    - ✅ Created a single, reusable `ValidationStar.jsx` component that takes a `color` prop.
    - ✅ The component renders an optimized `<svg>` with dynamic colors.
    - ✅ Uses CSS variables (from Step 1) to set the `fill` color and `drop-shadow` filter based on the prop. Eliminates code duplication and improves performance.
- [x] **Enhance Hover Animation:** The current `transform: translateY(-1px) scale(1.02)` is subtle. Consider a more modern 3D tilt effect to give the cards a physical feel.
    - ✅ Implemented sophisticated 3D tilt effect with pure CSS using `perspective`, `rotateX`, `rotateY`, and enhanced scaling.
    - ✅ Added mobile optimizations and accessibility considerations for reduced motion preferences.
- [x] **Improve State Visibility:** Make the `selected` and `validated` states more prominent.
    - ✅ Enhanced `selected` state with thicker borders (3px), prominent outer glow, and elevated positioning.
    - ✅ Enhanced `validated` state with improved glow animation, stronger visual feedback, and enhanced hover effects.
    - ✅ Added mobile-optimized versions of all state effects.

**✅ COMPLETED:** Card component significantly refined with modern 3D hover effects, optimized ValidationStar component, and enhanced state visibility. Performance optimizations included for mobile devices and accessibility preferences.

---

### Step 3: Boost Interactivity with Fluid Animations

Modern UIs feel fluid. Replacing some of the basic CSS transitions with a dedicated animation library will make the game more engaging.

**TODO:**
- [x] **Choose an Animation Library:** Integrated `Framer Motion` for comprehensive animation control and cross-component transitions.
    - ✅ Chosen Framer Motion over AutoAnimate for better `layoutId` support and complex animation control.
    - ✅ Installed and integrated into project architecture.
- [x] **Animate Card Movement:** When a card is picked from the `DraftPhase`, animate its transition to the `GameGrid`. `Framer Motion`'s `layoutId` prop is perfect for this.
    - ✅ Enhanced Card component with `layoutId` support for seamless cross-component transitions.
    - ✅ Cards now smoothly animate from DraftPhase to GameGrid using shared `layoutId="card-${card.id}"`.
- [x] **Animate List Appearances:** When the `DraftPhase` or `GameGrid` first loads, animate the cards appearing with a subtle stagger effect.
    - ✅ Added stagger effects to DraftPhase card list (0.1s delay per card with smooth slide-up animation).
    - ✅ Added stagger effects to GameGrid spaces (0.05s delay per space with scale-in animation).
    - ✅ Implemented entrance animations for individual cards with 3D rotations and backOut easing.
- [x] **Improve Modal Transitions:** Animate the modal's appearance (e.g., scale in, fade in) and the backdrop overlay.
    - ✅ Completely redesigned Modal component with sophisticated entrance/exit animations.
    - ✅ Added 3D perspective effects with rotateX transforms and spring physics.
    - ✅ Enhanced close button with hover/tap animations and backdrop fade transitions.
    - ✅ Added staggered content animations for header and body sections.

**✅ COMPLETED:** Comprehensive animation system implemented with Framer Motion. Cards now smoothly transition between DraftPhase and GameGrid, all list appearances have engaging stagger effects, and modals feature sophisticated 3D entrance animations. The game feels significantly more fluid and engaging.

---

### Step 4: Improve UI Clarity and Accessibility (A11y)

A modern UI is an accessible UI. These changes will improve usability for all players.

**TODO:**
- [ ] **Add ARIA Attributes:**
    - Add `role="dialog"`, `aria-modal="true"`, and `aria-labelledby` to all modals.
    - Add `aria-label` to icon-only buttons (e.g., the audio and scoreboard controls).
- [ ] **Manage Focus:** Ensure that when a modal opens, focus is trapped within it and returned to the previously focused element when it closes.
- [ ] **Check Color Contrast:** Use a contrast checker tool to verify that text is readable against the glassmorphism backgrounds. Adjust the color variables from Step 1 if necessary.
- [ ] **Refine Restriction Overlay:** The `🚫` icon on un-pickable cards is not very descriptive.
    - Augment the overlay to include the reason text (e.g., "Already Validated").
    - Add an `aria-label` to the overlay container explaining why the card is disabled.

---

### Step 5: Standardize Iconography

The project uses a mix of `.png` and `.svg` files. Consolidating to a single format and system will improve consistency and performance.

**TODO:**
- [ ] **Choose an Icon Set:** Select a modern, open-source icon library like [Heroicons](https://heroicons.com/) or [Feather](https://feathericons.com/).
- [ ] **Create an `Icon` Component:** Build a generic `Icon.jsx` component that takes an `iconName` prop and dynamically renders the corresponding SVG.
- [ ] **Replace All Icons:** Go through the project (`GameBoard.jsx`, etc.) and replace all `<img>` tags used for icons with the new `<Icon>` component.
- [ ] **Optimize SVGs:** Ensure all SVGs are run through an optimizer like [SVGO](https://github.com/svg/svgo) to reduce their file size.
