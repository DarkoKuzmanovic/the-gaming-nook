# CSS Design Token Migration Implementation Plan

## Executive Summary

This document outlines the migration from hardcoded CSS values to the legacy design token system. Instead of adding Tailwind CSS (which would violate our simplicity principles), we'll extract and apply the superior CSS custom properties system from the `/legacy/` folder.

**Goal**: Improve CSS maintainability while preserving existing visual design and following the "legacy-first" principle.

**Timeline**: 1 week (7 days)
**Effort**: ~35 hours
**Risk Level**: Low (incremental migration with rollback options)

---

## Current State Analysis

### Problems with Current CSS
- **Hardcoded values**: Colors, spacing, and typography scattered across 30+ CSS files
- **Duplication**: Same values repeated in multiple files
- **Inconsistency**: Slight variations in similar components
- **Maintenance burden**: Changes require updates in multiple places

### Current CSS Files (Priority Order)
1. **High Priority** (Core Game Components):
   - `src/games/vetrolisci/client/components/GameBoard.css` (407 lines)
   - `src/games/vetrolisci/client/components/Card.css` (239 lines)
   - `src/App.css` (330 lines)

2. **Medium Priority** (UI Components):
   - `src/games/vetrolisci/client/components/ScoreboardModal.css` (177 lines)
   - `src/games/vetrolisci/client/components/TurnScoreModal.css` (147 lines)
   - `src/games/vetrolisci/client/components/DraftPhase.css` (309 lines)

3. **Low Priority** (Supporting Components):
   - All other modal and utility CSS files

---

## Target State: Legacy Design Token System

### Design Tokens from `/legacy/src/index.css`

```css
/* Typography Scale */
--font-size-xs: 0.75rem;    /* 12px */
--font-size-sm: 0.875rem;   /* 14px */
--font-size-base: 1rem;     /* 16px */
--font-size-lg: 1.125rem;   /* 18px */
--font-size-xl: 1.25rem;    /* 20px */

/* Font Weights */
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;

/* Color Palette */
--color-primary: #667eea;
--color-primary-hover: #5a6fd8;
--color-success: #48bb78;
--color-warning: #ed8936;
--color-danger: #dc3545;

/* Text Colors */
--color-text-primary: #2d3748;
--color-text-secondary: #4a5568;
--color-text-muted: #718096;
--color-text-white: #ffffff;

/* Background Colors */
--color-bg-primary: #ffffff;
--color-bg-secondary: #f7fafc;
--color-bg-overlay: rgba(255, 255, 255, 0.9);
--color-bg-glass: rgba(255, 255, 255, 0.1);

/* Border Radius */
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;

/* Shadows */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.15);

/* Text Shadows */
--text-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.5);
--text-shadow-md: 0 2px 4px rgba(0, 0, 0, 0.5);
```

---

## Implementation Phases

### Phase 1: Foundation Setup (Day 1)
**Goal**: Establish design token system in current codebase

### Phase 2: Core Component Migration (Days 2-3)
**Goal**: Migrate the most critical and complex components

### Phase 3: Supporting Component Migration (Days 4-5)
**Goal**: Migrate modals and secondary components

### Phase 4: Minor Component Migration (Day 6)
**Goal**: Complete remaining components

### Phase 5: Testing & Polish (Day 7)
**Goal**: Ensure visual consistency and fix any issues

---

## Detailed Task List

### Phase 1: Foundation Setup (Day 1 - 4 hours)

- [ ] **Extract Design Tokens** (2 hours)
  - [ ] Copy CSS custom properties from `legacy/src/index.css`
  - [ ] Create `src/design-tokens.css` file
  - [ ] Add any missing tokens needed for current components
  - [ ] Document token usage guidelines

- [ ] **Setup Token System** (1 hour)
  - [ ] Import design tokens in `src/index.css`
  - [ ] Ensure tokens are available globally
  - [ ] Test token availability in browser dev tools

- [ ] **Create Migration Utilities** (1 hour)
  - [ ] Document common patterns for migration
  - [ ] Create before/after examples
  - [ ] Set up git branch: `feature/css-design-tokens`

### Phase 2: Core Component Migration (Days 2-3 - 12 hours)

- [ ] **Migrate GameBoard.css** (4 hours)
  - [ ] Replace hardcoded colors with `--color-*` tokens
  - [ ] Replace border-radius values with `--radius-*` tokens
  - [ ] Replace shadow values with `--shadow-*` tokens
  - [ ] Replace font sizes with `--font-size-*` tokens
  - [ ] Test visual consistency
  - [ ] Commit changes

- [ ] **Migrate Card.css** (3 hours)
  - [ ] Replace color values with design tokens
  - [ ] Standardize border-radius using tokens
  - [ ] Update shadow effects with token values
  - [ ] Test card animations and states
  - [ ] Commit changes

- [ ] **Migrate App.css** (3 hours)
  - [ ] Replace global color values
  - [ ] Standardize typography using font tokens
  - [ ] Update layout spacing with consistent values
  - [ ] Test overall app appearance
  - [ ] Commit changes

- [ ] **Visual Regression Testing** (2 hours)
  - [ ] Compare before/after screenshots
  - [ ] Test in different browsers
  - [ ] Verify game functionality unchanged
  - [ ] Document any intentional changes

### Phase 3: Supporting Component Migration (Days 4-5 - 10 hours)

