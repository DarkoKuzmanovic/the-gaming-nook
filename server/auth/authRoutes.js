import express from 'express';
import authService from './authService.js';

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const result = await authService.register(username, email, password);
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    
    res.json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error.message
    });
  }
});

// Guest login
router.post('/guest', async (req, res) => {
  try {
    const { username } = req.body;
    const result = await authService.guestLogin(username);
    
    res.json({
      success: true,
      message: 'Guest login successful',
      data: result
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Get current user profile (requires authentication)
router.get('/profile', authService.authenticateToken, async (req, res) => {
  try {
    const profile = await authService.getProfile(req.user.id);
    
    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      error: error.message
    });
  }
});

// Verify token validity
router.get('/verify', authService.authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Token is valid',
    user: req.user
  });
});

// Logout (client-side token removal, but we can add server-side blacklisting later)
router.post('/logout', authService.authenticateToken, (req, res) => {
  // For now, logout is handled client-side by removing the token
  // In a more advanced implementation, we could maintain a token blacklist
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

// Get user game statistics
router.get('/stats/:gameType?', authService.authenticateToken, async (req, res) => {
  try {
    const { gameType } = req.params;
    const stats = await authService.getGameStats(req.user.id, gameType);
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;