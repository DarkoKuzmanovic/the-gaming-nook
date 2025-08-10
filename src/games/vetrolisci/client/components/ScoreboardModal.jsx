import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { calculatePlayerScore } from '../../shared/scoring.js'
import './ScoreboardModal.css'

const ScoreboardModal = ({ isOpen, gameState, playerIndex, onClose }) => {
  if (!isOpen || !gameState) return null

  const getCurrentScore = (player) => {
    if (!player.grid) return { total: 0 }
    return calculatePlayerScore(player.grid, gameState.currentRound - 1) // use 0-based round index
  }

  const getTotalScore = (player) => {
    const completedRounds = player.scores.reduce((sum, score) => sum + score, 0)
    return completedRounds + getCurrentScore(player).total
  }

  const currentPlayer = gameState.players[playerIndex]
  const opponentIndex = playerIndex === 0 ? 1 : 0
  const opponent = gameState.players[opponentIndex]

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="modal-overlay" 
          onClick={handleOverlayClick}
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: 1,
            transition: { duration: 0.2, ease: "easeOut" }
          }}
          exit={{ 
            opacity: 0,
            transition: { duration: 0.15, ease: "easeIn" }
          }}
        >
          <motion.div 
            className="scoreboard-modal"
            initial={{ 
              opacity: 0, 
              scale: 0.8, 
              y: -50,
              rotateX: -15
            }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              rotateX: 0,
              transition: { 
                duration: 0.3, 
                ease: "backOut",
                type: "spring",
                damping: 25,
                stiffness: 300
              }
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.85, 
              y: -30,
              rotateX: 15,
              transition: { 
                duration: 0.2, 
                ease: "easeIn" 
              }
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div 
              className="modal-header"
              initial={{ opacity: 0, y: -10 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                transition: { delay: 0.1, duration: 0.2 }
              }}
            >
              <h2>Scoreboard - Round {gameState.currentRound}/3</h2>
              <motion.button 
                className="close-button" 
                onClick={onClose} 
                title="Close scoreboard"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
              >
                ✕
              </motion.button>
            </motion.div>
        
            <motion.div 
              className="scores-container"
              initial={{ opacity: 0, y: 10 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                transition: { delay: 0.15, duration: 0.2 }
              }}
            >
          <div className="player-score-section">
            <h3>{currentPlayer.name} (You)</h3>
            <div className="score-display">
              <div className="round-scores">
                {currentPlayer.scores.map((score, roundIndex) => (
                  <div key={roundIndex} className="round-score-item completed">
                    <strong>Round {roundIndex + 1}: {score} points</strong>
                  </div>
                ))}
                <div className="round-score-item current">
                  <strong>Round {gameState.currentRound}: {getCurrentScore(currentPlayer).total} points</strong>
                </div>
              </div>
              <div className="total-score">
                <strong>Total Score: {getTotalScore(currentPlayer)} points</strong>
              </div>
            </div>
          </div>

          <div className="player-score-section">
            <h3>{opponent.name}</h3>
            <div className="score-display">
              <div className="round-scores">
                {opponent.scores.map((score, roundIndex) => (
                  <div key={roundIndex} className="round-score-item completed">
                    <strong>Round {roundIndex + 1}: {score} points</strong>
                  </div>
                ))}
                <div className="round-score-item current">
                  <strong>Round {gameState.currentRound}: {getCurrentScore(opponent).total} points</strong>
                </div>
              </div>
              <div className="total-score">
                <strong>Total Score: {getTotalScore(opponent)} points</strong>
              </div>
            </div>
          </div>
            </motion.div>

            <motion.div 
              className="modal-actions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                transition: { delay: 0.2, duration: 0.2 }
              }}
            >
              <motion.button 
                className="close-button-large" 
                onClick={onClose}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
              >
                Close
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default ScoreboardModal