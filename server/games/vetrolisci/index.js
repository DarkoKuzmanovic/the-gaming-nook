import VetrolisciServer from './VetrolisciServer.js';
import GameServerRegistry from '../base/GameServerRegistry.js';

// Register Vetrolisci server in the game server registry
const vetrolisciServerConfig = {
  id: 'vetrolisci',
  name: 'vetrolisci',
  displayName: 'Vetrolisci',
  description: 'A strategic card placement game where players build 3x3 grids over 3 rounds with validated scoring.',
  minPlayers: 2,
  maxPlayers: 2,
  category: 'card'
};

GameServerRegistry.registerGameServer('vetrolisci', VetrolisciServer, vetrolisciServerConfig);

export { VetrolisciServer, vetrolisciServerConfig };
export default VetrolisciServer;