import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { CARDS, shuffleDeck, dealRoundCards, dealTurnCards, createGameDeck } from './src/data/cards.js';
import { canPickCard } from './src/game/placement.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: true, // Allow all origins for network access
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const PORT = process.env.PORT || 8001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "dist")));

// Game state storage
const games = new Map();
const players = new Map();

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-game", (playerName) => {
    players.set(socket.id, { name: playerName, socket: socket });

    // Simple matchmaking - find existing game or create new one
    let gameId = null;
    for (const [id, game] of games.entries()) {
      if (game.players.length < 2) {
        gameId = id;
        break;
      }
    }

    if (!gameId) {
      gameId = generateGameId();
      games.set(gameId, {
        id: gameId,
        players: [],
        currentRound: 1,
        currentPlayer: 0,
        deck: [],
        gameState: "waiting",
        draftState: null,
        phase: "draft",
      });
    }

    const game = games.get(gameId);
    game.players.push({
      id: socket.id,
      name: playerName,
      grid: Array(9).fill(null),
      scores: [0, 0, 0],
    });

    socket.join(gameId);
    socket.emit("game-joined", { gameId, playerIndex: game.players.length - 1 });
    console.log(`Player ${playerName} joined game ${gameId}. Players: ${game.players.length}/2`);

    if (game.players.length === 2) {
      game.gameState = "playing";
      initializeGame(game);
      console.log(
        `Game ${gameId} starting with players:`,
        game.players.map((p) => p.name)
      );
      io.to(gameId).emit("game-started", game);
    }
  });

  // Draft phase handlers - start-draft removed as cards are now automatically revealed

  socket.on("pick-card", async ({ gameId, playerIndex, cardId, choice, position }) => {
    const game = games.get(gameId);
    if (!game || !game.draftState) return;

    try {
      // Validate it's the correct player's turn
      const currentPickingPlayer = game.draftState.pickOrder[game.draftState.currentPickIndex];
      if (currentPickingPlayer !== playerIndex) {
        socket.emit("error", { message: "Not your turn to pick" });
        return;
      }

      // Find the card to pick
      const cardToPick = game.draftState.revealedCards.find((card) => card.id === cardId);
      if (!cardToPick) {
        socket.emit("error", { message: "Card not found in revealed cards" });
        return;
      }

      // Check if player can pick this card based on validation rules
      const player = game.players[playerIndex];
      const pickResult = canPickCard(cardToPick, player.grid, game.draftState.revealedCards);

      if (!pickResult.canPick) {
        socket.emit("error", {
          message: "Cannot pick this card - you already have a validated card with this number",
          reason: pickResult.reason,
        });
        return;
      }

      // Execute the pick
      const result = pickCard(game.draftState, playerIndex, cardId);
      const pickedCard = result.selectedCard;
      game.draftState = result.draftState;

      // Immediately place the picked card
      const pickerPlayer = game.players[playerIndex];
      let gridIndex = pickedCard.value - 1; // Default placement

      // Handle different placement scenarios
      const scenario = determineServerPlacementScenario(pickedCard, pickerPlayer.grid);
      if (scenario === "validated") {
        // Use provided position or find first empty space for scenario 3
        if (position !== undefined && position !== null) {
          gridIndex = position;
          // Validate the provided position is empty
          if (pickerPlayer.grid[gridIndex] !== null) {
            socket.emit("error", { message: "Cannot place card on occupied space" });
            return;
          }
        } else {
          // Fallback to first empty space
          gridIndex = pickerPlayer.grid.findIndex((cell) => cell === null);
        }
        if (gridIndex === -1) {
          // Edge case: No empty spaces available - discard the card
          console.log(`Card ${pickedCard.id} discarded - no empty spaces available for face-down placement`);

          // Broadcast the pick without placement (card is discarded)
          io.to(gameId).emit("card-picked-and-discarded", {
            playerIndex,
            cardId,
            discardedCard: pickedCard,
            draftState: game.draftState,
            reason: "no_empty_spaces",
          });

          // Continue with turn completion logic
          if (game.draftState.revealedCards.length === 0) {
            const lastPicker = game.draftState.pickOrder[game.draftState.currentPickIndex - 1];
            game.currentPlayer = lastPicker;

            const roundShouldEnd = checkRoundEndCondition(game);
            if (roundShouldEnd) {
              await endRound(game, gameId, io);
            } else {
              game.draftState = initializeTurnPhase(game.draftState.remainingDeck, lastPicker, game.draftState.turnNumber);
              game.deck = game.draftState.remainingDeck;
              io.to(gameId).emit("new-turn", {
                currentPlayer: game.currentPlayer,
                draftState: game.draftState,
              });
            }
            
            // Track that both players completed this turn
            if (!game.playerTurnCounts) {
              game.playerTurnCounts = [0, 0];
            }
            // Both players get a turn each time we complete a full turn cycle
            game.playerTurnCounts[0]++;
            game.playerTurnCounts[1]++;
          }
          return; // Exit early, card was discarded
        }
      }

      // For duplicate scenarios, default to 'keep-existing' if no choice provided
      let finalChoice = choice;
      if (scenario === "duplicate" && !choice) {
        finalChoice = "keep-existing";
      }

      const placementResult = executeServerCardPlacement(pickedCard, gridIndex, pickerPlayer.grid, finalChoice);
      pickerPlayer.grid = placementResult.grid;

      // Set validated property on the placed card if it was validated
      const wasValidated = placementResult.validated.includes(gridIndex) || 
                          (scenario === "duplicate" && placementResult.validated.length > 0);
      const placedCardWithValidation = { ...pickedCard, validated: wasValidated };

      // Broadcast the pick-and-place to all players
      io.to(gameId).emit("card-picked-and-placed", {
        playerIndex,
        cardId,
        placedCard: placedCardWithValidation,
        newGrid: pickerPlayer.grid,
        draftState: game.draftState,
        placementResult,
      });

      // Check if round should end immediately after placement
      const roundShouldEnd = checkRoundEndCondition(game);
      if (roundShouldEnd) {
        await endRound(game, gameId, io);
        return; // Exit early if round ended
      }

      // Check if all cards in this turn are picked
      if (game.draftState.revealedCards.length === 0) {
        // Turn complete - the last picker becomes first player for next turn
        const lastPicker = game.draftState.pickOrder[game.draftState.currentPickIndex - 1];
        game.currentPlayer = lastPicker;

        // Start new turn using remaining deck
        game.draftState = initializeTurnPhase(game.draftState.remainingDeck, lastPicker, game.draftState.turnNumber);
        // Update the main deck reference
        game.deck = game.draftState.remainingDeck;
        
        // Track that both players completed this turn
        if (!game.playerTurnCounts) {
          game.playerTurnCounts = [0, 0];
        }
        // Both players get a turn each time we complete a full turn cycle
        game.playerTurnCounts[0]++;
        game.playerTurnCounts[1]++;
        
        io.to(gameId).emit("new-turn", {
          currentPlayer: game.currentPlayer,
          draftState: game.draftState,
        });
      }
    } catch (error) {
      console.error("Pick card error:", error);
      socket.emit("error", { message: error.message });
    }
  });

  // Card placement handlers
  socket.on("place-card", async ({ gameId, playerIndex, cardId, gridIndex, choice }) => {
    const game = games.get(gameId);
    if (!game || game.phase !== "place") return;

    try {
      // Validate it's the correct player's turn
      if (game.currentPlayer !== playerIndex) {
        socket.emit("error", { message: "Not your turn to place" });
        return;
      }

      // Find the card in player's hand
      const playerHand = game.draftState?.playerHands[playerIndex] || [];
      const card = playerHand.find((c) => c.id === cardId);
      if (!card) {
        socket.emit("error", { message: "Card not in your hand" });
        return;
      }

      // Execute card placement
      const currentPlayer = game.players[playerIndex];
      const placementResult = executeServerCardPlacement(card, gridIndex, currentPlayer.grid, choice);

      // Update player grid
      currentPlayer.grid = placementResult.grid;

      // Set validated property on the placed card if it was validated
      const wasValidated = placementResult.validated.includes(gridIndex);
      const placedCardWithValidation = { ...card, validated: wasValidated };

      // Remove card from player's hand
      if (game.draftState?.playerHands[playerIndex]) {
        game.draftState.playerHands[playerIndex] = game.draftState.playerHands[playerIndex].filter(
          (c) => c.id !== cardId
        );
      }

      // Switch turns
      game.currentPlayer = 1 - game.currentPlayer;

      // Broadcast placement to all players
      io.to(gameId).emit("card-placed", {
        playerIndex,
        cardId,
        gridIndex,
        choice,
        placedCard: placedCardWithValidation,
        newGrid: currentPlayer.grid,
        currentPlayer: game.currentPlayer,
        placementResult,
      });

      // Check if round is complete (all cards placed or players have no more cards)
      const allCardsPlaced = game.players.every(
        (p) => game.draftState?.playerHands[game.players.indexOf(p)]?.length === 0
      );

      if (allCardsPlaced) {
        // End current round
        await endRound(game, gameId, io);
      }

      console.log(`Player ${playerIndex} placed card ${cardId} at position ${gridIndex}`);
    } catch (error) {
      console.error("Card placement error:", error);
      socket.emit("error", { message: error.message });
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    players.delete(socket.id);

    // Handle game cleanup if needed
    for (const [gameId, game] of games.entries()) {
      const playerIndex = game.players.findIndex((p) => p.id === socket.id);
      if (playerIndex !== -1) {
        io.to(gameId).emit("player-disconnected", playerIndex);
        games.delete(gameId);
        break;
      }
    }
  });
});

