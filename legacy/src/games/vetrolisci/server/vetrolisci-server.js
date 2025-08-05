import { createGameDeck, dealTurnCards, getCardById } from '../shared/cards.js'
import { initializeDraftPhase, getCurrentPickingPlayer, pickCard, DraftPhase } from '../shared/draft.js'
import { executeCardPlacement, determinePlacementScenario, PlacementScenario, canPickCard } from '../shared/placement.js'
import { validateCards } from '../shared/validation.js'
import { calculatePlayerScore } from '../shared/scoring.js'

export class VetrolisciServer {
  constructor() {
    this.games = new Map()
  }

  createGame(roomCode, players) {
    console.log(`🎮 Creating Vetrolisci game for room ${roomCode}`)
    
    const deck = createGameDeck()
    const game = {
      id: roomCode,
      gameType: 'vetrolisci',
      players: players.map((player, index) => ({
        id: player.id,
        name: player.name,
        index,
        grid: Array(9).fill(null), // 3x3 grid
        scores: [0, 0, 0] // Scores for 3 rounds
      })),
      currentRound: 1,
      phase: 'draft', // 'draft', 'placement', 'scoring', 'finished'
      deck,
      draftState: null,
      turn: 0,
      status: 'playing',
      createdAt: Date.now()
    }

    // Initialize first turn draft
    this.startNewTurn(game)
    
    this.games.set(roomCode, game)
    console.log(`🎮 Vetrolisci game created for room ${roomCode}, Round ${game.currentRound}`)
    
    return game
  }

  startNewTurn(game) {
    console.log(`🎯 Starting new turn for round ${game.currentRound}, turn ${game.turn + 1}`)
    
    try {
      // Deal 4 cards for this turn
      const { turnCards, remainingDeck } = dealTurnCards(game.deck)
      game.deck = remainingDeck
      
      // Initialize draft phase with these 4 cards
      game.draftState = initializeDraftPhase([...turnCards], game.currentRound)
      game.phase = 'draft'
      
      console.log(`🎯 Turn started: ${turnCards.length} cards revealed for draft`)
      console.log(`🎯 Pick order: ${game.draftState.pickOrder.join(' → ')}`)
      
    } catch (error) {
      console.error(`❌ Error starting turn: ${error.message}`)
      throw error
    }
  }

