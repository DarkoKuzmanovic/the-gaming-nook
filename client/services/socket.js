// Socket.io client service for multiplayer functionality
import { io } from "socket.io-client";

class SocketService {
  constructor() {
    this.socket = null;
    this.gameId = null;
    this.playerIndex = null;
    this.connected = false;
  }

  connect() {
    // Prevent multiple connections
    if (this.socket && this.socket.connected) {
      console.log('Socket already connected, reusing existing connection');
      return this.socket;
    }
    
    // Disconnect any existing socket first
    if (this.socket) {
      console.log('Disconnecting existing socket before creating new one');
      this.socket.disconnect();
    }
    
    // Dynamically determine server URL based on current host
    const serverUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:8001'
      : `http://${window.location.hostname}:8001`;
    
    console.log('Connecting to server:', serverUrl);
    this.socket = io(serverUrl);

    this.socket.on("connect", () => {
      console.log("Connected to server:", this.socket.id);
      this.connected = true;
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from server");
      this.connected = false;
    });

    this.socket.on("error", (error) => {
      console.error("Socket error:", error);
    });

    return this.socket;
  }

  joinGame(playerName, gameType = 'vetrolisci', authToken = null) {
    if (!this.socket) {
      console.error("No socket connection");
      return Promise.reject(new Error("No socket connection"));
    }

    return new Promise((resolve, reject) => {
      const data = { playerName, gameType, authToken };
      console.log("Emitting join-game with:", { playerName, gameType, hasToken: !!authToken });
      this.socket.emit("join-game", data);

      const timeoutId = setTimeout(() => {
        console.error("Join game timeout");
        reject(new Error("Join game timeout"));
      }, 10000);

      this.socket.once("game-joined", ({ gameId, playerIndex }) => {
        clearTimeout(timeoutId); // Clear timeout on success
        this.gameId = gameId;
        this.playerIndex = playerIndex;
        console.log(`Successfully joined game ${gameId} as player ${playerIndex}`);
        resolve({ gameId, playerIndex });
      });
    });
  }

  // Draft phase events
  onGameStarted(callback) {
    if (!this.socket) return;
    this.socket.on("game-started", callback);
  }

  onDraftStarted(callback) {
    if (!this.socket) return;
    // Remove any existing listeners first to prevent duplicates
    this.socket.off("draft-started");
    this.socket.on("draft-started", callback);
  }

  onCardPicked(callback) {
    if (!this.socket) return;
    // Remove any existing listeners first to prevent duplicates
    this.socket.off("card-picked");
    this.socket.on("card-picked", callback);
  }

  onCardPickedAndPlaced(callback) {
    if (!this.socket) return;
    // Remove any existing listeners first to prevent duplicates
    this.socket.off("card-picked-and-placed");
    this.socket.on("card-picked-and-placed", callback);
  }

  onCardPickedPendingChoice(callback) {
    if (!this.socket) return;
    // Remove any existing listeners first to prevent duplicates
    this.socket.off("card-picked-pending-choice");
    this.socket.on("card-picked-pending-choice", callback);
  }

  onCardChoiceProcessed(callback) {
    if (!this.socket) return;
    // Remove any existing listeners first to prevent duplicates
    this.socket.off("card-choice-processed");
    this.socket.on("card-choice-processed", callback);
  }

  onCardPickedAndDiscarded(callback) {
    if (!this.socket) return;
    // Remove any existing listeners first to prevent duplicates
    this.socket.off("card-picked-and-discarded");
    this.socket.on("card-picked-and-discarded", callback);
  }

  onNewTurn(callback) {
    if (!this.socket) return;
    // Remove any existing listeners first to prevent duplicates
    this.socket.off("new-turn");
    this.socket.on("new-turn", callback);
  }

  onDraftComplete(callback) {
    if (!this.socket) return;
    // Remove any existing listeners first to prevent duplicates
    this.socket.off("draft-complete");
    this.socket.on("draft-complete", callback);
  }

  // Emit events - startDraft removed as cards are now automatically revealed

  pickCard(cardId, choice, position) {
    if (!this.socket) return;
    this.socket.emit("pick-card", {
      gameId: this.gameId,
      playerIndex: this.playerIndex,
      cardId,
      choice,
      position,
    });
  }

  sendCardChoice(cardId, choice, position) {
    if (!this.socket) return;
    
    this.socket.emit("card-choice", {
      cardId,
      choice,
      position
    });
  }

  // Note: placeCard removed - cards placed immediately via pickCard
  // No separate placement phase exists in real Vetrolisci game

  // Note: onCardPlaced removed - cards placed immediately via pick-card events
  // No separate card-placed events exist in real Vetrolisci game

  // Event cleanup methods
  removeAllListeners() {
    if (!this.socket) return;
    console.log("🧹 SOCKET: Removing all event listeners");
    this.socket.removeAllListeners("draft-started");
    this.socket.removeAllListeners("card-picked");
    this.socket.removeAllListeners("card-picked-and-placed");
    this.socket.removeAllListeners("card-picked-pending-choice");
    this.socket.removeAllListeners("card-choice-processed");
    this.socket.removeAllListeners("card-picked-and-discarded");
    this.socket.removeAllListeners("new-turn");
    this.socket.removeAllListeners("draft-complete");
    this.socket.removeAllListeners("round-complete");
    this.socket.removeAllListeners("game-complete");
  }

  // Round management events
  onRoundComplete(callback) {
    if (!this.socket) return;
    // Remove any existing listeners first to prevent duplicates
    this.socket.off("round-complete");
    this.socket.on("round-complete", callback);
  }

  onGameComplete(callback) {
    if (!this.socket) return;
    // Remove any existing listeners first to prevent duplicates
    this.socket.off("game-complete");
    this.socket.on("game-complete", callback);
  }

  // Player events
  onPlayerDisconnected(callback) {
    if (!this.socket) return;
    this.socket.on("player-disconnected", callback);
  }

  // Game state events
  onGameUpdate(callback) {
    if (!this.socket) return;
    this.socket.on("game-update", callback);
  }

  onDraftUpdate(callback) {
    if (!this.socket) return;
    this.socket.on("draft-update", callback);
  }

  disconnect() {
    if (this.socket) {
      console.log('Disconnecting socket:', this.socket.id);
      this.socket.removeAllListeners(); // Remove all event listeners
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.gameId = null;
      this.playerIndex = null;
    }
  }

  isConnected() {
    return this.connected && this.socket?.connected;
  }

  getPlayerIndex() {
    return this.playerIndex;
  }

  getGameId() {
    return this.gameId;
  }
}

// Export singleton instance
export default new SocketService();
