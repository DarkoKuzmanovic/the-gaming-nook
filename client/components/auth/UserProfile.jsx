import React, { useState, useEffect } from 'react';
import authService from '../../services/authService';
import './UserProfile.css';

const UserProfile = ({ user, onClose, onLogout }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    if (authService.isGuest()) {
      setProfile(user);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const profileData = await authService.getProfile();
      setProfile(profileData);
    } catch (error) {
      setError('Failed to load profile: ' + error.message);
      setProfile(user); // Fallback to basic user data
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      onLogout();
      onClose();
    } catch (error) {
      console.error('Logout failed:', error);
      // Still proceed with local logout
      onLogout();
      onClose();
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getWinRate = (stats) => {
    if (!stats || stats.games === 0) return 0;
    return Math.round((stats.wins / stats.games) * 100);
  };

  if (loading) {
    return (
      <div className="user-profile-overlay" onClick={onClose}>
        <div className="user-profile" onClick={(e) => e.stopPropagation()}>
          <div className="loading-spinner">Loading profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="user-profile-overlay" onClick={onClose}>
      <div className="user-profile" onClick={(e) => e.stopPropagation()}>
        <button className="profile-close" onClick={onClose}>×</button>
        
        <div className="profile-header">
          <div className="profile-avatar">
            {profile?.avatar ? (
              <img src={profile.avatar} alt="Avatar" />
            ) : (
              <div className="default-avatar">
                {profile?.username?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
          </div>
          <div className="profile-info">
            <h2>{profile?.username}</h2>
            {authService.isGuest() ? (
              <p className="guest-badge">Guest Player</p>
            ) : (
              <p className="profile-email">{profile?.email}</p>
            )}
          </div>
        </div>

        {error && <div className="profile-error">{error}</div>}

        {!authService.isGuest() && (
          <div className="profile-stats">
            <h3>Overall Statistics</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Total Games</span>
                <span className="stat-value">{profile?.total_games || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Total Wins</span>
                <span className="stat-value">{profile?.total_wins || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Win Rate</span>
                <span className="stat-value">
                  {profile?.total_games > 0 
                    ? Math.round((profile.total_wins / profile.total_games) * 100) 
                    : 0}%
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Member Since</span>
                <span className="stat-value">{formatDate(profile?.created_at)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Last Login</span>
                <span className="stat-value">{formatDate(profile?.last_login)}</span>
              </div>
            </div>
          </div>
        )}

        {!authService.isGuest() && profile?.gameStats && Object.keys(profile.gameStats).length > 0 && (
          <div className="game-stats">
            <h3>Game Statistics</h3>
            <div className="game-stats-list">
              {Object.entries(profile.gameStats).map(([gameType, stats]) => (
                <div key={gameType} className="game-stat-item">
                  <div className="game-stat-header">
                    <h4>{gameType.charAt(0).toUpperCase() + gameType.slice(1)}</h4>
                    <span className="win-rate">{getWinRate(stats)}% win rate</span>
                  </div>
                  <div className="game-stat-details">
                    <span>Games: {stats.games}</span>
                    <span>Wins: {stats.wins}</span>
                    <span>ELO: {stats.elo}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {authService.isGuest() && (
          <div className="guest-info">
            <h3>Playing as Guest</h3>
            <p>Your game progress won't be saved. Create an account to:</p>
            <ul>
              <li>Track your statistics</li>
              <li>Save your game history</li>
              <li>Compete on leaderboards</li>
              <li>Unlock achievements</li>
            </ul>
          </div>
        )}

        <div className="profile-actions">
          <button className="logout-btn" onClick={handleLogout}>
            {authService.isGuest() ? 'Switch User' : 'Logout'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;