  handleCardPick(roomCode, playerId, cardId, placementChoice = null) {
    const game = this.games.get(roomCode)
    if (!game) {
      throw new Error('Game not found')
    }

    console.log(`🎯 Card pick: Player ${playerId} picks card ${cardId}`)

    // Find player index
    const playerIndex = game.players.findIndex(p => p.id === playerId)
    if (playerIndex === -1) {
      throw new Error('Player not found')
    }

    try {
      // First, check placement scenario BEFORE advancing draft state
      const tempResult = pickCard(game.draftState, playerIndex, cardId)
      const selectedCard = tempResult.selectedCard
      
      // Check if player can pick this card based on validation rules
      const currentPlayer = game.players[playerIndex]
      const pickResult = canPickCard(selectedCard, currentPlayer.grid, game.draftState.revealedCards)
      
      if (!pickResult.canPick) {
        throw new Error(`Cannot pick this card: ${pickResult.reason}`)
      }
      
      // Determine placement scenario
      let scenario = determinePlacementScenario(selectedCard, currentPlayer.grid)
      console.log(`🎯 Placement scenario for card ${selectedCard.value}: ${scenario}`)
      
      // Special handling for cards that can only be picked because all cards are validated
      if (pickResult.reason === 'all_cards_validated') {
        // Force ALREADY_VALIDATED scenario even if it would normally be DUPLICATE_NUMBER
        if (scenario === PlacementScenario.DUPLICATE_NUMBER) {
          console.log(`🎯 Overriding DUPLICATE_NUMBER to ALREADY_VALIDATED due to validation rule`)
          scenario = PlacementScenario.ALREADY_VALIDATED
        }
      }
      
      // If choice is needed, don't advance draft state yet
      if ((scenario === PlacementScenario.DUPLICATE_NUMBER && !placementChoice) ||
          (scenario === PlacementScenario.ALREADY_VALIDATED && (!placementChoice || placementChoice.position === undefined))) {
        console.log(`🎯 Player needs to make choice - NOT advancing draft state yet`)
        return {
          success: true,
          needsChoice: true,
          choiceType: scenario,
          selectedCard
        }
      }
      
      // Only advance draft state when we can complete the placement
      game.draftState = tempResult.draftState
      const pickingPlayer = tempResult.pickingPlayer
      
      console.log(`🎯 Card picked successfully: ${selectedCard.value} of ${selectedCard.color}`)
      console.log(`🎯 Current grid:`, game.players[playerIndex].grid.map((card, i) => 
        card ? `${i+1}:${card.value}(${card.faceUp ? 'up' : 'down'}${card.validated ? ',val' : ''})` : `${i+1}:empty`
      ))

      let placementResult = null
      let needsChoice = false

      switch (scenario) {
        case PlacementScenario.EMPTY_OR_FACE_DOWN:
          // Auto-place on target position
          const targetPos = selectedCard.value - 1
          placementResult = executeCardPlacement(
            selectedCard, 
            targetPos, 
            game.players[playerIndex].grid
          )
          game.players[playerIndex].grid = placementResult.grid
          console.log(`🎯 Placed card ${selectedCard.value} at position ${targetPos + 1}`)
          break

        case PlacementScenario.DUPLICATE_NUMBER:
          if (!placementChoice) {
            needsChoice = true
            console.log(`🎯 Player needs to choose which card to keep face-up`)
          } else {
            const targetPos = selectedCard.value - 1
            console.log(`🎯 Player chose: ${placementChoice}`)
            placementResult = executeCardPlacement(
              selectedCard, 
              targetPos, 
              game.players[playerIndex].grid,
              placementChoice === 'keep-new' ? 'new' : 'existing'
            )
            game.players[playerIndex].grid = placementResult.grid
          }
          break

        case PlacementScenario.ALREADY_VALIDATED:
          if (!placementChoice || placementChoice.position === undefined) {
            needsChoice = true
            console.log(`🎯 Player needs to choose empty position for face-down card`)
          } else {
            placementResult = executeCardPlacement(
              selectedCard, 
              placementChoice.position, 
              game.players[playerIndex].grid
            )
            game.players[playerIndex].grid = placementResult.grid
          }
          break
      }

      // If placement successful, validate cards
      if (placementResult) {
        const validationResult = validateCards(game.players[playerIndex].grid)
        game.players[playerIndex].grid = validationResult.grid
        console.log(`🎯 Cards validated: ${validationResult.validatedCount}`)
        console.log(`🎯 Grid after validation:`, game.players[playerIndex].grid.map((card, i) => 
          card ? `${i+1}:${card.value}(${card.faceUp ? 'up' : 'down'}${card.validated ? ',val' : ''})` : `${i+1}:empty`
        ))
      }

      // Check if draft phase is complete
      if (game.draftState.phase === DraftPhase.COMPLETE) {
        console.log(`🎯 Turn complete - all 4 cards picked`)
        this.checkTurnEnd(game)
      }

      return {
        success: true,
        game,
        cardPlaced: !needsChoice,
        needsChoice,
        choiceType: needsChoice ? scenario : null,
        selectedCard,
        placementResult
      }

    } catch (error) {
      console.error(`❌ Error picking card: ${error.message}`)
      throw error
    }
  }

