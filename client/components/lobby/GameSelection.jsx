import React, { useState, useEffect } from 'react';
import GameCard from '../shared/GameCard';
import GameRegistry from '../../games/base/GameRegistry';
import './GameSelection.css';

const GameSelection = ({ onGameSelect, user }) => {
  const [games, setGames] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    // Load available games from registry
    const availableGames = GameRegistry.getAllGames();
    const gameCategories = ['all', ...GameRegistry.getCategories().filter(cat => cat && typeof cat === 'string')];
    
    setGames(availableGames);
    setCategories(gameCategories);
  }, []);

  const filteredGames = selectedCategory === 'all' 
    ? games 
    : games.filter(game => game.category === selectedCategory);

  const handleGameSelect = (game) => {
    onGameSelect(game);
  };

  return (
    <div className="game-selection">
      <div className="game-selection-header">
        <div className="welcome-section">
          <h1>Welcome to The Gaming Nook</h1>
          <p>Hello, <strong>{user?.username}</strong>! Choose a game to play:</p>
        </div>
        
        <div className="category-filter">
          {categories.map(category => (
            <button
              key={category}
              className={`category-button ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category === 'all' ? 'All Games' : (category || '').charAt(0).toUpperCase() + (category || '').slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="games-grid">
        {filteredGames.length > 0 ? (
          filteredGames.map(game => (
            <GameCard
              key={game.id}
              game={game}
              onSelect={handleGameSelect}
            />
          ))
        ) : (
          <div className="no-games">
            <p>No games available in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameSelection;