import React, { useEffect } from 'react'
import './RoundCompleteModal.css'

const RoundCompleteModal = ({ isOpen, roundNumber, roundScores, nextRound, onContinue }) => {
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onContinue()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onContinue])

  if (!isOpen) return null

  return (
    <div className="round-complete-overlay">
      <div className="round-complete-modal">
        <div className="round-complete-header">
          <h2>🎯 Round {roundNumber} Complete! 🎯</h2>
        </div>
        
        <div className="round-scores">
          <h3>Round {roundNumber} Scores:</h3>
          {roundScores.map((scoreData, index) => (
            <div key={index} className="player-round-score">
              <span className="player-name">{scoreData.playerName}:</span>
              <span className="round-score">+{scoreData.score} points</span>
              <span className="total-score">(Total: {scoreData.totalScore})</span>
            </div>
          ))}
        </div>

        {nextRound <= 3 ? (
          <div className="next-round-info">
            <p>🔄 Starting Round {nextRound}...</p>
            <p>Grids cleared and cards reshuffled!</p>
          </div>
        ) : (
          <div className="game-complete-info">
            <p>🏆 Game Complete!</p>
          </div>
        )}

        <button 
          className="continue-button"
          onClick={onContinue}
          title={nextRound <= 3 ? `Proceed to round ${nextRound} (Esc)` : 'View final game results (Esc)'}
        >
          {nextRound <= 3 ? `Continue to Round ${nextRound}` : 'View Final Results'}
        </button>
      </div>
    </div>
  )
}

export default RoundCompleteModal