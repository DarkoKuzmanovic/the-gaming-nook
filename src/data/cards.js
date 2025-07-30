// Vetrolisci Card Database
// Generated from cards.csv - 70 unique cards for the game

export const CARDS = [
  { id: 1, value: 7, color: 'multi', scoring: -1, special: false },
  { id: 2, value: 6, color: 'green', scoring: 1, special: false },
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
  { id: 39, value: 6, color: 'green', scoring: -1, special: false },
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

// Turn management - deals 4 cards from the front of the deck
export const dealTurnCards = (deck) => {
  const cardsPerTurn = 4;

  if (deck.length < cardsPerTurn) {
    throw new Error('Not enough cards in deck for turn');
  }

  return {
    turnCards: deck.slice(0, cardsPerTurn),
    remainingDeck: deck.slice(cardsPerTurn)
  };
};

// Card image mapping based on checklist and CSV data
export const getCardImagePath = (card) => {
  if (!card) return null;

  // Map card ID to image filename from card-checklist.md
  const imageMap = {
    1: 'multi-7.png',
    2: 'green-6-alt.png',
    3: 'green-9.png',
    4: 'blue-4-alt2.png',
    5: 'green-3.png',
    6: 'multi-4.png',
    7: 'red-7.png',
    8: 'yellow-4.png',
    9: 'yellow-7.png',
    10: 'red-5-special.png',
    11: 'red-1-special.png',
    12: 'red-7-alt.png',
    13: 'yellow-5-alt.png',
    14: 'yellow-2-special.png',
    15: 'green-2.png',
    16: 'blue-5-special.png',
    17: 'blue-9.png',
    18: 'red-6.png',
    19: 'yellow-5-special.png',
    20: 'multi-6.png',
    21: 'red-6-alt.png',
    22: 'blue-5-alt.png',
    23: 'green-5-special.png',
    24: 'blue-1.png',
    25: 'yellow-6.png',
    26: 'yellow-6-alt.png',
    27: 'multi-3.png',
    28: 'yellow-9.png',
    29: 'red-4.png',
    30: 'yellow-7-alt.png',
    31: 'blue-2.png',
    32: 'green-1.png',
    33: 'blue-6.png',
    34: 'multi-2.png',
    35: 'red-4-alt.png',
    36: 'blue-3.png',
    37: 'green-8.png',
    38: 'red-8.png',
    39: 'green-6.png',
    40: 'green-7.png',
    41: 'blue-3-alt.png',
    42: 'multi-8.png',
    43: 'blue-5-alt2.png',
    44: 'yellow-3.png',
    45: 'red-5-alt.png',
    46: 'red-8-alt.png',
    47: 'yellow-5-alt2.png',
    48: 'green-3-special.png',
    49: 'yellow-3-alt.png',
    50: 'red-2.png',
    51: 'red-1-alt.png',
    52: 'yellow-4-alt.png',
    53: 'green-4.png',
    54: 'blue-4-alt.png',
    55: 'yellow-1.png',
    56: 'green-5-alt.png',
    57: 'yellow-2-alt.png',
    58: 'red-3.png',
    59: 'blue-9-alt.png',
    60: 'red-9.png',
    61: 'blue-8.png',
    62: 'yellow-8.png',
    63: 'blue-6-alt.png',
    64: 'green-6-alt2.png',
    65: 'red-5.png',
    66: 'green-5-alt2.png',
    67: 'green-4-alt.png',
    68: 'blue-4.png',
    69: 'blue-7.png',
    70: 'green-7-alt.png'
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