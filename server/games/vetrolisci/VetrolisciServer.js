import BaseGameServer from '../base/BaseGameServer.js';
import { CARDS, shuffleDeck, dealRoundCards, dealTurnCards, createGameDeck } from '../../../client/games/vetrolisci/cards.js';
import { canPickCard } from '../../../client/games/vetrolisci/placement.js';

// Simplified server-side Vetrolisci game implementation based on working legacy version
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

    // Initialize first turn of the round
    game.draftState = this.initializeTurnPhase(game.deck, 0, 1);
  }

  // Simplified turn initialization based on legacy
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
      turnNumber: currentTurnNumber,
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
      default:
        throw new Error(`Unknown move type: ${moveData.type}`);
    }
  }

  processCardPick(game, playerIndex, moveData) {
    const { cardId, choice, position } = moveData;

    console.log(`🎯 SERVER CARD PICK START: Player ${playerIndex} picks card ${cardId}`);
    console.log(`🎯 SERVER DRAFT STATE:`, {
      revealedCards: game.draftState.revealedCards.map(c => c.id),
      currentPickIndex: game.draftState.currentPickIndex,
      pickOrder: game.draftState.pickOrder,
      completedPicks: game.draftState.completedPicks
    });

    // Validate turn - simplified logic
    const currentPickingPlayer = game.draftState.pickOrder[game.draftState.currentPickIndex];
    if (currentPickingPlayer !== playerIndex) {
      console.log(`🎯 SERVER ERROR: Wrong turn! Expected ${currentPickingPlayer}, got ${playerIndex}`);
      throw new Error("Not your turn to pick");
    }

    // Find the card to pick
    const cardToPick = game.draftState.revealedCards.find((card) => String(card.id) === String(cardId));
    if (!cardToPick) {
      throw new Error("Card not found in revealed cards");
    }

    // Check if player can pick this card
    const player = game.players[playerIndex];
    const pickResult = canPickCard(cardToPick, player.grid, game.draftState.revealedCards);

    if (!pickResult.canPick) {
      throw new Error(`Cannot pick this card: ${pickResult.reason}`);
    }

    // Execute the pick using simplified legacy logic
    const result = this.pickCard(game.draftState, playerIndex, cardId);
    const pickedCard = result.selectedCard;
    game.draftState = result.draftState;

    // Immediately place the picked card using legacy logic
    const scenario = this.determinePlacementScenario(pickedCard, player.grid);
    let gridIndex = pickedCard.value - 1; // Default placement

    // Handle placement based on scenario
    let finalChoice = choice;
    if (scenario === "duplicate" && !choice) {
      finalChoice = "keep-existing"; // Default fallback
    }

    const placementResult = this.executeCardPlacement(pickedCard, gridIndex, player.grid, finalChoice);
    player.grid = placementResult.grid;

    // Set validated property on the placed card
    const wasValidated = placementResult.validated.includes(gridIndex) || 
                        (scenario === "duplicate" && placementResult.validated.length > 0);
    const placedCardWithValidation = { ...pickedCard, validated: wasValidated };

    console.log(`🎯 SERVER AFTER PICK:`, {
      revealedCardsLeft: game.draftState.revealedCards.length,
      currentPickIndex: game.draftState.currentPickIndex,
      completedPicks: game.draftState.completedPicks
    });

    // Check if all cards in this turn are picked (legacy logic)
    if (game.draftState.revealedCards.length === 0) {
      console.log(`🎯 SERVER: Turn complete! All cards picked`);
      // Turn complete - the last picker becomes first player for next turn
      const lastPicker = game.draftState.pickOrder[game.draftState.currentPickIndex - 1];
      game.currentPlayer = lastPicker;

      // Check if there are enough cards for a new turn
      if (game.draftState.remainingDeck.length >= 4) {
        // Start new turn using remaining deck
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

  // Simplified pickCard based on legacy - this is the key fix!
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

    // Create new state - THIS IS THE KEY LOGIC FROM LEGACY
    const newDraftState = {
      ...draftState,
      revealedCards: draftState.revealedCards.filter((card) => String(card.id) !== String(cardId)),
      playerHands: draftState.playerHands.map((hand, index) => 
        index === playerIndex ? [...hand, selectedCard] : hand
      ),
      currentPickIndex: draftState.currentPickIndex + 1,
      completedPicks: draftState.completedPicks + 1,
    };

    // Check if draft phase is complete
    if (newDraftState.completedPicks >= 4) {
      newDraftState.phase = "complete";
    }

    return {
      draftState: newDraftState,
      selectedCard,
    };
  }

  // Simplified placement logic
  executeCardPlacement(card, gridIndex, grid, choice) {
    const result = { grid: [...grid], validated: [], scenario: "standard" };
    
    // Basic placement logic - can be expanded later
    if (result.grid[gridIndex] === null) {
      result.grid[gridIndex] = { ...card, faceUp: true, validated: false };
    } else if (!result.grid[gridIndex].faceUp) {
      result.grid[gridIndex] = { ...card, faceUp: true, validated: true };
      result.validated.push(gridIndex);
    }

    return result;
  }

  determinePlacementScenario(card, grid) {
    const cardValue = card.value;
    const existingCard = grid[cardValue - 1];
    
    if (!existingCard) {
      return "empty";
    } else if (existingCard.faceUp && existingCard.value === cardValue) {
      return existingCard.validated ? "validated" : "duplicate";
    } else {
      return "face_down";
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
    return true;
  }

  handlePlayerDisconnect(gameId, playerId) {
    const game = this.activeGames.get(gameId);
    if (game) {
      game.gameState = "abandoned";
    }
  }
}

export default VetrolisciServer;