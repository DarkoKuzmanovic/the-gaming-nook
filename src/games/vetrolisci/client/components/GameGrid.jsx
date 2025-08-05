import React from 'react'
import Card from './Card.jsx'
import Confetti from './Confetti.jsx'
import './GameGrid.css'

const GameGrid = ({
  grid,
  isOpponent = false,
  newlyPlacedCards = new Set(),
  glowingCards = new Set(),
  confettiCards = new Set(),
  onConfettiComplete
}) => {
  return (
    <div className={`game-grid ${isOpponent ? 'opponent' : ''}`}>
      {grid.map((card, index) => (
        <div
          key={index}
          className="grid-space"
        >
          {!card && <div className="space-number">{index + 1}</div>}
          {card && (
            <>
              <Card
                card={card}
                isPlaced={true}
                showBack={!card.faceUp}
                className={`${newlyPlacedCards.has(card.id) ? 'card-fade-in' : ''} ${
                  glowingCards.has(card.id) ? 'card-glow' : ''
                }`}
              />
              {confettiCards.has(card.id) && (
                <Confetti cardId={card.id} onComplete={onConfettiComplete} />
              )}
            </>
          )}
        </div>
      ))}
    </div>
  )
}

export default GameGrid