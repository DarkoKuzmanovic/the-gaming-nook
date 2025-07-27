import React, { useState, useEffect } from "react";
import GameBoard from "./components/GameBoard";
import ScoreBoard from "./components/ScoreBoard";
import socketService from "./services/socket";
import imagePreloader from "./services/imagePreloader";
import gameStateCache from "./services/gameStateCache";
import "./App.css";

function App() {
  const [gameState, setGameState] = useState("menu"); // 'menu', 'waiting', 'playing', 'finished'
  const [playerName, setPlayerName] = useState(() => {
    // Load saved player name from localStorage
    return localStorage.getItem("vetrolisci-player-name") || "";
  });
  const [gameInfo, setGameInfo] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [currentGameState, setCurrentGameState] = useState(null);
  const [currentDraftState, setCurrentDraftState] = useState(null);
  const [imagesPreloaded, setImagesPreloaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Update page title based on game state
  useEffect(() => {
    if (gameState === "menu") {
      document.title = "Vetrolisci - Digital Pixies Card Game";
    } else if (gameState === "waiting") {
      document.title = "Waiting for Player - Vetrolisci";
    } else if (gameState === "playing" && currentGameState) {
      const isMyTurn = currentDraftState?.pickOrder[currentDraftState.currentPickIndex] === gameInfo?.playerIndex;
      if (isMyTurn) {
        document.title = `Your Turn - Round ${currentGameState.currentRound} - Vetrolisci`;
      } else {
        document.title = `Round ${currentGameState.currentRound} - Vetrolisci`;
      }
    }
  }, [gameState, currentGameState, currentDraftState, gameInfo?.playerIndex]);

  // Save player name to localStorage whenever it changes
  useEffect(() => {
    if (playerName.trim()) {
      localStorage.setItem("vetrolisci-player-name", playerName.trim());
    }
  }, [playerName]);

  useEffect(() => {
    // Check for cached game state on app start
    const cachedState = gameStateCache.loadGameState();
    if (cachedState) {
      console.log("Restoring game from cache:", cachedState);
      setGameState("playing");
      setGameInfo(cachedState.gameInfo);
      setCurrentGameState(cachedState.gameState);
      setCurrentDraftState(cachedState.draftState);
      // Note: We'll need to reconnect to the socket with the cached game ID
    }

    // Preload card images on app start
    imagePreloader
      .preloadAllCardImages()
      .then((result) => {
        console.log("Card images preloaded:", result);
        setImagesPreloaded(true);
      })
      .catch((error) => {
        console.error("Failed to preload images:", error);
        setImagesPreloaded(true); // Continue anyway
      });

    // Connect to server on app start
    const socket = socketService.connect();

    socket.on("connect", () => {
      console.log("Socket connected");
      setConnectionStatus("connected");
    });

    socket.on("disconnect", () => {
      console.log("Socket disconnected");
      setConnectionStatus("disconnected");
    });

    // Handle game started event
    socketService.onGameStarted((game) => {
      console.log("Game started event received:", game);
      setGameState("playing");
      setGameInfo((prevInfo) => ({ ...prevInfo, ...game }));
    });

    // Handle player disconnection
    socketService.onPlayerDisconnected((playerIndex) => {
      console.log("Player disconnected:", playerIndex);
      gameStateCache.clearGameState(); // Clear cache when game ends
      alert("The other player has disconnected. Returning to menu.");
      setGameState("menu");
      setGameInfo(null);
    });

    return () => {
      socketService.disconnect();
    };
  }, []);

  // Cache game state when playing and state changes
  useEffect(() => {
    if (gameState === "playing" && gameInfo && currentGameState) {
      gameStateCache.saveGameState(currentGameState, gameInfo, currentDraftState);
    } else if (gameState === "menu" || gameState === "finished") {
      gameStateCache.clearGameState();
    }
  }, [gameState, gameInfo, currentGameState, currentDraftState]);

  const startGame = async () => {
    if (playerName.trim() && socketService.isConnected()) {
      try {
        setGameState("waiting");
        const { gameId, playerIndex } = await socketService.joinGame(playerName.trim());
        console.log("Joined game successfully:", { gameId, playerIndex });
        setGameInfo({ gameId, playerIndex });

        // If this is the second player, the game will start automatically
        // If this is the first player, we wait for another player
      } catch (error) {
        console.error("Failed to join game:", error);
        alert("Failed to join game. Please try again.");
        setGameState("menu");
      }
    }
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

  if (gameState === "menu") {
    return (
      <div className="app">
        <div className="menu">
          <div className="menu-content">
            <h1>Vetrolisci</h1>
            <p>A strategic card placement game for 2 players</p>
            <div className="connection-status">
              Status: {connectionStatus === "connected" ? "🟢 Connected" : "🔴 Disconnected"}
              {!imagesPreloaded && <div>🖼️ Loading images...</div>}
            </div>
            <div className="menu-form">
              <input
                type="text"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && startGame()}
              />
              <button
                onClick={startGame}
                disabled={!playerName.trim() || connectionStatus !== "connected"}
                title={
                  connectionStatus !== "connected" ? "Waiting for connection..." : "Start searching for another player"
                }
              >
                Find Game
              </button>
            </div>
            <p className="instructions">Enter your name and click "Find Game" to be matched with another player</p>
            <div className="version-footer">
              <small>v1.0.0</small>
              <button
                onClick={toggleFullscreen}
                title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                style={{
                  position: "absolute",
                  top: "20px",
                  right: "20px",
                  background: "rgba(255, 255, 255, 0.15)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "8px",
                  padding: "10px",
                  cursor: "pointer",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                }}
              >
                <img src="/icons/fullscreen.png" alt="Fullscreen" style={{ width: "20px", height: "20px" }} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === "waiting") {
    return (
      <div className="app">
        <div className="waiting">
          <div className="waiting-content">
            <h1>Vetrolisci</h1>
            <div className="spinner">⟳</div>
            <h2>Waiting for another player...</h2>
            <p>Game ID: {gameInfo?.gameId}</p>
            <p>You are Player {(gameInfo?.playerIndex || 0) + 1}</p>
            <button
              onClick={() => {
                socketService.disconnect();
                setGameState("menu");
                setGameInfo(null);
              }}
              title="Return to main menu"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-left">
          <h1>Vetrolisci</h1>
          <p>
            Player: {playerName} | Game: {gameInfo?.gameId}
          </p>
        </div>
        <div className="app-header-right">
          <GameInfo gameState={currentGameState} draftState={currentDraftState} />
        </div>

        {/* Floating turn indicator in center bottom */}
        {currentDraftState && (
          <div className="header-turn-indicator">
            {currentDraftState.pickOrder[currentDraftState.currentPickIndex] === gameInfo?.playerIndex
              ? "Your turn to pick!"
              : `Waiting for ${
                  currentGameState?.players[currentDraftState.pickOrder[currentDraftState.currentPickIndex]]?.name
                }...`}
          </div>
        )}
      </header>

      <GameBoard
        playerName={playerName}
        gameInfo={gameInfo}
        socketService={socketService}
        onGameStateChange={setCurrentGameState}
        onDraftStateChange={setCurrentDraftState}
        hideScoreBoard={true}
        hideTurnIndicator={true}
      />
    </div>
  );
}

// Game info component to be used in header
const GameInfo = ({ gameState, draftState }) => {
  if (!gameState) {
    return (
      <div className="game-info-inline">
        <h2>Loading...</h2>
      </div>
    );
  }

  return (
    <div className="game-info-inline">
      <h2>Round {gameState.currentRound}/3</h2>
      <p>Turn: {gameState.players[gameState.currentPlayer]?.name}</p>
    </div>
  );
};

export default App;
