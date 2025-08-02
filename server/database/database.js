import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import bcrypt from 'bcryptjs';

// Enable verbose mode for better debugging
const sqlite = sqlite3.verbose();

class Database {
  constructor() {
    this.db = null;
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite.Database('./server/database/gaming_nook.db', (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
        } else {
          console.log('Connected to SQLite database');
          this.createTables().then(resolve).catch(reject);
        }
      });
    });
  }

  async createTables() {
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        avatar TEXT DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME DEFAULT NULL,
        total_games INTEGER DEFAULT 0,
        total_wins INTEGER DEFAULT 0
      )
    `;

    const createGameStatsTable = `
      CREATE TABLE IF NOT EXISTS game_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        game_type TEXT NOT NULL,
        games_played INTEGER DEFAULT 0,
        games_won INTEGER DEFAULT 0,
        elo_rating INTEGER DEFAULT 1200,
        FOREIGN KEY (user_id) REFERENCES users (id),
        UNIQUE(user_id, game_type)
      )
    `;

    const createGameHistoryTable = `
      CREATE TABLE IF NOT EXISTS game_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_id TEXT NOT NULL,
        game_type TEXT NOT NULL,
        player1_id INTEGER,
        player2_id INTEGER,
        winner_id INTEGER DEFAULT NULL,
        game_data TEXT,
        started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        ended_at DATETIME DEFAULT NULL,
        FOREIGN KEY (player1_id) REFERENCES users (id),
        FOREIGN KEY (player2_id) REFERENCES users (id),
        FOREIGN KEY (winner_id) REFERENCES users (id)
      )
    `;

    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run(createUsersTable, (err) => {
          if (err) {
            console.error('Error creating users table:', err);
            reject(err);
            return;
          }
        });

        this.db.run(createGameStatsTable, (err) => {
          if (err) {
            console.error('Error creating game_stats table:', err);
            reject(err);
            return;
          }
        });

        this.db.run(createGameHistoryTable, (err) => {
          if (err) {
            console.error('Error creating game_history table:', err);
            reject(err);
            return;
          }
          console.log('Database tables created successfully');
          resolve();
        });
      });
    });
  }

  // User management methods
  async createUser(username, email, password) {
    const passwordHash = await bcrypt.hash(password, 10);
    
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO users (username, email, password_hash)
        VALUES (?, ?, ?)
      `);
      
      stmt.run([username, email, passwordHash], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ 
            id: this.lastID, 
            username, 
            email,
            created_at: new Date().toISOString()
          });
        }
      });
      
      stmt.finalize();
    });
  }

  async getUserByEmail(email) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM users WHERE email = ?',
        [email],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });
  }

  async getUserByUsername(username) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM users WHERE username = ?',
        [username],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });
  }

  async getUserById(id) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT id, username, email, avatar, created_at, last_login, total_games, total_wins FROM users WHERE id = ?',
        [id],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });
  }

  async updateLastLogin(userId) {
    return new Promise((resolve, reject) => {
      this.db.run(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
        [userId],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve(this.changes > 0);
          }
        }
      );
    });
  }

  async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  // Game statistics methods
  async getGameStats(userId, gameType = null) {
    if (gameType) {
      return new Promise((resolve, reject) => {
        this.db.get(
          'SELECT * FROM game_stats WHERE user_id = ? AND game_type = ?',
          [userId, gameType],
          (err, row) => {
            if (err) {
              reject(err);
            } else {
              resolve(row);
            }
          }
        );
      });
    } else {
      return new Promise((resolve, reject) => {
        this.db.all(
          'SELECT * FROM game_stats WHERE user_id = ?',
          [userId],
          (err, rows) => {
            if (err) {
              reject(err);
            } else {
              resolve(rows);
            }
          }
        );
      });
    }
  }

  async updateGameStats(userId, gameType, won = false) {
    return new Promise((resolve, reject) => {
      // First, try to insert new stats record
      const insertStmt = this.db.prepare(`
        INSERT OR IGNORE INTO game_stats (user_id, game_type, games_played, games_won)
        VALUES (?, ?, 0, 0)
      `);
      
      insertStmt.run([userId, gameType], (err) => {
        if (err) {
          reject(err);
          return;
        }

        // Then update the stats
        const updateQuery = won 
          ? 'UPDATE game_stats SET games_played = games_played + 1, games_won = games_won + 1 WHERE user_id = ? AND game_type = ?'
          : 'UPDATE game_stats SET games_played = games_played + 1 WHERE user_id = ? AND game_type = ?';
        
        this.db.run(updateQuery, [userId, gameType], function(updateErr) {
          if (updateErr) {
            reject(updateErr);
          } else {
            // Also update user totals
            const userUpdateQuery = won
              ? 'UPDATE users SET total_games = total_games + 1, total_wins = total_wins + 1 WHERE id = ?'
              : 'UPDATE users SET total_games = total_games + 1 WHERE id = ?';
            
            this.db.run(userUpdateQuery, [userId], (userErr) => {
              if (userErr) {
                reject(userErr);
              } else {
                resolve(this.changes > 0);
              }
            });
          }
        });
      });
      
      insertStmt.finalize();
    });
  }

  async recordGameHistory(gameId, gameType, player1Id, player2Id, winnerId = null, gameData = null) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO game_history (game_id, game_type, player1_id, player2_id, winner_id, game_data, ended_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `);
      
      stmt.run([gameId, gameType, player1Id, player2Id, winnerId, JSON.stringify(gameData)], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
      
      stmt.finalize();
    });
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
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        } else {
          console.log('Database connection closed');
        }
      });
    }
  }
}

// Export singleton instance
export default new Database();