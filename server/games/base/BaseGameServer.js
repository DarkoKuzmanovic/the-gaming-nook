// Base server-side game class that all games must extend
export class BaseGameServer {
  constructor(gameConfig) {
    this.id = gameConfig.id;
    this.name = gameConfig.name;
    this.displayName = gameConfig.displayName;
    this.minPlayers = gameConfig.minPlayers || 2;
    this.maxPlayers = gameConfig.maxPlayers || 2;
    this.activeGames = new Map(); // gameId -> gameInstance
  }

  // Abstract methods that all server-side games must implement
  createGame(gameId, players) {
    throw new Error('createGame must be implemented by game server class');
  }

  processMove(gameId, playerId, move) {
    throw new Error('processMove must be implemented by game server class');
  }

  handlePlayerJoin(gameId, player) {
    throw new Error('handlePlayerJoin must be implemented by game server class');
  }

  handlePlayerDisconnect(gameId, playerId) {
    throw new Error('handlePlayerDisconnect must be implemented by game server class');
  }

  getGameState(gameId) {
    throw new Error('getGameState must be implemented by game server class');
  }

  // Optional methods with default implementations
  onGameStart(gameId) {
    console.log(`Game ${this.name} started: ${gameId}`);
  }

  onGameEnd(gameId, result) {
    console.log(`Game ${this.name} ended: ${gameId}`, result);
    this.activeGames.delete(gameId);
  }

  validateGameConfig() {
    return true;
  }

  // Utility methods
  getActiveGames() {
    return Array.from(this.activeGames.keys());
  }

  hasGame(gameId) {
    return this.activeGames.has(gameId);
  }

  getGame(gameId) {
    return this.activeGames.get(gameId);
  }

  removeGame(gameId) {
    this.activeGames.delete(gameId);
  }
}

export default BaseGameServer;