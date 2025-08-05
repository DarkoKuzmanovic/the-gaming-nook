import React from 'react'
import Card from './Card'
import './CardHand.css'

const CardHand = ({ cards, onCardSelect, selectedCard, canSelect }) => {
  const handleCardClick = (card) => {
    if (canSelect) {
      onCardSelect(card)
    }
  }

  return (
    <div className="card-hand">
      <h3>Available Cards</h3>
      <div className="cards-container">
        {cards.map((card, index) => (
          <Card
            key={index}
            card={card}
            isSelected={selectedCard === card}
            onClick={() => handleCardClick(card)}
          />
        ))}
      </div>
      {cards.length === 0 && (
        <div className="no-cards">
          <p>No cards available</p>
        </div>
      )}
    </div>
  )
}

export default CardHand