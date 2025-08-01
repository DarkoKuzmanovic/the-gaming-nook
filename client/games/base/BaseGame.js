// Base game class that all games must extend
export class BaseGame {
  constructor(gameConfig) {
    this.id = gameConfig.id;
    this.name = gameConfig.name;
    this.displayName = gameConfig.displayName;
    this.description = gameConfig.description;
    this.minPlayers = gameConfig.minPlayers || 2;
    this.maxPlayers = gameConfig.maxPlayers || 2;
    this.thumbnail = gameConfig.thumbnail;
    this.category = gameConfig.category || 'strategy';
  }

  // Abstract methods that all games must implement
  initializeGame(players) {
    throw new Error('initializeGame must be implemented by game class');
  }

  processMove(playerId, move) {
    throw new Error('processMove must be implemented by game class');
  }

  checkWinCondition() {
    throw new Error('checkWinCondition must be implemented by game class');
  }

  getGameState() {
    throw new Error('getGameState must be implemented by game class');
  }

  validateMove(playerId, move) {
    throw new Error('validateMove must be implemented by game class');
  }

  // Optional methods with default implementations
  onPlayerJoin(player) {
    console.log(`Player ${player.name} joined ${this.name}`);
  }

  onPlayerLeave(player) {
    console.log(`Player ${player.name} left ${this.name}`);
  }

  getPlayerActions(playerId) {
    return [];
  }

  serialize() {
    return {
      id: this.id,
      name: this.name,
      displayName: this.displayName,
      description: this.description,
      minPlayers: this.minPlayers,
      maxPlayers: this.maxPlayers,
      thumbnail: this.thumbnail,
      category: this.category
    };
  }
}

export default BaseGame;