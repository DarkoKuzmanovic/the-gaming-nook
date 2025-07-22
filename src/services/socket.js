// Socket.io client service for multiplayer functionality
import { io } from 'socket.io-client'

class SocketService {
  constructor() {
    this.socket = null
    this.gameId = null
    this.playerIndex = null
    this.connected = false
  }

  connect() {
    this.socket = io('http://localhost:3001')
    
    this.socket.on('connect', () => {
      console.log('Connected to server:', this.socket.id)
      this.connected = true
    })

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server')
      this.connected = false
    })

    this.socket.on('error', (error) => {
      console.error('Socket error:', error)
    })

    return this.socket
  }

  joinGame(playerName) {
    if (!this.socket) {
      console.error('No socket connection')
      return Promise.reject(new Error('No socket connection'))
    }
    
    return new Promise((resolve, reject) => {
      console.log('Emitting join-game with name:', playerName)
      this.socket.emit('join-game', playerName)
      
      this.socket.once('game-joined', ({ gameId, playerIndex }) => {
        this.gameId = gameId
        this.playerIndex = playerIndex
        console.log(`Successfully joined game ${gameId} as player ${playerIndex}`)
        resolve({ gameId, playerIndex })
      })
      
      setTimeout(() => {
        console.error('Join game timeout')
        reject(new Error('Join game timeout'))
      }, 10000)
    })
  }

  // Draft phase events
  onGameStarted(callback) {
    if (!this.socket) return
    this.socket.on('game-started', callback)
  }

  onDraftStarted(callback) {
    if (!this.socket) return
    this.socket.on('draft-started', callback)
  }

  onCardPicked(callback) {
    if (!this.socket) return
    this.socket.on('card-picked', callback)
  }

  onCardPickedAndPlaced(callback) {
    if (!this.socket) return
    this.socket.on('card-picked-and-placed', callback)
  }

  onNewTurn(callback) {
    if (!this.socket) return
    this.socket.on('new-turn', callback)
  }

  onDraftComplete(callback) {
    if (!this.socket) return
    this.socket.on('draft-complete', callback)
  }

  // Emit events
  startDraft() {
    if (!this.socket) return
    this.socket.emit('start-draft', { gameId: this.gameId })
  }

  pickCard(cardId, choice) {
    if (!this.socket) return
    this.socket.emit('pick-card', { 
      gameId: this.gameId, 
      playerIndex: this.playerIndex, 
      cardId,
      choice
    })
  }

  placeCard(cardId, gridIndex, choice) {
    if (!this.socket) return
    this.socket.emit('place-card', {
      gameId: this.gameId,
      playerIndex: this.playerIndex,
      cardId,
      gridIndex,
      choice
    })
  }

  // Card placement events
  onCardPlaced(callback) {
    if (!this.socket) return
    this.socket.on('card-placed', callback)
  }

  // Round management events
  onRoundComplete(callback) {
    if (!this.socket) return
    this.socket.on('round-complete', callback)
  }

  onGameComplete(callback) {
    if (!this.socket) return
    this.socket.on('game-complete', callback)
  }

  // Player events
  onPlayerDisconnected(callback) {
    if (!this.socket) return
    this.socket.on('player-disconnected', callback)
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
      this.connected = false
    }
  }

  isConnected() {
    return this.connected && this.socket?.connected
  }

  getPlayerIndex() {
    return this.playerIndex
  }

  getGameId() {
    return this.gameId
  }
}

// Export singleton instance
export default new SocketService()