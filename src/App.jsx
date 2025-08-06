import React, { useState, useEffect } from 'react'
import socketClient from './shared/client/utils/socket-client.js'
import Modal from './shared/client/components/Modal.jsx'
import Button from './shared/client/components/Button.jsx'
import LoadingSpinner from './shared/client/components/LoadingSpinner.jsx'
import GameBoard from './games/vetrolisci/client/components/GameBoard.jsx'
import './App.css'

function App() {
  const [currentView, setCurrentView] = useState('menu') // 'menu', 'create', 'join', 'waiting', 'game'
  const [roomCode, setRoomCode] = useState('')
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [currentRoom, setCurrentRoom] = useState(null)
  const [showErrorModal, setShowErrorModal] = useState(false)
  const [gameData, setGameData] = useState(null)

  // Connect to server on app load
  useEffect(() => {
    const connect = async () => {
      try {
        setLoading(true)
        await socketClient.connect()
        setConnected(true)
        
        // Set up connection status listener
        socketClient.onConnectionStatus(({ connected, reconnected }) => {
          setConnected(connected)
          if (reconnected) {
            console.log('🔌 Reconnected to server')
          }
        })

        // Set up error handling
        socketClient.onError((error) => {
          setError(error.message || 'An error occurred')
          setShowErrorModal(true)
        })

        // Listen for when players join
        socketClient.onPlayerJoined((data) => {
          console.log('👤 Player joined:', data)
        })

        // Listen for game started
        socketClient.on('game-started', (data) => {
          console.log('🚀 Game started for room:', data.room.code)
          
          // Find player index by socket ID
          let playerIndex = 0
          if (data.room && data.room.players) {
            const myPlayer = data.room.players.find(p => p.id === socketClient.getSocketId())
            if (myPlayer) {
              playerIndex = data.room.players.indexOf(myPlayer)
            }
          }
          
          console.log(`🎯 Joined as Player ${playerIndex} (${data.room.players[playerIndex]?.name})`)
          
          setGameData({
            roomCode: data.room.code,
            gameType: data.room.gameType,
            playerIndex: playerIndex,
            gameState: data.gameState
          })
          setCurrentView('game')
        })
        
        // Listen for game state updates to keep header in sync
        socketClient.on('vetrolisci-game-state', (data) => {
          if (gameData) {
            setGameData(prev => ({
              ...prev,
              gameState: data
            }))
          }
        })

      } catch (err) {
        console.error('Failed to connect to server:', err)
        setError('Failed to connect to server. Please check your connection.')
        setShowErrorModal(true)
      } finally {
        setLoading(false)
      }
    }

    connect()

    // Cleanup on unmount
    return () => {
      socketClient.disconnect()
    }
  }, [])

  const handleCreateGame = () => {
    setCurrentView('create')
  }

  const handleJoinGame = () => {
    setCurrentView('join')
  }

  const handleBack = () => {
    setCurrentView('menu')
    setRoomCode('')
    setError('')
    setCurrentRoom(null)
    setGameData(null)
  }

  const handleCreateVetrolisciRoom = async () => {
    if (!connected) {
      setError('Not connected to server')
      setShowErrorModal(true)
      return
    }

    try {
      setLoading(true)
      const response = await socketClient.emit('create-room', { 
        gameType: 'vetrolisci', 
        playerName: 'Host' 
      })
      
      if (response.success) {
        setCurrentRoom(response)
        setRoomCode(response.roomCode)
        setCurrentView('waiting')
        console.log('🎮 Room created:', response.roomCode)
      } else {
        setError(response.error || 'Failed to create room')
        setShowErrorModal(true)
      }
    } catch (err) {
      setError('Failed to create room. Please try again.')
      setShowErrorModal(true)
    } finally {
      setLoading(false)
    }
  }

  const handleJoinRoom = async () => {
    console.log('🎯 JOIN ATTEMPT: Starting join process for room:', roomCode)
    
    if (!connected) {
      console.log('🎯 JOIN ATTEMPT: Not connected to server')
      setError('Not connected to server')
      setShowErrorModal(true)
      return
    }

    if (roomCode.length !== 6) {
      console.log('🎯 JOIN ATTEMPT: Invalid room code length:', roomCode.length)
      setError('Please enter a valid 6-character room code')
      setShowErrorModal(true)
      return
    }

    try {
      setLoading(true)
      console.log('🎯 JOIN ATTEMPT: Checking if room exists:', roomCode)
      
      // First check if room exists
      const checkResponse = await socketClient.checkRoom(roomCode)
      console.log('🎯 JOIN ATTEMPT: Check room response:', checkResponse)
      
      if (!checkResponse.success) {
        console.log('🎯 JOIN ATTEMPT: Room check failed:', checkResponse.error)
        setError(checkResponse.error || 'Room not found')
        setShowErrorModal(true)
        setLoading(false)
        return
      }

      console.log('🎯 JOIN ATTEMPT: Room exists, attempting to join...')
      // Join the room
      const joinResponse = await socketClient.joinRoom(roomCode, 'Guest')
      console.log('🎯 JOIN ATTEMPT: Join response:', joinResponse)
      
      if (joinResponse.success) {
        setCurrentRoom(joinResponse)
        setCurrentView('waiting')
        console.log('👤 Successfully joined room:', roomCode)
      } else {
        console.log('🎯 JOIN ATTEMPT: Join failed:', joinResponse.error)
        setError(joinResponse.error || 'Failed to join room')
        setShowErrorModal(true)
      }
    } catch (err) {
      console.log('🎯 JOIN ATTEMPT: Exception:', err)
      setError('Failed to join room. Please try again.')
      setShowErrorModal(true)
    } finally {
      setLoading(false)
    }
  }

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode)
    // Could add a toast notification here
    console.log('📋 Room code copied to clipboard')
  }

  if (loading && currentView === 'menu') {
    return (
      <div className="app">
        <LoadingSpinner size="large" text="Connecting to server..." />
      </div>
    )
  }

  return (
    <div className="app">
      <header className="app-header">
        {currentView === 'game' && gameData ? (
          <>
            <h1>🎮 Vetrolisci - Round {gameData.gameState?.currentRound || 1}/3</h1>
            <p>Room: {gameData.roomCode}</p>
          </>
        ) : (
          <>
            <h1>🎮 The Gaming Nook</h1>
            <p>Simple multiplayer games for friends</p>
          </>
        )}
        {!connected && (
          <div className="connection-status offline">
            ⚠️ Disconnected from server
          </div>
        )}
      </header>

      <main className="app-main">
        {currentView === 'menu' && (
          <div className="menu">
            <Button 
              variant="success"
              size="large"
              onClick={handleCreateGame}
              disabled={!connected}
            >
              Create Game
            </Button>
            
            <Button 
              variant="primary"
              size="large"
              onClick={handleJoinGame}
              disabled={!connected}
            >
              Join Game
            </Button>
          </div>
        )}

        {currentView === 'create' && (
          <div className="create-game">
            <h2>Select Game Type</h2>
            <div className="game-selection">
              <Button
                className="game-card-button"
                variant="danger"
                size="large"
                onClick={handleCreateVetrolisciRoom}
                loading={loading}
                disabled={!connected}
              >
                <div className="game-card-content">
                  <h3>Vetrolisci</h3>
                  <p>Card Strategy Game</p>
                </div>
              </Button>
            </div>
            <Button variant="outline" onClick={handleBack}>
              ← Back
            </Button>
          </div>
        )}

        {currentView === 'join' && (
          <div className="join-game">
            <h2>Join Game</h2>
            <div className="join-form">
              <input
                type="text"
                placeholder="Enter room code..."
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="room-code-input"
                disabled={loading}
              />
              <Button 
                variant="primary"
                size="large"
                onClick={handleJoinRoom}
                disabled={roomCode.length !== 6 || !connected}
                loading={loading}
              >
                Join Game
              </Button>
            </div>
            <Button variant="outline" onClick={handleBack}>
              ← Back
            </Button>
          </div>
        )}

        {currentView === 'waiting' && (
          <div className="waiting-room">
            <h2>Room: {roomCode}</h2>
            <div className="room-info">
              <p><strong>Game:</strong> {currentRoom?.room?.gameType || currentRoom?.gameType}</p>
              <p><strong>Players:</strong> {currentRoom?.room?.players?.length || 1}/2</p>
            </div>
            
            <div className="room-code-share">
              <h3>Share this code with your friend:</h3>
              <div className="room-code-display">
                <span className="room-code-text">{roomCode}</span>
                <Button variant="outline" size="small" onClick={copyRoomCode}>
                  Copy
                </Button>
              </div>
            </div>

            <LoadingSpinner text="Waiting for another player to join..." />
            
            <Button variant="outline" onClick={handleBack}>
              Leave Room
            </Button>
          </div>
        )}

        {currentView === 'game' && gameData && (
          <GameBoard 
            roomCode={gameData.roomCode}
            playerIndex={gameData.playerIndex}
            onBackToMenu={handleBack}
            showHeader={false}
          />
        )}
      </main>

      {/* Error Modal */}
      <Modal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        title="Error"
      >
        <p className="error-message">{error}</p>
        <div className="modal-actions">
          <Button onClick={() => setShowErrorModal(false)}>
            OK
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default App