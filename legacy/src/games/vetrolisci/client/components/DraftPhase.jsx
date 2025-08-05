import React from 'react'
import Card from './Card.jsx'
import { getPickableCards } from '../../shared/placement.js'
import './DraftPhase.css'

const DraftPhase = ({ gameState, playerIndex, onCardPick, error, animatingCards }) => {
  if (!gameState || !gameState.draftState) {
    return null
  }

  const { draftState, players, currentPickingPlayer } = gameState
  const currentPlayer = players[playerIndex]
  const opponentIndex = playerIndex === 0 ? 1 : 0
  const opponent = players[opponentIndex]
  
  const isMyTurn = currentPickingPlayer?.index === playerIndex
  const currentPickingPlayerName = currentPickingPlayer?.name || 'Unknown'
  
  // Calculate draft progress
  const totalPicks = 4 // 4 cards per round
  const picksCompleted = draftState.picksThisRound || 0
  const remainingCards = draftState.revealedCards ? draftState.revealedCards.length : 0
  
  // Get pickable cards with restrictions
  const pickableCards = draftState.revealedCards ? 
    getPickableCards(currentPlayer.grid, draftState.revealedCards) : []

  return (
    <div className="draft-phase">
      <div className="draft-header">
        <h3>Draft Phase - Round {gameState.currentRound}</h3>
        
        <div className={`turn-indicator ${isMyTurn ? 'my-turn' : 'waiting'}`}>
          {isMyTurn ? (
            <span className="my-turn-text">
              🎯 Your turn to pick!
            </span>
          ) : (
            <span className="waiting-text">
              ⏳ Waiting for {currentPickingPlayerName}
              <span className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </span>
          )}
        </div>
        
        <div className="pick-progress">
          <div className="pick-counter">
            Pick {picksCompleted + 1} of {totalPicks}
          </div>
          <div className="cards-remaining">
            {remainingCards} cards remaining
          </div>
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="error-banner">
            ⚠️ {error}
          </div>
        )}
      </div>

      <div className="draft-content">
        {/* Available Cards */}
        <div className="available-cards-section">
          <h4>Available Cards</h4>
          <div className="available-cards">
            {pickableCards.map((cardData) => {
              const canPlayerPick = isMyTurn && cardData.pickable.canPick
              const isAnimating = animatingCards.has(cardData.id)
              const canPick = canPlayerPick && !isAnimating
              
              const tooltipText = !cardData.pickable.canPick ? 
                (cardData.pickable.reason === 'all_cards_validated' ? 
                  'All cards would violate validation rule - can place face-down' : 
                  'You already have a validated card with this number') : ''
              
              return (
                <div 
                  key={cardData.id} 
                  className={`card-container ${
                    canPick ? 'pickable' : 'not-pickable'
                  } ${isAnimating ? 'animating' : ''}`}
                  title={tooltipText}
                >
                  <Card 
                    card={cardData}
                    onClick={() => {
                      if (canPick) {
                        onCardPick(cardData.id)
                      }
                    }}
                    isSelected={false}
                  />
                  {!cardData.pickable.canPick && (
                    <div className="card-restriction-overlay">
                      <span className="restriction-icon">🚫</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Draft Complete - Ready for Placement */}
        {gameState.draftState?.phase === 'complete' && (
          <div className="draft-complete-section">
            <h4>Draft Complete!</h4>
            <p>All cards have been drafted. Ready to begin placement phase.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default DraftPhase