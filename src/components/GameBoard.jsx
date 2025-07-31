import React, { useState, useEffect } from "react";
import GameGrid from "./GameGrid";
import Card from "./Card";
import CardChoiceModal from "./CardChoiceModal";
import PlacementChoiceModal from "./PlacementChoiceModal";
import RoundCompleteModal from "./RoundCompleteModal";
import BackToMenuModal from "./BackToMenuModal";
import ScoreBoard from "./ScoreBoard";
import SkeletonLoader from "./SkeletonLoader";
import {
  PlacementScenario,
  determinePlacementScenario,
  getPickableCards,
  getValidPlacementPositions,
} from "../game/placement";
import AudioService from "../services/audio";
import imagePreloader from "../services/imagePreloader";
import "./GameBoard.css";

const GameBoard = ({
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
    selectedCard: null,
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

  // Function to trigger shake animation for invalid actions
  const triggerInvalidAction = (cardId) => {
    setInvalidActionCards((prev) => new Set([...prev, cardId]));
    setTimeout(() => {
      setInvalidActionCards((prev) => {
        const newSet = new Set(prev);
        newSet.delete(cardId);
        return newSet;
      });
    }, 500); // Remove after animation completes
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
          setTimeout(() => {
            setRevealedCardIds((prev) => new Set([...prev, card.id]));
            // Play a subtle card reveal sound
            if (soundEnabled && index % 2 === 0) {
              // Only every other card to avoid noise
              AudioService.playSound("playCard");
            }
          }, index * 300); // Increased to 300ms for better effect
        });

        // End revealing state after all cards are shown
        setTimeout(() => {
          setRevealingCards(false);
          setRevealedCardIds(currentCardIds);
        }, newCards.length * 300 + 800); // Longer delay for final state
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
          if (gameState.selectedCard && gameState.phase === "place" && gameState.currentPlayer === playerIndex) {
            handleCardPlace(gridIndex);
          } else if (showPlacementChoice && placementChoiceData) {
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
        console.log(`Player ${pickingPlayer} picked and placed card ${cardId}`);
        console.log("🔍 GRID UPDATE DEBUG:", {
          cardId,
          placedCard,
          placedCardId: placedCard?.id,
          newGrid: newGrid.map((card) => (card ? { id: card.id, value: card.value, validated: card.validated } : null)),
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

            console.log("🎉 CONFETTI DEBUG - onCardPickedAndPlaced:", {
              cardId,
              placedCardId: placedCard.id,
              validatedCardInGrid: validatedCardInGrid?.id,
              validated: placedCard.validated,
              eventType: "onCardPickedAndPlaced",
            });

            if (validatedCardInGrid) {
              setConfettiCards((prev) => {
                // Prevent duplicate additions - use the grid card ID
                if (prev.has(validatedCardInGrid.id)) {
                  console.log("🎉 Confetti already exists for card:", validatedCardInGrid.id);
                  return prev;
                }
                const newSet = new Set([...prev, validatedCardInGrid.id]);
                console.log("🎉 Setting confetti cards:", Array.from(newSet));
                return newSet;
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
          // Ensure we're updating the correct player's grid with the server's authoritative state
          newPlayers[pickingPlayer] = {
            ...newPlayers[pickingPlayer],
            grid: [...newGrid], // Create a new array to ensure React detects the change
          };

          return {
            ...prev,
            players: newPlayers,
          };
        });
      }
    );

    socketService.onCardPickedAndDiscarded(
      ({ playerIndex: pickingPlayer, cardId, discardedCard, draftState: newDraftState, reason }) => {
        console.log(`Player ${pickingPlayer} picked card ${cardId} but it was discarded (${reason})`);

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

    socketService.onDraftComplete(({ draftState: finalDraftState, playerHands, currentPlayer }) => {
      console.log("Draft complete:", finalDraftState);
      setDraftState(finalDraftState);

      // Transition to placement phase with player's cards
      setTimeout(() => {
        const playerCards = playerHands[playerIndex];
        setGameState((prev) => ({
          ...prev,
          phase: "place",
          currentCards: playerCards,
          currentPlayer: currentPlayer,
        }));
      }, 2000);
    });

    // Handle card placement events
    socketService.onCardPlaced(
      ({
        playerIndex: placingPlayer,
        cardId,
        gridIndex,
        choice,
        placedCard,
        newGrid,
        currentPlayer,
        placementResult,
      }) => {
        console.log(`Player ${placingPlayer} placed card ${cardId}`);

        // Add fade-in animation for the placed card
        setNewlyPlacedCards((prev) => new Set([...prev, cardId]));
        setGlowingCards((prev) => new Set([...prev, cardId]));

        // Check if card was validated for confetti
        if (placedCard && placedCard.validated) {
          // Play validation sound effect
          if (soundEnabled) {
            AudioService.playSound("validate");
          }

          console.log("🎉 CONFETTI DEBUG - onCardPlaced:", {
            cardId,
            placedCardId: placedCard.id,
            validated: placedCard.validated,
            eventType: "onCardPlaced",
            idsMatch: cardId === placedCard.id,
          });
          setConfettiCards((prev) => {
            // Prevent duplicate additions
            if (prev.has(cardId)) {
              console.log("🎉 Confetti already exists for card:", cardId);
              return prev;
            }
            const newSet = new Set([...prev, cardId]);
            console.log("🎉 Setting confetti cards (onCardPlaced):", Array.from(newSet));
            return newSet;
          });
          setTimeout(() => {
            setConfettiCards((prev) => {
              const newSet = new Set(prev);
              newSet.delete(cardId);
              return newSet;
            });
          }, 1500);
        }

        // Clear fade-in animation after duration
        setTimeout(() => {
          setNewlyPlacedCards((prev) => {
            const newSet = new Set(prev);
            newSet.delete(cardId);
            return newSet;
          });
        }, 500);

        // Clear glow effect after 5 seconds
        setTimeout(() => {
          setGlowingCards((prev) => {
            const newSet = new Set(prev);
            newSet.delete(cardId);
            return newSet;
          });
        }, 5000);

        setGameState((prev) => {
          const newPlayers = [...prev.players];
          // Ensure we're updating with the server's authoritative grid state
          newPlayers[placingPlayer] = {
            ...newPlayers[placingPlayer],
            grid: [...newGrid], // Create a new array to ensure React detects the change
          };

          // Remove card from current player's hand if it's our turn
          let newCurrentCards = prev.currentCards;
          if (placingPlayer === playerIndex) {
            newCurrentCards = prev.currentCards.filter((c) => c.id !== cardId);
          }

          return {
            ...prev,
            players: newPlayers,
            currentCards: newCurrentCards,
            currentPlayer,
            selectedCard: placingPlayer === playerIndex ? null : prev.selectedCard,
          };
        });
      }
    );

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
            newPlayers[playerIndex].scores[roundNumber - 1] = score; // Fix: use 0-based indexing
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
            selectedCard: null,
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
  }, [socketService, gameInfo, playerIndex]);

  const handleDraftCardPick = (cardId) => {
    if (!cardId || !draftState) return;

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
    setTimeout(() => {
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
        // Send pick-and-place to server immediately
        socketService.pickCard(cardId);
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
    }, 800); // Increased timeout to account for flying animation
  };

  const handleCardSelect = (card) => {
    if (gameState.phase === "place" && gameState.currentPlayer === playerIndex) {
      setGameState((prev) => ({
        ...prev,
        selectedCard: card,
      }));
    }
  };

  const handleCardPlace = (gridIndex) => {
    if (gameState.phase === "place" && gameState.selectedCard && gameState.currentPlayer === playerIndex) {
      const card = gameState.selectedCard;
      const currentPlayer = gameState.players[playerIndex];
      const scenario = determinePlacementScenario(card, currentPlayer.grid);

      if (scenario === PlacementScenario.DUPLICATE_NUMBER) {
        // Show choice modal for duplicate number scenario
        const existingCard = currentPlayer.grid[card.value - 1];
        setCardChoiceData({
          existingCard,
          newCard: card,
          targetIndex: gridIndex,
        });
        setShowCardChoice(true);
      } else {
        // Send placement to server
        socketService.placeCard(card.id, gridIndex);
      }
    }
  };

  const handleCardChoice = (choice) => {
    if (cardChoiceData) {
      const { cardId } = cardChoiceData;

      // Send pick with choice to server (server will handle placement)
      socketService.pickCard(cardId, choice);

      setShowCardChoice(false);
      setCardChoiceData(null);
    }
  };

  const handleCardChoiceCancel = () => {
    setShowCardChoice(false);
    setCardChoiceData(null);
  };

  const handlePlacementChoice = (position) => {
    if (placementChoiceData) {
      const { cardId } = placementChoiceData;

      // Send pick with placement position to server
      socketService.pickCard(cardId, null, position);

      setShowPlacementChoice(false);
      setPlacementChoiceData(null);
    }
  };

  const handlePlacementChoiceCancel = () => {
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
    return (
      <div className="game-board">
        <div className="game-complete">
          <h1>🎉 Game Complete! 🎉</h1>
          <h2>Winner: {gameState.players[gameState.winner]?.name}</h2>

          <div className="final-scores">
            <h3>Final Scores:</h3>
            {gameState.players.map((player, index) => (
              <div key={index} className={`player-final-score ${index === gameState.winner ? "winner" : ""}`}>
                <strong>{player.name}:</strong> {player.scores.reduce((a, b) => a + b, 0)} points
                <div className="round-breakdown">
                  {player.scores.map((score, roundIndex) => (
                    <span key={roundIndex}>
                      Round {roundIndex + 1}: {score}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => window.location.reload()}>Play Again</button>
        </div>
      </div>
    );
  }

  // Main game interface - shows both draft and placement together
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
                const isRevealed = revealedCardIds.has(cardData.id) || !revealingCards;
                const canPick = canPlayerPick && !isAnimating && isRevealed;
                const isKeyboardSelected = isMyTurn && index === selectedCardIndex && keyboardNavigationStarted;
                const hasInvalidAction = invalidActionCards.has(cardData.id);

                const fadeData = flyingCards.get(cardData.id);
                const isFadingOut = fadeData?.fadeOut;

                const cardClass = `revealed-card ${canPick ? "can-pick" : "waiting"} ${
                  isAnimating ? "card-picking" : ""
                } ${isFadingOut ? "card-fade-out" : ""} ${isKeyboardSelected ? "keyboard-selected" : ""} ${
                  hasInvalidAction ? "invalid-action" : ""
                }`;
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
                        }
                      }}
                      isSelected={false}
                      className={
                        revealingCards && !revealedCardIds.has(cardData.id)
                          ? "card-revealing"
                          : revealingCards && revealedCardIds.has(cardData.id)
                          ? "card-revealed"
                          : ""
                      }
                    />
                    {!cardData.pickable.canPick && isRevealed && <div className="card-restriction-overlay"></div>}
                  </div>
                );
              });
            })()}
          </div>
          {!hideTurnIndicator && (
            <div className="turn-indicator">
              {draftState.pickOrder[draftState.currentPickIndex] === playerIndex ? (
                keyboardNavigationStarted ? (
                  "Your turn to pick! Use ← → to navigate, Enter to select"
                ) : (
                  "Your turn to pick!"
                )
              ) : (
                <span>
                  Waiting for {gameState.players[draftState.pickOrder[draftState.currentPickIndex]]?.name}
                  <span className="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </span>
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Game Grids */}
      <div className="game-grids">
        <div className="player-grid-section">
          <h3>Your Grid ({gameState.players[playerIndex].name})</h3>
          {imagesLoading ? (
            <SkeletonLoader type="grid" />
          ) : (
            <GameGrid
              grid={gameState.players[playerIndex].grid}
              onCardPlace={handleCardPlace}
              canPlace={false} // Placement happens automatically after pick
              selectedCard={gameState.selectedCard}
              placingCards={placingCards}
              newlyPlacedCards={newlyPlacedCards}
              glowingCards={glowingCards}
              confettiCards={confettiCards}
              onConfettiComplete={(cardId) => {
                setConfettiCards((prev) => {
                  const newSet = new Set(prev);
                  newSet.delete(cardId);
                  return newSet;
                });
              }}
            />
          )}
        </div>

        <div className="opponent-grid-section">
          <h3>Opponent Grid ({gameState.players[1 - playerIndex].name})</h3>
          {imagesLoading ? (
            <SkeletonLoader type="grid" />
          ) : (
            <GameGrid
              grid={gameState.players[1 - playerIndex].grid}
              onCardPlace={() => {}}
              canPlace={false}
              isOpponent={true}
              placingCards={placingCards}
              newlyPlacedCards={newlyPlacedCards}
              glowingCards={glowingCards}
              confettiCards={confettiCards}
              onConfettiComplete={(cardId) => {
                setConfettiCards((prev) => {
                  const newSet = new Set(prev);
                  newSet.delete(cardId);
                  return newSet;
                });
              }}
            />
          )}
        </div>
      </div>

      {/* Cards are now automatically revealed - no manual button needed */}

      {!hideScoreBoard && <ScoreBoard players={gameState.players} currentRound={gameState.currentRound} />}

      <CardChoiceModal
        isOpen={showCardChoice}
        existingCard={cardChoiceData?.existingCard}
        newCard={cardChoiceData?.newCard}
        onChoose={handleCardChoice}
        onCancel={handleCardChoiceCancel}
      />

      <PlacementChoiceModal
        isOpen={showPlacementChoice}
        card={placementChoiceData?.card}
        availablePositions={placementChoiceData?.availablePositions || []}
        onChoose={handlePlacementChoice}
        onCancel={handlePlacementChoiceCancel}
      />

      <RoundCompleteModal
        isOpen={showRoundComplete}
        roundNumber={roundCompleteData?.roundNumber}
        roundScores={roundCompleteData?.roundScores}
        nextRound={roundCompleteData?.nextRound}
        onContinue={handleRoundContinue}
      />

      {/* Control buttons */}
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

      <BackToMenuModal
        isOpen={showBackToMenuModal}
        onConfirm={handleBackToMenuConfirm}
        onCancel={handleBackToMenuCancel}
      />

      {/* Scoreboard Modal */}
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

      {/* Keyboard Help Modal */}
      {showKeyboardHelp && (
        <div className="score-modal-overlay" onClick={() => setShowKeyboardHelp(false)}>
          <div className="score-modal-content keyboard-help-content" onClick={(e) => e.stopPropagation()}>
            <div className="keyboard-help">
              <div className="keyboard-help-header">
                <h3>
                  <img
                    src="/icons/keyboard.svg"
                    alt="Keyboard"
                    style={{ width: "24px", height: "24px", marginRight: "8px", verticalAlign: "middle" }}
                  />
                  Keyboard Shortcuts
                </h3>
                <button
                  className="keyboard-help-close"
                  onClick={() => setShowKeyboardHelp(false)}
                  title="Close help (Esc)"
                >
                  ✕
                </button>
              </div>
              <div className="keyboard-help-sections">
                <div className="keyboard-help-section">
                  <h4>🎮 Gameplay</h4>
                  <div className="keyboard-shortcut">
                    <kbd>←</kbd>
                    <kbd>→</kbd>
                    <span>Navigate between drafted cards</span>
                  </div>
                  <div className="keyboard-shortcut">
                    <kbd>Enter</kbd>
                    <span>Pick selected card</span>
                  </div>
                  <div className="keyboard-shortcut">
                    <kbd>Space</kbd>
                    <span>Auto-pick first available card</span>
                  </div>
                  <div className="keyboard-shortcut">
                    <kbd>1</kbd>-<kbd>9</kbd>
                    <span>Quick placement on grid positions & modal selection</span>
                  </div>
                </div>

                <div className="keyboard-help-section">
                  <h4>🎯 Interface</h4>
                  <div className="keyboard-shortcut">
                    <kbd>Esc</kbd>
                    <span>Close any modal/overlay</span>
                  </div>
                  <div className="keyboard-shortcut">
                    <kbd>S</kbd>
                    <span>Open scoreboard</span>
                  </div>
                  <div className="keyboard-shortcut">
                    <kbd>H</kbd> or <kbd>?</kbd>
                    <span>Show/hide this help</span>
                  </div>
                </div>

                <div className="keyboard-help-section">
                  <h4>⚙️ Controls</h4>
                  <div className="keyboard-shortcut">
                    <kbd>R</kbd>
                    <span>Return to main menu</span>
                  </div>
                </div>
              </div>
              <div className="keyboard-help-footer">
                <p>
                  <small>💡 Tip: These shortcuts work when you're not typing in input fields</small>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoard;
