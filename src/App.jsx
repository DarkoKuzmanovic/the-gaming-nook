import React, { useState, useEffect } from 'react'
import GameBoard from './components/GameBoard'
import socketService from './services/socket'
import './App.css'

function App() {
  const [gameState, setGameState] = useState('menu') // 'menu', 'waiting', 'playing', 'finished'
  const [playerName, setPlayerName] = useState('')
  const [gameInfo, setGameInfo] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')

  useEffect(() => {
    // Connect to server on app start
    const socket = socketService.connect()
    
    socket.on('connect', () => {
      console.log('Socket connected')
      setConnectionStatus('connected')
    })

    socket.on('disconnect', () => {
      console.log('Socket disconnected')
      setConnectionStatus('disconnected')
    })

    // Handle game started event
    socketService.onGameStarted((game) => {
      console.log('Game started event received:', game)
      setGameState('playing')
      setGameInfo(prevInfo => ({ ...prevInfo, ...game }))
    })

    // Handle player disconnection
    socketService.onPlayerDisconnected((playerIndex) => {
      console.log('Player disconnected:', playerIndex)
      alert('The other player has disconnected. Returning to menu.')
      setGameState('menu')
      setGameInfo(null)
    })

    return () => {
      socketService.disconnect()
    }
  }, [])

  const startGame = async () => {
    if (playerName.trim() && socketService.isConnected()) {
      try {
        setGameState('waiting')
        const { gameId, playerIndex } = await socketService.joinGame(playerName.trim())
        console.log('Joined game successfully:', { gameId, playerIndex })
        setGameInfo({ gameId, playerIndex })
        
        // If this is the second player, the game will start automatically
        // If this is the first player, we wait for another player
      } catch (error) {
        console.error('Failed to join game:', error)
        alert('Failed to join game. Please try again.')
        setGameState('menu')
      }
    }
  }

  if (gameState === 'menu') {
    return (
      <div className="app">
        <div className="menu">
          <h1>Vetrolisci</h1>
          <p>A strategic card placement game for 2 players</p>
          <div className="connection-status">
            Status: {connectionStatus === 'connected' ? '🟢 Connected' : '🔴 Disconnected'}
          </div>
          <div className="menu-form">
            <input
              type="text"
              placeholder="Enter your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && startGame()}
            />
            <button 
              onClick={startGame}
              disabled={!playerName.trim() || connectionStatus !== 'connected'}
            >
              Find Game
            </button>
          </div>
          <p className="instructions">
            Enter your name and click "Find Game" to be matched with another player
          </p>
        </div>
      </div>
    )
  }

  if (gameState === 'waiting') {
    return (
      <div className="app">
        <div className="waiting">
          <h1>Vetrolisci</h1>
          <div className="waiting-content">
            <div className="spinner">⟳</div>
            <h2>Waiting for another player...</h2>
            <p>Game ID: {gameInfo?.gameId}</p>
            <p>You are Player {(gameInfo?.playerIndex || 0) + 1}</p>
            <button onClick={() => {
              socketService.disconnect()
              setGameState('menu')
              setGameInfo(null)
            }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Vetrolisci</h1>
        <p>Player: {playerName} | Game: {gameInfo?.gameId}</p>
      </header>
      <GameBoard 
        playerName={playerName} 
        gameInfo={gameInfo}
        socketService={socketService}
      />
    </div>
  )
}

export default App