import React from 'react'
import './Card.css'
import { COLORS, getCardImagePath, getCardBackImagePath } from '../data/cards.js'

const Card = ({ card, isSelected, onClick, isPlaced = false, showBack = false }) => {
  const getColorClass = (color) => {
    const colorMap = {
      blue: 'card-blue',
      green: 'card-green',
      yellow: 'card-yellow',
      red: 'card-red',
      multi: 'card-multi'
    }
    return colorMap[color] || 'card-default'
  }

  const getScoringSymbols = (scoring) => {
    if (scoring > 0) {
      return Array(Math.min(scoring, 5)).fill().map((_, i) => (
        <span key={i} className="spiral">🌀</span>
      ))
    } else if (scoring < 0) {
      return Array(Math.min(Math.abs(scoring), 5)).fill().map((_, i) => (
        <span key={i} className="cross">✖️</span>
      ))
    }
    return null
  }

  if (showBack) {
    const backImagePath = getCardBackImagePath()
    return (
      <div className="card card-back">
        <img 
          src={`/cards/backs/${backImagePath}`} 
          alt="Card back"
          className="card-image"
          onError={(e) => {
            e.target.style.display = 'none'
            e.target.nextSibling.style.display = 'block'
          }}
        />
        <div className="card-back-fallback" style={{display: 'none'}}>
          <div className="card-back-pattern"></div>
        </div>
      </div>
    )
  }

  if (!card) {
    return <div className="card card-empty"></div>
  }

  const frontImagePath = getCardImagePath(card)

  return (
    <div 
      className={`card ${getColorClass(card.color)} ${isSelected ? 'selected' : ''} ${isPlaced ? 'placed' : ''} ${card.validated ? 'validated' : ''}`}
      onClick={onClick}
    >
      {frontImagePath ? (
        <>
          <img 
            src={`/cards/fronts/${frontImagePath}`} 
            alt={`${card.color} ${card.value}`}
            className="card-image"
            onError={(e) => {
              e.target.style.display = 'none'
              e.target.nextSibling.style.display = 'block'
            }}
          />
          <div className="card-fallback" style={{display: 'none'}}>
            <div className="card-header">
              <div className="card-number">{card.value}</div>
              <div className="card-symbols">
                {getScoringSymbols(card.scoring)}
              </div>
            </div>
            
            <div className="card-center">
              <div className="card-color-indicator"></div>
              {card.special && <div className="special-indicator">⭐</div>}
            </div>
            
            <div className="card-footer">
              <div className="card-scoring">{card.scoring > 0 ? `+${card.scoring}` : card.scoring}</div>
              <div className="card-number-small">{card.value}</div>
            </div>
          </div>
        </>
      ) : (
        <div className="card-fallback">
          <div className="card-header">
            <div className="card-number">{card.value}</div>
            <div className="card-symbols">
              {getScoringSymbols(card.scoring)}
            </div>
          </div>
          
          <div className="card-center">
            <div className="card-color-indicator"></div>
            {card.special && <div className="special-indicator">⭐</div>}
          </div>
          
          <div className="card-footer">
            <div className="card-scoring">{card.scoring > 0 ? `+${card.scoring}` : card.scoring}</div>
            <div className="card-number-small">{card.value}</div>
          </div>
        </div>
      )}
      
      {card.validated && <div className="validation-badge">✓</div>}
    </div>
  )
}

export default Card