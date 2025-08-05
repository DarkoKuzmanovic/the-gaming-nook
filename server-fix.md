# Server Security & Architecture Fix Guide

## Executive Summary

This document outlines critical security vulnerabilities and architectural issues identified in The Gaming Nook multiplayer game server. Issues are categorized by severity with immediate action items and long-term recommendations.

## Critical Security Vulnerabilities (Fix Immediately)

### 1. CORS Configuration - CRITICAL
**File:** `server/main.js`
**Issue:** CORS allows all origins (`*`)
```javascript
// Current (DANGEROUS)
app.use(cors());

// Fix
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
```

### 2. Hardcoded JWT Secret - CRITICAL
**File:** `server/auth/authService.js`
**Issue:** JWT secret hardcoded as fallback
```javascript
// Current (DANGEROUS)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Fix
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
```

### 3. No HTTPS Enforcement - CRITICAL
**File:** `server/main.js`
**Issue:** Server accepts HTTP connections
```javascript
// Add HTTPS redirect middleware
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure && req.get('x-forwarded-proto') !== 'https') {
    return res.redirect(301, `https://${req.get('host')}${req.url}`);
  }
  next();
});
```

### 4. Socket.io Input Validation - CRITICAL
**File:** `server/main.js`
**Issue:** No validation on socket events
```javascript
// Current (VULNERABLE)
socket.on('join-game', async (data) => {
  const { gameType, playerName, authToken } = data;
  // No validation of data structure or content
});

// Fix
socket.on('join-game', async (data) => {
  if (!data || typeof data !== 'object') {
    return socket.emit('error', { message: 'Invalid request format' });
  }
  
  const { gameType, playerName, authToken } = data;
  
  if (!gameType || !['vetrolisci', 'connect4'].includes(gameType)) {
    return socket.emit('error', { message: 'Invalid game type' });
  }
  
  if (!playerName || typeof playerName !== 'string' || playerName.length > 50) {
    return socket.emit('error', { message: 'Invalid player name' });
  }
  
  // Continue with existing logic...
});
```

## High Priority Security Issues

### 5. Rate Limiting - HIGH
**Issue:** No protection against spam/DoS
```javascript
// Add to server/main.js
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});

app.use('/api/', limiter);

// Socket.io rate limiting
const socketRateLimit = new Map();

socket.use((packet, next) => {
  const clientId = socket.id;
  const now = Date.now();
  const windowMs = 1000; // 1 second
  const maxRequests = 10;
  
  if (!socketRateLimit.has(clientId)) {
    socketRateLimit.set(clientId, { count: 1, resetTime: now + windowMs });
    return next();
  }
  
  const clientData = socketRateLimit.get(clientId);
  
  if (now > clientData.resetTime) {
    clientData.count = 1;
    clientData.resetTime = now + windowMs;
    return next();
  }
  
  if (clientData.count >= maxRequests) {
    return next(new Error('Rate limit exceeded'));
  }
  
  clientData.count++;
  next();
});
```

### 6. JWT Token Management - HIGH
**Issue:** Long expiration, no blacklisting
```javascript
// Fix in server/auth/authService.js
generateToken(user) {
  return jwt.sign(
    { userId: user.id, username: user.username },
    JWT_SECRET,
    { expiresIn: '1h' } // Reduced from 24h
  );
},

// Add token blacklist
const tokenBlacklist = new Set();

blacklistToken(token) {
  tokenBlacklist.add(token);
},

verifyToken(token) {
  if (tokenBlacklist.has(token)) {
    throw new Error('Token has been revoked');
  }
  return jwt.verify(token, JWT_SECRET);
}
```

### 7. Game Move Validation - HIGH
**File:** `server/games/vetrolisci/VetrolisciServer.js`
**Issue:** Trusts client data without validation
```javascript
// Fix processCardPick method
processCardPick(playerId, data) {
  // Validate input structure
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid move data');
  }
  
  const { cardId, choice, position } = data;
  
  // Validate cardId
  if (!cardId || typeof cardId !== 'string') {
    throw new Error('Invalid card ID');
  }
  
  // Validate it's player's turn
  if (this.currentPlayerIndex !== this.players.findIndex(p => p.id === playerId)) {
    throw new Error('Not your turn');
  }
  
  // Validate card exists in player's hand
  const player = this.players.find(p => p.id === playerId);
  if (!player.hand.some(card => card.id === cardId)) {
    throw new Error('Card not in hand');
  }
  
  // Validate choice and position based on game rules
  if (choice === 'place' && position) {
    const { row, col } = position;
    if (!Number.isInteger(row) || !Number.isInteger(col) || 
        row < 0 || row >= 4 || col < 0 || col >= 4) {
      throw new Error('Invalid position');
    }
    
    if (player.grid[row][col] !== null) {
      throw new Error('Position already occupied');
    }
  }
  
  // Continue with existing logic...
}
```

### 8. Error Information Disclosure - HIGH
**Issue:** Detailed errors exposed to clients
```javascript
// Add error handling middleware to server/main.js
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (process.env.NODE_ENV === 'production') {
    res.status(500).json({ message: 'Internal server error' });
  } else {
    res.status(500).json({ message: err.message, stack: err.stack });
  }
});

