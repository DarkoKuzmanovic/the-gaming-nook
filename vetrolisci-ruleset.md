# Pixies Card Game - Complete LLM-Friendly Ruleset for 2-Player Online Implementation

## 1. Game Components

- **70 cards total**: Each card has:
  - A number (1-9)
  - A color (Blue, Green, Yellow, Orange, Red, Purple, Brown, or Multi-colored)
  - Optional symbols: Spiral (🌀) or Cross (✖️)
  - Some cards are "Special Cards" that grant bonus spirals

## 2. Game Objective

Score the most points across 3 rounds by strategically placing cards in a 3×3 grid. Points come from:
- Validated card numbers
- Symbol bonuses/penalties
- Largest color zone bonus

## 3. Game Setup

1. Shuffle all 70 cards into a single face-down deck
2. Randomly select the starting player
3. Each player has an empty 3×3 grid (spaces numbered 1-9 like a phone keypad)

## 4. Game Structure

### 4.1 Overall Flow
- Game consists of exactly 3 rounds
- Each round has multiple turns
- A round ends when any player fills all 9 grid spaces

### 4.2 Turn Structure (2-Player Specific)
Each turn follows these steps:

1. **Reveal Phase**: The current first player reveals 4 cards from the deck
2. **Draft Phase**: Players alternate picking cards:
   - First player picks 1 card and immediately places it
   - Second player picks 1 card and immediately places it
   - First player picks 1 card and immediately places it
   - Second player picks the last card and places it
3. **Turn End**: The player who picked last becomes the first player for the next turn

## 5. Card Placement Rules

Cards must be placed according to these scenarios based on the card's number:

### Scenario 1: Empty Space or Face-down Card
- **Condition**: No face-up card with this number exists in your grid
- **Action**: Place the card face-up on the space matching its number
- **Special case**: If a face-down card already occupies that space, place the new card face-up on top
- **Result**: If placed on top of a face-down card, the new card is immediately "validated"

### Scenario 2: Duplicate Number (Face-up Already Present)
- **Condition**: You already have a face-up card with this number
- **Action**: 
  1. Choose which of the two cards to keep face-up
  2. Turn the other card face-down and slide it partially underneath the face-up card
  3. The face-down card must remain partially visible to opponents
- **Result**: The top (face-up) card is now "validated"

### Scenario 3: Already Validated Number
- **Condition**: The number already has a validated face-up card
- **Action**: Place the new card face-down on ANY empty space (ignoring its number)
- **Note**: This card cannot be placed under another card
- **Future**: Another card matching the space's number can later be placed face-up on top to validate it

## 6. Card States

### Face-up Cards
- Active and visible
- Show color, symbols, and number
- Can score points if validated

### Face-down Cards
- Act as placeholders
- Must be tucked to show the number
- Cannot score points themselves

### Validated Cards
- Definition: A face-up card that covers a face-down card
- Only validated cards score their printed number value

## 7. Round End Conditions

### Standard End
- A round ends after the turn in which any player fills all 9 spaces (face-up or face-down)

### 2-Player Special Rule
- If one player fills their last space mid-turn, the round continues until both players have placed an equal number of cards
- Example: Player 1 fills their grid after placing their first card of the turn. Player 2 still gets to place one more card. The round then ends even if 2 cards remain unpicked.

## 8. Scoring System

Calculate points at the end of each round:

### 8.1 Validated Card Numbers
- Add the printed number of each validated card
- Non-validated face-up cards score 0 for their number

### 8.2 Symbol Points (All Face-up Cards)
- Spiral (🌀): +1 point each
- Cross (✖️): -1 point each
- Special Cards: Gain +1 spiral for each OTHER face-up card of the indicated color
  - Multi-colored cards count for all colors

### 8.3 Largest Color Zone Bonus
1. Identify groups of 2+ face-up cards of the same color that are orthogonally adjacent (not diagonal)
2. Find your largest zone
3. Score per card in that zone:
   - Round 1: 2 points per card
   - Round 2: 3 points per card
   - Round 3: 4 points per card
4. Multi-colored cards can join any color zone

### 8.4 Scoring Example
Player's grid at end of Round 1:
- Validated cards: 1, 5, 7, 8 = 21 points
- Symbols: 10 spirals on cards + 5 from special card - 4 crosses = 11 points
- Largest zone: 4 blue cards × 2 points = 8 points
- Round total: 40 points

## 9. Between Rounds

1. Collect all cards and reshuffle into a new deck
2. The player who picked last in the previous round becomes the new first player
3. Continue to next round with empty grids

## 10. Game End

- After 3 complete rounds, sum all round scores
- Highest total score wins
- Ties are shared victories

## 11. Implementation Notes for Online Play

### Key Data Structures Needed
- Player grids: 3×3 array tracking card states (empty/face-up/face-down)
- Card objects: number, color, symbols, special status
- Validation tracking: which cards are validated
- Turn order management
- Score tracking per round

### Critical Rules to Enforce
1. Card must go to matching number space if possible (unless Scenario 3)
2. Face-down cards must track what number space they're on
3. Validated status is permanent once achieved
4. Color zones must be recalculated after each placement
5. Equal turns rule for 2-player round endings

### UI Requirements
- Show partially visible face-down cards under face-up cards
- Highlight legal placement options
- Display running score calculations
- Show deck count
- Indicate current player and turn phase