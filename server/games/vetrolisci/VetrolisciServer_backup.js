import BaseGameServer from '../base/BaseGameServer.js';
import { CARDS, shuffleDeck, dealRoundCards, dealTurnCards, createGameDeck } from '../../../client/games/vetrolisci/cards.js';
import { canPickCard } from '../../../client/games/vetrolisci/placement.js';

// Server-side Vetrolisci game implementation
export class VetrolisciServer extends BaseGameServer {
  constructor(config) {
    super(config);
  }

  createGame(gameId, players) {
    const gameInstance = {
      id: gameId,
      players: players.map((player, index) => ({
        id: player.id,
        name: player.name,
        grid: Array(9).fill(null),
        scores: [0, 0, 0],
        index: index
      })),
      currentRound: 1,
      currentPlayer: 0,
      deck: [],
      gameState: "playing",
      draftState: null,
      phase: "draft",
      playerTurnCounts: [0, 0]
    };

    this.initializeGame(gameInstance);
    this.activeGames.set(gameId, gameInstance);
    return gameInstance;
  }

  initializeGame(game) {
    // Initialize deck with proper 70-card deck
    game.deck = createGameDeck();

    // Initialize draft phase
    game.draftState = this.initializeDraftPhase(game.deck, game.currentRound);

    // Reset player grids
    game.players.forEach((player) => {
      player.grid = Array(9).fill(null);
    });
  }

  initializeDraftPhase(deck, roundNumber) {
    const { roundCards, remainingDeck } = dealRoundCards(deck, roundNumber);

    // Determine pick order based on round
    const pickOrder = roundNumber % 2 === 1 ? [0, 1, 0, 1] : [1, 0, 1, 0];

    return {
      phase: "pick",
      revealedCards: roundCards,
      playerHands: [[], []],
      pickOrder,
      currentPickIndex: 0,
      remainingDeck,
      completedPicks: 0,
      turnNumber: 1,
    };
  }

  processMove(gameId, playerId, moveData) {
    const game = this.activeGames.get(gameId);
    if (!game) {
      throw new Error(`Game not found: ${gameId}`);
    }

    const playerIndex = game.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      throw new Error(`Player not found in game: ${playerId}`);
    }

