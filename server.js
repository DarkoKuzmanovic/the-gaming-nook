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
        gameState: 'waiting',
        draftState: null,
        phase: 'draft'
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
    console.log(`Player ${playerName} joined game ${gameId}. Players: ${game.players.length}/2`)

    if (game.players.length === 2) {
      game.gameState = 'playing'
      initializeGame(game)
      console.log(`Game ${gameId} starting with players:`, game.players.map(p => p.name))
      io.to(gameId).emit('game-started', game)
    }
  })

  // Draft phase handlers
  socket.on('start-draft', ({ gameId }) => {
    const game = games.get(gameId)
    if (!game) return

    try {
      game.draftState = initializeDraftPhase(game.deck, game.currentRound)
      game.draftState.phase = 'pick' // Start picking immediately
      io.to(gameId).emit('draft-started', game.draftState)
    } catch (error) {
      console.error('Failed to start draft:', error)
      socket.emit('error', { message: 'Failed to start draft phase' })
    }
  })

  socket.on('pick-card', ({ gameId, playerIndex, cardId, choice }) => {
    const game = games.get(gameId)
    if (!game || !game.draftState) return

    try {
      // Validate it's the correct player's turn
      const currentPickingPlayer = game.draftState.pickOrder[game.draftState.currentPickIndex]
      if (currentPickingPlayer !== playerIndex) {
        socket.emit('error', { message: 'Not your turn to pick' })
        return
      }

      // Execute the pick
      const result = pickCard(game.draftState, playerIndex, cardId)
      const pickedCard = result.selectedCard
      game.draftState = result.draftState

      // Immediately place the picked card
      const player = game.players[playerIndex]
      let gridIndex = pickedCard.value - 1 // Default placement
      
      // Handle different placement scenarios
      const scenario = determineServerPlacementScenario(pickedCard, player.grid)
      if (scenario === 'validated') {
        // Find first empty space for scenario 3
        gridIndex = player.grid.findIndex(cell => cell === null)
        if (gridIndex === -1) {
          throw new Error('No empty space available')
        }
      }

      const placementResult = executeServerCardPlacement(pickedCard, gridIndex, player.grid, choice)
      player.grid = placementResult.grid

      // Broadcast the pick-and-place to all players
      io.to(gameId).emit('card-picked-and-placed', {
        playerIndex,
        cardId,
        placedCard: pickedCard,
        newGrid: player.grid,
        draftState: game.draftState,
        placementResult
      })

      // Check if all cards in this turn are picked
      if (game.draftState.revealedCards.length === 0) {
        // Turn complete - next player becomes first player
        game.currentPlayer = game.draftState.pickOrder[game.draftState.currentPickIndex - 1]
        
        // Check if round should end
        const roundShouldEnd = checkRoundEndCondition(game)
        if (roundShouldEnd) {
          endRound(game, gameId, io)
        } else {
          // Start new turn
          game.draftState = initializeDraftPhase(game.deck, game.currentRound)
          io.to(gameId).emit('new-turn', {
            currentPlayer: game.currentPlayer,
            draftState: game.draftState
          })
        }
      }

    } catch (error) {
      console.error('Pick card error:', error)
      socket.emit('error', { message: error.message })
    }
  })

  // Card placement handlers
  socket.on('place-card', ({ gameId, playerIndex, cardId, gridIndex, choice }) => {
    const game = games.get(gameId)
    if (!game || game.phase !== 'place') return

    try {
      // Validate it's the correct player's turn
      if (game.currentPlayer !== playerIndex) {
        socket.emit('error', { message: 'Not your turn to place' })
        return
      }

      // Find the card in player's hand
      const playerHand = game.draftState?.playerHands[playerIndex] || []
      const card = playerHand.find(c => c.id === cardId)
      if (!card) {
        socket.emit('error', { message: 'Card not in your hand' })
        return
      }

      // Execute card placement
      const player = game.players[playerIndex]
      const placementResult = executeServerCardPlacement(card, gridIndex, player.grid, choice)
      
      // Update player grid
      player.grid = placementResult.grid

      // Remove card from player's hand
      if (game.draftState?.playerHands[playerIndex]) {
        game.draftState.playerHands[playerIndex] = game.draftState.playerHands[playerIndex].filter(c => c.id !== cardId)
      }

      // Switch turns
      game.currentPlayer = 1 - game.currentPlayer

      // Broadcast placement to all players
      io.to(gameId).emit('card-placed', {
        playerIndex,
        cardId,
        gridIndex,
        choice,
        newGrid: player.grid,
        currentPlayer: game.currentPlayer,
        placementResult
      })

      // Check if round is complete (all cards placed or players have no more cards)
      const allCardsPlaced = game.players.every(p => 
        game.draftState?.playerHands[game.players.indexOf(p)]?.length === 0
      )

      if (allCardsPlaced) {
        // End current round
        endRound(game, gameId, io)
      }

      console.log(`Player ${playerIndex} placed card ${cardId} at position ${gridIndex}`)

    } catch (error) {
      console.error('Card placement error:', error)
      socket.emit('error', { message: error.message })
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

// Import our proper card data and draft logic
const CARDS = [
  { id: 1, value: 7, color: 'multi', scoring: -1, special: false },
  { id: 2, value: 6, color: 'green', scoring: -1, special: false },
  { id: 3, value: 9, color: 'green', scoring: -4, special: false },
  { id: 4, value: 4, color: 'blue', scoring: 1, special: true },
  { id: 5, value: 3, color: 'green', scoring: 2, special: false },
  { id: 6, value: 4, color: 'multi', scoring: 0, special: false },
  { id: 7, value: 7, color: 'red', scoring: -4, special: false },
  { id: 8, value: 4, color: 'yellow', scoring: -1, special: false },
  { id: 9, value: 7, color: 'yellow', scoring: 1, special: false },
  { id: 10, value: 5, color: 'red', scoring: 1, special: true },
  { id: 11, value: 1, color: 'red', scoring: 1, special: true },
  { id: 12, value: 7, color: 'red', scoring: -1, special: false },
  { id: 13, value: 5, color: 'yellow', scoring: 0, special: false },
  { id: 14, value: 2, color: 'yellow', scoring: 1, special: true },
  { id: 15, value: 2, color: 'green', scoring: 3, special: false },
  { id: 16, value: 5, color: 'blue', scoring: 1, special: true },
  { id: 17, value: 9, color: 'blue', scoring: -6, special: false },
  { id: 18, value: 6, color: 'red', scoring: -2, special: false },
  { id: 19, value: 5, color: 'yellow', scoring: 1, special: true },
  { id: 20, value: 6, color: 'multi', scoring: -1, special: false },
  { id: 21, value: 6, color: 'red', scoring: 0, special: false },
  { id: 22, value: 5, color: 'blue', scoring: 0, special: false },
  { id: 23, value: 5, color: 'green', scoring: 1, special: true },
  { id: 24, value: 1, color: 'blue', scoring: 6, special: false },
  { id: 25, value: 6, color: 'yellow', scoring: 0, special: false },
  { id: 26, value: 6, color: 'yellow', scoring: -3, special: false },
  { id: 27, value: 3, color: 'multi', scoring: 0, special: false },
  { id: 28, value: 9, color: 'yellow', scoring: -2, special: false },
  { id: 29, value: 4, color: 'red', scoring: 2, special: false },
  { id: 30, value: 7, color: 'yellow', scoring: -5, special: false },
  { id: 31, value: 2, color: 'blue', scoring: 4, special: false },
  { id: 32, value: 1, color: 'green', scoring: 5, special: false },
  { id: 33, value: 6, color: 'blue', scoring: 1, special: false },
  { id: 34, value: 2, color: 'multi', scoring: 0, special: false },
  { id: 35, value: 4, color: 'red', scoring: 0, special: false },
  { id: 36, value: 3, color: 'blue', scoring: 0, special: false },
  { id: 37, value: 8, color: 'green', scoring: -2, special: false },
  { id: 38, value: 8, color: 'red', scoring: 0, special: false },
  { id: 39, value: 6, color: 'green', scoring: 1, special: false },
  { id: 40, value: 7, color: 'green', scoring: -2, special: false },
  { id: 41, value: 3, color: 'blue', scoring: 1, special: false },
  { id: 42, value: 8, color: 'multi', scoring: -1, special: false },
  { id: 43, value: 5, color: 'blue', scoring: -2, special: false },
  { id: 44, value: 3, color: 'yellow', scoring: 5, special: false },
  { id: 45, value: 5, color: 'red', scoring: -1, special: false },
  { id: 46, value: 8, color: 'red', scoring: -5, special: false },
  { id: 47, value: 5, color: 'yellow', scoring: -2, special: false },
  { id: 48, value: 3, color: 'green', scoring: 1, special: true },
  { id: 49, value: 3, color: 'yellow', scoring: 0, special: false },
  { id: 50, value: 2, color: 'red', scoring: 5, special: false },
  { id: 51, value: 1, color: 'red', scoring: 3, special: false },
  { id: 52, value: 4, color: 'yellow', scoring: 3, special: false },
  { id: 53, value: 4, color: 'green', scoring: 4, special: false },
  { id: 54, value: 4, color: 'blue', scoring: 0, special: false },
  { id: 55, value: 1, color: 'yellow', scoring: 4, special: false },
  { id: 56, value: 5, color: 'green', scoring: -1, special: false },
  { id: 57, value: 2, color: 'yellow', scoring: 2, special: false },
  { id: 58, value: 3, color: 'red', scoring: 4, special: false },
  { id: 59, value: 9, color: 'blue', scoring: -1, special: false },
  { id: 60, value: 9, color: 'red', scoring: 0, special: false },
  { id: 61, value: 8, color: 'blue', scoring: -3, special: false },
  { id: 62, value: 8, color: 'yellow', scoring: -1, special: false },
  { id: 63, value: 6, color: 'blue', scoring: -1, special: false },
  { id: 64, value: 6, color: 'green', scoring: -4, special: false },
  { id: 65, value: 5, color: 'red', scoring: 0, special: false },
  { id: 66, value: 5, color: 'green', scoring: 0, special: false },
  { id: 67, value: 4, color: 'green', scoring: -1, special: false },
  { id: 68, value: 4, color: 'blue', scoring: 1, special: false },
  { id: 69, value: 7, color: 'blue', scoring: -3, special: false },
  { id: 70, value: 7, color: 'green', scoring: 0, special: false }
]

function initializeGame(game) {
  // Initialize deck with our proper 70-card deck
  game.deck = createGameDeck()
  
  // Initialize draft phase
  game.draftState = initializeDraftPhase(game.deck, game.currentRound)
  
  // Reset player grids
  game.players.forEach(player => {
    player.grid = Array(9).fill(null)
  })
}

function createGameDeck() {
  return shuffleDeck([...CARDS]) // Copy and shuffle
}

function initializeDraftPhase(deck, roundNumber) {
  const { roundCards, remainingDeck } = dealRoundCards(deck, roundNumber)
  
  return {
    phase: 'reveal',
    revealedCards: roundCards,
    playerHands: [[], []], // Each player's selected cards
    pickOrder: [0, 1, 1, 0], // Alternating pick order: P1, P2, P2, P1
    currentPickIndex: 0,
    remainingDeck,
    completedPicks: 0
  }
}

function dealRoundCards(deck, roundNumber) {
  const cardsPerRound = 4 // Each player gets 2 cards, 2 players = 4 total
  const startIndex = (roundNumber - 1) * cardsPerRound
  const endIndex = startIndex + cardsPerRound
  
  if (deck.length < endIndex) {
    throw new Error('Not enough cards for round')
  }
  
  return {
    roundCards: deck.slice(startIndex, endIndex),
    remainingDeck: deck.slice(endIndex)
  }
}

function pickCard(draftState, playerIndex, cardId) {
  // Validate turn
  const currentPlayer = draftState.pickOrder[draftState.currentPickIndex]
  if (currentPlayer !== playerIndex) {
    throw new Error('It is not this player\'s turn to pick')
  }

  const cardIndex = draftState.revealedCards.findIndex(card => card.id === cardId)
  if (cardIndex === -1) {
    throw new Error('Card not found in revealed cards')
  }

  const selectedCard = draftState.revealedCards[cardIndex]
  
  // Create new state
  const newDraftState = {
    ...draftState,
    revealedCards: draftState.revealedCards.filter(card => card.id !== cardId),
    playerHands: draftState.playerHands.map((hand, index) => 
      index === playerIndex ? [...hand, selectedCard] : hand
    ),
    currentPickIndex: draftState.currentPickIndex + 1,
    completedPicks: draftState.completedPicks + 1
  }

  // Check if draft phase is complete
  if (newDraftState.completedPicks >= 4) {
    newDraftState.phase = 'complete'
  }

  return {
    draftState: newDraftState,
    selectedCard,
    pickingPlayer: playerIndex
  }
}

function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

// Server-side card placement logic
function executeServerCardPlacement(card, gridIndex, grid, choice) {
  const scenario = determineServerPlacementScenario(card, grid)
  const result = { grid: [...grid], validated: [] }

  switch (scenario) {
    case 'empty':
      // Scenario 1: Empty space or face-down card
      const targetIndex = card.value - 1
      if (result.grid[targetIndex] === null) {
        // Place on empty space
        result.grid[targetIndex] = { ...card, faceUp: true, validated: false }
      } else if (!result.grid[targetIndex].faceUp) {
        // Place on face-down card - becomes validated
        result.grid[targetIndex] = { ...card, faceUp: true, validated: true }
        result.validated.push(targetIndex)
      }
      break

    case 'duplicate':
      // Scenario 2: Duplicate number
      const existingIndex = card.value - 1
      if (choice === 'keep-new') {
        // Keep new card face-up, put existing face-down
        result.grid[existingIndex] = { ...card, faceUp: true, validated: true }
      } else {
        // Keep existing face-up, put new face-down under it
        result.grid[existingIndex].validated = true
      }
      result.validated.push(existingIndex)
      break

    case 'validated':
      // Scenario 3: Already validated number - place face-down anywhere
      if (result.grid[gridIndex] === null) {
        result.grid[gridIndex] = { ...card, faceUp: false, validated: false }
      } else {
        throw new Error('Cannot place card on occupied space')
      }
      break

    default:
      throw new Error('Invalid placement scenario')
  }

  return result
}

function determineServerPlacementScenario(card, grid) {
  const targetIndex = card.value - 1
  const targetCard = grid[targetIndex]

  if (!targetCard || !targetCard.faceUp) {
    return 'empty'
  }

  if (targetCard.faceUp && !targetCard.validated) {
    return 'duplicate'
  }

  if (targetCard.validated) {
    return 'validated'
  }

  return 'empty'
}

// Round management
function endRound(game, gameId, io) {
  console.log(`Round ${game.currentRound} ended for game ${gameId}`)
  
  // Calculate scores for this round
  const roundScores = game.players.map((player, index) => {
    const score = calculatePlayerScore(player.grid, game.currentRound)
    player.scores[game.currentRound - 1] = score
    return { playerIndex: index, score, totalScore: player.scores.reduce((a, b) => a + b, 0) }
  })

  // Check if game is complete (3 rounds)
  if (game.currentRound >= 3) {
    // Game complete
    const winner = roundScores.reduce((prev, current) => 
      current.totalScore > prev.totalScore ? current : prev
    )
    
    game.gameState = 'finished'
    io.to(gameId).emit('game-complete', {
      finalScores: roundScores,
      winner: winner.playerIndex,
      playerScores: game.players.map(p => p.scores)
    })
  } else {
    // Start next round
    game.currentRound++
    game.phase = 'draft'
    
    // Collect all cards from player grids and reshuffle
    const allUsedCards = []
    game.players.forEach(player => {
      player.grid.forEach(cell => {
        if (cell) {
          // Extract the original card data
          allUsedCards.push({
            id: cell.id,
            value: cell.value,
            color: cell.color,
            scoring: cell.scoring,
            special: cell.special
          })
        }
      })
      player.grid = Array(9).fill(null) // Clear grid
    })
    
    // Add used cards back to deck and reshuffle
    game.deck = shuffleDeck([...game.deck, ...allUsedCards])
    
    // The player who picked last becomes first player
    game.currentPlayer = game.draftState.pickOrder[(game.draftState.currentPickIndex - 1) % 2]
    
    // Initialize new draft phase
    game.draftState = initializeDraftPhase(game.deck, game.currentRound)
    
    io.to(gameId).emit('round-complete', {
      roundNumber: game.currentRound - 1,
      roundScores,
      nextRound: game.currentRound,
      draftState: game.draftState,
      currentPlayer: game.currentPlayer
    })
  }
}

function calculatePlayerScore(grid, roundNumber) {
  let score = 0
  
  // 1. Validated card numbers
  grid.forEach(cell => {
    if (cell && cell.faceUp && cell.validated) {
      score += cell.value
    }
  })
  
  // 2. Symbol points (simplified - using scoring field from card data)
  grid.forEach(cell => {
    if (cell && cell.faceUp) {
      score += cell.scoring || 0
    }
  })
  
  // 3. Color zone bonus (simplified for now - would need more complex logic)
  const colorZoneBonus = calculateColorZoneBonus(grid, roundNumber)
  score += colorZoneBonus
  
  return Math.max(0, score) // Don't allow negative scores
}

function calculateColorZoneBonus(grid, roundNumber) {
  // Simplified color zone calculation
  // In a real implementation, this would use flood-fill to find connected color groups
  const multiplier = roundNumber + 1 // Round 1: 2x, Round 2: 3x, Round 3: 4x
  return 0 // Placeholder - would need complex adjacency checking
}

function checkRoundEndCondition(game) {
  // Check if any player has filled all 9 spaces
  return game.players.some(player => 
    player.grid.every(cell => cell !== null)
  )
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', games: games.size, players: players.size })
})

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})