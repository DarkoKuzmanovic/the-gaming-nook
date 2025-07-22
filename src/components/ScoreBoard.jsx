import React, { useState } from 'react'
import { calculatePlayerScore, calculateTotalGameScore } from '../game/scoring'
import './ScoreBoard.css'

const ScoreBoard = ({ players, currentRound }) => {
  const [expandedPlayer, setExpandedPlayer] = useState(null)
  const [isCollapsed, setIsCollapsed] = useState(true)
  
  const getCurrentScore = (player) => {
    if (!player.grid) return { total: 0 }
    return calculatePlayerScore(player.grid, currentRound)
  }

  const getTotalScore = (player) => {
    return calculateTotalGameScore(player) + getCurrentScore(player).total
  }
  
  const toggleExpanded = (playerIndex) => {
    setExpandedPlayer(expandedPlayer === playerIndex ? null : playerIndex)
  }

  return (
    <div className="score-board">
      <h3 onClick={() => setIsCollapsed(!isCollapsed)} style={{ cursor: 'pointer' }}>
        Scoreboard {isCollapsed ? '▼' : '▲'}
      </h3>
      {!isCollapsed && (
        <div className="scores-container">
        {players.map((player, index) => (
          <div key={index} className="player-score">
            <h4>{player.name}</h4>
            <div className="score-breakdown">
              <div className="round-scores">
                {player.scores.map((score, roundIndex) => (
                  <div key={roundIndex} className="round-score">
                    <span>R{roundIndex + 1}:</span>
                    <span>{score}</span>
                  </div>
                ))}
                <div className="round-score current">
                  <span>R{currentRound}:</span>
                  <span>{getCurrentScore(player).total}</span>
                </div>
              </div>
              <div className="total-score" onClick={() => toggleExpanded(index)}>
                <strong>Total: {getTotalScore(player)} {expandedPlayer === index ? '▼' : '▶'}</strong>
              </div>
              {expandedPlayer === index && (
                <ScoreDetails player={player} currentRound={currentRound} />
              )}
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  )
}

const ScoreDetails = ({ player, currentRound }) => {
  const scoreData = getCurrentScore(player)
  
  if (!scoreData) return null
  
  const { breakdown } = scoreData
  
  return (
    <div className="score-details">
      <div className="score-category">
        <h5>Validated Numbers ({scoreData.validatedNumbers})</h5>
        <div className="score-items">
          {breakdown.validatedCards.map((card, i) => (
            <span key={i} className="score-item">
              {card.number} ({card.color})
            </span>
          ))}
        </div>
      </div>
      
      <div className="score-category">
        <h5>Symbols ({scoreData.symbols})</h5>
        <div className="score-items">
          {breakdown.spirals > 0 && (
            <span className="score-item positive">
              +{breakdown.spirals} spirals
            </span>
          )}
          {breakdown.specialBonuses > 0 && (
            <span className="score-item positive">
              +{breakdown.specialBonuses} special bonus
            </span>
          )}
          {breakdown.crosses > 0 && (
            <span className="score-item negative">
              -{breakdown.crosses} crosses
            </span>
          )}
        </div>
      </div>
      
      <div className="score-category">
        <h5>Color Zone ({scoreData.colorZone})</h5>
        <div className="score-items">
          {breakdown.largestZone.size > 0 ? (
            <span className="score-item">
              {breakdown.largestZone.size} {breakdown.largestZone.color} cards × {breakdown.largestZone.multiplier}
            </span>
          ) : (
            <span className="score-item muted">No zones found</span>
          )}
        </div>
      </div>
    </div>
  )
}

function getCurrentScore(player) {
  if (!player.grid) return { total: 0 }
  return calculatePlayerScore(player.grid, 1) // Default to round 1 for now
}

export default ScoreBoard