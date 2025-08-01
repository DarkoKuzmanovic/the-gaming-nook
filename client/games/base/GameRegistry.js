// Central registry for all available games
class GameRegistry {
  constructor() {
    this.games = new Map();
  }

  // Register a game in the platform
  registerGame(gameClass, config) {
    const gameInstance = new gameClass(config);
    this.games.set(config.id, {
      class: gameClass,
      config: config,
      instance: gameInstance
    });
    console.log(`Game registered: ${config.displayName} (${config.id})`);
  }

  // Get all available games
  getAllGames() {
    return Array.from(this.games.values()).map(game => game.instance.serialize());
  }

  // Get games by category
  getGamesByCategory(category) {
    return this.getAllGames().filter(game => game.category === category);
  }

  // Create a new game instance
  createGame(gameId, players = []) {
    const gameEntry = this.games.get(gameId);
    if (!gameEntry) {
      throw new Error(`Game not found: ${gameId}`);
    }

    const gameInstance = new gameEntry.class(gameEntry.config);
    if (players.length > 0) {
      gameInstance.initializeGame(players);
    }
    
    return gameInstance;
  }

  // Get game configuration
  getGameConfig(gameId) {
    const gameEntry = this.games.get(gameId);
    return gameEntry ? gameEntry.config : null;
  }

  // Check if game exists
  hasGame(gameId) {
    return this.games.has(gameId);
  }

  // Get game categories
  getCategories() {
    const categories = new Set();
    this.getAllGames().forEach(game => categories.add(game.category));
    return Array.from(categories);
  }
}

// Export singleton instance
export default new GameRegistry();