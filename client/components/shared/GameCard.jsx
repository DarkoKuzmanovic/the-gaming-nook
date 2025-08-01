import React from 'react';
import './GameCard.css';

// Reusable game selection card component
const GameCard = ({ game, onSelect, isSelected = false }) => {
  return (
    <div 
      className={`game-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onSelect(game)}
    >
      <div className="game-thumbnail">
        <img 
          src={game.thumbnail || '/icons/favicon.svg'} 
          alt={game.displayName}
          onError={(e) => {
            e.target.src = '/icons/favicon.svg';
          }}
        />
      </div>
      
      <div className="game-info">
        <h3>{game.displayName}</h3>
        <p className="game-description">{game.description}</p>
        
        <div className="game-meta">
          <span className="game-category">{game.category}</span>
          <span className="game-players">
            {game.minPlayers === game.maxPlayers 
              ? `${game.minPlayers} players`
              : `${game.minPlayers}-${game.maxPlayers} players`
            }
          </span>
        </div>
      </div>
      
      <div className="game-status">
        <button className="play-button">
          Play Now
        </button>
      </div>
    </div>
  );
};

export default GameCard;