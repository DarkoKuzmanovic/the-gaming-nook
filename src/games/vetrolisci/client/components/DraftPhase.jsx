import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
      <div className="draft-content">
        {/* Available Cards */}
        <div className="available-cards-section">
          <div className="section-header">
            <h4>Available Cards</h4>
            {/* Error Display - moved here for better visibility */}
            {error && (
              <div className="error-banner">
                ⚠️ {error}
              </div>
            )}
          </div>
          <motion.div 
            className="available-cards"
            initial={false}
            layout
          >
            <AnimatePresence mode="popLayout">
              {pickableCards.map((cardData, index) => {
                const canPlayerPick = isMyTurn && cardData.pickable.canPick
                const isAnimating = animatingCards.has(cardData.id)
                const canPick = canPlayerPick && !isAnimating
                
                const tooltipText = !cardData.pickable.canPick ? 
                  (cardData.pickable.reason === 'all_cards_validated' ? 
                    'All cards would violate validation rule - can place face-down' : 
                    'You already have a validated card with this number') : ''
                
                return (
                  <motion.div 
                    key={cardData.id} 
                    className={`card-container ${
                      canPick ? 'pickable' : 'not-pickable'
                    } ${isAnimating ? 'animating' : ''}`}
                    title={tooltipText}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0, 
                      scale: 1,
                      transition: {
                        duration: 0.4,
                        delay: index * 0.1,
                        ease: "easeOut"
                      }
                    }}
                    exit={{ 
                      opacity: 0, 
                      scale: 0.9, 
                      y: -10,
                      transition: {
                        duration: 0.4,
                        ease: "easeInOut"
                      }
                    }}
                    layout
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
                      <motion.div 
                        className="card-restriction-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <span className="restriction-icon">🚫</span>
                      </motion.div>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </motion.div>
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