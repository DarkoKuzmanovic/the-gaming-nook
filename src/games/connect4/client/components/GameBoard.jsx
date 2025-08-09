import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GRID_ROWS, GRID_COLS, GAME_STATES, getValidMoves } from '../../shared/game-logic.js'
import socketClient from '../../../../shared/client/utils/socket-client.js'
import './GameBoard.css'

const GameBoard = ({ roomCode, playerIndex, onBackToMenu, onGameStateUpdate }) => {
  // ==================== STATE MANAGEMENT ====================
  
  const [gameState, setGameState] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lastMove, setLastMove] = useState(null)
  const [isMyTurn, setIsMyTurn] = useState(false)

  // ==================== HELPER FUNCTIONS ====================
  
  const updateGameState = (newGameState) => {
    setGameState(newGameState)
    setIsMyTurn(newGameState.currentPlayer === playerIndex)
    onGameStateUpdate?.(newGameState)
  }

  const getPlayerColor = (player) => {
    return player === 0 ? 'red' : 'yellow'
  }

  const getPlayerName = (player) => {
    if (!gameState?.players) return `Player ${player + 1}`
    return gameState.players[player]?.name || `Player ${player + 1}`
  }

  // ==================== EFFECTS ====================
  
  // Load initial game state
  useEffect(() => {
    const loadGameState = async () => {
      try {
        setLoading(true)
        const response = await socketClient.emit('connect4-get-state', { roomCode })
        
        if (response.success) {
          updateGameState(response.gameState)
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

    const handleMoveMade = (data) => {
      console.log('🔴 Move made:', data)
      updateGameState(data.gameState)
      setLastMove(data.lastMove)
      
      // Clear last move highlight after animation
      setTimeout(() => setLastMove(null), 1000)
    }

    const handleGameFinished = (data) => {
      console.log('🔴 Game finished:', data)
      updateGameState(data.gameState)
    }

    const handleGameRestarted = (data) => {
      console.log('🔴 Game restarted:', data)
      updateGameState(data.gameState)
      setLastMove(null)
      setError('')
    }

    // Register event listeners
    socketClient.on('connect4-move-made', handleMoveMade)
    socketClient.on('connect4-game-finished', handleGameFinished)
    socketClient.on('connect4-game-restarted', handleGameRestarted)

    // Cleanup
    return () => {
      socketClient.off('connect4-move-made', handleMoveMade)
      socketClient.off('connect4-game-finished', handleGameFinished)
      socketClient.off('connect4-game-restarted', handleGameRestarted)
    }
  }, [roomCode, playerIndex])

  // ==================== EVENT HANDLERS ====================
  
  const handleColumnClick = async (col) => {
    if (!isMyTurn || gameState.gameState !== GAME_STATES.PLAYING) {
      return
    }

    const validMoves = getValidMoves(gameState.grid)
    if (!validMoves.includes(col)) {
      setError('Column is full!')
      setTimeout(() => setError(''), 2000)
      return
    }

    try {
      const response = await socketClient.emit('connect4-make-move', {
        roomCode,
        col
      })
      
      if (!response.success) {
        setError(response.error)
        setTimeout(() => setError(''), 3000)
      }
    } catch (err) {
      setError('Failed to make move')
      setTimeout(() => setError(''), 3000)
    }
  }

  const handleRestart = async () => {
    try {
      const response = await socketClient.emit('connect4-restart', { roomCode })
      if (!response.success) {
        setError(response.error)
        setTimeout(() => setError(''), 3000)
      }
    } catch (err) {
      setError('Failed to restart game')
      setTimeout(() => setError(''), 3000)
    }
  }

  // ==================== RENDER STATES ====================
  
  if (loading) {
    return (
      <div className="connect4-game-board">
        <div className="connect4-loading">
          <h2>Loading Connect 4...</h2>
          <div className="loading-spinner"></div>
        </div>
      </div>
    )
  }

  if (error && !gameState) {
    return (
      <div className="connect4-game-board">
        <div className="connect4-error">
          <h2>Error</h2>
          <p>{error}</p>
          <button className="connect4-button secondary" onClick={onBackToMenu}>
            Back to Menu
          </button>
        </div>
      </div>
    )
  }

  if (!gameState) {
    return (
      <div className="connect4-game-board">
        <div className="connect4-error">
          <h2>Game Not Found</h2>
          <button className="connect4-button secondary" onClick={onBackToMenu}>
            Back to Menu
          </button>
        </div>
      </div>
    )
  }

  // ==================== MAIN RENDER ====================
  
  const validMoves = getValidMoves(gameState.grid)
  const currentPlayerColor = getPlayerColor(gameState.currentPlayer)
  const currentPlayerName = getPlayerName(gameState.currentPlayer)

  return (
    <div className="connect4-game-board">
      <motion.div 
        className="connect4-game-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Error Banner */}
        <AnimatePresence>
          {error && (
            <motion.div 
              className="error-banner"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              style={{ 
                background: 'rgba(239, 68, 68, 0.9)', 
                color: 'white', 
                padding: '12px 24px', 
                borderRadius: '8px',
                marginBottom: '20px'
              }}
            >
              ⚠️ {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Game Status */}
        <motion.div 
          className="connect4-game-status"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {gameState.gameState === GAME_STATES.PLAYING ? (
            <div className="connect4-current-player">
              <span className={`connect4-player-indicator ${currentPlayerColor} ${isMyTurn ? 'active' : ''}`}>
                <span className="connect4-disc" style={{ width: '20px', height: '20px', fontSize: '12px' }}>
                  {gameState.currentPlayer === 0 ? '●' : '●'}
                </span>
                {isMyTurn ? 'Your Turn' : `${currentPlayerName}'s Turn`}
              </span>
            </div>
          ) : gameState.gameState === GAME_STATES.FINISHED ? (
            <div className="connect4-game-result">
              {gameState.winner !== null ? (
                <div className={`connect4-winner-announcement ${getPlayerColor(gameState.winner)}`}>
                  🎉 {getPlayerName(gameState.winner)} Wins! 🎉
                </div>
              ) : (
                <div className="connect4-winner-announcement draw">
                  🤝 It's a Draw! 🤝
                </div>
              )}
              <div className="connect4-controls">
                <button className="connect4-button primary" onClick={handleRestart}>
                  Play Again
                </button>
                <button className="connect4-button secondary" onClick={onBackToMenu}>
                  Back to Menu
                </button>
              </div>
            </div>
          ) : null}
        </motion.div>

        {/* Game Grid */}
        <motion.div 
          className="connect4-grid-container"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {/* Game Grid */}
          <div className="connect4-grid">
            {Array.from({ length: GRID_ROWS }, (_, row) =>
              Array.from({ length: GRID_COLS }, (_, col) => {
                const cellValue = gameState.grid[row][col]
                const isLastMove = lastMove && lastMove.row === row && lastMove.col === col
                const isColumnPlayable = isMyTurn && gameState.gameState === GAME_STATES.PLAYING && validMoves.includes(col)
                
                return (
                  <motion.div
                    key={`${row}-${col}`}
                    className={`connect4-cell ${cellValue !== null ? 'occupied' : ''} ${isColumnPlayable ? 'playable' : ''}`}
                    onClick={() => isColumnPlayable ? handleColumnClick(col) : null}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: (row * GRID_COLS + col) * 0.02 }}
                    whileHover={isColumnPlayable ? { scale: 1.05 } : {}}
                    whileTap={isColumnPlayable ? { scale: 0.95 } : {}}
                    style={{ cursor: isColumnPlayable ? 'pointer' : 'default' }}
                  >
                    <AnimatePresence>
                      {cellValue !== null && (
                        <motion.div
                          className={`connect4-disc ${getPlayerColor(cellValue)} ${isLastMove ? 'last-move' : ''}`}
                          initial={{ y: -200, opacity: 0.8 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ 
                            type: "spring",
                            stiffness: 300,
                            damping: 20,
                            duration: 0.6
                          }}
                        >
                          ●
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )
              })
            )}
          </div>
        </motion.div>

        {/* Back to Menu Button (only show during gameplay) */}
        {gameState.gameState === GAME_STATES.PLAYING && (
          <motion.button
            className="connect4-button secondary"
            onClick={onBackToMenu}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            Back to Menu
          </motion.button>
        )}
      </motion.div>
    </div>
  )
}

export default GameBoard