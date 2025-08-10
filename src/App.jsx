import React, { useState, useEffect } from "react";
import socketClient from "./shared/client/utils/socket-client.js";
import Modal from "./shared/client/components/Modal.jsx";
import Button from "./shared/client/components/Button.jsx";
import LoadingSpinner from "./shared/client/components/LoadingSpinner.jsx";
import VetrolisciGameBoard from "./games/vetrolisci/client/components/GameBoard.jsx";
import Connect4GameBoard from "./games/connect4/client/components/GameBoard.jsx";
import "./App.css";

function App() {
  const [currentView, setCurrentView] = useState("menu"); // 'menu', 'create', 'join', 'waiting', 'game'
  const [roomCode, setRoomCode] = useState("");
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentRoom, setCurrentRoom] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [gameData, setGameData] = useState(null);

  // Connect to server on app load
  useEffect(() => {
    const connect = async () => {
      try {
        setLoading(true);
        await socketClient.connect();
        setConnected(true);

        // Set up connection status listener
        socketClient.onConnectionStatus(({ connected, reconnected }) => {
          setConnected(connected);
          if (reconnected) {
            console.log("🔌 Reconnected to server");
          }
        });

        // Set up error handling
        socketClient.onError((error) => {
          setError(error.message || "An error occurred");
          setShowErrorModal(true);
        });

        // Listen for when players join
        socketClient.onPlayerJoined((data) => {
          console.log("👤 Player joined:", data);
        });

        // Listen for game started
        socketClient.on("game-started", (data) => {
          console.log("🚀 Game started for room:", data.room.code);

          // Find player index by socket ID
          let playerIndex = 0;
          if (data.room && data.room.players) {
            const myPlayer = data.room.players.find((p) => p.id === socketClient.getSocketId());
            if (myPlayer) {
              playerIndex = data.room.players.indexOf(myPlayer);
            }
          }

          console.log(`🎯 Joined as Player ${playerIndex} (${data.room.players[playerIndex]?.name})`);

          setGameData({
            roomCode: data.room.code,
            gameType: data.room.gameType,
            playerIndex: playerIndex,
            gameState: data.gameState,
          });
          setCurrentView("game");
        });

        // Listen for game state updates to keep header in sync
        socketClient.on("vetrolisci-game-state", (data) => {
          if (gameData) {
            setGameData((prev) => ({
              ...prev,
              gameState: data,
            }));
          }
        });
      } catch (err) {
        console.error("Failed to connect to server:", err);
        setError("Failed to connect to server. Please check your connection.");
        setShowErrorModal(true);
      } finally {
        setLoading(false);
      }
    };

    connect();

    // Cleanup on unmount
    return () => {
      socketClient.disconnect();
    };
  }, []);

  const handleCreateGame = () => {
    setCurrentView("create");
  };

  const handleJoinGame = () => {
    setCurrentView("join");
  };

  const handleBack = () => {
    setCurrentView("menu");
    setRoomCode("");
    setError("");
    setCurrentRoom(null);
    setGameData(null);
  };

  const handleCreateVetrolisciRoom = async () => {
    if (!connected) {
      setError("Not connected to server");
      setShowErrorModal(true);
      return;
    }

    try {
      setLoading(true);
      const response = await socketClient.emit("create-room", {
        gameType: "vetrolisci",
        playerName: "Host",
      });

      if (response.success) {
        setCurrentRoom(response);
        setRoomCode(response.roomCode);
        setCurrentView("waiting");
        console.log("🎮 Room created:", response.roomCode);
      } else {
        setError(response.error || "Failed to create room");
        setShowErrorModal(true);
      }
    } catch (err) {
      setError("Failed to create room. Please try again.");
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateConnect4Room = async () => {
    if (!connected) {
      setError("Not connected to server");
      setShowErrorModal(true);
      return;
    }

    try {
      setLoading(true);
      const response = await socketClient.emit("create-room", {
        gameType: "connect4",
        playerName: "Host",
      });

      if (response.success) {
        setCurrentRoom(response);
        setRoomCode(response.roomCode);
        setCurrentView("waiting");
        console.log("🔴 Connect 4 room created:", response.roomCode);
      } else {
        setError(response.error || "Failed to create room");
        setShowErrorModal(true);
      }
    } catch (err) {
      setError("Failed to create room. Please try again.");
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    console.log("🎯 JOIN ATTEMPT: Starting join process for room:", roomCode);

    if (!connected) {
      console.log("🎯 JOIN ATTEMPT: Not connected to server");
      setError("Not connected to server");
      setShowErrorModal(true);
      return;
    }

    if (roomCode.length !== 6) {
      console.log("🎯 JOIN ATTEMPT: Invalid room code length:", roomCode.length);
      setError("Please enter a valid 6-character room code");
      setShowErrorModal(true);
      return;
    }

    try {
      setLoading(true);
      console.log("🎯 JOIN ATTEMPT: Checking if room exists:", roomCode);

      // First check if room exists
      const checkResponse = await socketClient.checkRoom(roomCode);
      console.log("🎯 JOIN ATTEMPT: Check room response:", checkResponse);

      if (!checkResponse.success) {
        console.log("🎯 JOIN ATTEMPT: Room check failed:", checkResponse.error);
        setError(checkResponse.error || "Room not found");
        setShowErrorModal(true);
        setLoading(false);
        return;
      }

      console.log("🎯 JOIN ATTEMPT: Room exists, attempting to join...");
      // Join the room
      const joinResponse = await socketClient.joinRoom(roomCode, "Guest");
      console.log("🎯 JOIN ATTEMPT: Join response:", joinResponse);

      if (joinResponse.success) {
        setCurrentRoom(joinResponse);
        setCurrentView("waiting");
        console.log("👤 Successfully joined room:", roomCode);
      } else {
        console.log("🎯 JOIN ATTEMPT: Join failed:", joinResponse.error);
        setError(joinResponse.error || "Failed to join room");
        setShowErrorModal(true);
      }
    } catch (err) {
      console.log("🎯 JOIN ATTEMPT: Exception:", err);
      setError("Failed to join room. Please try again.");
      setShowErrorModal(true);
    } finally {
      setLoading(false);
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    // Could add a toast notification here
    console.log("📋 Room code copied to clipboard");
  };

  if (loading && currentView === "menu") {
    return (
      <div className="app">
        <LoadingSpinner size="large" text="Connecting to server..." />
      </div>
    );
  }

  return (
    <div className="app">
      {/* Hide header on main menu, game selection, join game, waiting room, and game screens for cleaner design */}
      {currentView !== "menu" && currentView !== "create" && currentView !== "join" && currentView !== "waiting" && currentView !== "game" && (
        <header className="app-header">
          <div className="header-left">
            {currentView === "game" && gameData ? (
              <>
                <h1>🎮 Vetrolisci</h1>
                <p>Room: {gameData.roomCode}</p>
              </>
            ) : (
              <>
                <h1>🎮 The Gaming Nook</h1>
                <p>Simple multiplayer games for friends</p>
              </>
            )}
          </div>

          <div className="header-center">
            {currentView === "game" && gameData?.gameState && (
              <>
                {/* Turn Indicator - show during draft phase */}
                {gameData.gameState.draftState && gameData.gameState.draftState.revealedCards && (
                  <div
                    className={`turn-indicator ${
                      gameData.gameState.currentPickingPlayer?.index === gameData.playerIndex ? "my-turn" : "waiting"
                    }`}
                  >
                    {gameData.gameState.currentPickingPlayer?.index === gameData.playerIndex ? (
                      <span className="my-turn-text">🎯 Your turn to pick!</span>
                    ) : (
                      <span className="waiting-text">
                        ⏳ Waiting for {gameData.gameState.currentPickingPlayer?.name || "Unknown"}
                        <span className="loading-dots">
                          <span></span>
                          <span></span>
                          <span></span>
                        </span>
                      </span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="header-right">
            {currentView === "game" && gameData?.gameState && gameData.gameType === "vetrolisci" && (
              <div className="game-progress">
                <div className="round-indicators">
                  {[1, 2, 3].map((round) => (
                    <div
                      key={round}
                      className={`round-indicator ${round === gameData.gameState.currentRound ? "current" : ""} ${
                        round < gameData.gameState.currentRound ? "completed" : ""
                      }`}
                    >
                      {round}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentView === "game" && gameData?.gameState && gameData.gameType === "connect4" && (
              <div className="game-progress">
                <div className="round-info">
                  {gameData.gameState.gameState === "playing" ? "In Progress" : 
                   gameData.gameState.gameState === "finished" ? "Game Over" : "Ready"}
                </div>
              </div>
            )}

            {!connected && <div className="connection-status offline">⚠️ Disconnected from server</div>}
          </div>
        </header>
      )}

      <main className="app-main">
        {currentView === "menu" && (
          <div className="menu">
            <div className="menu-title">
              <h1>🎮 Gaming Nook</h1>
              <p>Choose your next adventure</p>
            </div>
            
            <div className="menu-buttons">
              <Button variant="success" size="large" onClick={handleCreateGame} disabled={!connected}>
                Create Game
              </Button>

              <Button variant="primary" size="large" onClick={handleJoinGame} disabled={!connected}>
                Join Game
              </Button>
            </div>
            
            {/* Connection status for main menu */}
            {!connected && (
              <div className="menu-connection-status">
                ⚠️ Disconnected from server
              </div>
            )}
          </div>
        )}

        {currentView === "create" && (
          <div className="create-game">
            <div className="create-game-title">
              <h2>Select Game Type</h2>
              <p>Pick your game and create a room to play with friends</p>
            </div>
            <div className="game-selection">
              <button
                className="game-card-button"
                onClick={handleCreateVetrolisciRoom}
                disabled={loading || !connected}
              >
                <div className="game-card">
                  <div className="game-card-content">
                    <h3>Vetrolisci</h3>
                    <p>Card Strategy Game</p>
                  </div>
                </div>
              </button>
              <button
                className="game-card-button"
                onClick={handleCreateConnect4Room}
                disabled={loading || !connected}
              >
                <div className="game-card">
                  <div className="game-card-content">
                    <h3>Connect 4</h3>
                    <p>Classic Strategy Game</p>
                  </div>
                </div>
              </button>
            </div>
            <Button variant="outline" onClick={handleBack}>
              ← Back
            </Button>
          </div>
        )}

        {currentView === "join" && (
          <div className="join-game">
            <div className="join-game-title">
              <h2>Join Game</h2>
              <p>Enter your room code to join friends</p>
            </div>
            <div className="join-form">
              <input
                type="text"
                placeholder="Enter room code..."
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
                className="room-code-input"
                disabled={loading}
              />
              <Button
                variant="primary"
                size="large"
                onClick={handleJoinRoom}
                disabled={roomCode.length !== 6 || !connected}
                loading={loading}
              >
                Join Game
              </Button>
            </div>
            <Button variant="outline" onClick={handleBack}>
              ← Back
            </Button>
          </div>
        )}

        {currentView === "waiting" && (
          <div className="waiting-room">
            <div className="waiting-room-title">
              <h2>Room Created!</h2>
              <p>Share your room code and wait for friends to join</p>
            </div>

            <div className="room-code-share">
              <h3>Room Code</h3>
              <div className="room-code-display">
                <span className="room-code-text">{roomCode}</span>
                <Button variant="outline" size="small" onClick={copyRoomCode}>
                  📋
                </Button>
              </div>
            </div>

            <div className="room-info">
              <div className="room-info-section game-section">
                <div className="game-info">
                  <span className="game-icon">
                    {(currentRoom?.room?.gameType || currentRoom?.gameType) === 'vetrolisci' ? '🎴' : '🔴'}
                  </span>
                  <div className="game-details">
                    <span className="game-label">Playing</span>
                    <span className="game-name">{(currentRoom?.room?.gameType || currentRoom?.gameType) === 'vetrolisci' ? 'Vetrolisci' : 'Connect 4'}</span>
                  </div>
                </div>
              </div>
              <div className="room-info-section players-section">
                <div className="players-info">
                  <span className="players-label">Players</span>
                  <div className="players-progress">
                    <div className="player-slots">
                      <div className="player-slot filled">
                        <span className="player-icon">👤</span>
                      </div>
                      <div className={`player-slot ${(currentRoom?.room?.players?.length || 1) > 1 ? 'filled' : 'empty'}`}>
                        <span className="player-icon">{(currentRoom?.room?.players?.length || 1) > 1 ? '👤' : '⏳'}</span>
                      </div>
                    </div>
                    <span className="players-count">{currentRoom?.room?.players?.length || 1}/2</span>
                  </div>
                </div>
              </div>
            </div>

            <LoadingSpinner text="Waiting for another player to join..." />

            <Button variant="outline" onClick={handleBack}>
              Leave Room
            </Button>
          </div>
        )}

        {currentView === "game" && gameData && (
          <>
            {gameData.gameType === "vetrolisci" && (
              <VetrolisciGameBoard
                roomCode={gameData.roomCode}
                playerIndex={gameData.playerIndex}
                onBackToMenu={handleBack}
                showHeader={false}
                onGameStateUpdate={(gameState) => {
                  setGameData((prev) => ({ ...prev, gameState }));
                }}
              />
            )}
            {gameData.gameType === "connect4" && (
              <Connect4GameBoard
                roomCode={gameData.roomCode}
                playerIndex={gameData.playerIndex}
                onBackToMenu={handleBack}
                onGameStateUpdate={(gameState) => {
                  setGameData((prev) => ({ ...prev, gameState }));
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Error Modal */}
      <Modal isOpen={showErrorModal} onClose={() => setShowErrorModal(false)} title="Error">
        <p className="error-message">{error}</p>
        <div className="modal-actions">
          <Button onClick={() => setShowErrorModal(false)}>OK</Button>
        </div>
      </Modal>
    </div>
  );
}

export default App;
