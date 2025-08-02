class AuthService {
  constructor() {
    this.baseURL = '/api/auth';
    this.token = localStorage.getItem('gaming-nook-token');
    this.user = null;
    
    // Load user from localStorage if token exists
    if (this.token) {
      const savedUser = localStorage.getItem('gaming-nook-user');
      if (savedUser) {
        try {
          this.user = JSON.parse(savedUser);
        } catch (error) {
          console.error('Failed to parse saved user data:', error);
          this.clearAuth();
        }
      }
    }
  }

  // Make authenticated API request
  async apiRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { 'Authorization': `Bearer ${this.token}` }),
        ...options.headers
      },
      ...options
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      // If token is invalid, clear auth data
      if (error.message.includes('Invalid or expired token')) {
        this.clearAuth();
      }
      throw error;
    }
  }

  // Register new user
  async register(username, email, password) {
    try {
      const response = await this.apiRequest('/register', {
        method: 'POST',
        body: { username, email, password }
      });

      if (response.success) {
        this.setAuth(response.data.token, response.data.user);
        return response.data.user;
      } else {
        throw new Error(response.error || 'Registration failed');
      }
    } catch (error) {
      throw error;
    }
  }

  // Login user
  async login(email, password) {
    try {
      const response = await this.apiRequest('/login', {
        method: 'POST',
        body: { email, password }
      });

      if (response.success) {
        this.setAuth(response.data.token, response.data.user);
        return response.data.user;
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      throw error;
    }
  }

  // Guest login
  async guestLogin(username) {
    try {
      const response = await this.apiRequest('/guest', {
        method: 'POST',
        body: { username }
      });

      if (response.success) {
        this.setAuth(response.data.token, response.data.user);
        return response.data.user;
      } else {
        throw new Error(response.error || 'Guest login failed');
      }
    } catch (error) {
      throw error;
    }
  }

  // Logout
  async logout() {
    try {
      if (this.token) {
        await this.apiRequest('/logout', { method: 'POST' });
      }
    } catch (error) {
      console.error('Logout request failed:', error);
      // Continue with local logout even if server request fails
    } finally {
      this.clearAuth();
    }
  }

  // Get user profile
  async getProfile() {
    try {
      const response = await this.apiRequest('/profile');
      if (response.success) {
        this.user = { ...this.user, ...response.data };
        this.saveUser();
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to fetch profile');
      }
    } catch (error) {
      throw error;
    }
  }

  // Verify token validity
  async verifyToken() {
    if (!this.token) {
      return false;
    }

    try {
      const response = await this.apiRequest('/verify');
      return response.success;
    } catch (error) {
      console.error('Token verification failed:', error);
      this.clearAuth();
      return false;
    }
  }

  // Get game statistics
  async getGameStats(gameType = null) {
    try {
      const endpoint = gameType ? `/stats/${gameType}` : '/stats';
      const response = await this.apiRequest(endpoint);
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.error || 'Failed to fetch game stats');
      }
    } catch (error) {
      throw error;
    }
  }

  // Set authentication data
  setAuth(token, user) {
    this.token = token;
    this.user = user;
    localStorage.setItem('gaming-nook-token', token);
    this.saveUser();
  }

  // Clear authentication data
  clearAuth() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('gaming-nook-token');
    localStorage.removeItem('gaming-nook-user');
  }

  // Save user data to localStorage
  saveUser() {
    if (this.user) {
      localStorage.setItem('gaming-nook-user', JSON.stringify(this.user));
    }
  }

  // Check if user is authenticated
  isAuthenticated() {
    return !!(this.token && this.user);
  }

  // Check if user is a guest
  isGuest() {
    return this.user && this.user.isGuest === true;
  }

  // Get current user
  getCurrentUser() {
    return this.user;
  }

  // Get authentication token
  getToken() {
    return this.token;
  }

  // Get user ID for socket connection
  getUserId() {
    return this.user ? this.user.id : null;
  }

  // Get username for display
  getUsername() {
    return this.user ? this.user.username : '';
  }

  // Check if user has played a specific game
  hasPlayedGame(gameType) {
    return this.user && 
           this.user.gameStats && 
           this.user.gameStats[gameType] && 
           this.user.gameStats[gameType].games > 0;
  }

  // Get win rate for a specific game
  getWinRate(gameType) {
    if (!this.user || !this.user.gameStats || !this.user.gameStats[gameType]) {
      return 0;
    }
    
    const stats = this.user.gameStats[gameType];
    return stats.games > 0 ? (stats.wins / stats.games) * 100 : 0;
  }

  // Auto-refresh token periodically
  startTokenRefresh() {
    // Refresh token every 6 hours
    setInterval(async () => {
      if (this.isAuthenticated() && !this.isGuest()) {
        try {
          const isValid = await this.verifyToken();
          if (!isValid) {
            console.log('Token expired, user needs to re-authenticate');
            this.clearAuth();
            // Emit event for app to handle re-authentication
            window.dispatchEvent(new CustomEvent('auth-expired'));
          }
        } catch (error) {
          console.error('Token refresh check failed:', error);
        }
      }
    }, 6 * 60 * 60 * 1000); // 6 hours
  }
}

// Export singleton instance
export default new AuthService();