function generateGameId() {
  return Math.random().toString(36).substr(2, 9);
}

// Game logic functions

function initializeGame(game) {
  // Initialize deck with our proper 70-card deck
  game.deck = createGameDeck();

  // Initialize draft phase
  game.draftState = initializeDraftPhase(game.deck, game.currentRound);

  // Reset player grids
  game.players.forEach((player) => {
    player.grid = Array(9).fill(null);
  });
}

function initializeDraftPhase(deck, roundNumber) {
  const { roundCards, remainingDeck } = dealRoundCards(deck, roundNumber);

  // Determine pick order based on round: P1, P2, P1, P2 for round 1
  // For subsequent rounds, whoever finished last round starts next
  // Round 1: P1>P2>P1>P2, Round 2: P2>P1>P2>P1, Round 3: P1>P2>P1>P2
  const pickOrder = roundNumber % 2 === 1 ? [0, 1, 0, 1] : [1, 0, 1, 0];

  return {
    phase: "pick", // Start directly in pick phase for automatic card revealing
    revealedCards: roundCards,
    playerHands: [[], []], // Each player's selected cards
    pickOrder, // Alternating pick order based on round
    currentPickIndex: 0,
    remainingDeck,
    completedPicks: 0,
    turnNumber: 1, // Track which turn this is in the round
  };
}

