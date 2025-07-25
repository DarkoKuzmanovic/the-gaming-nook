import React, { useState, useEffect } from "react";
import GameBoard from "./components/GameBoard";
import ScoreBoard from "./components/ScoreBoard";
import socketService from "./services/socket";
import "./App.css";

function App() {
  const [gameState, setGameState] = useState("menu"); // 'menu', 'waiting', 'playing', 'finished'
  const [playerName, setPlayerName] = useState("");
  const [gameInfo, setGameInfo] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [currentGameState, setCurrentGameState] = useState(null);
  const [currentDraftState, setCurrentDraftState] = useState(null);

  useEffect(() => {
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
      alert("The other player has disconnected. Returning to menu.");
      setGameState("menu");
      setGameInfo(null);
    });

    return () => {
      socketService.disconnect();
    };
  }, []);

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

  if (gameState === "menu") {
    return (
      <div className="app">
        <div className="menu">
          <div className="menu-content">
            <h1>Vetrolisci</h1>
            <p>A strategic card placement game for 2 players</p>
            <div className="connection-status">
              Status: {connectionStatus === "connected" ? "🟢 Connected" : "🔴 Disconnected"}
            </div>
            <div className="menu-form">
              <input
                type="text"
                placeholder="Enter your name"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && startGame()}
              />
              <button onClick={startGame} disabled={!playerName.trim() || connectionStatus !== "connected"}>
                Find Game
              </button>
            </div>
            <p className="instructions">Enter your name and click "Find Game" to be matched with another player</p>
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
      <p>Phase: {draftState ? (draftState.phase === "reveal" ? "Revealing Cards" : "Pick & Place") : "Waiting"}</p>
      <p>Deck: {gameState.deck?.length || 0} cards</p>
    </div>
  );
};

export default App;
