const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const cors = require('cors')
const path = require('path')

const app = express()
const server = http.createServer(app)
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
})

const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

// Game state storage
const games = new Map()
const players = new Map()

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id)

  socket.on('join-game', (playerName) => {
    players.set(socket.id, { name: playerName, socket: socket })
    
    // Simple matchmaking - find existing game or create new one
    let gameId = null
    for (const [id, game] of games.entries()) {
      if (game.players.length < 2) {
        gameId = id
        break
      }
    }

    if (!gameId) {
      gameId = generateGameId()
      games.set(gameId, {
        id: gameId,
        players: [],
        currentRound: 1,
        currentPlayer: 0,
        deck: [],
        gameState: 'waiting'
      })
    }

    const game = games.get(gameId)
    game.players.push({
      id: socket.id,
      name: playerName,
      grid: Array(9).fill(null),
      scores: [0, 0, 0]
    })

    socket.join(gameId)
    socket.emit('game-joined', { gameId, playerIndex: game.players.length - 1 })

    if (game.players.length === 2) {
      game.gameState = 'playing'
      initializeGame(game)
      io.to(gameId).emit('game-started', game)
    }
  })

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id)
    players.delete(socket.id)
    
    // Handle game cleanup if needed
    for (const [gameId, game] of games.entries()) {
      const playerIndex = game.players.findIndex(p => p.id === socket.id)
      if (playerIndex !== -1) {
        io.to(gameId).emit('player-disconnected', playerIndex)
        games.delete(gameId)
        break
      }
    }
  })
})

function generateGameId() {
  return Math.random().toString(36).substr(2, 9)
}

function initializeGame(game) {
  // Initialize deck with 70 cards based on ruleset
  game.deck = createDeck()
  shuffleDeck(game.deck)
  
  // Reset player grids
  game.players.forEach(player => {
    player.grid = Array(9).fill(null)
  })
}

function createDeck() {
  const colors = ['blue', 'green', 'yellow', 'orange', 'red', 'purple', 'brown', 'multi']
  const deck = []
  
  // This is a simplified deck creation - should be expanded based on actual card distribution
  for (let number = 1; number <= 9; number++) {
    for (let colorIndex = 0; colorIndex < colors.length; colorIndex++) {
      const color = colors[colorIndex]
      
      // Add multiple cards of each number/color combination
      for (let i = 0; i < Math.floor(70 / (9 * colors.length)); i++) {
        deck.push({
          number,
          color,
          hasSpiral: Math.random() < 0.3,
          hasCross: Math.random() < 0.2,
          isSpecial: Math.random() < 0.1
        })
      }
    }
  }
  
  return deck.slice(0, 70) // Ensure exactly 70 cards
}

function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]]
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', games: games.size, players: players.size })
})

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})