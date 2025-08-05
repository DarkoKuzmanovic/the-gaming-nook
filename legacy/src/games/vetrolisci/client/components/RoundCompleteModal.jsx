import React from 'react'
import Modal from '../../../../shared/client/components/Modal.jsx'
import Button from '../../../../shared/client/components/Button.jsx'
import './RoundCompleteModal.css'

const RoundCompleteModal = ({ 
  isOpen, 
  roundNumber, 
  roundScores = [], 
  nextRound, 
  onContinue 
}) => {
  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onContinue} title={`Round ${roundNumber} Complete!`}>
      <div className="round-complete-modal">
        <h3>🏆 Round {roundNumber} Results</h3>
        
        <div className="round-scores">
          {roundScores.map((scoreData, index) => (
            <div key={index} className="player-round-score">
              <h4>{scoreData.playerName}</h4>
              <div className="score-value">{scoreData.score} points</div>
              {scoreData.breakdown && (
                <div className="score-breakdown">
                  <span>Validated: {scoreData.breakdown.validatedNumbers}</span>
                  <span>Symbols: {scoreData.breakdown.symbols}</span>
                  <span>Color Zone: {scoreData.breakdown.colorZone}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {nextRound && (
          <div className="next-round-info">
            <p>Get ready for Round {nextRound}!</p>
          </div>
        )}

        <div className="modal-actions">
          <Button variant="primary" size="large" onClick={onContinue}>
            {nextRound ? `Continue to Round ${nextRound}` : 'View Final Results'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default RoundCompleteModal