import React, { useState, useEffect } from "react";
import GameGrid from "./GameGrid";
import Card from "./Card";
import CardChoiceModal from "./CardChoiceModal";
import PlacementChoiceModal from "./PlacementChoiceModal";
import RoundCompleteModal from "./RoundCompleteModal";
import BackToMenuModal from "./BackToMenuModal";
import ScoreBoard from "./ScoreBoard";
import {
  PlacementScenario,
  determinePlacementScenario,
  getPickableCards,
  getValidPlacementPositions,
} from "../../games/vetrolisci/placement";
import {
  validateCards,
  getValidationStatus,
} from "../../games/vetrolisci/validation";
import AudioService from "../../services/audio";
import imagePreloader from "../../services/imagePreloader";
import "./GameBoard.css";

const VetrolisciBoard = ({
  playerName = "Player 1",
  gameInfo,
  socketService,
  onGameStateChange,
  onDraftStateChange,
  onReturnToMenu,
  hideScoreBoard = false,
  hideTurnIndicator = false,
}) => {
  const [gameState, setGameState] = useState({
    currentRound: 1,
    currentPlayer: 0,
    phase: "draft", // 'draft', 'place'
    players: [
      { name: playerName, grid: Array(9).fill(null), scores: [0, 0, 0] },
      { name: "Opponent", grid: Array(9).fill(null), scores: [0, 0, 0] },
    ],
    currentCards: [],
    // Note: selectedCard removed - cards placed automatically during draft
    deck: [],
  });

  const [draftState, setDraftState] = useState(null);
  const [showCardChoice, setShowCardChoice] = useState(false);
  const [cardChoiceData, setCardChoiceData] = useState(null);
  const [showPlacementChoice, setShowPlacementChoice] = useState(false);
  const [placementChoiceData, setPlacementChoiceData] = useState(null);
  const [showRoundComplete, setShowRoundComplete] = useState(false);
  const [roundCompleteData, setRoundCompleteData] = useState(null);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [showBackToMenuModal, setShowBackToMenuModal] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [selectedCardIndex, setSelectedCardIndex] = useState(0);
  const [keyboardNavigationStarted, setKeyboardNavigationStarted] = useState(false);
  const [invalidActionCards, setInvalidActionCards] = useState(new Set());
  const [animatingCards, setAnimatingCards] = useState(new Set());
  const [placingCards, setPlacingCards] = useState(new Set());
  const [revealingCards, setRevealingCards] = useState(false);
  const [revealedCardIds, setRevealedCardIds] = useState(new Set());
  const [flyingCards, setFlyingCards] = useState(new Map());
  const [newlyPlacedCards, setNewlyPlacedCards] = useState(new Set());
  const [glowingCards, setGlowingCards] = useState(new Set());
  const [confettiCards, setConfettiCards] = useState(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState(new Set());
  const [timeoutRefs, setTimeoutRefs] = useState(new Set());
  const [soundEnabled, setSoundEnabled] = useState(() => {
    // Load saved sound preference from localStorage, default to true
    const saved = localStorage.getItem("vetrolisci-sound-enabled");
    return saved ? JSON.parse(saved) : true;
  });
  const [musicEnabled, setMusicEnabled] = useState(() => {
    // Load saved music preference from localStorage, default to true
    const saved = localStorage.getItem("vetrolisci-music-enabled");
    return saved ? JSON.parse(saved) : true;
  });
  const [imagesLoading, setImagesLoading] = useState(true);
  const playerIndex = gameInfo?.playerIndex || 0;

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.forEach(timeoutId => clearTimeout(timeoutId));
    };
  }, [timeoutRefs]);

  // Clear pending requests when game changes or component unmounts
  useEffect(() => {
    return () => {
      setPendingRequests(new Set());
    };
  }, [gameInfo?.gameId]);

  // Function to trigger shake animation for invalid actions
  const triggerInvalidAction = (cardId) => {
    setInvalidActionCards((prev) => new Set([...prev, cardId]));
    const timeoutId = setTimeout(() => {
      setInvalidActionCards((prev) => {
        const newSet = new Set(prev);
        newSet.delete(cardId);
        return newSet;
      });
      // Remove timeout from tracking
      setTimeoutRefs((prev) => {
        const newSet = new Set(prev);
        newSet.delete(timeoutId);
        return newSet;
      });
    }, 500); // Remove after animation completes
    
    // Track timeout for cleanup
    setTimeoutRefs((prev) => new Set([...prev, timeoutId]));
  };

  // Effect to handle staggered card reveal animation
  useEffect(() => {
    if (draftState && draftState.revealedCards && draftState.revealedCards.length > 0) {
      const currentCardIds = new Set(draftState.revealedCards.map((card) => card.id));
      const previousCardIds = revealedCardIds;

      // Check if we have new cards to reveal
      const newCards = draftState.revealedCards.filter((card) => !previousCardIds.has(card.id));

      if (newCards.length > 0) {
        setRevealingCards(true);
        setRevealedCardIds(new Set());

        // Stagger the reveal of each card with enhanced timing
        newCards.forEach((card, index) => {
          const timeoutId = setTimeout(() => {
            setRevealedCardIds((prev) => new Set([...prev, card.id]));
            // Play a subtle card reveal sound
            if (soundEnabled && index % 2 === 0) {
              // Only every other card to avoid noise
              AudioService.playSound("playCard");
            }
            // Remove timeout from tracking
            setTimeoutRefs((prev) => {
              const newSet = new Set(prev);
              newSet.delete(timeoutId);
              return newSet;
            });
          }, index * 300); // Increased to 300ms for better effect
          
          // Track timeout for cleanup
          setTimeoutRefs((prev) => new Set([...prev, timeoutId]));
        });

        // End revealing state after all cards are shown
        const finalTimeoutId = setTimeout(() => {
          setRevealingCards(false);
          setRevealedCardIds(currentCardIds);
          // Remove timeout from tracking
          setTimeoutRefs((prev) => {
            const newSet = new Set(prev);
            newSet.delete(finalTimeoutId);
            return newSet;
          });
        }, newCards.length * 300 + 800); // Longer delay for final state
        
        // Track timeout for cleanup
        setTimeoutRefs((prev) => new Set([...prev, finalTimeoutId]));
      } else if (!revealingCards) {
        // If not revealing and no new cards, make sure all current cards are marked as revealed
        setRevealedCardIds(currentCardIds);
      }
    }
  }, [draftState?.revealedCards, revealingCards]);

  // Reset selected card index and navigation state when draft state changes
  useEffect(() => {
    if (draftState && draftState.revealedCards) {
      const pickableCards = getPickableCards(gameState.players[playerIndex].grid, draftState.revealedCards);
      // Reset to 0 if no cards, or ensure index is within bounds
      setSelectedCardIndex((prevIndex) => {
        if (pickableCards.length === 0) return 0;
        return Math.min(prevIndex, pickableCards.length - 1);
      });
      // Reset keyboard navigation state when new cards are revealed
      setKeyboardNavigationStarted(false);
    }
  }, [draftState?.revealedCards, gameState.players, playerIndex]);

  // Initialize audio when component mounts
  useEffect(() => {
    // Check if images are still loading
    const checkImageLoading = () => {
      const stats = imagePreloader.getStats();
      setImagesLoading(stats.loading > 0);
    };

    // Initial check
    checkImageLoading();

    // Set up interval to check loading status
    const interval = setInterval(checkImageLoading, 500);

    // Note: Removed place_cards sound on game board load as it was unintended

    // Start background music
    if (musicEnabled) {
      AudioService.startBackgroundMusic();
    }

    return () => {
      clearInterval(interval);
      // Stop music when component unmounts
      AudioService.stopBackgroundMusic();
    };
  }, []);

  // Save sound/music preferences to localStorage
  useEffect(() => {
    localStorage.setItem("vetrolisci-sound-enabled", JSON.stringify(soundEnabled));
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem("vetrolisci-music-enabled", JSON.stringify(musicEnabled));
  }, [musicEnabled]);

  // Handle sound/music toggle changes
  useEffect(() => {
    if (soundEnabled !== AudioService.isSoundEffectsEnabled()) {
      AudioService.toggleSoundEffects();
    }
  }, [soundEnabled]);

  useEffect(() => {
    if (musicEnabled !== AudioService.isMusicEnabled()) {
      AudioService.toggleMusic();
    }
  }, [musicEnabled]);

  // Notify parent component of state changes
  useEffect(() => {
    if (onGameStateChange) {
      onGameStateChange(gameState);
    }
  }, [gameState, onGameStateChange]);

  useEffect(() => {
    if (onDraftStateChange) {
      onDraftStateChange(draftState);
    }
  }, [draftState, onDraftStateChange]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Prevent shortcuts when typing in input fields
      if (event.target.tagName === "INPUT" || event.target.tagName === "TEXTAREA") {
        return;
      }

      switch (event.key.toLowerCase()) {
        case "escape":
          // Close any open modal in priority order
          if (showKeyboardHelp) {
            setShowKeyboardHelp(false);
          } else if (showScoreModal) {
            setShowScoreModal(false);
          } else if (showCardChoice) {
            handleCardChoiceCancel();
          } else if (showPlacementChoice) {
            handlePlacementChoiceCancel();
          } else if (showRoundComplete) {
            handleRoundContinue();
          } else if (showBackToMenuModal) {
            handleBackToMenuCancel();
          }
          break;

        case " ":
        case "spacebar":
          event.preventDefault(); // Prevent page scroll
          // Auto-pick first available card during draft phase
          if (draftState && draftState.revealedCards && draftState.revealedCards.length > 0) {
            const pickableCards = getPickableCards(gameState.players[playerIndex].grid, draftState.revealedCards);
            const isMyTurn = draftState.pickOrder[draftState.currentPickIndex] === playerIndex;
            const firstPickableCard = pickableCards.find((card) => card.pickable.canPick);

            if (isMyTurn && firstPickableCard && !animatingCards.has(firstPickableCard.id)) {
              handleDraftCardPick(firstPickableCard.id);
            }
          }
          break;

        case "arrowleft":
        case "arrowright":
          event.preventDefault();
          // Navigate between drafted cards
          if (draftState && draftState.revealedCards && draftState.revealedCards.length > 0) {
            const pickableCards = getPickableCards(gameState.players[playerIndex].grid, draftState.revealedCards);
            const isMyTurn = draftState.pickOrder[draftState.currentPickIndex] === playerIndex;

            if (isMyTurn && pickableCards.length > 0) {
              // Mark that keyboard navigation has been started
              setKeyboardNavigationStarted(true);

              const direction = event.key.toLowerCase() === "arrowleft" ? -1 : 1;
              setSelectedCardIndex((prevIndex) => {
                const newIndex = prevIndex + direction;
                if (newIndex < 0) return pickableCards.length - 1;
                if (newIndex >= pickableCards.length) return 0;
                return newIndex;
              });
            }
          }
          break;

        case "enter":
          event.preventDefault();
          // Pick the currently selected card
          if (draftState && draftState.revealedCards && draftState.revealedCards.length > 0) {
            const pickableCards = getPickableCards(gameState.players[playerIndex].grid, draftState.revealedCards);
            const isMyTurn = draftState.pickOrder[draftState.currentPickIndex] === playerIndex;

            if (isMyTurn && pickableCards.length > 0) {
              const selectedCard = pickableCards[selectedCardIndex];
              if (selectedCard && selectedCard.pickable.canPick && !animatingCards.has(selectedCard.id)) {
                handleDraftCardPick(selectedCard.id);
              }
            }
          }
          break;

        case "1":
        case "2":
        case "3":
        case "4":
        case "5":
        case "6":
        case "7":
        case "8":
        case "9":
          // Quick grid placement using number keys
          const gridIndex = parseInt(event.key) - 1;
          // Note: Manual grid placement removed - cards placed automatically during draft
          if (showPlacementChoice && placementChoiceData) {
            // Use number keys for placement choice modal
            const availablePositions = placementChoiceData.availablePositions;
            if (availablePositions.includes(gridIndex)) {
              handlePlacementChoice(gridIndex);
            }
          }
          break;

        case "r":
          // Show restart/back to menu confirmation
          if (!showBackToMenuModal) {
            handleBackToMenuClick();
          }
          break;

        case "s":
          // Toggle scoreboard
          if (!showScoreModal) {
            setShowScoreModal(true);
          }
          break;

        case "h":
        case "?":
          // Toggle keyboard help
          setShowKeyboardHelp(!showKeyboardHelp);
          break;

        default:
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    showScoreModal,
    showCardChoice,
    showPlacementChoice,
    showRoundComplete,
    showBackToMenuModal,
    showKeyboardHelp,
    selectedCardIndex,
    keyboardNavigationStarted,
    draftState,
    gameState,
    playerIndex,
    animatingCards,
    placementChoiceData,
  ]);

  useEffect(() => {
    if (!socketService || !gameInfo) return;

    console.log("🔌 SETUP: Registering socket event listeners for game", gameInfo?.gameId);

    // Handle server draft events
    socketService.onDraftStarted((serverDraftState) => {
      console.log("Draft started:", serverDraftState);
      setDraftState(serverDraftState);
    });

    socketService.onCardPicked(({ playerIndex: pickingPlayer, cardId, draftState: newDraftState }) => {
      console.log(`Player ${pickingPlayer} picked card ${cardId}`);
      setDraftState(newDraftState);
    });

    socketService.onCardPickedAndPlaced(
      ({ playerIndex: pickingPlayer, cardId, placedCard, newGrid, draftState: newDraftState, placementResult }) => {
        const timestamp = Date.now();
        console.log(`🎯 SYNC DEBUG [${timestamp}] Player ${pickingPlayer} picked and placed card ${cardId}`);
        console.log("🎯 SYNC GRID UPDATE:", {
          timestamp,
          cardId,
          pickingPlayer,
          isMyCard: pickingPlayer === playerIndex,
          placedCard: placedCard ? {
            id: placedCard.id,
            value: placedCard.value,
            validated: placedCard.validated,
            faceUp: placedCard.faceUp
          } : null,
          gridBefore: gameState.players[pickingPlayer]?.grid?.map((card, idx) => ({
            pos: idx,
            card: card ? { id: card.id, value: card.value, validated: card.validated } : null
          })),
          gridAfter: newGrid.map((card, idx) => ({
            pos: idx,
            card: card ? { id: card.id, value: card.value, validated: card.validated } : null
          })),
          draftCardsRemaining: newDraftState.revealedCards.length
        });

        // Clear pending request
        setPendingRequests((prev) => {
          const newSet = new Set(prev);
          newSet.delete(cardId);
          return newSet;
        });

        // Play card sound effect
        if (soundEnabled) {
          AudioService.playSound("playCard");
        }

        // Trigger placement animation for the placed card
        if (placedCard) {
          setPlacingCards((prev) => new Set([...prev, placedCard.id]));
          setNewlyPlacedCards((prev) => new Set([...prev, placedCard.id]));
          setGlowingCards((prev) => new Set([...prev, placedCard.id]));

          // Check if card was validated for confetti
          if (placedCard.validated) {
            // Play validation sound effect
            if (soundEnabled) {
              AudioService.playSound("validate");
            }

            // Find the actual card in the new grid that was validated
            const validatedCardInGrid = newGrid.find(
              (gridCard) => gridCard && gridCard.validated && gridCard.value === placedCard.value
            );


            if (validatedCardInGrid) {
              setConfettiCards((prev) => {
                // Prevent duplicate additions - use the grid card ID
                if (prev.has(validatedCardInGrid.id)) {
                  return prev;
                }
                return new Set([...prev, validatedCardInGrid.id]);
              });
              setTimeout(() => {
                setConfettiCards((prev) => {
                  const newSet = new Set(prev);
                  newSet.delete(validatedCardInGrid.id);
                  return newSet;
                });
              }, 1500);
            }
          }

          // Clear placement animation after duration
          setTimeout(() => {
            setPlacingCards((prev) => {
              const newSet = new Set(prev);
              newSet.delete(placedCard.id);
              return newSet;
            });
          }, 600);

          // Clear fade-in animation after duration
          setTimeout(() => {
            setNewlyPlacedCards((prev) => {
              const newSet = new Set(prev);
              newSet.delete(placedCard.id);
              return newSet;
            });
          }, 500);

          // Clear glow effect after 5 seconds
          setTimeout(() => {
            setGlowingCards((prev) => {
              const newSet = new Set(prev);
              newSet.delete(placedCard.id);
              return newSet;
            });
          }, 5000);
        }

        setDraftState(newDraftState);
        setGameState((prev) => {
          const newPlayers = [...prev.players];
          // Ensure deep copy of grid to force React re-render
          newPlayers[pickingPlayer] = {
            ...newPlayers[pickingPlayer],
            grid: newGrid.map(card => card ? { ...card } : null), // Deep copy each card object
          };

          const newState = {
            ...prev,
            players: newPlayers,
          };

          console.log(`🎯 SYNC STATE UPDATE [${timestamp}]:`, {
            timestamp,
            cardId,
            pickingPlayer,
            isMyCard: pickingPlayer === playerIndex,
            stateChangeDetected: JSON.stringify(prev.players[pickingPlayer]?.grid) !== JSON.stringify(newGrid),
            gridUpdatedSuccessfully: newState.players[pickingPlayer].grid.length === newGrid.length,
            newGridCards: newState.players[pickingPlayer].grid.map((card, idx) => ({
              pos: idx,
              cardId: card?.id,
              value: card?.value,
              faceUp: card?.faceUp
            }))
          });

          return newState;
        });
      }
    );

    // Handle card picked pending choice events
    socketService.onCardPickedPendingChoice(({ playerIndex: pickingPlayer, cardId, pickedCard, draftState: newDraftState }) => {
      console.log(`🎯 PENDING CHOICE: Player ${pickingPlayer} picked card ${cardId}, waiting for choice`);
      
      // If it's the current player, show the choice modal
      if (pickingPlayer === gameInfo.playerIndex) {
        setCardChoiceData({
          cardId,
          newCard: pickedCard
        });
        setShowCardChoice(true);
      }
      
      setDraftState(newDraftState);
    });

    // Handle card choice processed events
    socketService.onCardChoiceProcessed(({ playerIndex: choosingPlayer, cardId, choice, draftState: newDraftState }) => {
      console.log(`🎯 CHOICE PROCESSED: Player ${choosingPlayer} made choice ${choice} for card ${cardId}`);
      
      // Clear pending request
      setPendingRequests((prev) => {
        const newSet = new Set(prev);
        newSet.delete(cardId);
        return newSet;
      });
      
      setDraftState(newDraftState);
    });

    socketService.onCardPickedAndDiscarded(
      ({ playerIndex: pickingPlayer, cardId, discardedCard, draftState: newDraftState, reason }) => {
        console.log(`Player ${pickingPlayer} picked card ${cardId} but it was discarded (${reason})`);

        // Clear pending request
        setPendingRequests((prev) => {
          const newSet = new Set(prev);
          newSet.delete(cardId);
          return newSet;
        });

        // Show notification to all players
        const playerName = `Player ${pickingPlayer + 1}`;
        const message =
          reason === "no_empty_spaces"
            ? `${playerName} picked a card but had to discard it - no empty spaces available!`
            : `${playerName} picked a card but it was discarded`;

        // You could add a toast notification system here
        console.log(message);

        setDraftState(newDraftState);
      }
    );

    socketService.onNewTurn(({ currentPlayer: newCurrentPlayer, draftState: newDraftState }) => {
      console.log(`New turn started. Current player: ${newCurrentPlayer}`);

      setDraftState(newDraftState);
      setGameState((prev) => ({
        ...prev,
        currentPlayer: newCurrentPlayer,
      }));
    });

    socketService.onDraftComplete(({ draftState: finalDraftState, currentPlayer }) => {
      console.log("🎯 DRAFT COMPLETE - All cards have been picked and placed:", finalDraftState);
      setDraftState(finalDraftState);
      // Note: No placement phase needed - all cards already placed during draft
    });

    // Note: onCardPlaced removed - card placement handled by card-picked-and-placed events
    // No separate placement phase exists in real Vetrolisci game

    // Handle round completion
    socketService.onRoundComplete(
      ({ roundNumber, roundScores, nextRound, draftState: newDraftState, currentPlayer: newCurrentPlayer }) => {
        console.log(`Round ${roundNumber} completed, starting round ${nextRound}`);

        // Show round complete modal
        setRoundCompleteData({
          roundNumber,
          roundScores,
          nextRound,
        });
        setShowRoundComplete(true);

        // Update scores and start new round
        setGameState((prev) => {
          const newPlayers = [...prev.players];
          roundScores.forEach(({ playerIndex, score }) => {
            newPlayers[playerIndex].scores[roundNumber - 1] = score.total; // roundNumber is 1-based, convert to 0-based
          });

          // Clear grids for new round
          newPlayers.forEach((player) => {
            player.grid = Array(9).fill(null);
          });

          return {
            ...prev,
            players: newPlayers,
            currentRound: nextRound,
            phase: "draft",
            currentPlayer: newCurrentPlayer,
            currentCards: [],
            // Note: selectedCard removed - no manual selection needed
          };
        });

        setDraftState(newDraftState);
      }
    );

    // Handle game completion
    socketService.onGameComplete(({ finalScores, winner, playerScores }) => {
      console.log("Game completed! Winner:", winner);

      // Play win/lose sound effect
      if (soundEnabled) {
        if (winner === playerIndex) {
          AudioService.playSound("win");
        } else {
          AudioService.playSound("lose");
        }
      }

      setGameState((prev) => ({
        ...prev,
        phase: "finished",
        winner,
        finalScores,
      }));
    });

    // Initial game state from server
    if (gameInfo.players) {
      setGameState((prev) => ({
        ...prev,
        players: gameInfo.players.map((p) => ({
          name: p.name,
          grid: p.grid || Array(9).fill(null),
          scores: p.scores || [0, 0, 0],
        })),
      }));
    }

    if (gameInfo.draftState) {
      setDraftState(gameInfo.draftState);
    }

    // Cleanup function to prevent duplicate event listeners
    return () => {
      console.log("🧹 CLEANUP: Removing socket event listeners");
      if (socketService) {
        socketService.removeAllListeners();
      }
    };
  }, [socketService, gameInfo?.gameId]); // Only re-run when game changes, not playerIndex

  const handleDraftCardPick = (cardId) => {
    if (!cardId || !draftState) return;

    // Check if we have a pending request for this card
    if (pendingRequests.has(cardId)) {
      console.log("Request already pending for card:", cardId);
      triggerInvalidAction(cardId);
      return;
    }

    // Check socket connection
    if (!socketService.isConnected()) {
      console.log("Not connected to server");
      triggerInvalidAction(cardId);
      return;
    }

    // Only allow current player to pick
    const currentPickingPlayer = draftState.pickOrder[draftState.currentPickIndex];
    if (currentPickingPlayer !== playerIndex) {
      console.log("Not your turn to pick");
      triggerInvalidAction(cardId);
      return;
    }

    // Find the picked card
    const pickedCard = draftState.revealedCards.find((card) => card.id === cardId);
    if (!pickedCard) {
      triggerInvalidAction(cardId);
      return;
    }

    // Check if card can be picked
    const pickableCards = getPickableCards(gameState.players[playerIndex].grid, draftState.revealedCards);
    const cardData = pickableCards.find((card) => card.id === cardId);
    if (!cardData || !cardData.pickable.canPick) {
      triggerInvalidAction(cardId);
      return;
    }

    // Mark request as pending
    setPendingRequests((prev) => new Set([...prev, cardId]));

    // Start pick animation
    setAnimatingCards((prev) => new Set([...prev, cardId]));

    // Play card sound effect
    if (soundEnabled) {
      AudioService.playSound("playCard");
    }

    // Start fade out animation for the drafted card
    setFlyingCards((prev) => new Map([...prev, [cardId, { fadeOut: true }]]));

    // Check placement scenario to see if we need to show choice modal
    const currentPlayer = gameState.players[playerIndex];
    const scenario = determinePlacementScenario(pickedCard, currentPlayer.grid);

    // Delay the actual pick to allow animation to play
    const timeoutId = setTimeout(() => {
      if (scenario === PlacementScenario.DUPLICATE_NUMBER) {
        // Show choice modal for duplicate number scenario
        const existingCard = currentPlayer.grid[pickedCard.value - 1];
        setCardChoiceData({
          existingCard,
          newCard: pickedCard,
          targetIndex: pickedCard.value - 1, // Will be overridden based on choice
          cardId: cardId,
        });
        setShowCardChoice(true);
      } else if (scenario === PlacementScenario.ALREADY_VALIDATED) {
        // Show placement choice modal for face-down placement
        const availablePositions = getValidPlacementPositions(pickedCard, currentPlayer.grid);
        setPlacementChoiceData({
          card: pickedCard,
          cardId: cardId,
          availablePositions: availablePositions,
        });
        setShowPlacementChoice(true);
      } else {
        // Send pick-and-place to server immediately with target position
        const targetIndex = pickedCard.value - 1; // Cards 1-9 map to indices 0-8
        const position = {
          row: Math.floor(targetIndex / 3),
          col: targetIndex % 3
        };
        
        try {
          socketService.pickCard(cardId, 'place', position);
        } catch (error) {
          console.error("Failed to send pick card:", error);
          // Clear pending request on error
          setPendingRequests((prev) => {
            const newSet = new Set(prev);
            newSet.delete(cardId);
            return newSet;
          });
        }
      }

      // Clear animation state
      setAnimatingCards((prev) => {
        const newSet = new Set(prev);
        newSet.delete(cardId);
        return newSet;
      });
      setFlyingCards((prev) => {
        const newMap = new Map(prev);
        newMap.delete(cardId);
        return newMap;
      });

      // Remove timeout from tracking
      setTimeoutRefs((prev) => {
        const newSet = new Set(prev);
        newSet.delete(timeoutId);
        return newSet;
      });
    }, 800);

    // Track timeout for cleanup
    setTimeoutRefs((prev) => new Set([...prev, timeoutId]));
  };

  // Note: Card selection removed - not needed in real Vetrolisci game
  // Cards are picked from draft and immediately placed

  // Note: handleCardPlace removed - cards are placed immediately during draft phase
  // Players don't manually place cards on grid - this happens automatically via pick-card

  const handleCardChoice = (choice) => {
    if (cardChoiceData) {
      const { cardId, newCard } = cardChoiceData;

      try {
        // Map modal choice to server choice (server expects 'place' or 'discard')
        let serverChoice;
        if (choice === 'keep-new') {
          serverChoice = 'place'; // Place the new card
        } else if (choice === 'keep-existing') {
          serverChoice = 'discard'; // Discard the new card (keep existing)
        } else {
          // Fallback for any other choice
          serverChoice = choice === 'place' ? 'place' : 'discard';
        }

        console.log("🎯 CARD CHOICE:", {
          choice,
          serverChoice,
          cardId,
          newCard
        });

        // Send choice to server using pickCard (same as legacy implementation)
        socketService.pickCard(cardId, serverChoice);
      } catch (error) {
        console.error("Failed to send card choice:", error);
        // Clear pending request on error
        setPendingRequests((prev) => {
          const newSet = new Set(prev);
          newSet.delete(cardId);
          return newSet;
        });
      }

      setShowCardChoice(false);
      setCardChoiceData(null);
    }
  };

  const handleCardChoiceCancel = () => {
    if (cardChoiceData) {
      const { cardId } = cardChoiceData;
      // Clear pending request when canceling
      setPendingRequests((prev) => {
        const newSet = new Set(prev);
        newSet.delete(cardId);
        return newSet;
      });
    }
    setShowCardChoice(false);
    setCardChoiceData(null);
  };

  const handlePlacementChoice = (position) => {
    console.log("🎯 PLACEMENT CHOICE:", {
      position,
      placementChoiceData,
      cardToPlace: placementChoiceData?.card
    });

    if (placementChoiceData) {
      const { cardId } = placementChoiceData;

      try {
        console.log("🎯 SENDING FACE-DOWN PLACEMENT:", {
          cardId,
          position,
          method: "pickCard with position"
        });
        // Send pick with placement position to server
        socketService.pickCard(cardId, 'place', position);
      } catch (error) {
        console.error("🎯 PLACEMENT CHOICE FAILED:", error);
        // Clear pending request on error
        setPendingRequests((prev) => {
          const newSet = new Set(prev);
          newSet.delete(cardId);
          return newSet;
        });
      }

      setShowPlacementChoice(false);
      setPlacementChoiceData(null);
    }
  };

  const handlePlacementChoiceCancel = () => {
    if (placementChoiceData) {
      const { cardId } = placementChoiceData;
      // Clear pending request when canceling
      setPendingRequests((prev) => {
        const newSet = new Set(prev);
        newSet.delete(cardId);
        return newSet;
      });
    }
    setShowPlacementChoice(false);
    setPlacementChoiceData(null);
  };

  const handleRoundContinue = () => {
    setShowRoundComplete(false);
    setRoundCompleteData(null);
  };

  const handleBackToMenuClick = () => {
    setShowBackToMenuModal(true);
  };

  const handleBackToMenuConfirm = () => {
    // Disconnect from the game
    socketService.disconnect();
    // Return to main menu
    if (onReturnToMenu) {
      onReturnToMenu();
    }
  };

  const handleBackToMenuCancel = () => {
    setShowBackToMenuModal(false);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then(() => {
          setIsFullscreen(true);
        })
        .catch((err) => {
          console.log("Error attempting to enable fullscreen:", err);
        });
    } else {
      document
        .exitFullscreen()
        .then(() => {
          setIsFullscreen(false);
        })
        .catch((err) => {
          console.log("Error attempting to exit fullscreen:", err);
        });
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Show game completion screen
  if (gameState.phase === "finished") {
    const winner = gameState.winner;
    const isWinner = winner === playerIndex;
    const winnerName = winner !== null ? gameState.players[winner].name : "No one";

    return (
      <div className="game-board finished-game">
        <div className="game-complete">
          <h1 className={`complete-title ${isWinner ? "winner" : "loser"}`}>
            {isWinner ? "🎉 You Win!" : `${winnerName} Wins!`}
          </h1>
          
          <div className="final-scores">
            <h2>Final Scores</h2>
            <div className="scores-table">
              {gameState.players.map((player, idx) => (
                <div key={idx} className={`player-score ${idx === winner ? "winner" : ""}`}>
                  <span className="player-name">{player.name}</span>
                  <div className="round-scores">
                    {player.scores.map((score, roundIdx) => (
                      <span key={roundIdx} className="round-score">
                        R{roundIdx + 1}: {score}
                      </span>
                    ))}
                  </div>
                  <span className="total-score">Total: {player.scores.reduce((sum, score) => sum + score, 0)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="game-complete-actions">
            <button onClick={handleBackToMenuConfirm} className="btn btn-primary">
              Back to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show loading screen while images are loading
  if (imagesLoading) {
    const stats = imagePreloader.getStats();
    const progressPercent = stats.total > 0 ? Math.round((stats.loaded / stats.total) * 100) : 0;

    return (
      <div className="game-board loading">
        <div className="loading-container">
          <h2>Loading Game Assets...</h2>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <p>{stats.loaded} / {stats.total} images loaded ({progressPercent}%)</p>
          {stats.loading > 0 && (
            <div className="loading-spinner">
              <div className="spinner"></div>
            </div>
          )}
        </div>
      </div>
    );
  }

  const currentPlayer = gameState.players[playerIndex];
  const opponent = gameState.players[1 - playerIndex];
  const isMyTurn = gameState.currentPlayer === playerIndex;

  // Get draft cards for UI
  let pickableCards = [];
  let currentPickingPlayer = null;
  let isMyDraftTurn = false;

  if (draftState && draftState.revealedCards) {
    pickableCards = getPickableCards(currentPlayer.grid, draftState.revealedCards);
    currentPickingPlayer = draftState.pickOrder[draftState.currentPickIndex];
    isMyDraftTurn = currentPickingPlayer === playerIndex;
  }

  // Get the selected card for keyboard navigation
  const keyboardSelectedCard = 
    keyboardNavigationStarted && pickableCards.length > 0 
      ? pickableCards[selectedCardIndex] 
      : null;

  return (
    <div className="game-board">

      {/* Revealed Cards Section */}
      {draftState && draftState.revealedCards && draftState.revealedCards.length > 0 && (
        <div className="revealed-cards-section">
          <h3>Revealed Cards</h3>
          <div className="revealed-cards">
            {(() => {
              const pickableCards = getPickableCards(gameState.players[playerIndex].grid, draftState.revealedCards);
              const isMyTurn = draftState.pickOrder[draftState.currentPickIndex] === playerIndex;

              return pickableCards.map((cardData, index) => {
                const canPlayerPick = isMyTurn && cardData.pickable.canPick;
                const isAnimating = animatingCards.has(cardData.id);
                const isFlying = flyingCards.has(cardData.id);
                const isRevealed = true; // Cards are immediately available for picking
                const canPick = canPlayerPick && !isAnimating && isRevealed;
                const isKeyboardSelected = isMyTurn && index === selectedCardIndex && keyboardNavigationStarted;
                const hasInvalidAction = invalidActionCards.has(cardData.id);

                const fadeData = flyingCards.get(cardData.id);
                const isFadingOut = fadeData?.fadeOut;

                const cardClass = `revealed-card ${canPick ? "can-pick" : "waiting"} ${
                  isAnimating ? "card-picking" : ""
                } ${isFadingOut ? "card-fade-out" : ""} ${isKeyboardSelected ? "keyboard-selected" : ""} ${
                  hasInvalidAction ? "invalid-action" : ""
                } ${!cardData.pickable.canPick ? "restricted-card" : ""}`;
                const tooltipText = !cardData.pickable.canPick
                  ? cardData.pickable.reason === "all_cards_validated"
                    ? "All cards would violate validation rule - can place face-down"
                    : "You already have a validated card with this number"
                  : "";

                return (
                  <div
                    key={cardData.id}
                    data-card-id={cardData.id}
                    className={cardClass}
                    title={tooltipText}
                    style={{
                      position: "relative",
                      animationDelay: !isRevealed ? `${index * 300}ms` : "0ms",
                    }}
                  >
                    <Card
                      card={cardData}
                      onClick={() => {
                        if (canPick) {
                          handleDraftCardPick(cardData.id);
                        } else {
                          triggerInvalidAction(cardData.id);
                        }
                      }}
                      isAnimating={isAnimating}
                      isInvalid={invalidActionCards.has(cardData.id)}
                      showConfetti={confettiCards.has(cardData.id)}
                    />

                     {!cardData.pickable.canPick && (
                       <div className="card-restriction-overlay" />
                     )}
                  </div>
                );
              });
            })()}
          </div>
          {!hideTurnIndicator && (
            <div className="turn-indicator">
              {(() => {
                const isMyTurn = draftState.pickOrder[draftState.currentPickIndex] === playerIndex;
                const currentPickingPlayer = gameState.players[draftState.pickOrder[draftState.currentPickIndex]];
                return isMyTurn ? "Your turn to pick a card" : `Waiting for ${currentPickingPlayer?.name} to pick`;
              })()}
            </div>
          )}
        </div>
      )}

      {/* Players section */}
      <div className="players-section">
        {/* Current player (you) */}
        <div className="player-section current-player">
            <div className="player-header">
              <h3>{currentPlayer.name} (You)</h3>
              {!hideScoreBoard && (
                <div className="current-scores">
                  Round Scores: {currentPlayer.scores.join(" - ")} (Total: {currentPlayer.scores.reduce((sum, score) => sum + score, 0)})
                </div>
              )}
            </div>
            <GameGrid
              grid={currentPlayer.grid}
              onCardPlace={() => {}} // Player cannot manually place cards - happens automatically
              selectedCard={null} // No manual card selection
              canPlace={false}
              newlyPlacedCards={newlyPlacedCards}
              glowingCards={glowingCards}
              confettiCards={confettiCards}
              placingCards={placingCards}
              key={`current-grid-${JSON.stringify(currentPlayer.grid)}`}
            />
          </div>

        {/* Opponent */}
        <div className="player-section opponent">
          <div className="player-header">
            <h3>{opponent.name}</h3>
            {!hideScoreBoard && (
              <div className="current-scores">
                Round Scores: {opponent.scores.join(" - ")} (Total: {opponent.scores.reduce((sum, score) => sum + score, 0)})
              </div>
            )}
          </div>
          <GameGrid
            grid={opponent.grid}
            onCardPlace={() => {}}
            selectedCard={null}
            canPlace={false}
            isOpponent={true}
            newlyPlacedCards={newlyPlacedCards}
            glowingCards={glowingCards}
            confettiCards={confettiCards}
            placingCards={placingCards}
            key={`opponent-grid-${JSON.stringify(opponent.grid)}`}
          />
        </div>
      </div>

      {/* Keyboard help overlay */}
      {showKeyboardHelp && (
        <div className="keyboard-help-overlay" onClick={() => setShowKeyboardHelp(false)}>
          <div className="keyboard-help-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Keyboard Shortcuts</h3>
            <div className="shortcuts-grid">
              <div className="shortcut-group">
                <h4>Navigation</h4>
                <div className="shortcut">
                  <kbd>←</kbd><kbd>→</kbd> <span>Navigate cards</span>
                </div>
                <div className="shortcut">
                  <kbd>Enter</kbd> <span>Pick selected card</span>
                </div>
                <div className="shortcut">
                  <kbd>Space</kbd> <span>Quick pick first card</span>
                </div>
              </div>
              <div className="shortcut-group">
                <h4>Grid Placement</h4>
                <div className="shortcut">
                  <kbd>1</kbd><kbd>2</kbd><kbd>3</kbd> <span>Top row</span>
                </div>
                <div className="shortcut">
                  <kbd>4</kbd><kbd>5</kbd><kbd>6</kbd> <span>Middle row</span>
                </div>
                <div className="shortcut">
                  <kbd>7</kbd><kbd>8</kbd><kbd>9</kbd> <span>Bottom row</span>
                </div>
              </div>
              <div className="shortcut-group">
                <h4>Controls</h4>
                <div className="shortcut">
                  <kbd>Esc</kbd> <span>Close modal/cancel</span>
                </div>
                <div className="shortcut">
                  <kbd>S</kbd> <span>Show scores</span>
                </div>
                <div className="shortcut">
                  <kbd>R</kbd> <span>Back to menu</span>
                </div>
                <div className="shortcut">
                  <kbd>H</kbd><kbd>?</kbd> <span>Toggle this help</span>
                </div>
              </div>
            </div>
            <button onClick={() => setShowKeyboardHelp(false)} className="btn btn-primary">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCardChoice && cardChoiceData && (
        <CardChoiceModal
          isOpen={showCardChoice}
          existingCard={cardChoiceData.existingCard}
          newCard={cardChoiceData.newCard}
          onChoose={handleCardChoice}
          onCancel={handleCardChoiceCancel}
        />
      )}

      {showPlacementChoice && placementChoiceData && (
        <PlacementChoiceModal
          card={placementChoiceData.card}
          availablePositions={placementChoiceData.availablePositions}
          onChoice={handlePlacementChoice}
          onCancel={handlePlacementChoiceCancel}
        />
      )}

      {showRoundComplete && roundCompleteData && (
        <RoundCompleteModal
          roundNumber={roundCompleteData.roundNumber}
          roundScores={roundCompleteData.roundScores}
          players={gameState.players}
          onContinue={handleRoundContinue}
        />
      )}

      {showBackToMenuModal && (
        <BackToMenuModal
          isOpen={showBackToMenuModal}
          onConfirm={handleBackToMenuConfirm}
          onCancel={handleBackToMenuCancel}
        />
      )}

      {/* Control buttons - Original floating layout */}
      <button
        className="header-score-button audio-toggle-button"
        onClick={toggleFullscreen}
        title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        style={{ bottom: "260px" }}
      >
        <img
          src="/icons/fullscreen.png"
          alt="Fullscreen"
          style={{
            width: "30px",
            height: "30px",
            opacity: 1,
          }}
        />
      </button>

      <button
        className="header-score-button audio-toggle-button"
        onClick={() => setSoundEnabled(!soundEnabled)}
        title={soundEnabled ? "Disable Sound Effects" : "Enable Sound Effects"}
        style={{ bottom: "190px" }}
      >
        <img
          src="/icons/sound.png"
          alt="Sound Effects"
          style={{
            width: "30px",
            height: "30px",
            opacity: soundEnabled ? 1 : 0.5,
          }}
        />
      </button>

      <button
        className="header-score-button audio-toggle-button"
        onClick={() => setMusicEnabled(!musicEnabled)}
        title={musicEnabled ? "Disable Music" : "Enable Music"}
        style={{ bottom: "120px" }}
      >
        <img
          src="/icons/music.png"
          alt="Music"
          style={{
            width: "30px",
            height: "30px",
            opacity: musicEnabled ? 1 : 0.5,
          }}
        />
      </button>

      {/* Floating scoreboard button */}
      <button
        className="header-score-button scoreboard-button"
        onClick={() => setShowScoreModal(true)}
        title="View Scoreboard"
        style={{ bottom: "50px" }}
      >
        <img src="/icons/score.png" alt="Scoreboard" style={{ width: "30px", height: "30px" }} />
      </button>

      {/* Back to Main Menu button */}
      <button
        className="header-score-button audio-toggle-button"
        onClick={handleBackToMenuClick}
        title="Back to Main Menu"
        style={{ bottom: "50px", left: "20px", right: "auto" }}
      >
        <img src="/icons/exit.svg" alt="Exit to Menu" style={{ width: "30px", height: "30px" }} />
      </button>

      {/* Keyboard Help button */}
      <button
        className="header-score-button audio-toggle-button"
        onClick={() => setShowKeyboardHelp(true)}
        title="Keyboard Shortcuts (H)"
        style={{ bottom: "120px", left: "20px", right: "auto" }}
      >
        <img src="/icons/keyboard.svg" alt="Keyboard shortcuts" style={{ width: "30px", height: "30px" }} />
      </button>

      {/* Scoreboard Modal - Original structure */}
      {showScoreModal && (
        <div className="score-modal-overlay" onClick={() => setShowScoreModal(false)}>
          <div className="score-modal-content" onClick={(e) => e.stopPropagation()}>
            <ScoreBoard
              players={gameState.players}
              currentRound={gameState.currentRound}
              onClose={() => setShowScoreModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default VetrolisciBoard;