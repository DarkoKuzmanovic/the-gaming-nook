// Game State Caching Service
// Saves and recovers game state to prevent loss on page refresh

class GameStateCache {
  constructor() {
    this.CACHE_KEY = 'vetrolisci-game-state';
    this.CACHE_EXPIRY_KEY = 'vetrolisci-game-state-expiry';
    this.CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
  }

  // Save game state to localStorage
  saveGameState(gameState, gameInfo, draftState) {
    try {
      const cacheData = {
        gameState,
        gameInfo,
        draftState,
        timestamp: Date.now()
      };

      localStorage.setItem(this.CACHE_KEY, JSON.stringify(cacheData));
      localStorage.setItem(this.CACHE_EXPIRY_KEY, (Date.now() + this.CACHE_DURATION).toString());
      
      console.log('Game state cached successfully');
    } catch (error) {
      console.warn('Failed to cache game state:', error);
    }
  }

  // Load game state from localStorage
  loadGameState() {
    try {
      const cachedData = localStorage.getItem(this.CACHE_KEY);
      const expiryTime = localStorage.getItem(this.CACHE_EXPIRY_KEY);

      if (!cachedData || !expiryTime) {
        return null;
      }

      // Check if cache has expired
      if (Date.now() > parseInt(expiryTime)) {
        this.clearGameState();
        return null;
      }

      const parsedData = JSON.parse(cachedData);
      
      // Validate required fields
      if (!parsedData.gameState || !parsedData.gameInfo) {
        return null;
      }

      console.log('Game state loaded from cache');
      return parsedData;
    } catch (error) {
      console.warn('Failed to load cached game state:', error);
      this.clearGameState();
      return null;
    }
  }

  // Clear cached game state
  clearGameState() {
    try {
      localStorage.removeItem(this.CACHE_KEY);
      localStorage.removeItem(this.CACHE_EXPIRY_KEY);
      console.log('Game state cache cleared');
    } catch (error) {
      console.warn('Failed to clear game state cache:', error);
    }
  }

  // Check if there's a valid cached game state
  hasCachedState() {
    const cachedData = localStorage.getItem(this.CACHE_KEY);
    const expiryTime = localStorage.getItem(this.CACHE_EXPIRY_KEY);

    if (!cachedData || !expiryTime) {
      return false;
    }

    return Date.now() <= parseInt(expiryTime);
  }

  // Get cache info for debugging
  getCacheInfo() {
    const cachedData = localStorage.getItem(this.CACHE_KEY);
    const expiryTime = localStorage.getItem(this.CACHE_EXPIRY_KEY);

    if (!cachedData || !expiryTime) {
      return { exists: false };
    }

    const expiryTimestamp = parseInt(expiryTime);
    const now = Date.now();

    return {
      exists: true,
      expired: now > expiryTimestamp,
      expiresAt: new Date(expiryTimestamp).toLocaleString(),
      timeRemaining: Math.max(0, expiryTimestamp - now)
    };
  }

  // Update cache expiry without changing the data
  extendCacheExpiry() {
    try {
      const newExpiry = Date.now() + this.CACHE_DURATION;
      localStorage.setItem(this.CACHE_EXPIRY_KEY, newExpiry.toString());
    } catch (error) {
      console.warn('Failed to extend cache expiry:', error);
    }
  }
}

// Export singleton instance
const gameStateCache = new GameStateCache();
export default gameStateCache;