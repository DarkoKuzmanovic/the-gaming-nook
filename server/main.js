import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import GameServerRegistry from './games/base/GameServerRegistry.js';

// Import game server implementations
import './games/vetrolisci/index.js';

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
app.use(express.static(path.join(__dirname, "../client/dist")));

// Game state storage - now supports multiple game types
const gameRooms = new Map(); // gameId -> { gameType, gameInstance, players, status }
const players = new Map();   // socketId -> { name, socket, currentGame }

// Socket.io connection handling
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Updated join-game to accept game type
  socket.on("join-game", (playerName, gameType = 'vetrolisci') => {
    if (!GameServerRegistry.hasGameServer(gameType)) {
      socket.emit("error", { message: `Game type not supported: ${gameType}` });
      return;
    }

    players.set(socket.id, { 
      name: playerName, 
      socket: socket,
      currentGame: null
    });

    // Find existing waiting room for this game type or create new one
    let gameId = null;
    for (const [id, room] of gameRooms.entries()) {
      if (room.gameType === gameType && room.players.length < 2 && room.status === 'waiting') {
        gameId = id;
        break;
      }
    }

    if (!gameId) {
      gameId = generateGameId();
      gameRooms.set(gameId, {
        id: gameId,
        gameType: gameType,
        players: [],
        status: 'waiting',
        gameInstance: null,
        createdAt: new Date()
      });
    }

    const room = gameRooms.get(gameId);
    const player = {
      id: socket.id,
      name: playerName,
      joinedAt: new Date()
    };

    room.players.push(player);
    players.get(socket.id).currentGame = gameId;

    socket.join(gameId);
    socket.emit("game-joined", { 
      gameId, 
      playerIndex: room.players.length - 1,
      gameType: gameType
    });
    
    console.log(`Player ${playerName} joined ${gameType} game ${gameId}. Players: ${room.players.length}/2`);

    // Start game when room is full
    if (room.players.length === 2) {
      room.status = 'playing';
      
      try {
        // Create game instance using the registry
        const gameInstance = GameServerRegistry.createGame(gameType, gameId, room.players);
        room.gameInstance = gameInstance;
        
        console.log(`Game ${gameId} (${gameType}) starting with players:`, room.players.map(p => p.name));
        io.to(gameId).emit("game-started", gameInstance);
      } catch (error) {
        console.error(`Failed to start ${gameType} game:`, error);
        io.to(gameId).emit("error", { message: "Failed to start game" });
      }
    }
  });

  // Generic move handler that delegates to appropriate game server
  socket.on("game-move", async (moveData) => {
    const player = players.get(socket.id);
    if (!player || !player.currentGame) {
      socket.emit("error", { message: "Not in a game" });
      return;
    }

    const room = gameRooms.get(player.currentGame);
    if (!room || room.status !== 'playing') {
      socket.emit("error", { message: "Game not active" });
      return;
    }

    try {
      const result = GameServerRegistry.processMove(
        room.gameType, 
        room.id, 
        socket.id, 
        moveData
      );

      // Broadcast result to all players in the room
      if (result.broadcast) {
        io.to(room.id).emit(result.event, result.data);
      } else {
        socket.emit(result.event, result.data);
      }

      // Check for game end conditions
      if (result.gameEnded) {
        room.status = 'finished';
        setTimeout(() => {
          gameRooms.delete(room.id);
        }, 30000); // Clean up finished games after 30 seconds
      }

    } catch (error) {
      console.error("Move processing error:", error);
      socket.emit("error", { message: error.message });
    }
  });

  // Legacy Vetrolisci events for backward compatibility
  socket.on("pick-card", async (data) => {
    // Convert to generic move format
    const moveData = {
      type: 'pick-card',
      ...data
    };
    socket.emit("game-move", moveData);
  });

  socket.on("place-card", async (data) => {
    // Convert to generic move format
    const moveData = {
      type: 'place-card',
      ...data
    };
    socket.emit("game-move", moveData);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    
    const player = players.get(socket.id);
    if (player && player.currentGame) {
      const room = gameRooms.get(player.currentGame);
      if (room) {
        // Handle player disconnection in the game
        GameServerRegistry.handlePlayerDisconnect(room.gameType, room.id, socket.id);
        
        // Notify other players
        io.to(room.id).emit("player-disconnected", {
          playerId: socket.id,
          playerName: player.name
        });

        // Clean up room if game was in progress
        if (room.status === 'playing') {
          room.status = 'abandoned';
          setTimeout(() => {
            gameRooms.delete(room.id);
          }, 5000);
        } else {
          // Remove player from waiting room
          room.players = room.players.filter(p => p.id !== socket.id);
          if (room.players.length === 0) {
            gameRooms.delete(room.id);
          }
        }
      }
    }

    players.delete(socket.id);
  });
});

function generateGameId() {
  return Math.random().toString(36).substr(2, 9);
}

// API endpoints
app.get("/api/games", (req, res) => {
  const availableGames = GameServerRegistry.getRegisteredGames();
  res.json({ games: availableGames });
});

app.get("/api/stats", (req, res) => {
  const stats = {
    activeGames: gameRooms.size,
    activePlayers: players.size,
    gameTypes: GameServerRegistry.getRegisteredGames().length
  };
  res.json(stats);
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok",
    games: gameRooms.size,
    players: players.size,
    registeredGameTypes: GameServerRegistry.getRegisteredGames()
  });
});

// Serve client application
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`The Gaming Nook server running on port ${PORT}`);
  console.log(`Available game types: ${GameServerRegistry.getRegisteredGames().join(', ')}`);
});