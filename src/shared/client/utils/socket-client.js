import { io } from 'socket.io-client'

class SocketClient {
  constructor() {
    this.socket = null
    this.connected = false
    this.listeners = new Map()
  }

  connect(serverUrl) {
    // Auto-detect server URL based on current page URL
    if (!serverUrl) {
      const hostname = window.location.hostname
      const port = '8001' // Always use port 8001 for server
      serverUrl = `http://${hostname}:${port}`
    }
    
    if (this.socket?.connected) {
      console.log('🔌 Socket already connected')
      return Promise.resolve()
    }

    console.log(`🔌 Connecting to server: ${serverUrl}`)
    
    this.socket = io(serverUrl, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 10000
    })

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'))
      }, 10000)

      this.socket.on('connect', () => {
        clearTimeout(timeout)
        this.connected = true
        console.log(`🔌 Connected to server: ${this.socket.id}`)
        resolve()
      })

      this.socket.on('connect_error', (error) => {
        clearTimeout(timeout)
        console.error('🔌 Connection error:', error)
        reject(error)
      })

      this.socket.on('disconnect', (reason) => {
        this.connected = false
        console.log(`🔌 Disconnected: ${reason}`)
      })

      this.socket.on('reconnect', (attemptNumber) => {
        this.connected = true
        console.log(`🔌 Reconnected after ${attemptNumber} attempts`)
      })

      this.socket.on('reconnect_error', (error) => {
        console.error('🔌 Reconnection error:', error)
      })
    })
  }

  getSocketId() {
    return this.socket?.id || null
  }

  disconnect() {
    if (this.socket) {
      console.log('🔌 Disconnecting from server')
      this.socket.disconnect()
      this.socket = null
      this.connected = false
      this.listeners.clear()
    }
  }

  // Generic event listeners
  on(event, callback) {
    if (!this.socket) {
      console.warn(`🔌 Socket not connected. Cannot listen for event: ${event}`)
      return
    }

    // Remove existing listener if it exists
    this.off(event)
    
    // Add new listener
    this.socket.on(event, callback)
    this.listeners.set(event, callback)
    console.log(`🔌 Listening for event: ${event}`)
  }

  off(event) {
    if (this.socket && this.listeners.has(event)) {
      this.socket.off(event, this.listeners.get(event))
      this.listeners.delete(event)
      console.log(`🔌 Stopped listening for event: ${event}`)
    }
  }

  emit(event, data) {
    if (!this.socket?.connected) {
      console.warn(`🔌 Socket not connected. Cannot emit event: ${event}`)
      return Promise.reject(new Error('Socket not connected'))
    }

    console.log(`🔌 Emitting event: ${event}`, data)
    return new Promise((resolve, reject) => {
      this.socket.emit(event, data, (response) => {
        if (response?.error) {
          console.error(`🔌 Server error for ${event}:`, response.error)
          reject(new Error(response.error))
        } else {
          console.log(`🔌 Server response for ${event}:`, response)
          resolve(response)
        }
      })
    })
  }

  // Room management methods
  async createRoom(gameType) {
    return this.emit('create-room', { gameType })
  }

  async joinRoom(roomCode, playerName) {
    return this.emit('join-room', { roomCode, playerName })
  }

  async checkRoom(roomCode) {
    return this.emit('check-room', { roomCode })
  }

  // Connection status
  isConnected() {
    return this.connected && this.socket?.connected
  }

  getSocketId() {
    return this.socket?.id
  }

  // Event handlers for common events
  onRoomCreated(callback) {
    this.on('room-created', callback)
  }

  onRoomJoined(callback) {
    this.on('room-joined', callback)
  }

  onRoomInfo(callback) {
    this.on('room-info', callback)
  }

  onGameStarted(callback) {
    this.on('game-started', callback)
  }

  onPlayerJoined(callback) {
    this.on('player-joined', callback)
  }

  onPlayerLeft(callback) {
    this.on('player-left', callback)
  }

  onError(callback) {
    this.on('error', callback)
  }

  onConnectionStatus(callback) {
    if (!this.socket) return

    this.socket.on('connect', () => callback({ connected: true }))
    this.socket.on('disconnect', () => callback({ connected: false }))
    this.socket.on('reconnect', () => callback({ connected: true, reconnected: true }))
  }
}

// Create a singleton instance
const socketClient = new SocketClient()

export default socketClient