// Initialize a new turn using remaining deck
function initializeTurnPhase(remainingDeck, lastPicker, currentTurnNumber = 1) {
  const { turnCards, remainingDeck: newRemainingDeck } = dealTurnCards(remainingDeck);

  // The last picker becomes the first picker of the next turn
  // Maintain P1, P2, P1, P2 pattern but start with whoever finished last
  const pickOrder = lastPicker === 0 ? [0, 1, 0, 1] : [1, 0, 1, 0];

  return {
    phase: "pick", // Start directly in pick phase for automatic card revealing
    revealedCards: turnCards,
    playerHands: [[], []], // Reset player hands for new turn
    pickOrder, // Adjusted pick order based on last picker
    currentPickIndex: 0,
    remainingDeck: newRemainingDeck,
    completedPicks: 0,
    turnNumber: currentTurnNumber + 1, // Increment turn number
  };
}

function pickCard(draftState, playerIndex, cardId) {
  // Validate turn
  const currentPlayer = draftState.pickOrder[draftState.currentPickIndex];
  if (currentPlayer !== playerIndex) {
    throw new Error("It is not this player's turn to pick");
  }

  const cardIndex = draftState.revealedCards.findIndex((card) => card.id === cardId);
  if (cardIndex === -1) {
    throw new Error("Card not found in revealed cards");
  }

  const selectedCard = draftState.revealedCards[cardIndex];

  // Create new state
  const newDraftState = {
    ...draftState,
    revealedCards: draftState.revealedCards.filter((card) => card.id !== cardId),
    playerHands: draftState.playerHands.map((hand, index) => (index === playerIndex ? [...hand, selectedCard] : hand)),
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
    pickingPlayer: playerIndex,
  };
}

