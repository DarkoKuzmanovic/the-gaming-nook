import React from 'react'
import './Card.css'

const Card = ({ card, isSelected, onClick, isPlaced = false, showBack = false }) => {
  const getColorClass = (color) => {
    const colorMap = {
      blue: 'card-blue',
      green: 'card-green',
      yellow: 'card-yellow',
      orange: 'card-orange',
      red: 'card-red',
      purple: 'card-purple',
      brown: 'card-brown',
      multi: 'card-multi'
    }
    return colorMap[color] || 'card-default'
  }

  if (showBack) {
    return (
      <div className="card card-back">
        <div className="card-back-pattern"></div>
        <div className="card-number-peek">{card.number}</div>
      </div>
    )
  }

  return (
    <div 
      className={`card ${getColorClass(card.color)} ${isSelected ? 'selected' : ''} ${isPlaced ? 'placed' : ''} ${card.validated ? 'validated' : ''}`}
      onClick={onClick}
    >
      <div className="card-header">
        <div className="card-number">{card.number}</div>
        <div className="card-symbols">
          {card.hasSpiral && <span className="spiral">🌀</span>}
          {card.hasCross && <span className="cross">✖️</span>}
        </div>
      </div>
      
      <div className="card-center">
        <div className="card-color-indicator"></div>
        {card.isSpecial && <div className="special-indicator">⭐</div>}
      </div>
      
      <div className="card-footer">
        <div className="card-number-small">{card.number}</div>
      </div>
      
      {card.validated && <div className="validation-badge">✓</div>}
      {card.stackedCard && <div className="stacked-indicator">📚</div>}
    </div>
  )
}

export default Card