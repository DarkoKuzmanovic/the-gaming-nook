import VetrolisciGame from './VetrolisciGame.js';
import GameRegistry from '../base/GameRegistry.js';

// Register Vetrolisci in the game registry
const vetrolisciConfig = {
  id: 'vetrolisci',
  name: 'vetrolisci',
  displayName: 'Vetrolisci',
  description: 'A strategic card placement game where players build 3x3 grids over 3 rounds with validated scoring.',
  minPlayers: 2,
  maxPlayers: 2,
  thumbnail: '/icons/favicon.svg',
  category: 'card',
  // Game-specific configuration
  rules: {
    rounds: 3,
    gridSize: 9,
    cardsPerRound: 4
  }
};

GameRegistry.registerGame(VetrolisciGame, vetrolisciConfig);

export { VetrolisciGame, vetrolisciConfig };
export default VetrolisciGame;