// Server-side card placement logic
function executeServerCardPlacement(card, gridIndex, grid, choice) {
  const scenario = determineServerPlacementScenario(card, grid);
  const result = { grid: [...grid], validated: [] };

  switch (scenario) {
    case "empty":
      // Scenario 1: Empty space or face-down card
      const targetIndex = card.value - 1;
      if (result.grid[targetIndex] === null) {
        // Place on empty space
        result.grid[targetIndex] = { ...card, faceUp: true, validated: false };
      } else if (!result.grid[targetIndex].faceUp) {
        // Place on face-down card - becomes validated
        result.grid[targetIndex] = { ...card, faceUp: true, validated: true };
        result.validated.push(targetIndex);
      }
      break;

    case "duplicate":
      // Scenario 2: Duplicate number
      const existingIndex = card.value - 1;
      const existingCard = result.grid[existingIndex];

      if (choice === "keep-new") {
        // Keep new card face-up, put existing face-down underneath
        result.grid[existingIndex] = {
          ...card,
          faceUp: true,
          validated: true,
          stackedCard: { ...existingCard, faceUp: false },
        };
      } else if (choice === "keep-existing") {
        // Keep existing face-up, put new face-down underneath
        result.grid[existingIndex] = {
          ...existingCard,
          validated: true,
          stackedCard: { ...card, faceUp: false },
        };
      } else {
        throw new Error('Invalid choice for duplicate scenario: must be "keep-new" or "keep-existing"');
      }
      result.validated.push(existingIndex);
      break;

    case "validated":
      // Scenario 3: Already validated number - place face-down anywhere
      if (result.grid[gridIndex] === null) {
        result.grid[gridIndex] = { ...card, faceUp: false, validated: false };
      } else {
        throw new Error("Cannot place card on occupied space");
      }
      break;

    default:
      throw new Error("Invalid placement scenario");
  }

  return result;
}

