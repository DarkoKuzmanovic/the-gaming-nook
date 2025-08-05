import React, { useState, useEffect } from 'react'
import GameGrid from './GameGrid.jsx'
import Card from './Card.jsx' 
import CardChoiceModal from './CardChoiceModal.jsx'
import PlacementChoiceModal from './PlacementChoiceModal.jsx'
import RoundCompleteModal from './RoundCompleteModal.jsx'
import ScoreBoard from './ScoreBoard.jsx'
import DraftPhase from './DraftPhase.jsx'
import { PlacementScenario, getPickableCards } from '../../shared/placement.js'
import socketClient from '../../../../shared/client/utils/socket-client.js'
import audioService from '../services/audio.js'
import './GameBoard.css'

const GameBoard = ({ roomCode, playerIndex, onBackToMenu }) => {
  const [gameState, setGameState] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Modal states
  const [showCardChoice, setShowCardChoice] = useState(false)
  const [cardChoiceData, setCardChoiceData] = useState(null)
  const [showPlacementChoice, setShowPlacementChoice] = useState(false)
  const [placementChoiceData, setPlacementChoiceData] = useState(null)
  const [showRoundComplete, setShowRoundComplete] = useState(false)
  const [roundCompleteData, setRoundCompleteData] = useState(null)
  
  // Animation states
  const [animatingCards, setAnimatingCards] = useState(new Set())
  const [newlyPlacedCards, setNewlyPlacedCards] = useState(new Set())
  const [glowingCards, setGlowingCards] = useState(new Set())
  const [confettiCards, setConfettiCards] = useState(new Set())
  
  // Audio states
  const [soundEnabled, setSoundEnabled] = useState(audioService.isSoundEffectsEnabled())
  const [musicEnabled, setMusicEnabled] = useState(audioService.isMusicEnabled())

  // Audio control functions
  const toggleSound = () => {
    const newState = audioService.toggleSoundEffects()
    setSoundEnabled(newState)
  }
  
  const toggleMusic = () => {
    const newState = audioService.toggleMusic()
    setMusicEnabled(newState)
  }
  
  // Confetti handler
  const handleConfettiComplete = (cardId) => {
    setConfettiCards(prev => {
      const newSet = new Set(prev)
      newSet.delete(cardId)
      return newSet
    })
  }
  
  // Start background music when game loads
  useEffect(() => {
    audioService.startBackgroundMusic()
    return () => {
      audioService.stopBackgroundMusic()
    }
  }, [])

  // Update page title based on game state  
  useEffect(() => {
    if (!gameState) return
    
    if (gameState.phase === 'finished') {
      document.title = 'Game Complete - Vetrolisci'
    } else if (gameState.phase === 'draft') {
      const isMyTurn = gameState.currentPickingPlayer?.index === playerIndex
      if (isMyTurn) {
        document.title = `Your Turn - Round ${gameState.currentRound} - Vetrolisci`
      } else {
        document.title = `Round ${gameState.currentRound} - Vetrolisci`
      }
    } else {
      document.title = `Round ${gameState.currentRound} - Vetrolisci`
    }
    
    return () => {
      document.title = 'The Gaming Nook'
    }
  }, [gameState?.phase, gameState?.currentRound, gameState?.currentPickingPlayer?.index, playerIndex])

  // Log turn changes only
  useEffect(() => {
    if (gameState?.currentPickingPlayer?.index !== undefined) {
      console.log(`🎯 Turn: Player ${gameState.currentPickingPlayer.index} (${gameState.currentPickingPlayer?.name})`)
    }
  }, [gameState?.currentPickingPlayer?.index, gameState?.currentPickingPlayer?.name])

  // Load initial game state
  useEffect(() => {
    const loadGameState = async () => {
      try {
        setLoading(true)
        const response = await socketClient.emit('vetrolisci-get-state', { roomCode })
        
        if (response.success) {
          setGameState(response.gameState)
        } else {
          setError(response.error || 'Failed to load game state')
        }
      } catch (err) {
        setError('Failed to connect to game')
      } finally {
        setLoading(false)
      }
    }

    if (roomCode) {
      loadGameState()
    }
  }, [roomCode])

  // Socket event listeners
  useEffect(() => {
    if (!roomCode) return

    // Listen for card placement events
    const handleCardPlaced = (data) => {
      console.log('🎯 Card placed:', data)
      setGameState(data.gameState)
      
      // Trigger animations
      if (data.cardId) {
        setNewlyPlacedCards(prev => new Set([...prev, data.cardId]))
        setGlowingCards(prev => new Set([...prev, data.cardId]))
        
        // Check if card was validated for confetti
        if (data.gameState && data.gameState.players) {
          const allPlayers = data.gameState.players
          for (const player of allPlayers) {
            const validatedCard = player.grid.find(card => 
              card && card.id === data.cardId && card.validated
            )
            if (validatedCard) {
              console.log('🎉 Card validated, triggering confetti:', data.cardId)
              setConfettiCards(prev => new Set([...prev, data.cardId]))
              break
            }
          }
        }
        
        // Clear animations after delay
        setTimeout(() => {
          setNewlyPlacedCards(prev => {
            const newSet = new Set(prev)
            newSet.delete(data.cardId)
            return newSet
          })
        }, 500)
        
        setTimeout(() => {
          setGlowingCards(prev => {
            const newSet = new Set(prev)
            newSet.delete(data.cardId)
            return newSet
          })
        }, 3000)
      }
    }

    const handleRoundComplete = (data) => {
      console.log('🏆 Round complete:', data)
      audioService.playSound('validate')
      setRoundCompleteData({
        roundNumber: data.roundNumber,
        roundScores: data.roundScores,
        nextRound: data.nextRound,
        gameState: data.gameState
      })
      setShowRoundComplete(true)
    }

    const handleGameComplete = (data) => {
      console.log('🎉 Game complete:', data)
      // Determine if current player won to play appropriate sound
      const currentPlayerScore = data.gameState.players[playerIndex].totalScore
      const opponentScore = data.gameState.players[playerIndex === 0 ? 1 : 0].totalScore
      audioService.playSound(currentPlayerScore > opponentScore ? 'win' : 'lose')
      setGameState(data.gameState)
    }

    socketClient.on('vetrolisci-card-placed', handleCardPlaced)
    socketClient.on('vetrolisci-round-complete', handleRoundComplete)
    socketClient.on('vetrolisci-game-complete', handleGameComplete)

    return () => {
      socketClient.off('vetrolisci-card-placed', handleCardPlaced)
      socketClient.off('vetrolisci-round-complete', handleRoundComplete)
      socketClient.off('vetrolisci-game-complete', handleGameComplete)
    }
  }, [roomCode])

  const handleCardPick = async (cardId) => {
    if (!gameState || !gameState.draftState) {
      console.log('⚠️ No game state or draft state available')
      return
    }
    
    // Check if it's player's turn
    const currentPickingPlayer = gameState.currentPickingPlayer
    if (!currentPickingPlayer || currentPickingPlayer.index !== playerIndex) {
      console.log('⚠️ Not your turn to pick - current player:', currentPickingPlayer?.index, 'you are:', playerIndex)
      setError('Not your turn to pick!')
      setTimeout(() => setError(''), 3000)
      return
    }

    // Check if card can be picked
    const pickableCards = getPickableCards(gameState.players[playerIndex].grid, gameState.draftState.revealedCards)
    const cardData = pickableCards.find(card => card.id === cardId)
    if (!cardData || !cardData.pickable.canPick) {
      const message = cardData?.pickable.reason === 'all_cards_validated' 
        ? 'All cards would violate validation rule - can place face-down'
        : 'You already have a validated card with this number'
      setError(message)
      setTimeout(() => setError(''), 3000)
      return
    }

    // Prevent double-clicking/rapid clicking
    if (animatingCards.has(cardId)) {
      console.log('⚠️ Card pick already in progress')
      return
    }

    try {
      setAnimatingCards(prev => new Set([...prev, cardId]))
      
      const response = await socketClient.emit('vetrolisci-pick-card', {
        roomCode,
        cardId
      })
      
      if (response.success) {
        // Play card pick sound
        audioService.playSound('playCard')
        
        if (response.needsChoice) {
          // Handle placement choices
          if (response.choiceType === PlacementScenario.DUPLICATE_NUMBER) {
            // Show card choice modal
            const selectedCard = response.selectedCard
            const existingCard = gameState.players[playerIndex].grid[selectedCard.value - 1]
            
            setCardChoiceData({
              cardId,
              selectedCard,
              existingCard
            })
            setShowCardChoice(true)
          } else if (response.choiceType === PlacementScenario.ALREADY_VALIDATED) {
            // Show placement choice modal
            const availablePositions = gameState.players[playerIndex].grid
              .map((card, index) => card === null ? index : null)
              .filter(index => index !== null)
            
            setPlacementChoiceData({
              cardId,
              selectedCard: response.selectedCard,
              availablePositions
            })
            setShowPlacementChoice(true)
          }
        } else {
          // Card was placed automatically
          audioService.playSound('placeCards')
          setGameState(response.gameState)
        }
      } else {
        console.error('Failed to pick card:', response.error)
        setError(response.error)
      }
    } catch (err) {
      console.error('Error picking card:', err)
      setError('Failed to pick card')
    } finally {
      setAnimatingCards(prev => {
        const newSet = new Set(prev)
        newSet.delete(cardId)
        return newSet
      })
    }
  }

  const handleCardChoice = async (choice) => {
    if (!cardChoiceData) return
    
    try {
      const response = await socketClient.emit('vetrolisci-placement-choice', {
        roomCode,
        cardId: cardChoiceData.cardId,
        choice
      })
      
      if (response.success) {
        audioService.playSound('placeCards')
        setGameState(response.gameState)
      } else {
        setError(response.error)
      }
    } catch (err) {
      setError('Failed to make choice')
    }
    
    setShowCardChoice(false)
    setCardChoiceData(null)
  }

  const handlePlacementChoice = async (position) => {
    if (!placementChoiceData) return
    
    try {
      const response = await socketClient.emit('vetrolisci-placement-choice', {
        roomCode,
        cardId: placementChoiceData.cardId,
        choice: { position }
      })
      
      if (response.success) {
        audioService.playSound('placeCards')
        setGameState(response.gameState)
      } else {
        setError(response.error)
      }
    } catch (err) {
      setError('Failed to place card')
    }
    
    setShowPlacementChoice(false)
    setPlacementChoiceData(null)
  }

  const handleRoundContinue = () => {
    setShowRoundComplete(false)
    
    // Update game state with the new round data
    if (roundCompleteData?.gameState) {
      setGameState(roundCompleteData.gameState)
    }
    
    setRoundCompleteData(null)
  }

  if (loading) {
    return (
      <div className="game-board loading">
        <h2>Loading Vetrolisci...</h2>
        <div className="loading-spinner"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="game-board error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={onBackToMenu}>Back to Menu</button>
      </div>
    )
  }

  if (!gameState) {
    return (
      <div className="game-board error">
        <h2>Game Not Found</h2>
        <button onClick={onBackToMenu}>Back to Menu</button>
      </div>
    )
  }

  // Show game completion screen
  if (gameState.phase === 'finished') {
    return (
      <div className="game-board">
        <div className="game-complete">
          <h1>🎉 Game Complete! 🎉</h1>
          {/* TODO: Add winner display */}
          <button onClick={onBackToMenu}>Back to Menu</button>
        </div>
      </div>
    )
  }

  const currentPlayer = gameState.players[playerIndex]
  const opponentIndex = playerIndex === 0 ? 1 : 0
  const opponent = gameState.players[opponentIndex]
  
  const isMyTurn = gameState.currentPickingPlayer?.index === playerIndex
  const currentPickingPlayerName = gameState.currentPickingPlayer?.name || 'Unknown'

  return (
    <div className="game-board">
      {/* Game Header */}
      <div className="game-header">
        <div className="header-left">
          <h2>Vetrolisci - Round {gameState.currentRound}/3</h2>
        </div>
        
        <div className="header-right">
          {/* Audio Controls */}
          <div className="audio-controls">
            <button 
              className={`audio-button ${soundEnabled ? 'enabled' : 'disabled'}`}
              onClick={toggleSound}
              title={soundEnabled ? 'Disable sound effects' : 'Enable sound effects'}
            >
              🔊
            </button>
            <button 
              className={`audio-button ${musicEnabled ? 'enabled' : 'disabled'}`}
              onClick={toggleMusic}
              title={musicEnabled ? 'Disable music' : 'Enable music'}
            >
              🎵
            </button>
          </div>
        </div>
        
        {/* Game Progress */}
        <div className="game-progress">
          <div className="round-indicators">
            {[1, 2, 3].map(round => (
              <div 
                key={round} 
                className={`round-indicator ${round === gameState.currentRound ? 'current' : ''} ${round < gameState.currentRound ? 'completed' : ''}`}
              >
                {round}
              </div>
            ))}
          </div>
        </div>
        
        <div className="turn-indicator">
          {isMyTurn ? (
            <span className="my-turn">Your turn to pick!</span>
          ) : (
            <span className="waiting">
              Waiting for {currentPickingPlayerName}
              <span className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </span>
          )}
        </div>
        
        {/* Error Display */}
        {error && (
          <div className="error-banner">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Enhanced Draft Phase */}
      {gameState.draftState && gameState.draftState.revealedCards && (
        <DraftPhase
          gameState={gameState}
          playerIndex={playerIndex}
          onCardPick={handleCardPick}
          error={error}
          animatingCards={animatingCards}
        />
      )}

      {/* Game Grids */}
      <div className="game-grids">
        <div className="player-grid-section">
          <h3>Your Grid ({currentPlayer.name})</h3>
          <GameGrid
            grid={currentPlayer.grid}
            newlyPlacedCards={newlyPlacedCards}
            glowingCards={glowingCards}
            confettiCards={confettiCards}
            onConfettiComplete={handleConfettiComplete}
          />
        </div>

        <div className="opponent-grid-section">
          <h3>Opponent ({opponent.name})</h3>
          <GameGrid
            grid={opponent.grid}
            isOpponent={true}
            newlyPlacedCards={newlyPlacedCards}
            glowingCards={glowingCards}
            confettiCards={confettiCards}
            onConfettiComplete={handleConfettiComplete}
          />
        </div>
      </div>

      {/* Scoreboard */}
      <ScoreBoard 
        players={gameState.players} 
        currentRound={gameState.currentRound} 
      />

      {/* Back to Menu */}
      <button 
        className="back-to-menu-button"
        onClick={onBackToMenu}
      >
        Back to Menu
      </button>

      {/* Modals */}
      <CardChoiceModal
        isOpen={showCardChoice}
        existingCard={cardChoiceData?.existingCard}
        newCard={cardChoiceData?.selectedCard}
        onChoose={handleCardChoice}
        onCancel={() => setShowCardChoice(false)}
      />

      <PlacementChoiceModal
        isOpen={showPlacementChoice}
        card={placementChoiceData?.selectedCard}
        availablePositions={placementChoiceData?.availablePositions || []}
        onChoose={handlePlacementChoice}
        onCancel={() => setShowPlacementChoice(false)}
      />

      <RoundCompleteModal
        isOpen={showRoundComplete}
        roundNumber={roundCompleteData?.roundNumber}
        roundScores={roundCompleteData?.roundScores}
        nextRound={roundCompleteData?.nextRound}
        onContinue={handleRoundContinue}
      />
    </div>
  )
}

export default GameBoard