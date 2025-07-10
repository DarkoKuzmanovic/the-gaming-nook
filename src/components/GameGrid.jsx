import React from 'react'
import Card from './Card'
import { getValidPlacementPositions } from '../game/placement'
import './GameGrid.css'

const GameGrid = ({ grid, onCardPlace, canPlace, selectedCard, isOpponent = false }) => {
  const handleGridClick = (index) => {
    if (canPlace && selectedCard) {
      onCardPlace(index)
    }
  }

  const getPlacementHint = (index) => {
    if (!canPlace || !selectedCard) return null
    
    const validPositions = getValidPlacementPositions(selectedCard, grid)
    const position = validPositions.find(pos => pos.index === index)
    
    if (position && position.valid) {
      return {
        type: position.type,
        description: position.description
      }
    }
    
    return null
  }

  return (
    <div className={`game-grid ${isOpponent ? 'opponent' : ''}`}>
      {grid.map((card, index) => (
        <div
          key={index}
          className={`grid-space ${getPlacementHint(index)?.type || ''}`}
          onClick={() => handleGridClick(index)}
        >
          <div className="space-number">{index + 1}</div>
          {card && (
            <Card 
              card={card}
              isPlaced={true}
              showBack={isOpponent && !card.faceUp}
            />
          )}
          {getPlacementHint(index) && (
            <div className="placement-hint">
              {getPlacementHint(index).description}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default GameGrid