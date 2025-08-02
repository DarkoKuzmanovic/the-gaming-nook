import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';

class JsonDatabase {
  constructor() {
    this.dbPath = './server/database/gaming_nook.json';
    this.data = {
      users: [],
      gameStats: [],
      gameHistory: []
    };
    this.nextUserId = 1;
  }

  async initialize() {
    try {
      // Try to load existing database
      await this.loadDatabase();
      console.log('JSON database loaded successfully');
    } catch (error) {
      if (error.code === 'ENOENT') {
        // Database doesn't exist, create it
        await this.saveDatabase();
        console.log('New JSON database created');
      } else {
        console.error('Error loading database:', error);
        throw error;
      }
    }
  }

  async loadDatabase() {
    const data = await fs.readFile(this.dbPath, 'utf8');
    this.data = JSON.parse(data);
    
    // Set next user ID based on existing users
    if (this.data.users.length > 0) {
      this.nextUserId = Math.max(...this.data.users.map(u => u.id)) + 1;
    }
  }

  async saveDatabase() {
    const dir = path.dirname(this.dbPath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(this.dbPath, JSON.stringify(this.data, null, 2));
  }

  // User management methods
  async createUser(username, email, password) {
    const passwordHash = await bcrypt.hash(password, 10);
    
    const user = {
      id: this.nextUserId++,
      username,
      email,
      password_hash: passwordHash,
      avatar: null,
      created_at: new Date().toISOString(),
      last_login: null,
      total_games: 0,
      total_wins: 0
    };

    this.data.users.push(user);
    await this.saveDatabase();
    
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      created_at: user.created_at
    };
  }

  async getUserByEmail(email) {
    return this.data.users.find(user => user.email === email) || null;
  }

  async getUserByUsername(username) {
    return this.data.users.find(user => user.username === username) || null;
  }

  async getUserById(id) {
    const user = this.data.users.find(user => user.id === id);
    if (!user) return null;
    
    // Return user without password hash
    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateLastLogin(userId) {
    const user = this.data.users.find(user => user.id === userId);
    if (user) {
      user.last_login = new Date().toISOString();
      await this.saveDatabase();
      return true;
    }
    return false;
  }

  async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  // Game statistics methods
  async getGameStats(userId, gameType = null) {
    if (gameType) {
      return this.data.gameStats.find(stat => 
        stat.user_id === userId && stat.game_type === gameType
      ) || null;
    } else {
      return this.data.gameStats.filter(stat => stat.user_id === userId);
    }
  }

  async updateGameStats(userId, gameType, won = false) {
    // Find existing stats
    let stats = this.data.gameStats.find(stat => 
      stat.user_id === userId && stat.game_type === gameType
    );

    if (!stats) {
      // Create new stats record
      stats = {
        id: this.data.gameStats.length + 1,
        user_id: userId,
        game_type: gameType,
        games_played: 0,
        games_won: 0,
        elo_rating: 1200
      };
      this.data.gameStats.push(stats);
    }

    // Update stats
    stats.games_played += 1;
    if (won) {
      stats.games_won += 1;
    }

    // Update user totals
    const user = this.data.users.find(user => user.id === userId);
    if (user) {
      user.total_games += 1;
      if (won) {
        user.total_wins += 1;
      }
    }

    await this.saveDatabase();
    return true;
  }

  async recordGameHistory(gameId, gameType, player1Id, player2Id, winnerId = null, gameData = null) {
    const gameRecord = {
      id: this.data.gameHistory.length + 1,
      game_id: gameId,
      game_type: gameType,
      player1_id: player1Id,
      player2_id: player2Id,
      winner_id: winnerId,
      game_data: gameData,
      started_at: new Date().toISOString(),
      ended_at: new Date().toISOString()
    };

    this.data.gameHistory.push(gameRecord);
    await this.saveDatabase();
    return gameRecord.id;
  }

  async getUserProfile(userId) {
    const user = await this.getUserById(userId);
    if (!user) return null;

    const gameStats = await this.getGameStats(userId);
    
    return {
      ...user,
      gameStats: gameStats.reduce((acc, stat) => {
        acc[stat.game_type] = {
          games: stat.games_played,
          wins: stat.games_won,
          elo: stat.elo_rating
        };
        return acc;
      }, {})
    };
  }

  close() {
    // No cleanup needed for JSON database
    console.log('JSON database connection closed');
  }
}

// Export singleton instance
export default new JsonDatabase();