    switch (moveData.type) {
      case 'pick-card':
        return this.processCardPick(game, playerIndex, moveData);
      case 'card-choice':
        return this.processCardChoice(game, playerIndex, moveData);
      // Note: place-card removed - cards placed immediately during pick-card
      default:
        throw new Error(`Unknown move type: ${moveData.type}`);
    }
  }

  processCardPick(game, playerIndex, moveData) {
    // Validate input structure
    if (!moveData || typeof moveData !== 'object') {
      throw new Error('Invalid move data');
    }
    
    const { cardId, choice, position } = moveData;
    
    // Validate cardId (convert to string if it's a number)
    let validCardId = cardId;
    if (typeof cardId === 'number') {
      validCardId = cardId.toString();
    }
    
    if (!validCardId || typeof validCardId !== 'string') {
      throw new Error('Invalid card ID');
    }
    
    // Use the validated cardId for the rest of the function
    const cardIdToUse = validCardId;
    
    // Validate choice
    if (!choice || !['place', 'discard'].includes(choice)) {
      throw new Error('Invalid choice - must be "place" or "discard"');
    }
    
    // Validate position if provided
    if (position && typeof position === 'object') {
      const { row, col } = position;
      if (!Number.isInteger(row) || !Number.isInteger(col) || 
          row < 0 || row >= 3 || col < 0 || col >= 3) {
        throw new Error('Invalid position - must be within 3x3 grid');
      }
    }

    // Validate turn
    const currentPickingPlayer = game.draftState.pickOrder[game.draftState.currentPickIndex];
    if (currentPickingPlayer !== playerIndex) {
      throw new Error("Not your turn to pick");
    }
    
    // Validate player exists
    const player = game.players[playerIndex];
    if (!player) {
      throw new Error('Invalid player index');
    }
    
    // Note: Position validation is handled in executeCardPlacement based on scenario
    // Don't validate position occupancy here as duplicate scenarios allow overwriting

    // Find and pick the card
    const cardToPick = game.draftState.revealedCards.find((card) => String(card.id) === cardIdToUse);
    if (!cardToPick) {
      throw new Error("Card not found in revealed cards");
    }

    // Check if player can pick this card
    const pickResult = canPickCard(cardToPick, player.grid, game.draftState.revealedCards);

    if (!pickResult.canPick) {
      throw new Error(`Cannot pick this card: ${pickResult.reason}`);
    }

    // Execute the pick
    const result = this.pickCard(game.draftState, playerIndex, cardIdToUse);
    const pickedCard = result.selectedCard;
    game.draftState = result.draftState;

    // Check placement scenario before placing
    const scenario = this.determinePlacementScenario(pickedCard, player.grid);
    
    // For already_validated scenario placing, position is required
    if (scenario === "already_validated" && choice === 'place' && (!position || typeof position !== 'object')) {
      throw new Error('Position required when placing card with already validated value');
    }
    
    // For duplicate scenarios, we need a choice from the client
    if (scenario === "duplicate_number" && !choice) {
      // Don't place the card yet - wait for client choice
      // Store the picked card temporarily
      game.pendingCardPlacement = {
        playerIndex,
        card: pickedCard,
        scenario
      };
      
      return {
        type: "card-picked-pending-choice",
        gameState: this.getGameState(game.id),
        pickedCard,
        scenario,
        needsChoice: true
      };
    }

    // Convert position object to grid index if provided
    let gridIndex = undefined;
    if (position && typeof position === 'object' && 'row' in position && 'col' in position) {
      gridIndex = position.row * 3 + position.col;
    }

    // Place the card immediately for non-duplicate scenarios or when choice is provided
    const placementResult = this.executeCardPlacement(pickedCard, player.grid, choice, gridIndex);
    player.grid = placementResult.grid;

    // Set validated property on the placed card
    const wasValidated = placementResult.validated.includes(placementResult.gridIndex) || 
                        (placementResult.scenario === "duplicate" && placementResult.validated.length > 0);
    const placedCardWithValidation = { ...pickedCard, validated: wasValidated };

    // Check for round end
    const roundShouldEnd = this.checkRoundEndCondition(game);
    
    if (roundShouldEnd) {
      // End round
      return this.endRound(game);
    }

    // Check if turn is complete
    console.log("🎯 SERVER TURN CHECK:", {
      revealedCardsLength: game.draftState.revealedCards.length,
      currentPickIndex: game.draftState.currentPickIndex,
      pickOrderLength: game.draftState.pickOrder.length,
      phase: game.draftState.phase,
      completedPicks: game.draftState.completedPicks
    });
    
    if (game.draftState.revealedCards.length === 0) {
      console.log("🎯 SERVER: Turn complete, starting new turn");
      const lastPicker = game.draftState.pickOrder[game.draftState.currentPickIndex - 1];
      game.currentPlayer = lastPicker;

      // Check if there are enough cards for a new turn (4 cards needed)
      if (game.draftState.remainingDeck.length < 4) {
        // Not enough cards for a new turn, end the round
        console.log("🎯 SERVER: Not enough cards, ending round");
        return this.endRound(game);
      }

      game.draftState = this.initializeTurnPhase(game.draftState.remainingDeck, lastPicker, game.draftState.turnNumber);
      game.deck = game.draftState.remainingDeck;
      
      // Track turn completion
      game.playerTurnCounts[0]++;
      game.playerTurnCounts[1]++;

      return {
        event: "new-turn",
        broadcast: true,
        data: {
          currentPlayer: game.currentPlayer,
          draftState: game.draftState,
        }
      };
    }

    return {
      event: "card-picked-and-placed",
      broadcast: true,
      data: {
        playerIndex,
        cardId: cardIdToUse,
        placedCard: placedCardWithValidation,
        newGrid: player.grid,
        draftState: game.draftState,
        placementResult,
      }
    };
  }

  processCardChoice(game, playerIndex, moveData) {
    if (!game.pendingCardPlacement) {
      throw new Error('No pending card placement found');
    }

    if (game.pendingCardPlacement.playerIndex !== playerIndex) {
      throw new Error('Not your pending card placement');
    }

    const { card, scenario } = game.pendingCardPlacement;
    const { choice, position } = moveData;
    const player = game.players[playerIndex];

    // Convert position object to grid index if provided
    let gridIndex = undefined;
    if (position && typeof position === 'object' && 'row' in position && 'col' in position) {
      gridIndex = position.row * 3 + position.col;
    }

    // Execute the placement with the choice
    const placementResult = this.executeCardPlacement(card, player.grid, choice, gridIndex);
    player.grid = placementResult.grid;

    // Clear pending placement
    delete game.pendingCardPlacement;

    // Set validated property on the placed card
    const wasValidated = placementResult.validated.includes(placementResult.gridIndex) || 
                        (placementResult.scenario === "duplicate" && placementResult.validated.length > 0);
    const placedCardWithValidation = { ...card, validated: wasValidated };

    // Check for round end
    const roundShouldEnd = this.checkRoundEndCondition(game);
    
    if (roundShouldEnd) {
      return this.endRound(game);
    }

    // Check if turn is complete
    if (game.draftState.revealedCards.length === 0) {
      const lastPicker = game.draftState.pickOrder[game.draftState.currentPickIndex - 1];
      game.currentPlayer = lastPicker;

      // Check if there are enough cards for a new turn (4 cards needed)
      if (game.draftState.remainingDeck.length < 4) {
        return this.endRound(game);
      }

      game.draftState = this.initializeTurnPhase(game.draftState.remainingDeck, lastPicker, game.draftState.turnNumber);
      game.deck = game.draftState.remainingDeck;
      
      // Track turn completion
      game.playerTurnCounts[0]++;
      game.playerTurnCounts[1]++;

      return {
        event: "new-turn",
        broadcast: true,
        data: {
          currentPlayer: game.currentPlayer,
          draftState: game.draftState,
        }
      };
    }

    return {
      event: "card-choice-processed",
      broadcast: true,
      data: {
        playerIndex,
        placedCard: placedCardWithValidation,
        newGrid: player.grid,
        draftState: game.draftState,
        placementResult,
      }
    };
  }

  // Note: processCardPlacement removed - cards placed immediately during pick
  // No separate placement phase exists in real Vetrolisci game

  pickCard(draftState, playerIndex, cardId) {
    const currentPlayer = draftState.pickOrder[draftState.currentPickIndex];
    if (currentPlayer !== playerIndex) {
      throw new Error("It is not this player's turn to pick");
    }

    const cardIndex = draftState.revealedCards.findIndex((card) => String(card.id) === String(cardId));
    if (cardIndex === -1) {
      throw new Error("Card not found in revealed cards");
    }

    const selectedCard = draftState.revealedCards[cardIndex];

    const newDraftState = {
      ...draftState,
      revealedCards: draftState.revealedCards.filter((card) => String(card.id) !== String(cardId)),
      playerHands: draftState.playerHands.map((hand, index) => 
        index === playerIndex ? [...hand, selectedCard] : hand
      ),
      currentPickIndex: draftState.currentPickIndex + 1,
      completedPicks: draftState.completedPicks + 1,
    };

    if (newDraftState.completedPicks >= 4) {
      newDraftState.phase = "complete";
    }

    return {
      draftState: newDraftState,
      selectedCard,
      pickingPlayer: playerIndex,
    };
  }

  executeCardPlacement(card, grid, choice, position) {
    const scenario = this.determinePlacementScenario(card, grid);
    const result = { grid: [...grid], validated: [], scenario };
    let gridIndex = card.value - 1; // Default placement

    switch (scenario) {
      case "empty_or_face_down":
        const targetIndex = card.value - 1;
        if (result.grid[targetIndex] === null) {
          result.grid[targetIndex] = { ...card, faceUp: true, validated: false };
          gridIndex = targetIndex;
        } else if (!result.grid[targetIndex].faceUp) {
          result.grid[targetIndex] = { ...card, faceUp: true, validated: true };
          result.validated.push(targetIndex);
          gridIndex = targetIndex;
        }
        break;

      case "duplicate_number":
        const existingIndex = card.value - 1;
        const existingCard = result.grid[existingIndex];

        if (choice === "keep-new") {
          result.grid[existingIndex] = {
            ...card,
            faceUp: true,
            validated: true,
            stackedCard: { ...existingCard, faceUp: false },
          };
        } else {
          result.grid[existingIndex] = {
            ...existingCard,
            validated: true,
            stackedCard: { ...card, faceUp: false },
          };
        }
        result.validated.push(existingIndex);
        gridIndex = existingIndex;
        break;

      case "already_validated":
        if (position !== undefined && position !== null) {
          gridIndex = position;
        } else {
          gridIndex = result.grid.findIndex((cell) => cell === null);
        }
        
        if (gridIndex === -1 || result.grid[gridIndex] !== null) {
          throw new Error("Cannot place card - no valid position");
        }
        
        result.grid[gridIndex] = { ...card, faceUp: false, validated: false };
        break;

      default:
        throw new Error("Invalid placement scenario");
    }

    result.gridIndex = gridIndex;
    return result;
  }

  determinePlacementScenario(card, grid) {
    const cardValue = card.value;
    
    const existingFaceUpCard = grid.find(gridCard => 
      gridCard && gridCard.faceUp && gridCard.value === cardValue
    );
    
    const isValidated = grid.some(gridCard => 
      gridCard && gridCard.faceUp && gridCard.value === cardValue && gridCard.validated
    );
    
    if (isValidated) {
      return "already_validated";
    } else if (existingFaceUpCard) {
      return "duplicate_number";
    } else {
      return "empty_or_face_down";
    }
  }

  initializeTurnPhase(remainingDeck, lastPicker, currentTurnNumber = 1) {
    const { turnCards, remainingDeck: newRemainingDeck } = dealTurnCards(remainingDeck);
    const pickOrder = lastPicker === 0 ? [0, 1, 0, 1] : [1, 0, 1, 0];

    return {
      phase: "pick",
      revealedCards: turnCards,
      playerHands: [[], []],
      pickOrder,
      currentPickIndex: 0,
      remainingDeck: newRemainingDeck,
      completedPicks: 0,
      turnNumber: currentTurnNumber + 1,
    };
  }

  checkRoundEndCondition(game) {
    // Check if any player has filled all 9 spaces
    const anyPlayerFilled = game.players.some((player) => 
      player.grid.every((cell) => cell !== null)
    );
    
    if (!anyPlayerFilled) {
      return false;
    }
    
    // Check if both players have had equal turns
    const player0Turns = game.playerTurnCounts[0];
    const player1Turns = game.playerTurnCounts[1];
    
    return player0Turns === player1Turns;
  }

  async endRound(game) {
    console.log(`Round ${game.currentRound} ended for game ${game.id}`);

    // Calculate scores (simplified - would use actual scoring logic)
    const roundScores = game.players.map((player, index) => ({
      playerIndex: index,
      playerName: player.name,
      score: { total: 10 }, // Placeholder score
      totalScore: player.scores.reduce((a, b) => a + b, 0) + 10
    }));

    // Check if game is complete
    if (game.currentRound >= 3) {
      const winner = roundScores.reduce((prev, current) => 
        current.totalScore > prev.totalScore ? current : prev
      );

      game.gameState = "finished";
      return {
        event: "game-complete",
        broadcast: true,
        gameEnded: true,
        data: {
          finalScores: roundScores,
          winner: winner.playerIndex,
          playerScores: game.players.map((p) => p.scores),
        }
      };
    } else {
      // Start next round
      game.currentRound++;
      game.phase = "draft";

      // Reset grids and deck
      game.players.forEach((player) => {
        player.grid = Array(9).fill(null);
      });

      game.deck = shuffleDeck(createGameDeck());
      game.draftState = this.initializeDraftPhase(game.deck, game.currentRound);
      game.playerTurnCounts = [0, 0];

      return {
        event: "round-complete",
        broadcast: true,
        data: {
          roundNumber: game.currentRound - 1,
          roundScores,
          nextRound: game.currentRound,
          draftState: game.draftState,
          currentPlayer: game.currentPlayer,
        }
      };
    }
  }

  getGameState(gameId) {
    const game = this.activeGames.get(gameId);
    if (!game) {
      throw new Error(`Game not found: ${gameId}`);
    }

    return {
      gameState: game,
      draftState: game.draftState
    };
  }

  handlePlayerJoin(gameId, player) {
    // Handle player joining - already handled in main server
    return true;
  }

  handlePlayerDisconnect(gameId, playerId) {
    const game = this.activeGames.get(gameId);
    if (game) {
      game.gameState = "abandoned";
      // Clean up will be handled by main server
    }
  }
}

export default VetrolisciServer;