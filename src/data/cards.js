// Vetrolisci Card Database
// Generated from cards.csv - 70 unique cards for the game

export const CARDS = [
  { id: 1, value: 7, color: 'multi', scoring: -1, special: false },
  { id: 2, value: 6, color: 'green', scoring: -1, special: false },
  { id: 3, value: 9, color: 'green', scoring: -4, special: false },
  { id: 4, value: 4, color: 'blue', scoring: 1, special: true },
  { id: 5, value: 3, color: 'green', scoring: 2, special: false },
  { id: 6, value: 4, color: 'multi', scoring: 0, special: false },
  { id: 7, value: 7, color: 'red', scoring: -4, special: false },
  { id: 8, value: 4, color: 'yellow', scoring: -1, special: false },
  { id: 9, value: 7, color: 'yellow', scoring: 1, special: false },
  { id: 10, value: 5, color: 'red', scoring: 1, special: true },
  { id: 11, value: 1, color: 'red', scoring: 1, special: true },
  { id: 12, value: 7, color: 'red', scoring: -1, special: false },
  { id: 13, value: 5, color: 'yellow', scoring: 0, special: false },
  { id: 14, value: 2, color: 'yellow', scoring: 1, special: true },
  { id: 15, value: 2, color: 'green', scoring: 3, special: false },
  { id: 16, value: 5, color: 'blue', scoring: 1, special: true },
  { id: 17, value: 9, color: 'blue', scoring: -6, special: false },
  { id: 18, value: 6, color: 'red', scoring: -2, special: false },
  { id: 19, value: 5, color: 'yellow', scoring: 1, special: true },
  { id: 20, value: 6, color: 'multi', scoring: -1, special: false },
  { id: 21, value: 6, color: 'red', scoring: 0, special: false },
  { id: 22, value: 5, color: 'blue', scoring: 0, special: false },
  { id: 23, value: 5, color: 'green', scoring: 1, special: true },
  { id: 24, value: 1, color: 'blue', scoring: 6, special: false },
  { id: 25, value: 6, color: 'yellow', scoring: 0, special: false },
  { id: 26, value: 6, color: 'yellow', scoring: -3, special: false },
  { id: 27, value: 3, color: 'multi', scoring: 0, special: false },
  { id: 28, value: 9, color: 'yellow', scoring: -2, special: false },
  { id: 29, value: 4, color: 'red', scoring: 2, special: false },
  { id: 30, value: 7, color: 'yellow', scoring: -5, special: false },
  { id: 31, value: 2, color: 'blue', scoring: 4, special: false },
  { id: 32, value: 1, color: 'green', scoring: 5, special: false },
  { id: 33, value: 6, color: 'blue', scoring: 1, special: false },
  { id: 34, value: 2, color: 'multi', scoring: 0, special: false },
  { id: 35, value: 4, color: 'red', scoring: 0, special: false },
  { id: 36, value: 3, color: 'blue', scoring: 0, special: false },
  { id: 37, value: 8, color: 'green', scoring: -2, special: false },
  { id: 38, value: 8, color: 'red', scoring: 0, special: false },
  { id: 39, value: 6, color: 'green', scoring: 1, special: false },
  { id: 40, value: 7, color: 'green', scoring: -2, special: false },
  { id: 41, value: 3, color: 'blue', scoring: 1, special: false },
  { id: 42, value: 8, color: 'multi', scoring: -1, special: false },
  { id: 43, value: 5, color: 'blue', scoring: -2, special: false },
  { id: 44, value: 3, color: 'yellow', scoring: 5, special: false },
  { id: 45, value: 5, color: 'red', scoring: -1, special: false },
  { id: 46, value: 8, color: 'red', scoring: -5, special: false },
  { id: 47, value: 5, color: 'yellow', scoring: -2, special: false },
  { id: 48, value: 3, color: 'green', scoring: 1, special: true },
  { id: 49, value: 3, color: 'yellow', scoring: 0, special: false },
  { id: 50, value: 2, color: 'red', scoring: 5, special: false },
  { id: 51, value: 1, color: 'red', scoring: 3, special: false },
  { id: 52, value: 4, color: 'yellow', scoring: 3, special: false },
  { id: 53, value: 4, color: 'green', scoring: 4, special: false },
  { id: 54, value: 4, color: 'blue', scoring: 0, special: false },
  { id: 55, value: 1, color: 'yellow', scoring: 4, special: false },
  { id: 56, value: 5, color: 'green', scoring: -1, special: false },
  { id: 57, value: 2, color: 'yellow', scoring: 2, special: false },
  { id: 58, value: 3, color: 'red', scoring: 4, special: false },
  { id: 59, value: 9, color: 'blue', scoring: -1, special: false },
  { id: 60, value: 9, color: 'red', scoring: 0, special: false },
  { id: 61, value: 8, color: 'blue', scoring: -3, special: false },
  { id: 62, value: 8, color: 'yellow', scoring: -1, special: false },
  { id: 63, value: 6, color: 'blue', scoring: -1, special: false },
  { id: 64, value: 6, color: 'green', scoring: -4, special: false },
  { id: 65, value: 5, color: 'red', scoring: 0, special: false },
  { id: 66, value: 5, color: 'green', scoring: 0, special: false },
  { id: 67, value: 4, color: 'green', scoring: -1, special: false },
  { id: 68, value: 4, color: 'blue', scoring: 1, special: false },
  { id: 69, value: 7, color: 'blue', scoring: -3, special: false },
  { id: 70, value: 7, color: 'green', scoring: 0, special: false }
];

