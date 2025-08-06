import React from 'react'
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

  return (
    <div className="modal-overlay">
      <div className="scoreboard-modal">
        <div className="modal-header">
          <h2>Scoreboard - Round {gameState.currentRound}/3</h2>
          <button className="close-button" onClick={onClose} title="Close scoreboard">
            ✕
          </button>
        </div>
        
        <div className="scores-container">
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
        </div>

        <div className="modal-actions">
          <button className="close-button-large" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default ScoreboardModal