// Socket.io error handling
socket.on('error', (error) => {
  console.error('Socket error:', error);
  socket.emit('error', { message: 'An error occurred' });
});
```

## Medium Priority Issues

### 9. Database Security - MEDIUM
**Issue:** JSON file storage, no encryption
**Recommendation:** Migrate to proper database
```javascript
// Consider migrating to SQLite with better-sqlite3
const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');

class SecureDatabase {
  constructor() {
    this.db = new Database('gaming_nook.db');
    this.initTables();
  }
  
  initTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME,
        games_played INTEGER DEFAULT 0,
        games_won INTEGER DEFAULT 0
      );
      
      CREATE TABLE IF NOT EXISTS game_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        game_type TEXT NOT NULL,
        players TEXT NOT NULL,
        winner TEXT,
        duration INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }
}
```

### 10. Password Requirements - MEDIUM
**File:** `server/auth/authService.js`
**Issue:** Weak password validation
```javascript
// Enhanced password validation
validatePassword(password) {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }
  
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    throw new Error('Password must contain at least one uppercase letter, one lowercase letter, and one number');
  }
  
  return true;
}
```

### 11. Session Management - MEDIUM
**Issue:** Multiple connections from same user
```javascript
// Add session tracking
const activeSessions = new Map();

socket.on('join-game', async (data) => {
  const user = await authService.verifyToken(authToken);
  
  // Check for existing sessions
  if (activeSessions.has(user.userId)) {
    const existingSocket = activeSessions.get(user.userId);
    existingSocket.emit('session-terminated', { reason: 'New login detected' });
    existingSocket.disconnect();
  }
  
  activeSessions.set(user.userId, socket);
  
  socket.on('disconnect', () => {
    activeSessions.delete(user.userId);
  });
});
```

## Game-Specific Security Issues

### 12. Anti-Cheat Measures
**Issue:** No server-side game rule enforcement
```javascript
// Add comprehensive game state validation
validateGameState() {
  // Validate player count
  if (this.players.length < 2 || this.players.length > 4) {
    throw new Error('Invalid player count');
  }
  
  // Validate deck integrity
  const totalCards = this.deck.length + 
    this.players.reduce((sum, p) => sum + p.hand.length, 0) +
    this.players.reduce((sum, p) => sum + p.grid.flat().filter(c => c).length, 0);
    
  if (totalCards !== 60) { // Assuming 60 total cards
    throw new Error('Card count mismatch detected');
  }
  
  // Validate turn order
  if (this.currentPlayerIndex < 0 || this.currentPlayerIndex >= this.players.length) {
    throw new Error('Invalid current player');
  }
}
```

### 13. Secure Randomization
**Issue:** Using Math.random() for game logic
```javascript
// Replace Math.random() with crypto.randomBytes
const crypto = require('crypto');

secureRandom() {
  return crypto.randomBytes(4).readUInt32BE(0) / 0xFFFFFFFF;
}

shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(this.secureRandom() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
```

## Environment Configuration

### Required Environment Variables
Create `.env` file:
```env
# Security
JWT_SECRET=your-super-secure-random-string-here
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com

# Database
DATABASE_URL=sqlite:./gaming_nook.db

# Server
PORT=3001
NODE_ENV=production

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Security Headers

Add security headers middleware:
```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

## Logging and Monitoring

```javascript
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Log security events
function logSecurityEvent(event, details) {
  logger.warn('Security Event', {
    event,
    details,
    timestamp: new Date().toISOString()
  });
}
```

## Implementation Priority

### Phase 1 (Immediate - Critical)
1. ✅ Fix CORS configuration
2. Move JWT secret to environment variables
3. Add HTTPS enforcement
4. ✅ Implement basic input validation

### Phase 2 (High Priority)
1. ✅ Add rate limiting
2. ✅ Implement proper error handling
3. ✅ Add game move validation
4. Improve JWT token management

### Phase 3 (Medium Priority)
1. Database migration
2. Enhanced password requirements
3. Session management improvements
4. Security headers implementation

### Phase 4 (Long-term)
1. Comprehensive anti-cheat system
2. Advanced monitoring and logging
3. Performance optimizations
4. Scalability improvements

## Testing Security Fixes

1. **Penetration Testing**: Test for common vulnerabilities
2. **Load Testing**: Verify rate limiting works
3. **Authentication Testing**: Test token validation and expiration
4. **Game Logic Testing**: Verify server-side validation prevents cheating

## Conclusion

These fixes address critical security vulnerabilities that could lead to:
- Unauthorized access
- Data breaches
- Game state manipulation
- Denial of service attacks

Implement Phase 1 fixes immediately before deploying to production. The remaining phases can be implemented incrementally while maintaining service availability.