- [ ] **Migrate ScoreboardModal.css** (2 hours)
  - [ ] Replace colors with design tokens
  - [ ] Standardize spacing and typography
  - [ ] Test modal functionality
  - [ ] Commit changes

- [ ] **Migrate TurnScoreModal.css** (2 hours)
  - [ ] Apply design tokens for consistency
  - [ ] Update button styles
  - [ ] Test modal interactions
  - [ ] Commit changes

- [ ] **Migrate DraftPhase.css** (3 hours)
  - [ ] Replace hardcoded values with tokens
  - [ ] Ensure animation compatibility
  - [ ] Test draft phase functionality
  - [ ] Commit changes

- [ ] **Migrate Remaining Modals** (3 hours)
  - [ ] CardChoiceModal.css
  - [ ] PlacementChoiceModal.css
  - [ ] RoundCompleteModal.css
  - [ ] Apply consistent token usage
  - [ ] Test all modal interactions
  - [ ] Commit changes

### Phase 4: Minor Component Migration (Day 6 - 4 hours)

- [ ] **Migrate Utility Components** (2 hours)
  - [ ] GameGrid.css
  - [ ] ScoreBoard.css
  - [ ] Any remaining component CSS files
  - [ ] Apply design tokens consistently

- [ ] **Migrate Shared Components** (2 hours)
  - [ ] Update any shared CSS in `src/shared/`
  - [ ] Ensure consistency across game components
  - [ ] Test shared component usage
  - [ ] Commit changes

### Phase 5: Testing & Polish (Day 7 - 5 hours)

- [ ] **Comprehensive Testing** (3 hours)
  - [ ] Full game playthrough testing
  - [ ] Test all UI states and interactions
  - [ ] Cross-browser compatibility check
  - [ ] Mobile responsiveness verification
  - [ ] Performance impact assessment

- [ ] **Documentation & Cleanup** (2 hours)
  - [ ] Update component documentation
  - [ ] Create design token usage guide
  - [ ] Remove any unused CSS rules
  - [ ] Final code review and cleanup
  - [ ] Merge feature branch to main

---

## Risk Management

### Identified Risks & Mitigation

1. **Visual Regressions**
   - **Risk**: Components look different after migration
   - **Mitigation**: Take screenshots before migration, compare after each component
   - **Rollback**: Git branch allows easy revert

2. **Game Functionality Breaks**
   - **Risk**: CSS changes affect game logic
   - **Mitigation**: Test game functionality after each major component
   - **Rollback**: Component-by-component commits allow targeted rollback

3. **Performance Impact**
   - **Risk**: CSS custom properties affect performance
   - **Mitigation**: Monitor load times, CSS custom properties are well-supported
   - **Rollback**: Minimal performance impact expected

4. **Browser Compatibility**
   - **Risk**: CSS custom properties not supported in old browsers
   - **Mitigation**: CSS custom properties supported in all modern browsers
   - **Rollback**: Fallback values can be added if needed

### Rollback Strategy
- Each phase is committed separately
- Feature branch allows complete rollback
- Component-level commits allow selective rollback
- Original CSS files preserved in git history

---

## Success Criteria

### Technical Success
- [ ] All hardcoded CSS values replaced with design tokens
- [ ] No visual regressions in game components
- [ ] All game functionality preserved
- [ ] CSS file sizes reduced through elimination of duplication
- [ ] Consistent spacing, colors, and typography across components

### Maintainability Success
- [ ] Design changes can be made by updating tokens only
- [ ] New components can easily use existing design system
- [ ] CSS is more readable and self-documenting
- [ ] Reduced cognitive load for future CSS changes

### Performance Success
- [ ] No negative impact on page load times
- [ ] CSS bundle size maintained or reduced
- [ ] Smooth animations and interactions preserved

---

## Tools & Resources

### Development Tools
- **Git**: Version control and rollback capability
- **Browser Dev Tools**: CSS inspection and comparison
- **VS Code**: Find/replace for efficient migration

### Testing Methods
- **Manual Visual Testing**: Side-by-side comparison
- **Functional Testing**: Full game playthrough
- **Cross-browser Testing**: Chrome, Firefox, Safari, Edge

### Reference Materials
- `legacy/src/index.css`: Source of design tokens
- Current CSS files: Target for migration
- Game functionality: Must be preserved

---

## Timeline Summary

| Day | Phase | Focus | Hours | Deliverable |
|-----|-------|-------|-------|-------------|
| 1 | Foundation | Setup design tokens | 4 | Token system ready |
| 2-3 | Core Migration | GameBoard, Card, App | 12 | Core components migrated |
| 4-5 | Supporting | Modals and secondary | 10 | All major components done |
| 6 | Minor Components | Utilities and shared | 4 | Complete migration |
| 7 | Testing & Polish | QA and documentation | 5 | Production ready |

**Total Effort**: 35 hours over 7 days
**Risk Level**: Low
**Expected Outcome**: Improved maintainability with zero visual regressions

---

## Next Steps

1. **Review this plan** with the team
2. **Create feature branch**: `git checkout -b feature/css-design-tokens`
3. **Start with Phase 1**: Extract design tokens from legacy
4. **Follow the checklist** above, committing after each major component
5. **Test thoroughly** before merging to main

This migration aligns perfectly with our "legacy-first" principle and "simplicity over features" philosophy while significantly improving CSS maintainability.