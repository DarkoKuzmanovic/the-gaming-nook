import React, { useState, useEffect } from 'react'
import GameGrid from './GameGrid'
import CardHand from './CardHand'
import ScoreBoard from './ScoreBoard'
import CardChoiceModal from './CardChoiceModal'
import { determinePlacementScenario, executeCardPlacement, PlacementScenario } from '../game/placement'
import './GameBoard.css'

const GameBoard = () => {
  const [gameState, setGameState] = useState({
    currentRound: 1,
    currentPlayer: 0,
    phase: 'draft', // 'draft', 'place'
    players: [
      { name: 'Player 1', grid: Array(9).fill(null), scores: [0, 0, 0] },
      { name: 'Player 2', grid: Array(9).fill(null), scores: [0, 0, 0] }
    ],
    currentCards: [],
    selectedCard: null,
    deck: []
  })

  const [showCardChoice, setShowCardChoice] = useState(false)
  const [cardChoiceData, setCardChoiceData] = useState(null)

  const [playerIndex] = useState(0) // This would come from server

  useEffect(() => {
    // Initialize game with mock data and some test cards in grid
    const mockCards = [
      { number: 1, color: 'blue', hasSpiral: true, hasCross: false, isSpecial: false },
      { number: 3, color: 'red', hasSpiral: false, hasCross: true, isSpecial: false },
      { number: 5, color: 'green', hasSpiral: true, hasCross: false, isSpecial: true },
      { number: 7, color: 'yellow', hasSpiral: false, hasCross: false, isSpecial: false }
    ]
    
    // Add some test cards to player grid for scoring demonstration
    const testGrid = Array(9).fill(null)
    testGrid[0] = { number: 1, color: 'blue', hasSpiral: true, hasCross: false, isSpecial: false, faceUp: true, validated: true }
    testGrid[1] = { number: 2, color: 'blue', hasSpiral: false, hasCross: false, isSpecial: false, faceUp: true, validated: true }
    testGrid[2] = { number: 3, color: 'red', hasSpiral: false, hasCross: true, isSpecial: false, faceUp: true, validated: false }
    testGrid[4] = { number: 5, color: 'green', hasSpiral: true, hasCross: false, isSpecial: true, faceUp: true, validated: true }
    
    setGameState(prev => ({
      ...prev,
      currentCards: mockCards,
      players: [
        { ...prev.players[0], grid: testGrid },
        { ...prev.players[1] }
      ]
    }))
  }, [])

  const handleCardSelect = (card) => {
    if (gameState.phase === 'draft' && gameState.currentPlayer === playerIndex) {
      setGameState(prev => ({
        ...prev,
        selectedCard: card,
        phase: 'place'
      }))
    }
  }

  const handleCardPlace = (gridIndex) => {
    if (gameState.phase === 'place' && gameState.selectedCard) {
      const card = gameState.selectedCard
      const currentPlayer = gameState.players[playerIndex]
      const scenario = determinePlacementScenario(card, currentPlayer.grid)
      
      if (scenario === PlacementScenario.DUPLICATE_NUMBER) {
        // Show choice modal for duplicate number scenario
        const existingCard = currentPlayer.grid[card.number - 1]
        setCardChoiceData({
          existingCard,
          newCard: card,
          targetIndex: gridIndex
        })
        setShowCardChoice(true)
      } else {
        // Execute placement directly
        executeCardPlacement(card, gridIndex, currentPlayer.grid)
          .then(result => {
            const newPlayers = [...gameState.players]
            newPlayers[playerIndex] = {
              ...currentPlayer,
              grid: result.grid
            }
            
            const newCurrentCards = gameState.currentCards.filter(c => c !== card)
            
            setGameState(prev => ({
              ...prev,
              players: newPlayers,
              currentCards: newCurrentCards,
              selectedCard: null,
              phase: 'draft',
              currentPlayer: 1 - prev.currentPlayer
            }))
          })
          .catch(error => {
            console.error('Placement error:', error)
            // Could show error message to user
          })
      }
    }
  }

  const handleCardChoice = (choice) => {
    if (cardChoiceData) {
      const { newCard, targetIndex } = cardChoiceData
      const currentPlayer = gameState.players[playerIndex]
      
      try {
        const result = executeCardPlacement(newCard, targetIndex, currentPlayer.grid, choice)
        
        const newPlayers = [...gameState.players]
        newPlayers[playerIndex] = {
          ...currentPlayer,
          grid: result.grid
        }
        
        const newCurrentCards = gameState.currentCards.filter(c => c !== newCard)
        
        setGameState(prev => ({
          ...prev,
          players: newPlayers,
          currentCards: newCurrentCards,
          selectedCard: null,
          phase: 'draft',
          currentPlayer: 1 - prev.currentPlayer
        }))
        
        setShowCardChoice(false)
        setCardChoiceData(null)
      } catch (error) {
        console.error('Card choice error:', error)
      }
    }
  }

  const handleCardChoiceCancel = () => {
    setShowCardChoice(false)
    setCardChoiceData(null)
  }

  return (
    <div className="game-board">
      <div className="game-info">
        <h2>Round {gameState.currentRound}/3</h2>
        <p>Current Player: {gameState.players[gameState.currentPlayer].name}</p>
        <p>Phase: {gameState.phase}</p>
      </div>

      <div className="game-content">
        <div className="player-area">
          <h3>Your Grid</h3>
          <GameGrid 
            grid={gameState.players[playerIndex].grid}
            onCardPlace={handleCardPlace}
            canPlace={gameState.phase === 'place' && gameState.currentPlayer === playerIndex}
            selectedCard={gameState.selectedCard}
          />
        </div>

        <div className="center-area">
          <CardHand 
            cards={gameState.currentCards}
            onCardSelect={handleCardSelect}
            selectedCard={gameState.selectedCard}
            canSelect={gameState.phase === 'draft' && gameState.currentPlayer === playerIndex}
          />
          
          <div className="deck-info">
            <p>Cards in deck: {gameState.deck.length}</p>
          </div>
        </div>

        <div className="opponent-area">
          <h3>Opponent Grid</h3>
          <GameGrid 
            grid={gameState.players[1 - playerIndex].grid}
            onCardPlace={() => {}}
            canPlace={false}
            isOpponent={true}
          />
        </div>
      </div>

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