function determineServerPlacementScenario(card, grid) {
  const cardValue = card.value;
  
  // Find if there's already a face-up card with this value ANYWHERE in the grid
  const existingFaceUpCard = grid.find(gridCard => 
    gridCard && gridCard.faceUp && gridCard.value === cardValue
  );
  
  // Check if the value is already validated ANYWHERE in the grid
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

// Round management
async function endRound(game, gameId, io) {
  console.log(`Round ${game.currentRound} ended for game ${gameId}`);

  // Calculate scores for this round
  const roundScores = await Promise.all(game.players.map(async (player, index) => {
    const score = await calculatePlayerScore(player.grid, game.currentRound - 1); // 0-based round index for scoring
    
    console.log(`🔍 ENDROUND DEBUG - Player ${index} (${player.name}):`, {
      currentRound: game.currentRound,
      calculatedScore: score,
      gridCards: player.grid.filter(Boolean).length,
      faceUpCards: player.grid.filter(card => card && card.faceUp).length
    });
    
    // Store detailed breakdown for each round
    if (!player.scoreBreakdowns) {
      player.scoreBreakdowns = [];
    }
    player.scoreBreakdowns[game.currentRound - 1] = score;
    player.scores[game.currentRound - 1] = score; // Store total score (score is already the total number)
    
    const totalScore = player.scores.reduce((a, b) => a + b, 0);
    console.log(`🔍 ENDROUND DEBUG - Player ${index} final:`, {
      thisRoundScore: score,
      allRoundScores: player.scores,
      totalScore
    });
    
    return {
      playerIndex: index,
      playerName: player.name,
      score: { total: score }, // Wrap score in object for compatibility
      totalScore,
    };
  }));

  // Check if game is complete (3 rounds)
  if (game.currentRound >= 3) {
    // Game complete
    const winner = roundScores.reduce((prev, current) => (current.totalScore > prev.totalScore ? current : prev));
    
    console.log(`🔍 WINNER DEBUG:`, {
      roundScores: roundScores.map(rs => ({
        playerIndex: rs.playerIndex, 
        playerName: rs.playerName, 
        totalScore: rs.totalScore
      })),
      winner: {
        playerIndex: winner.playerIndex,
        playerName: winner.playerName, 
        totalScore: winner.totalScore
      }
    });

    game.gameState = "finished";
    io.to(gameId).emit("game-complete", {
      finalScores: roundScores,
      winner: winner.playerIndex,
      playerScores: game.players.map((p) => p.scores),
    });
  } else {
    // Store the completed round number before incrementing
    const completedRound = game.currentRound;
    
    // Start next round
    game.currentRound++;
    game.phase = "draft";

    // Collect all cards from player grids and reshuffle
    const allUsedCards = [];
    game.players.forEach((player) => {
      player.grid.forEach((cell) => {
        if (cell) {
          // Extract the original card data
          allUsedCards.push({
            id: cell.id,
            value: cell.value,
            color: cell.color,
            scoring: cell.scoring,
            special: cell.special,
          });
        }
      });
      player.grid = Array(9).fill(null); // Clear grid
    });

    // Add used cards back to deck and reshuffle
    game.deck = shuffleDeck([...game.deck, ...allUsedCards]);

    // The player who picked last becomes first player
    game.currentPlayer = game.draftState.pickOrder[(game.draftState.currentPickIndex - 1) % 2];

    // Initialize new draft phase
    game.draftState = initializeDraftPhase(game.deck, game.currentRound);
    
    // Reset turn counts for the new round
    game.playerTurnCounts = [0, 0];

    io.to(gameId).emit("round-complete", {
      roundNumber: completedRound,
      roundScores,
      nextRound: game.currentRound,
      draftState: game.draftState,
      currentPlayer: game.currentPlayer,
    });
  }
}

async function calculatePlayerScore(grid, roundNumber) {
  // Import the proper scoring function from the client-side scoring module
  const { calculatePlayerScore: clientCalculatePlayerScore } = await import("./src/game/scoring.js");

  try {
    const result = clientCalculatePlayerScore(grid, roundNumber); // roundNumber is already 0-based
    return result.total;
  } catch (error) {
    console.error("Error calculating player score:", error);
    return 0;
  }
}

// Color zone calculation is now handled by the proper scoring module

function checkRoundEndCondition(game) {
  // Check if any player has filled all 9 spaces
  const anyPlayerFilled = game.players.some((player) => player.grid.every((cell) => cell !== null));
  
  if (!anyPlayerFilled) {
    return false; // Round continues if no one has filled their grid
  }
  
  // If someone filled their grid, check if both players have had equal turns
  if (!game.playerTurnCounts) {
    // Initialize turn counts if not present (for backward compatibility)
    game.playerTurnCounts = [0, 0];
    return true; // Allow round to end if no turn tracking yet (backward compatibility)
  }
  
  // Round ends only if both players have had equal number of turns
  const player0Turns = game.playerTurnCounts[0];
  const player1Turns = game.playerTurnCounts[1];
  
  console.log(`🔍 ROUND END CHECK: Player 0 turns: ${player0Turns}, Player 1 turns: ${player1Turns}`);
  
  // Both players must have completed the same number of turns
  return player0Turns === player1Turns;
}

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", games: games.size, players: players.size });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT} and accessible from network`);
});
