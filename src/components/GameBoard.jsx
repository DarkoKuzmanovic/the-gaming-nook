import React, { useState, useEffect } from 'react'
import GameGrid from './GameGrid'
import CardHand from './CardHand'
import ScoreBoard from './ScoreBoard'
import CardChoiceModal from './CardChoiceModal'
import DraftPhase from './DraftPhase'
import Card from './Card'
import { determinePlacementScenario, executeCardPlacement, PlacementScenario } from '../game/placement'
import { CARDS, shuffleDeck, createGameDeck } from '../data/cards.js'
import { initializeDraftPhase, pickCard, startPickPhase, DraftPhase as DraftPhaseEnum } from '../game/draft'
import './GameBoard.css'

const GameBoard = ({ playerName = 'Player 1', gameInfo, socketService }) => {
  const [gameState, setGameState] = useState({
    currentRound: 1,
    currentPlayer: 0,
    phase: 'draft', // 'draft', 'place'
    players: [
      { name: playerName, grid: Array(9).fill(null), scores: [0, 0, 0] },
      { name: 'Opponent', grid: Array(9).fill(null), scores: [0, 0, 0] }
    ],
    currentCards: [],
    selectedCard: null,
    deck: []
  })

  const [draftState, setDraftState] = useState(null)
  const [showCardChoice, setShowCardChoice] = useState(false)
  const [cardChoiceData, setCardChoiceData] = useState(null)
  const playerIndex = gameInfo?.playerIndex || 0

  useEffect(() => {
    if (!socketService || !gameInfo) return

    // Handle server draft events
    socketService.onDraftStarted((serverDraftState) => {
      console.log('Draft started:', serverDraftState)
      setDraftState(serverDraftState)
    })

    socketService.onCardPicked(({ playerIndex: pickingPlayer, cardId, draftState: newDraftState }) => {
      console.log(`Player ${pickingPlayer} picked card ${cardId}`)
      setDraftState(newDraftState)
    })

    socketService.onCardPickedAndPlaced(({ playerIndex: placingPlayer, cardId, placedCard, newGrid, draftState: newDraftState, placementResult }) => {
      console.log(`Player ${placingPlayer} picked and placed card ${cardId}`)
      
      setDraftState(newDraftState)
      
      setGameState(prev => {
        const newPlayers = [...prev.players]
        newPlayers[placingPlayer] = {
          ...newPlayers[placingPlayer],
          grid: newGrid
        }
        
        return {
          ...prev,
          players: newPlayers
        }
      })
    })

    socketService.onNewTurn(({ currentPlayer: newCurrentPlayer, draftState: newDraftState }) => {
      console.log(`New turn started. Current player: ${newCurrentPlayer}`)
      
      setDraftState(newDraftState)
      setGameState(prev => ({
        ...prev,
        currentPlayer: newCurrentPlayer
      }))
    })

    socketService.onDraftComplete(({ draftState: finalDraftState, playerHands, currentPlayer }) => {
      console.log('Draft complete:', finalDraftState)
      setDraftState(finalDraftState)
      
      // Transition to placement phase with player's cards
      setTimeout(() => {
        const playerCards = playerHands[playerIndex]
        setGameState(prev => ({
          ...prev,
          phase: 'place',
          currentCards: playerCards,
          currentPlayer: currentPlayer
        }))
      }, 2000)
    })

    // Handle card placement events
    socketService.onCardPlaced(({ playerIndex: placingPlayer, cardId, gridIndex, choice, newGrid, currentPlayer, placementResult }) => {
      console.log(`Player ${placingPlayer} placed card ${cardId}`)
      
      setGameState(prev => {
        const newPlayers = [...prev.players]
        newPlayers[placingPlayer] = {
          ...newPlayers[placingPlayer],
          grid: newGrid
        }
        
        // Remove card from current player's hand if it's our turn
        let newCurrentCards = prev.currentCards
        if (placingPlayer === playerIndex) {
          newCurrentCards = prev.currentCards.filter(c => c.id !== cardId)
        }
        
        return {
          ...prev,
          players: newPlayers,
          currentCards: newCurrentCards,
          currentPlayer,
          selectedCard: placingPlayer === playerIndex ? null : prev.selectedCard
        }
      })
    })

    // Handle round completion
    socketService.onRoundComplete(({ roundNumber, roundScores, nextRound, draftState: newDraftState, currentPlayer: newCurrentPlayer }) => {
      console.log(`Round ${roundNumber} completed, starting round ${nextRound}`)
      
      // Update scores and start new round
      setGameState(prev => {
        const newPlayers = [...prev.players]
        roundScores.forEach(({ playerIndex, score }) => {
          newPlayers[playerIndex].scores[roundNumber] = score
        })
        
        return {
          ...prev,
          players: newPlayers,
          currentRound: nextRound,
          phase: 'draft',
          currentPlayer: newCurrentPlayer,
          currentCards: [],
          selectedCard: null
        }
      })
      
      setDraftState(newDraftState)
    })

    // Handle game completion
    socketService.onGameComplete(({ finalScores, winner, playerScores }) => {
      console.log('Game completed! Winner:', winner)
      
      setGameState(prev => ({
        ...prev,
        phase: 'finished',
        winner,
        finalScores
      }))
    })

    // Initial game state from server
    if (gameInfo.players) {
      setGameState(prev => ({
        ...prev,
        players: gameInfo.players.map(p => ({
          name: p.name,
          grid: p.grid || Array(9).fill(null),
          scores: p.scores || [0, 0, 0]
        }))
      }))
    }

    if (gameInfo.draftState) {
      setDraftState(gameInfo.draftState)
    }

  }, [socketService, gameInfo, playerIndex])

  const handleDraftCardPick = (cardId, action) => {
    if (action === 'start') {
      // Start the picking phase
      socketService.startDraft()
      return
    }

    if (!cardId || !draftState) return

    // Only allow current player to pick
    const currentPickingPlayer = draftState.pickOrder[draftState.currentPickIndex]
    if (currentPickingPlayer !== playerIndex) {
      console.log('Not your turn to pick')
      return
    }

    // Find the picked card
    const pickedCard = draftState.revealedCards.find(card => card.id === cardId)
    if (!pickedCard) return

    // Check placement scenario to see if we need to show choice modal
    const currentPlayer = gameState.players[playerIndex]
    const scenario = determinePlacementScenario(pickedCard, currentPlayer.grid)
    
    if (scenario === PlacementScenario.DUPLICATE_NUMBER) {
      // Show choice modal for duplicate number scenario
      const existingCard = currentPlayer.grid[pickedCard.value - 1]
      setCardChoiceData({
        existingCard,
        newCard: pickedCard,
        targetIndex: pickedCard.value - 1, // Will be overridden based on choice
        cardId: cardId
      })
      setShowCardChoice(true)
    } else {
      // Send pick-and-place to server immediately
      socketService.pickCard(cardId)
    }
  }

  const handleCardSelect = (card) => {
    if (gameState.phase === 'place' && gameState.currentPlayer === playerIndex) {
      setGameState(prev => ({
        ...prev,
        selectedCard: card
      }))
    }
  }

  const handleCardPlace = (gridIndex) => {
    if (gameState.phase === 'place' && gameState.selectedCard && gameState.currentPlayer === playerIndex) {
      const card = gameState.selectedCard
      const currentPlayer = gameState.players[playerIndex]
      const scenario = determinePlacementScenario(card, currentPlayer.grid)
      
      if (scenario === PlacementScenario.DUPLICATE_NUMBER) {
        // Show choice modal for duplicate number scenario
        const existingCard = currentPlayer.grid[card.value - 1]
        setCardChoiceData({
          existingCard,
          newCard: card,
          targetIndex: gridIndex
        })
        setShowCardChoice(true)
      } else {
        // Send placement to server
        socketService.placeCard(card.id, gridIndex)
      }
    }
  }

  const handleCardChoice = (choice) => {
    if (cardChoiceData) {
      const { cardId } = cardChoiceData
      
      // Send pick with choice to server (server will handle placement)
      socketService.pickCard(cardId, choice)
      
      setShowCardChoice(false)
      setCardChoiceData(null)
    }
  }

  const handleCardChoiceCancel = () => {
    setShowCardChoice(false)
    setCardChoiceData(null)
  }

  // Show game completion screen
  if (gameState.phase === 'finished') {
    return (
      <div className="game-board">
        <div className="game-complete">
          <h1>🎉 Game Complete! 🎉</h1>
          <h2>Winner: {gameState.players[gameState.winner]?.name}</h2>
          
          <div className="final-scores">
            <h3>Final Scores:</h3>
            {gameState.players.map((player, index) => (
              <div key={index} className={`player-final-score ${index === gameState.winner ? 'winner' : ''}`}>
                <strong>{player.name}:</strong> {player.scores.reduce((a, b) => a + b, 0)} points
                <div className="round-breakdown">
                  {player.scores.map((score, roundIndex) => (
                    <span key={roundIndex}>Round {roundIndex + 1}: {score}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          <button onClick={() => window.location.reload()}>Play Again</button>
        </div>
      </div>
    )
  }

  // Main game interface - shows both draft and placement together
  return (
    <div className="game-board">
      <div className="game-info">
        <h2>Round {gameState.currentRound}/3</h2>
        <p>Current Turn: {gameState.players[gameState.currentPlayer].name}</p>
        <p>Phase: {draftState ? (draftState.phase === 'reveal' ? 'Revealing Cards' : 'Pick & Place') : 'Waiting'}</p>
        <p>Cards in deck: {gameState.deck.length || 0}</p>
      </div>

      {/* Revealed Cards Section */}
      {draftState && draftState.revealedCards && draftState.revealedCards.length > 0 && (
        <div className="revealed-cards-section">
          <h3>Revealed Cards</h3>
          <div className="revealed-cards">
            {draftState.revealedCards.map(card => (
              <div 
                key={card.id} 
                className={`revealed-card ${draftState.pickOrder[draftState.currentPickIndex] === playerIndex ? 'can-pick' : 'waiting'}`}
                onClick={() => {
                  if (draftState.pickOrder[draftState.currentPickIndex] === playerIndex) {
                    handleDraftCardPick(card.id)
                  }
                }}
              >
                {/* Use the actual Card component for proper image display */}
                <Card 
                  card={card} 
                  onClick={() => {
                    if (draftState.pickOrder[draftState.currentPickIndex] === playerIndex) {
                      handleDraftCardPick(card.id)
                    }
                  }}
                  isSelected={false}
                />
              </div>
            ))}
          </div>
          <div className="turn-indicator">
            {draftState.pickOrder[draftState.currentPickIndex] === playerIndex ? 
              "Your turn to pick!" : 
              `Waiting for ${gameState.players[draftState.pickOrder[draftState.currentPickIndex]]?.name}...`
            }
          </div>
        </div>
      )}

      {/* Game Grids */}
      <div className="game-grids">
        <div className="player-grid-section">
          <h3>Your Grid ({gameState.players[playerIndex].name})</h3>
          <GameGrid 
            grid={gameState.players[playerIndex].grid}
            onCardPlace={handleCardPlace}
            canPlace={false} // Placement happens automatically after pick
            selectedCard={gameState.selectedCard}
          />
        </div>

        <div className="opponent-grid-section">
          <h3>Opponent Grid ({gameState.players[1 - playerIndex].name})</h3>
          <GameGrid 
            grid={gameState.players[1 - playerIndex].grid}
            onCardPlace={() => {}}
            canPlace={false}
            isOpponent={true}
          />
        </div>
      </div>

      {/* Start turn button for first player */}
      {draftState && draftState.phase === 'reveal' && gameState.currentPlayer === playerIndex && (
        <div className="turn-actions">
          <button 
            className="start-turn-btn"
            onClick={() => handleDraftCardPick(null, 'start')}
          >
            Reveal 4 Cards
          </button>
        </div>
      )}

      <ScoreBoard players={gameState.players} currentRound={gameState.currentRound} />
      
      <CardChoiceModal
        isOpen={showCardChoice}
        existingCard={cardChoiceData?.existingCard}
        newCard={cardChoiceData?.newCard}
        onChoose={handleCardChoice}
        onCancel={handleCardChoiceCancel}
      />
    </div>
  )
}

export default GameBoard