// Utility functions for card management
export const getCardsByColor = (color) => {
  return CARDS.filter(card => card.color === color);
};

export const getSpecialCards = () => {
  return CARDS.filter(card => card.special === true);
};

export const getCardById = (id) => {
  return CARDS.find(card => card.id === id);
};

export const shuffleDeck = (cards = CARDS) => {
  const shuffled = [...cards];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Game distribution logic
export const dealCards = (deck, numCards = 4) => {
  if (deck.length < numCards) {
    throw new Error('Not enough cards in deck');
  }
  return {
    dealt: deck.slice(0, numCards),
    remaining: deck.slice(numCards)
  };
};

export const createGameDeck = () => {
  return shuffleDeck(CARDS);
};

// Round management
export const dealRoundCards = (deck, roundNumber) => {
  const cardsPerRound = 4; // Each player gets 2 cards, 2 players = 4 total
  const startIndex = (roundNumber - 1) * cardsPerRound;
  const endIndex = startIndex + cardsPerRound;
  
  if (deck.length < endIndex) {
    throw new Error('Not enough cards for round');
  }
  
  return {
    roundCards: deck.slice(startIndex, endIndex),
    remainingDeck: deck.slice(endIndex)
  };
};

// Card image mapping based on checklist and CSV data
export const getCardImagePath = (card) => {
  if (!card) return null;
  
  // Map card ID to image filename from card-checklist.md
  const imageMap = {
    1: 'multi-7.png', // Card #1: 7, multi, -1
    2: 'green-6-alt.png', // Card #2: 6, green, -1  
    3: 'green-9.png', // Card #3: 9, green, -4
    4: 'blue-4-alt2.png', // Card #4: 4, blue, 1, special
    5: 'green-3.png', // Card #5: 3, green, 2
    6: 'multi-4.png', // Card #6: 4, multi, 0
    7: 'red-7.png', // Card #7: 7, red, -4
    8: 'yellow-4.png', // Card #8: 4, yellow, -1
    9: 'yellow-7.png', // Card #9: 7, yellow, 1
    10: 'red-5-special.png', // Card #10: 5, red, 1, special
    11: 'red-1-special.png', // Card #11: 1, red, 1, special
    12: 'red-7-alt.png', // Card #12: 7, red, -1
    13: 'yellow-5-alt.png', // Card #13: 5, yellow, 0
    14: 'yellow-2-special.png', // Card #14: 2, yellow, 1, special
    15: 'green-2.png', // Card #15: 2, green, 3
    16: 'blue-5-special.png', // Card #16: 5, blue, 1, special
    17: 'blue-9.png', // Card #17: 9, blue, -6
    18: 'red-6.png', // Card #18: 6, red, -2
    19: 'yellow-5-special.png', // Card #19: 5, yellow, 1, special
    20: 'multi-6.png', // Card #20: 6, multi, -1
    21: 'red-6-alt.png', // Card #21: 6, red, 0
    22: 'blue-5-alt.png', // Card #22: 5, blue, 0
    23: 'green-5-special.png', // Card #23: 5, green, 1, special
    24: 'blue-1.png', // Card #24: 1, blue, 6
    25: 'yellow-6.png', // Card #25: 6, yellow, 0
    26: 'yellow-6-alt.png', // Card #26: 6, yellow, -3
    27: 'multi-3.png', // Card #27: 3, multi, 0
    28: 'yellow-9.png', // Card #28: 9, yellow, -2
    29: 'red-4.png', // Card #29: 4, red, 2
    30: 'yellow-7-alt.png', // Card #30: 7, yellow, -5
    31: 'blue-2.png', // Card #31: 2, blue, 4
    32: 'green-1.png', // Card #32: 1, green, 5
    33: 'blue-6.png', // Card #33: 6, blue, 1
    34: 'multi-2.png', // Card #34: 2, multi, 0
    35: 'red-4-alt.png', // Card #35: 4, red, 0
    36: 'blue-3.png', // Card #36: 3, blue, 0
    37: 'green-8.png', // Card #37: 8, green, -2
    38: 'red-8.png', // Card #38: 8, red, 0
    39: 'green-6.png', // Card #39: 6, green, 1
    40: 'green-7.png', // Card #40: 7, green, -2
    41: 'blue-3-alt.png', // Card #41: 3, blue, 1
    42: 'multi-8.png', // Card #42: 8, multi, -1
    43: 'blue-5-alt2.png', // Card #43: 5, blue, -2
    44: 'yellow-3.png', // Card #44: 3, yellow, 5
    45: 'red-5-alt.png', // Card #45: 5, red, -1
    46: 'red-8-alt.png', // Card #46: 8, red, -5
    47: 'yellow-5-alt2.png', // Card #47: 5, yellow, -2
    48: 'green-3-special.png', // Card #48: 3, green, 1, special
    49: 'yellow-3-alt.png', // Card #49: 3, yellow, 0
    50: 'red-2.png', // Card #50: 2, red, 5
    51: 'red-1-alt.png', // Card #51: 1, red, 3
    52: 'yellow-4-alt.png', // Card #52: 4, yellow, 3
    53: 'green-4.png', // Card #53: 4, green, 4
    54: 'blue-4-alt.png', // Card #54: 4, blue, 0
    55: 'yellow-1.png', // Card #55: 1, yellow, 4
    56: 'green-5-alt.png', // Card #56: 5, green, -1
    57: 'yellow-2-alt.png', // Card #57: 2, yellow, 2
    58: 'red-3.png', // Card #58: 3, red, 4
    59: 'blue-9-alt.png', // Card #59: 9, blue, -1
    60: 'red-9.png', // Card #60: 9, red, 0
    61: 'blue-8.png', // Card #61: 8, blue, -3
    62: 'yellow-8.png', // Card #62: 8, yellow, -1
    63: 'blue-6-alt.png', // Card #63: 6, blue, -1
    64: 'green-6-alt2.png', // Card #64: 6, green, -4
    65: 'red-5.png', // Card #65: 5, red, 0
    66: 'green-5-alt2.png', // Card #66: 5, green, 0
    67: 'green-4-alt.png', // Card #67: 4, green, -1
    68: 'blue-4.png', // Card #68: 4, blue, 1
    69: 'blue-7.png', // Card #69: 7, blue, -3
    70: 'green-7-alt.png' // Card #70: 7, green, 0
  };
  
  return imageMap[card.id] || null;
};

export const getCardBackImagePath = () => {
  return 'card-back.png';
};

// Color definitions for styling
export const COLORS = {
  blue: '#4A90E2',
  green: '#7ED321',
  yellow: '#F5A623',
  red: '#D0021B',
  multi: 'linear-gradient(45deg, #4A90E2, #7ED321, #F5A623, #D0021B)'
};