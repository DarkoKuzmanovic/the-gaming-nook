import React, { useState } from 'react'
import Card from './Card'
import { getDraftPhaseStatus, getUpcomingPickOrder } from '../../games/vetrolisci/draft'
import { getPickableCards } from '../../games/vetrolisci/placement'
import './DraftPhase.css'

const DraftPhase = ({ draftState, onCardPick, playerIndex, playerNames, playerGrid }) => {
  // State for shake animation on restricted cards
  const [shakingCards, setShakingCards] = useState(new Set())

  // Function to trigger shake animation for restricted cards
  const triggerShakeAnimation = (cardId) => {
    setShakingCards(prev => new Set([...prev, cardId]))
    setTimeout(() => {
      setShakingCards(prev => {
        const newSet = new Set(prev)
        newSet.delete(cardId)
        return newSet
      })
    }, 500) // Remove after animation completes
  }
  const status = getDraftPhaseStatus(draftState)
  const upcomingPicks = getUpcomingPickOrder(draftState)
  const currentPlayerName = playerNames[status.currentPickingPlayer] || `Player ${status.currentPickingPlayer + 1}`
  const isMyTurn = status.currentPickingPlayer === playerIndex
  
  // Get pickable cards based on validation rules
  const pickableCards = playerGrid ? getPickableCards(playerGrid, draftState.revealedCards) : draftState.revealedCards.map(card => ({ ...card, pickable: { canPick: true, reason: null } }))

  if (draftState.phase === 'reveal') {
    return (
      <div className="draft-phase">
        <div className="draft-header">
          <h3>Cards Revealed!</h3>
          <p>4 cards have been drawn for this round</p>
          <button 
            className="start-draft-btn"
            onClick={() => onCardPick(null, 'start')}
          >
            Start Draft
          </button>
        </div>
        
        <div className="revealed-cards">
          {draftState.revealedCards.map(card => (
            <Card 
              key={card.id}
              card={card}
              onClick={() => {}}
              isSelected={false}
            />
          ))}
        </div>
      </div>
    )
  }

  if (draftState.phase === 'pick') {
    return (
      <div className="draft-phase">
        <div className="draft-header">
          <h3>Draft Phase</h3>
          <div className={`turn-indicator ${isMyTurn ? 'my-turn' : ''}`}>
            <p className={`current-picker ${isMyTurn ? 'my-turn' : ''}`}>
              {isMyTurn ? "Your turn to pick!" : `${currentPlayerName}'s turn`}
            </p>
            <div className="pick-counter">
              Pick {5 - status.remainingPicks} of 4
            </div>
          </div>
        </div>

        <div className="draft-content">
          <div className="revealed-cards">
            <h4>Available Cards ({status.cardsRemaining} remaining)</h4>
            <div className="card-grid">
              {pickableCards.map(cardData => {
                const canPlayerPick = isMyTurn && cardData.pickable.canPick
                const cardClass = canPlayerPick ? 'pickable' : 'not-pickable'
                const tooltipText = !cardData.pickable.canPick ? 
                  (cardData.pickable.reason === 'all_cards_validated' ? 
                    'All cards would violate validation rule - can place face-down' : 
                    'You already have a validated card with this number') : ''
                
                const isShaking = shakingCards.has(cardData.id)
                const containerClass = `card-container ${isShaking ? 'shake-animation' : ''}`
                
                return (
                  <div key={cardData.id} className={containerClass} title={tooltipText}>
                    <Card 
                      card={cardData}
                      onClick={() => canPlayerPick ? onCardPick(cardData.id) : triggerShakeAnimation(cardData.id)}
                      isSelected={false}
                      className={cardClass}
                    />
                    {!cardData.pickable.canPick && (
                      <div className="card-restriction-overlay"></div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="player-hands">
            <div className={`player-hand ${status.currentPickingPlayer === 0 ? 'current-player' : ''}`}>
              <h4>{playerNames[0] || 'Player 1'} ({status.playerHands[0].length} cards)</h4>
              <div className="hand-cards">
                {status.playerHands[0].map(card => (
                  <Card 
                    key={`p1-${card.id}`}
                    card={card}
                    onClick={() => {}}
                    isSelected={false}
                  />
                ))}
              </div>
            </div>

            <div className={`player-hand ${status.currentPickingPlayer === 1 ? 'current-player' : ''}`}>
              <h4>{playerNames[1] || 'Player 2'} ({status.playerHands[1].length} cards)</h4>
              <div className="hand-cards">
                {status.playerHands[1].map(card => (
                  <Card 
                    key={`p2-${card.id}`}
                    card={card}
                    onClick={() => {}}
                    isSelected={false}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="pick-order">
            <h4>Pick Order</h4>
            <div className="order-list">
              {upcomingPicks.map(pick => (
                <div 
                  key={pick.pickNumber}
                  className={`pick-item ${pick.isCurrent ? 'current' : ''}`}
                >
                  <span className="pick-number">{pick.pickNumber}</span>
                  <span className="player-name">
                    {playerNames[pick.playerIndex] || `Player ${pick.playerIndex + 1}`}
                  </span>
                  {pick.isCurrent && <span className="current-indicator">👈</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="draft-phase">
      <div className="draft-complete">
        <h3>Draft Complete!</h3>
        <p>All cards have been selected. Starting placement phase...</p>
        
        <div className="final-hands">
          <div className="player-hand">
            <h4>{playerNames[0] || 'Player 1'}</h4>
            <div className="hand-cards">
              {status.playerHands[0].map(card => (
                <Card 
                  key={`final-p1-${card.id}`}
                  card={card}
                  onClick={() => {}}
                  isSelected={false}
                />
              ))}
            </div>
          </div>

          <div className="player-hand">
            <h4>{playerNames[1] || 'Player 2'}</h4>
            <div className="hand-cards">
              {status.playerHands[1].map(card => (
                <Card 
                  key={`final-p2-${card.id}`}
                  card={card}
                  onClick={() => {}}
                  isSelected={false}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DraftPhase