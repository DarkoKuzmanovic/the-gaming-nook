// Connect 4 Server Game Registration
import Connect4Server from './Connect4Server.js';
import GameServerRegistry from '../base/GameServerRegistry.js';

// Register Connect 4 server in the game server registry
const connect4ServerConfig = {
  id: 'connect4',
  name: 'connect4',
  displayName: 'Connect 4',
  description: 'Classic strategy game where players try to connect four pieces in a row on a 6x7 grid.',
  minPlayers: 2,
  maxPlayers: 2,
  category: 'strategy'
};

GameServerRegistry.registerGameServer('connect4', Connect4Server, connect4ServerConfig);

console.log('Connect 4 server game registered');

export { Connect4Server, connect4ServerConfig };
export default Connect4Server;