// Connect 4 Server Logic
import { 
  createInitialGameState, 
  processMove, 
  GAME_STATES 
} from '../shared/game-logic.js'

class Connect4Server {
  constructor() {
    this.games = new Map() // roomCode -> gameState
  }

  // Initialize a new Connect 4 game
  initializeGame(roomCode, players) {
    console.log('🔴 Initializing Connect 4 game for room:', roomCode)
    
    const gameState = createInitialGameState(players)
    this.games.set(roomCode, gameState)
    
    console.log('🔴 Connect 4 game initialized:', {
      roomCode,
      players: players.map(p => p.name),
      currentPlayer: gameState.currentPlayer
    })
    
    return gameState
  }

  // Get current game state
  getGameState(roomCode) {
    const gameState = this.games.get(roomCode)
    if (!gameState) {
      return { success: false, error: 'Game not found' }
    }
    return { success: true, gameState }
  }

  // Process a player move
  makeMove(roomCode, playerIndex, col) {
    const gameState = this.games.get(roomCode)
    if (!gameState) {
      return { success: false, error: 'Game not found' }
    }

    // Validate it's the player's turn
    if (gameState.currentPlayer !== playerIndex) {
      return { 
        success: false, 
        error: `Not your turn. It's ${gameState.players[gameState.currentPlayer].name}'s turn.` 
      }
    }

    // Process the move
    const result = processMove(gameState, col)
    if (!result.success) {
      return result
    }

    // Update stored game state
    this.games.set(roomCode, result.gameState)

    console.log('🔴 Move processed:', {
      roomCode,
      player: gameState.players[playerIndex].name,
      col,
      row: result.lastMove.row,
      gameState: result.gameState.gameState,
      winner: result.gameState.winner !== null ? gameState.players[result.gameState.winner].name : null
    })

    return {
      success: true,
      gameState: result.gameState,
      lastMove: result.lastMove
    }
  }

  // Clean up finished game
  cleanupGame(roomCode) {
    this.games.delete(roomCode)
    console.log('🔴 Cleaned up Connect 4 game for room:', roomCode)
  }

  // Get all active games (for debugging)
  getActiveGames() {
    return Array.from(this.games.keys())
  }
}

// Create singleton instance
const connect4Server = new Connect4Server()

// Export singleton instance
export default connect4Server

// Socket event handlers for Connect 4
export const setupConnect4Events = (io, socket, { rooms, players }) => {
  
  // Get current game state
  socket.on('connect4-get-state', async (data, callback) => {
    try {
      const { roomCode } = data
      
      if (!rooms.has(roomCode)) {
        callback({ success: false, error: 'Room not found' })
        return
      }

      const result = connect4Server.getGameState(roomCode)
      callback(result)
      
    } catch (error) {
      console.error('Error getting Connect 4 state:', error)
      callback({ success: false, error: 'Server error' })
    }
  })

  // Handle player move
  socket.on('connect4-make-move', async (data, callback) => {
    try {
      const { roomCode, col } = data
      
      const room = rooms.get(roomCode)
      if (!room) {
        callback({ success: false, error: 'Room not found' })
        return
      }

      // Find player index
      const playerIndex = room.players.findIndex(p => p.id === socket.id)
      if (playerIndex === -1) {
        callback({ success: false, error: 'Player not found' })
        return
      }

      // Process the move
      const result = connect4Server.makeMove(roomCode, playerIndex, col)
      
      if (result.success) {
        // Broadcast move to all players in the room
        io.to(roomCode).emit('connect4-move-made', {
          gameState: result.gameState,
          lastMove: result.lastMove,
          playerIndex
        })

        // Check if game is finished
        if (result.gameState.gameState === GAME_STATES.FINISHED) {
          io.to(roomCode).emit('connect4-game-finished', {
            gameState: result.gameState,
            winner: result.gameState.winner,
            isDraw: result.gameState.winner === null
          })
        }
        
        callback({ success: true })
      } else {
        callback(result)
      }
      
    } catch (error) {
      console.error('Error processing Connect 4 move:', error)
      callback({ success: false, error: 'Server error' })
    }
  })

  // Handle game restart request
  socket.on('connect4-restart', async (data, callback) => {
    try {
      const { roomCode } = data
      
      const room = rooms.get(roomCode)
      if (!room) {
        callback({ success: false, error: 'Room not found' })
        return
      }

      // Only host can restart
      if (room.host !== socket.id) {
        callback({ success: false, error: 'Only host can restart game' })
        return
      }

      // Initialize new game
      const gameState = connect4Server.initializeGame(roomCode, room.players)
      
      // Broadcast new game to all players
      io.to(roomCode).emit('connect4-game-restarted', { gameState })
      
      callback({ success: true })
      
    } catch (error) {
      console.error('Error restarting Connect 4:', error)
      callback({ success: false, error: 'Server error' })
    }
  })
}