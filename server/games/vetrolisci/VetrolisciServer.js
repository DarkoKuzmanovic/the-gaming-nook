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
      case 'place-card':
        return this.processCardPlacement(game, playerIndex, moveData);
      default:
        throw new Error(`Unknown move type: ${moveData.type}`);
    }
  }

  processCardPick(game, playerIndex, moveData) {
    const { cardId, choice, position } = moveData;

    // Validate turn
    const currentPickingPlayer = game.draftState.pickOrder[game.draftState.currentPickIndex];
    if (currentPickingPlayer !== playerIndex) {
      throw new Error("Not your turn to pick");
    }

    // Find and pick the card
    const cardToPick = game.draftState.revealedCards.find((card) => card.id === cardId);
    if (!cardToPick) {
      throw new Error("Card not found in revealed cards");
    }

    // Check if player can pick this card
    const player = game.players[playerIndex];
    const pickResult = canPickCard(cardToPick, player.grid, game.draftState.revealedCards);

    if (!pickResult.canPick) {
      throw new Error(`Cannot pick this card: ${pickResult.reason}`);
    }

    // Execute the pick
    const result = this.pickCard(game.draftState, playerIndex, cardId);
    const pickedCard = result.selectedCard;
    game.draftState = result.draftState;

    // Place the card immediately
    const placementResult = this.executeCardPlacement(pickedCard, player.grid, choice, position);
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
    if (game.draftState.revealedCards.length === 0) {
      const lastPicker = game.draftState.pickOrder[game.draftState.currentPickIndex - 1];
      game.currentPlayer = lastPicker;

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
        cardId,
        placedCard: placedCardWithValidation,
        newGrid: player.grid,
        draftState: game.draftState,
        placementResult,
      }
    };
  }

  processCardPlacement(game, playerIndex, moveData) {
    // Implementation for separate card placement phase
    // This would be used if we separate picking and placing phases
    return {
      event: "card-placed",
      broadcast: true,
      data: {}
    };
  }

  pickCard(draftState, playerIndex, cardId) {
    const currentPlayer = draftState.pickOrder[draftState.currentPickIndex];
    if (currentPlayer !== playerIndex) {
      throw new Error("It is not this player's turn to pick");
    }

    const cardIndex = draftState.revealedCards.findIndex((card) => card.id === cardId);
    if (cardIndex === -1) {
      throw new Error("Card not found in revealed cards");
    }

    const selectedCard = draftState.revealedCards[cardIndex];

    const newDraftState = {
      ...draftState,
      revealedCards: draftState.revealedCards.filter((card) => card.id !== cardId),
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
      case "empty":
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

      case "duplicate":
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

      case "validated":
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
      return "validated";
    } else if (existingFaceUpCard) {
      return "duplicate";
    } else {
      return "empty";
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