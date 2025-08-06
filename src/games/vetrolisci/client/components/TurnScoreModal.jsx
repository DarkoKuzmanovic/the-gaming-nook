import React from 'react'
import './TurnScoreModal.css'

const TurnScoreModal = ({ gameState, playerIndex, onContinue }) => {
  if (!gameState || !gameState.roundScores) return null

  const currentPlayer = gameState.players[playerIndex]
  const opponentIndex = playerIndex === 0 ? 1 : 0
  const opponent = gameState.players[opponentIndex]

  const playerScore = gameState.roundScores.find(score => score.playerIndex === playerIndex)
  const opponentScore = gameState.roundScores.find(score => score.playerIndex === opponentIndex)

  return (
    <div className="modal-overlay">
      <div className="turn-score-modal">
        <div className="modal-header">
          <h2>Turn Complete - Round {gameState.currentRound}</h2>
        </div>
        
        <div className="scores-container">
          <div className="player-score-section">
            <h3>{currentPlayer.name} (You)</h3>
            <div className="score-display">
              <div className="round-score">
                <strong>This Turn: {playerScore?.score || 0} points</strong>
              </div>
              {playerScore?.breakdown && (
                <div className="score-breakdown">
                  <div className="breakdown-item">
                    Validated Cards: {playerScore.breakdown.validatedNumbers || 0}
                  </div>
                  <div className="breakdown-item">
                    Symbol Points: {playerScore.breakdown.symbols || 0}
                  </div>
                  <div className="breakdown-item">
                    Color Bonus: {playerScore.breakdown.colorBonus || 0}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="player-score-section">
            <h3>{opponent.name}</h3>
            <div className="score-display">
              <div className="round-score">
                <strong>This Turn: {opponentScore?.score || 0} points</strong>
              </div>
              {opponentScore?.breakdown && (
                <div className="score-breakdown">
                  <div className="breakdown-item">
                    Validated Cards: {opponentScore.breakdown.validatedNumbers || 0}
                  </div>
                  <div className="breakdown-item">
                    Symbol Points: {opponentScore.breakdown.symbols || 0}
                  </div>
                  <div className="breakdown-item">
                    Color Bonus: {opponentScore.breakdown.colorBonus || 0}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="modal-actions">
          <button className="continue-button" onClick={onContinue}>
            Continue to Next Turn
          </button>
        </div>
      </div>
    </div>
  )
}

export default TurnScoreModal