import React, { useState, useEffect } from "react";
import GameGrid from "./GameGrid";
import Card from "./Card";
import CardChoiceModal from "./CardChoiceModal";
import RoundCompleteModal from "./RoundCompleteModal";
import ScoreBoard from "./ScoreBoard";
import { PlacementScenario, determinePlacementScenario, getPickableCards } from "../game/placement";
import AudioService from "../services/audio";
import "./GameBoard.css";

const GameBoard = ({
  playerName = "Player 1",
  gameInfo,
  socketService,
  onGameStateChange,
  onDraftStateChange,
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
  const [showRoundComplete, setShowRoundComplete] = useState(false);
  const [roundCompleteData, setRoundCompleteData] = useState(null);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const [animatingCards, setAnimatingCards] = useState(new Set());
  const [placingCards, setPlacingCards] = useState(new Set());
  const [revealingCards, setRevealingCards] = useState(false);
  const [revealedCardIds, setRevealedCardIds] = useState(new Set());
  const [flyingCards, setFlyingCards] = useState(new Map());
  const [newlyPlacedCards, setNewlyPlacedCards] = useState(new Set());
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const playerIndex = gameInfo?.playerIndex || 0;

  // Effect to handle staggered card reveal animation
  useEffect(() => {
    if (draftState && draftState.revealedCards && draftState.revealedCards.length > 0) {
      const currentCardIds = new Set(draftState.revealedCards.map(card => card.id));
      const previousCardIds = revealedCardIds;
      
      // Check if we have new cards to reveal
      const newCards = draftState.revealedCards.filter(card => !previousCardIds.has(card.id));
      
      if (newCards.length > 0) {
        setRevealingCards(true);
        setRevealedCardIds(new Set());
        
        // Stagger the reveal of each card
        newCards.forEach((card, index) => {
          setTimeout(() => {
            setRevealedCardIds(prev => new Set([...prev, card.id]));
          }, index * 200); // 200ms delay between each card
        });
        
        // End revealing state after all cards are shown
        setTimeout(() => {
          setRevealingCards(false);
          setRevealedCardIds(currentCardIds);
        }, newCards.length * 200 + 500);
      } else if (!revealingCards) {
        // If not revealing and no new cards, make sure all current cards are marked as revealed
        setRevealedCardIds(currentCardIds);
      }
    }
  }, [draftState?.revealedCards, revealingCards]);

  // Initialize audio when component mounts
  useEffect(() => {
    // Play place_cards sound when game board loads
    if (soundEnabled) {
      AudioService.playSound('placeCards');
    }
    
    // Start background music
    if (musicEnabled) {
      AudioService.startBackgroundMusic();
    }
    
    return () => {
      // Stop music when component unmounts
      AudioService.stopBackgroundMusic();
    };
  }, []);

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

        // Play card sound effect
      if (soundEnabled) {
        AudioService.playSound('playCard');
      }

        // Trigger placement animation for the placed card
        if (placedCard) {
          setPlacingCards(prev => new Set([...prev, placedCard.id]));
          setNewlyPlacedCards(prev => new Set([...prev, placedCard.id]));
          
          // Clear placement animation after duration
          setTimeout(() => {
            setPlacingCards(prev => {
              const newSet = new Set(prev);
              newSet.delete(placedCard.id);
              return newSet;
            });
          }, 600);
          
          // Clear fade-in animation after duration
          setTimeout(() => {
            setNewlyPlacedCards(prev => {
              const newSet = new Set(prev);
              newSet.delete(placedCard.id);
              return newSet;
            });
          }, 500);
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
      ({ playerIndex: placingPlayer, cardId, gridIndex, choice, newGrid, currentPlayer, placementResult }) => {
        console.log(`Player ${placingPlayer} placed card ${cardId}`);

        // Play card sound effect
         if (soundEnabled) {
           AudioService.playSound('playCard');
         }

        // Add fade-in animation for the placed card
        setNewlyPlacedCards(prev => new Set([...prev, cardId]));
        
        // Clear fade-in animation after duration
        setTimeout(() => {
          setNewlyPlacedCards(prev => {
            const newSet = new Set(prev);
            newSet.delete(cardId);
            return newSet;
          });
        }, 500);

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
            newPlayers[playerIndex].scores[roundNumber] = score;
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
      return;
    }

    // Find the picked card
    const pickedCard = draftState.revealedCards.find((card) => card.id === cardId);
    if (!pickedCard) return;

    // Start pick animation
    setAnimatingCards(prev => new Set([...prev, cardId]));

    // Play card sound effect
    if (soundEnabled) {
      AudioService.playSound('playCard');
    }

    // Start fade out animation for the drafted card
    setFlyingCards(prev => new Map([...prev, [cardId, { fadeOut: true }]]));

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
      } else {
        // Send pick-and-place to server immediately
        socketService.pickCard(cardId);
      }
      
      // Clear animation state
      setAnimatingCards(prev => {
        const newSet = new Set(prev);
        newSet.delete(cardId);
        return newSet;
      });
      setFlyingCards(prev => {
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

  const handleRoundContinue = () => {
    setShowRoundComplete(false);
    setRoundCompleteData(null);
  };

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
                
                const fadeData = flyingCards.get(cardData.id);
                const isFadingOut = fadeData?.fadeOut;
                
                const cardClass = `revealed-card ${canPick ? "can-pick" : "waiting"} ${isAnimating ? "card-picking" : ""} ${isFadingOut ? "card-fade-out" : ""} ${!isRevealed ? "card-revealing" : ""}`;
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
                      animationDelay: !isRevealed ? `${index * 200}ms` : '0ms'
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
                    />
                    {!cardData.pickable.canPick && isRevealed && (
                      <div className="card-restriction-overlay">
                        {cardData.pickable.reason === "already_validated" ? "🚫" : "⬇️"}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
          {!hideTurnIndicator && (
            <div className="turn-indicator">
              {draftState.pickOrder[draftState.currentPickIndex] === playerIndex
                ? "Your turn to pick!"
                : `Waiting for ${gameState.players[draftState.pickOrder[draftState.currentPickIndex]]?.name}...`}
            </div>
          )}
        </div>
      )}

      {/* Game Grids */}
      <div className="game-grids">
        <div className="player-grid-section">
          <h3>Your Grid ({gameState.players[playerIndex].name})</h3>
          <GameGrid
            grid={gameState.players[playerIndex].grid}
            onCardPlace={handleCardPlace}
            canPlace={false} // Placement happens automatically after pick
            selectedCard={gameState.selectedCard}
            placingCards={placingCards}
            newlyPlacedCards={newlyPlacedCards}
          />
        </div>

        <div className="opponent-grid-section">
          <h3>Opponent Grid ({gameState.players[1 - playerIndex].name})</h3>
          <GameGrid
            grid={gameState.players[1 - playerIndex].grid}
            onCardPlace={() => {}}
            canPlace={false}
            isOpponent={true}
            placingCards={placingCards}
            newlyPlacedCards={newlyPlacedCards}
          />
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

      <RoundCompleteModal
        isOpen={showRoundComplete}
        roundNumber={roundCompleteData?.roundNumber}
        roundScores={roundCompleteData?.roundScores}
        nextRound={roundCompleteData?.nextRound}
        onContinue={handleRoundContinue}
      />

      {/* Audio control buttons */}
      <button 
        className="header-score-button audio-toggle-button" 
        onClick={() => setSoundEnabled(!soundEnabled)} 
        title={soundEnabled ? "Disable Sound Effects" : "Enable Sound Effects"}
        style={{ bottom: '220px' }}
      >
        <img 
          src="/effects.svg" 
          alt="Sound Effects" 
          style={{ 
            width: '30px', 
            height: '30px',
            opacity: soundEnabled ? 1 : 0.5 
          }} 
        />
      </button>

      <button 
        className="header-score-button audio-toggle-button" 
        onClick={() => setMusicEnabled(!musicEnabled)} 
        title={musicEnabled ? "Disable Music" : "Enable Music"}
        style={{ bottom: '150px' }}
      >
        <img 
          src="/music.svg" 
          alt="Music" 
          style={{ 
            width: '30px', 
            height: '30px',
            opacity: musicEnabled ? 1 : 0.5 
          }} 
        />
      </button>

      {/* Floating scoreboard button */}
      <button className="header-score-button scoreboard-button" onClick={() => setShowScoreModal(true)} title="View Scoreboard" style={{ bottom: '80px' }}>
        <img src="/scoreboard.svg" alt="Scoreboard" style={{ width: '30px', height: '30px' }} />
      </button>

      {/* Scoreboard Modal */}
      {showScoreModal && (
        <div className="score-modal-overlay" onClick={() => setShowScoreModal(false)}>
          <div className="score-modal-content" onClick={(e) => e.stopPropagation()}>
            <ScoreBoard players={gameState.players} currentRound={gameState.currentRound} onClose={() => setShowScoreModal(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoard;
