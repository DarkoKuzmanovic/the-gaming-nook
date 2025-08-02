// Connect 4 Game Registration
import Connect4Game from './Connect4Game.js';
import GameRegistry from '../base/GameRegistry.js';

// Register Connect 4 in the game registry
const connect4Config = {
  id: 'connect4',
  displayName: 'Connect 4',
  description: 'Classic connection game - get 4 in a row to win!',
  minPlayers: 2,
  maxPlayers: 2,
  category: 'strategy',
  difficulty: 'easy',
  estimatedTime: '5-10 minutes',
  thumbnail: '/icons/connect4.svg',
  gameType: 'board-game',
  features: ['real-time', 'turn-based', 'competitive'],
  rules: [
    'Players take turns dropping colored pieces into a 7x6 grid',
    'Pieces fall to the lowest available space in the column',
    'First player to get 4 pieces in a row (horizontal, vertical, or diagonal) wins',
    'If the board fills up with no winner, the game is a tie'
  ]
};

// Register the game
GameRegistry.registerGame(Connect4Game, connect4Config);

console.log('Connect 4 game registered successfully');

export { Connect4Game, connect4Config };