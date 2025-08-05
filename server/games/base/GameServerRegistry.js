// Central registry for all server-side game implementations
class GameServerRegistry {
  constructor() {
    this.gameServers = new Map();
  }

  // Register a server-side game implementation
  registerGameServer(gameId, gameServerClass, config) {
    const gameServerInstance = new gameServerClass(config);
    this.gameServers.set(gameId, {
      instance: gameServerInstance,
      class: gameServerClass,
      config: config
    });
    console.log(`Game server registered: ${config.displayName} (${gameId})`);
  }

  // Get a game server instance
  getGameServer(gameId) {
    const entry = this.gameServers.get(gameId);
    return entry ? entry.instance : null;
  }

  // Check if game server exists
  hasGameServer(gameId) {
    return this.gameServers.has(gameId);
  }

  // Get all registered game types
  getRegisteredGames() {
    return Array.from(this.gameServers.keys());
  }

  // Create a new game instance for a specific game type
  createGame(gameId, gameInstanceId, players) {
    const gameServer = this.getGameServer(gameId);
    if (!gameServer) {
      throw new Error(`Game server not found: ${gameId}`);
    }

    return gameServer.createGame(gameInstanceId, players);
  }

  // Process a move for a specific game
  processMove(gameId, gameInstanceId, playerId, move) {
    const gameServer = this.getGameServer(gameId);
    if (!gameServer) {
      throw new Error(`Game server not found: ${gameId}`);
    }

    return gameServer.processMove(gameInstanceId, playerId, move);
  }

  // Get game state
  getGameState(gameId, gameInstanceId) {
    const gameServer = this.getGameServer(gameId);
    if (!gameServer) {
      throw new Error(`Game server not found: ${gameId}`);
    }

    return gameServer.getGameState(gameInstanceId);
  }

  // Handle player join
  handlePlayerJoin(gameId, gameInstanceId, player) {
    const gameServer = this.getGameServer(gameId);
    if (gameServer) {
      return gameServer.handlePlayerJoin(gameInstanceId, player);
    }
  }

  // Handle player disconnect
  handlePlayerDisconnect(gameId, gameInstanceId, playerId) {
    const gameServer = this.getGameServer(gameId);
    if (gameServer) {
      return gameServer.handlePlayerDisconnect(gameInstanceId, playerId);
    }
  }
}

// Export singleton instance
export default new GameServerRegistry();