  handlePlacementChoice(roomCode, playerId, cardId, choice) {
    console.log(`🎯 Placement choice: Player ${playerId} for card ${cardId}:`, choice)
    
    const game = this.games.get(roomCode)
    if (!game) {
      throw new Error('Game not found')
    }

    // Find player index
    const playerIndex = game.players.findIndex(p => p.id === playerId)
    if (playerIndex === -1) {
      throw new Error('Player not found')
    }

    // Re-run the card pick with the placement choice (this time it will complete)
    return this.handleCardPick(roomCode, playerId, cardId, choice)
  }

  checkTurnEnd(game) {
    console.log(`🎯 Checking turn end conditions...`)
    
    // Increment turn counter
    game.turn++
    
    // Check if round should end (after multiple turns)
    // For now, let's do 3 turns per round
    if (game.turn >= 3) {
      this.endRound(game)
    } else {
      // Start next turn
      this.startNewTurn(game)
    }
  }

  endRound(game) {
    console.log(`🎯 Ending round ${game.currentRound}`)
    
    game.phase = 'scoring'
    
    // Calculate scores for both players
    const roundScores = game.players.map((player, index) => {
      const scoreResult = calculatePlayerScore(player.grid, game.currentRound - 1) // 0-based round
      const roundScore = scoreResult.total
      
      // Store the score for this round
      player.scores[game.currentRound - 1] = roundScore
      
      console.log(`🎯 Player ${index} (${player.name}) scored ${roundScore} points`)
      
      return {
        playerIndex: index,
        playerName: player.name,
        score: roundScore,
        breakdown: scoreResult
      }
    })

    // Check if game is complete (3 rounds)
    if (game.currentRound >= 3) {
      this.endGame(game, roundScores)
    } else {
      // Prepare next round
      game.currentRound++
      game.turn = 0
      game.phase = 'draft'
      
      // Clear grids for new round
      game.players.forEach(player => {
        player.grid = Array(9).fill(null)
      })
      
      console.log(`🎯 Round ${game.currentRound - 1} complete. Starting round ${game.currentRound}`)
      
      // Start first turn of new round
      this.startNewTurn(game)
    }

    return { roundScores, gameComplete: game.currentRound > 3 }
  }

  endGame(game, finalRoundScores) {
    console.log(`🎯 Game complete! Calculating final scores...`)
    
    game.phase = 'finished'
    game.status = 'finished'
    
    // Calculate total scores
    const finalScores = game.players.map((player, index) => {
      const totalScore = player.scores.reduce((sum, score) => sum + score, 0)
      
      return {
        playerIndex: index,
        playerName: player.name,
        roundScores: player.scores,
        totalScore,
        winner: false // Will be set below
      }
    })

    // Determine winner
    const maxScore = Math.max(...finalScores.map(p => p.totalScore))
    finalScores.forEach(player => {
      if (player.totalScore === maxScore) {
        player.winner = true
      }
    })

    const winner = finalScores.find(p => p.winner)
    console.log(`🏆 Winner: ${winner.playerName} with ${winner.totalScore} points!`)

    return { finalScores, winner }
  }

  getGame(roomCode) {
    return this.games.get(roomCode)
  }

  removeGame(roomCode) {
    const removed = this.games.delete(roomCode)
    if (removed) {
      console.log(`🗑️ Removed Vetrolisci game: ${roomCode}`)
    }
    return removed
  }

  getCurrentPickingPlayer(roomCode) {
    const game = this.games.get(roomCode)
    if (!game || !game.draftState) return null
    
    const playerIndex = getCurrentPickingPlayer(game.draftState)
    return playerIndex !== null ? game.players[playerIndex] : null
  }

  getGameState(roomCode) {
    const game = this.games.get(roomCode)
    if (!game) return null

    return {
      id: game.id,
      gameType: game.gameType,
      players: game.players,
      currentRound: game.currentRound,
      phase: game.phase,
      turn: game.turn,
      draftState: game.draftState,
      currentPickingPlayer: this.getCurrentPickingPlayer(roomCode),
      status: game.status
    }
  }
}

// Export singleton instance
export default new VetrolisciServer()