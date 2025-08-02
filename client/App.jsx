import React, { useState, useEffect } from "react";
import GameSelection from "./components/lobby/GameSelection";
import GameBoard from "./components/games/GameBoard";
import AuthModal from "./components/auth/AuthModal";
import UserProfile from "./components/auth/UserProfile";
import socketService from "./services/socket";
import authService from "./services/authService";
import imagePreloader from "./services/imagePreloader";
import gameStateCache from "./services/gameStateCache";
import "./App.css";

// Import game registrations
import "./games/vetrolisci/index.js";
import "./games/connect4/index.js";

function App() {
  const [appState, setAppState] = useState("auth"); // 'auth', 'menu', 'game-selection', 'waiting', 'playing', 'finished'
  const [selectedGame, setSelectedGame] = useState(null);
  const [user, setUser] = useState(authService.getCurrentUser());
  const [gameInfo, setGameInfo] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [currentGameState, setCurrentGameState] = useState(null);
  const [currentDraftState, setCurrentDraftState] = useState(null);
  const [imagesPreloaded, setImagesPreloaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Check authentication status on app start
  useEffect(() => {
    const initializeAuth = async () => {
      if (authService.isAuthenticated()) {
        try {
          // Verify token is still valid
          const isValid = await authService.verifyToken();
          if (isValid) {
            setUser(authService.getCurrentUser());
            setAppState("menu");
          } else {
            setAppState("auth");
            setShowAuthModal(true);
          }
        } catch (error) {
          console.error('Auth verification failed:', error);
          setAppState("auth");
          setShowAuthModal(true);
        }
      } else {
        setAppState("auth");
        setShowAuthModal(true);
      }
    };

    initializeAuth();

    // Listen for auth expiration
    const handleAuthExpired = () => {
      setUser(null);
      setAppState("auth");
      setShowAuthModal(true);
    };

    window.addEventListener('auth-expired', handleAuthExpired);
    return () => window.removeEventListener('auth-expired', handleAuthExpired);
  }, []);

  // Update page title based on app state
  useEffect(() => {
    if (appState === "auth") {
      document.title = "Welcome - The Gaming Nook";
    } else if (appState === "menu") {
      document.title = "The Gaming Nook - Choose Your Adventure";
    } else if (appState === "game-selection") {
      document.title = "Game Selection - The Gaming Nook";
    } else if (appState === "waiting") {
      document.title = `Waiting for Player - ${selectedGame?.displayName || 'Game'}`;
    } else if (appState === "playing" && currentGameState && selectedGame) {
      const isMyTurn = currentDraftState?.pickOrder[currentDraftState.currentPickIndex] === gameInfo?.playerIndex;
      if (isMyTurn) {
        document.title = `Your Turn - ${selectedGame.displayName}`;
      } else {
        document.title = `Playing - ${selectedGame.displayName}`;
      }
    }
  }, [appState, currentGameState, currentDraftState, gameInfo?.playerIndex, selectedGame]);

  useEffect(() => {
    // Check for cached game state on app start
    const cachedState = gameStateCache.loadGameState();
    if (cachedState) {
      console.log("Restoring game from cache:", cachedState);
      setAppState("playing");
      setGameInfo(cachedState.gameInfo);
      setCurrentGameState(cachedState.gameState);
      setCurrentDraftState(cachedState.draftState);
      // Note: We'll need to restore the selected game as well
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
      setAppState("playing");
      setGameInfo((prevInfo) => ({ ...prevInfo, ...game }));
    });

    // Handle player disconnection
    socketService.onPlayerDisconnected((playerIndex) => {
      console.log("Player disconnected:", playerIndex);
      gameStateCache.clearGameState(); // Clear cache when game ends
      alert("The other player has disconnected. Returning to game selection.");
      setAppState("game-selection");
      setGameInfo(null);
      setSelectedGame(null);
    });

    // Handle page unload/refresh
    const handleBeforeUnload = () => {
      console.log('Page unloading, disconnecting socket');
      socketService.disconnect();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      console.log('App component unmounting, disconnecting socket');
      window.removeEventListener('beforeunload', handleBeforeUnload);
      socketService.disconnect();
    };
  }, []);

  // Cache game state when playing and state changes
  useEffect(() => {
    if (appState === "playing" && gameInfo && currentGameState) {
      gameStateCache.saveGameState(currentGameState, gameInfo, currentDraftState);
    } else if (appState === "menu" || appState === "finished") {
      gameStateCache.clearGameState();
    }
  }, [appState, gameInfo, currentGameState, currentDraftState]);

  const handleReturnToMenu = () => {
    console.log("Returning to main menu");
    gameStateCache.clearGameState();
    setAppState("menu");
    setGameInfo(null);
    setCurrentGameState(null);
    setCurrentDraftState(null);
    setSelectedGame(null);
  };

  const handleReturnToGameSelection = () => {
    console.log("Returning to game selection");
    gameStateCache.clearGameState();
    setAppState("game-selection");
    setGameInfo(null);
    setCurrentGameState(null);
    setCurrentDraftState(null);
    setSelectedGame(null);
  };

  const handleAuthSuccess = (authenticatedUser) => {
    setUser(authenticatedUser);
    // Skip menu for guest users, go directly to game selection
    if (authenticatedUser.isGuest) {
      setAppState("game-selection");
    } else {
      setAppState("menu");
    }
    setShowAuthModal(false);
  };

  const handleLogout = () => {
    setUser(null);
    setAppState("auth");
    setShowAuthModal(true);
    // Clear any active game state
    gameStateCache.clearGameState();
    setCurrentGameState(null);
    setCurrentDraftState(null);
    setGameInfo(null);
    setSelectedGame(null);
  };

  const handleGameSelect = async (game) => {
    setSelectedGame(game);
    
    if (user) {
      if (!socketService.isConnected()) {
        alert("Connection lost. Please refresh the page and try again.");
        return;
      }
      
      try {
        setAppState("waiting");
        // Pass the selected game type and auth token to the server
        const { gameId, playerIndex } = await socketService.joinGame(
          user.username, 
          game.id, 
          authService.getToken()
        );
        console.log("Joined game successfully:", { gameId, playerIndex, gameType: game.id });
        setGameInfo({ gameId, playerIndex, gameType: game.id });
      } catch (error) {
        console.error("Failed to join game:", error);
        alert("Failed to join game. Please try again.");
        setAppState("game-selection");
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

  // Authentication Screen
  if (appState === "auth") {
    return (
      <div className="app">
        <div className="menu">
          <div className="menu-content">
            <div className="title-with-logo">
              <img src="/icons/favicon.svg" alt="The Gaming Nook Logo" className="logo" />
              <h1>The Gaming Nook</h1>
            </div>
            <p>Your destination for strategic 2-player games</p>
            
            <div className="connection-status">
              <div className="status-content">
                <span>Status: {connectionStatus === "connected" ? "🟢 Connected" : "🔴 Disconnected"}</span>
                {connectionStatus !== "connected" && (
                  <button className="refresh-button" onClick={() => window.location.reload()} title="Refresh page">
                    <img src="/icons/refresh.svg" alt="Refresh" width="16" height="16" />
                  </button>
                )}
              </div>
              {!imagesPreloaded && <div>🖼️ Loading images...</div>}
            </div>

            {/* Integrated Auth Form */}
            <AuthModal
              isOpen={true}
              onClose={() => {
                // Don't allow closing if not authenticated
                if (authService.isAuthenticated()) {
                  setShowAuthModal(false);
                }
              }}
              onAuthSuccess={handleAuthSuccess}
              defaultMode="guest"
              embedded={true}
            />
          </div>
        </div>
      </div>
    );
  }

  // Main Menu - Authenticated User
  if (appState === "menu") {
    return (
      <div className="app">
        <div className="menu">
          <div className="menu-content">
            <div className="title-with-logo">
              <img src="/icons/favicon.svg" alt="The Gaming Nook Logo" className="logo" />
              <h1>The Gaming Nook</h1>
            </div>
            <p>Your destination for strategic 2-player games</p>
            
            <div className="user-welcome">
              <p>Welcome back, <strong>{user?.username}</strong>!</p>
              {authService.isGuest() && (
                <p className="guest-notice">
                  Playing as guest - <button onClick={() => setShowAuthModal(true)}>Create account</button> to save progress
                </p>
              )}
            </div>

            <div className="connection-status">
              <div className="status-content">
                <span>Status: {connectionStatus === "connected" ? "🟢 Connected" : "🔴 Disconnected"}</span>
                {connectionStatus !== "connected" && (
                  <button className="refresh-button" onClick={() => window.location.reload()} title="Refresh page">
                    <img src="/icons/refresh.svg" alt="Refresh" width="16" height="16" />
                  </button>
                )}
              </div>
              {!imagesPreloaded && <div>🖼️ Loading images...</div>}
            </div>

            <div className="menu-actions">
              <button
                onClick={() => setAppState("game-selection")}
                disabled={connectionStatus !== "connected"}
                className="play-button"
                title={connectionStatus !== "connected" ? "Waiting for connection..." : "Browse and play games"}
              >
                Play Games
              </button>
              
              <div className="menu-secondary-actions">
                <button onClick={() => setShowProfile(true)} className="profile-button">
                  View Profile
                </button>
                <button onClick={handleLogout} className="logout-button">
                  {authService.isGuest() ? 'Switch User' : 'Logout'}
                </button>
              </div>
            </div>

            <div className="version-footer">
              <small>
                Copyright &copy; 2025 &mdash; The Gaming Nook <span className="connection-status">v2.0.0</span>
              </small>
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

        {/* Auth Modal */}
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onAuthSuccess={handleAuthSuccess}
        />

        {/* User Profile Modal */}
        {showProfile && (
          <UserProfile
            user={user}
            onClose={() => setShowProfile(false)}
            onLogout={handleLogout}
          />
        )}
      </div>
    );
  }

  // Game Selection Screen
  if (appState === "game-selection") {
    return (
      <div className="app">
        <div className="game-selection-container">
          <GameSelection 
            onGameSelect={handleGameSelect} 
            user={user}
          />
          <button 
            className="back-button"
            onClick={handleReturnToMenu}
            style={{
              position: "absolute",
              top: "20px",
              left: "20px",
              background: "rgba(255, 255, 255, 0.15)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "8px",
              padding: "10px 15px",
              cursor: "pointer",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
          >
            ← Back to Menu
          </button>
          
          <button 
            className="profile-button"
            onClick={() => setShowProfile(true)}
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              background: "rgba(255, 255, 255, 0.15)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "8px",
              padding: "10px 15px",
              cursor: "pointer",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
          >
            {user?.username}
          </button>
        </div>

        {/* User Profile Modal */}
        {showProfile && (
          <UserProfile
            user={user}
            onClose={() => setShowProfile(false)}
            onLogout={handleLogout}
          />
        )}
      </div>
    );
  }

  // Waiting for Player Screen
  if (appState === "waiting") {
    return (
      <div className="app">
        <div className="waiting">
          <div className="waiting-content">
            <div className="title-with-logo">
              <img src={selectedGame?.thumbnail || "/icons/favicon.svg"} alt="Game Logo" className="logo" />
              <h1>{selectedGame?.displayName || "Game"}</h1>
            </div>
            <div className="spinner">⟳</div>
            <h2>
              Waiting for another player
              <span className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </span>
            </h2>
            <p>Game ID: {gameInfo?.gameId}</p>
            <p>You are Player {(gameInfo?.playerIndex || 0) + 1}</p>
            <button
              onClick={() => {
                socketService.disconnect();
                setAppState("game-selection");
                setGameInfo(null);
                setSelectedGame(null);
              }}
              title="Return to game selection"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Game Playing Screen
  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-left">
          <h1 style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <img
              src={selectedGame?.thumbnail || "/icons/favicon.svg"}
              alt="Game logo"
              width={24}
              height={24}
              style={{ marginTop: "-5px" }}
            />
            {selectedGame?.displayName || "Game"}
          </h1>
          <p>
            Player: {user?.username} | Game: {gameInfo?.gameId}
          </p>
        </div>
        <div className="app-header-right">
          <GameInfo gameState={currentGameState} draftState={currentDraftState} />
        </div>

        {/* Floating turn indicator in center bottom */}
        {currentDraftState && (
          <HeaderTurnIndicator
            isMyTurn={currentDraftState.pickOrder[currentDraftState.currentPickIndex] === gameInfo?.playerIndex}
            opponentName={
              currentGameState?.players[currentDraftState.pickOrder[currentDraftState.currentPickIndex]]?.name
            }
          />
        )}
      </header>

      <GameBoard
        user={user}
        gameInfo={gameInfo}
        socketService={socketService}
        onGameStateChange={setCurrentGameState}
        onDraftStateChange={setCurrentDraftState}
        onReturnToMenu={handleReturnToGameSelection}
        hideScoreBoard={true}
        hideTurnIndicator={true}
      />
    </div>
  );
}

// HeaderTurnIndicator and waiting synonyms
const WAITING_SYNONYMS = [
  "Summoning",
  "Consulting the oracle for",
  "Staring intensely at",
  "Manifesting a move from",
  "Politely nudging",
];

const YOUR_TURN_SYNONYMS = [
  "Your moment of glory!",
  "It's showtime!",
  "The spotlight's on you!",
  "Unleash your strategy!",
  "Your move, maestro!",
];

function HeaderTurnIndicator({ isMyTurn, opponentName }) {
  const waitingPhrase = React.useMemo(() => {
    if (!opponentName) return "Waiting for";
    const idx = Math.floor(Math.random() * WAITING_SYNONYMS.length);
    return WAITING_SYNONYMS[idx];
  }, [opponentName]);

  const yourTurnPhrase = React.useMemo(() => {
    const idx = Math.floor(Math.random() * YOUR_TURN_SYNONYMS.length);
    return YOUR_TURN_SYNONYMS[idx];
  }, [isMyTurn]);

  return (
    <div className="header-turn-indicator">
      {isMyTurn ? (
        <>{yourTurnPhrase}</>
      ) : (
        <>
          {`${waitingPhrase} ${opponentName}`}
          <span className="loading-dots">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </>
      )}
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