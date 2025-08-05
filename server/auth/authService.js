import jwt from 'jsonwebtoken';
import database from '../database/jsonDatabase.js';

// JWT secret - in production, this should be in environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days

class AuthService {
  // Generate JWT token
  generateToken(user) {
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      isGuest: user.isGuest || false
    };
    
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  // Verify JWT token
  verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  // Register new user
  async register(username, email, password) {
    try {
      // Validation
      if (!username || !email || !password) {
        throw new Error('Username, email, and password are required');
      }

      if (username.length < 3) {
        throw new Error('Username must be at least 3 characters long');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters long');
      }

      if (!this.isValidEmail(email)) {
        throw new Error('Please provide a valid email address');
      }

      // Check if user already exists
      const existingUserByEmail = await database.getUserByEmail(email);
      if (existingUserByEmail) {
        throw new Error('User with this email already exists');
      }

      const existingUserByUsername = await database.getUserByUsername(username);
      if (existingUserByUsername) {
        throw new Error('Username is already taken');
      }

      // Create user
      const user = await database.createUser(username, email, password);
      
      // Generate token
      const token = this.generateToken(user);
      
      // Update last login
      await database.updateLastLogin(user.id);

      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          created_at: user.created_at
        },
        token
      };
    } catch (error) {
      throw error;
    }
  }

  // Login user
  async login(email, password) {
    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      // Get user by email
      const user = await database.getUserByEmail(email);
      if (!user) {
        throw new Error('Invalid email or password');
      }

      // Verify password
      const isValidPassword = await database.verifyPassword(password, user.password_hash);
      if (!isValidPassword) {
        throw new Error('Invalid email or password');
      }

      // Generate token
      const token = this.generateToken(user);
      
      // Update last login
      await database.updateLastLogin(user.id);

      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          last_login: new Date().toISOString()
        },
        token
      };
    } catch (error) {
      throw error;
    }
  }

  // Get user profile
  async getProfile(userId) {
    try {
      const profile = await database.getUserProfile(userId);
      if (!profile) {
        throw new Error('User not found');
      }
      return profile;
    } catch (error) {
      throw error;
    }
  }

  // Middleware to authenticate requests
  authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    try {
      const decoded = this.verifyToken(token);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
  }

  // Helper method to validate email format
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Guest login - create temporary user session
  async guestLogin(username) {
    try {
      if (!username || username.length < 2) {
        throw new Error('Guest username must be at least 2 characters long');
      }

      // For guests, we create a temporary token without database storage
      const guestUser = {
        id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        username: username,
        email: null,
        isGuest: true
      };

      const token = this.generateToken(guestUser);

      return {
        user: guestUser,
        token
      };
    } catch (error) {
      throw error;
    }
  }

  // Update game statistics after game completion
  async updateGameStats(userId, gameType, won = false) {
    try {
      // Skip stats update for guest users
      if (typeof userId === 'string' && userId.startsWith('guest_')) {
        return null;
      }

      await database.updateGameStats(userId, gameType, won);
      return await database.getGameStats(userId, gameType);
    } catch (error) {
      console.error('Error updating game stats:', error);
      throw error;
    }
  }

  // Record completed game
  async recordGame(gameId, gameType, player1Id, player2Id, winnerId = null, gameData = null) {
    try {
      // Skip database recording for guest games
      const isGuestGame = (typeof player1Id === 'string' && player1Id.startsWith('guest_')) ||
                         (typeof player2Id === 'string' && player2Id.startsWith('guest_'));
      
      if (isGuestGame) {
        return null;
      }

      return await database.recordGameHistory(gameId, gameType, player1Id, player2Id, winnerId, gameData);
    } catch (error) {
      console.error('Error recording game:', error);
      throw error;
    }
  }
}

// Export singleton instance
export default new AuthService();