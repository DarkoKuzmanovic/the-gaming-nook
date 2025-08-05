import BaseGameServer from '../base/BaseGameServer.js';

export default class Connect4Server extends BaseGameServer {
  constructor(config) {
    super(config);
  }

  createGame(gameId, players) {
    const gameInstance = {
      id: gameId,
      players: players.map((player, index) => ({
        id: player.id,
        name: player.name,
        index: index
      })),
      board: Array(6).fill().map(() => Array(7).fill(null)), // 6 rows, 7 columns
      currentPlayer: 0, // 0 for player 1, 1 for player 2
      winner: null,
      winningCells: [],
      gameOver: false,
      moveCount: 0,
      gameState: 'playing'
    };
    
    console.log(`Connect 4 server game ${gameId} initialized with players:`, players.map(p => p.name));
    this.initializeGame(gameInstance);
    return gameInstance;
  }

  // Process a move from a player
  processMove(gameId, playerId, moveData) {
    const gameInstance = this.getGame(gameId);
    if (!gameInstance) {
      throw new Error('Game not found');
    }

    try {
      console.log(`Processing Connect 4 move from ${playerId}:`, moveData);
      
      // Find player index
      const playerIndex = gameInstance.players.findIndex(p => p.id === playerId);
      if (playerIndex === -1) {
        throw new Error('Player not found in game');
      }

      // Validate it's the player's turn
      if (playerIndex !== gameInstance.currentPlayer) {
        throw new Error('Not your turn');
      }

      // Validate game state
      if (gameInstance.gameOver) {
        throw new Error('Game is already over');
      }

      // Extract move data
      const { column } = moveData;
      if (typeof column !== 'number' || column < 0 || column >= 7) {
        throw new Error('Invalid column');
      }

      // Check if column is full
      if (gameInstance.board[0][column] !== null) {
        throw new Error('Column is full');
      }

      // Find the lowest empty row in the column
      let row = 5;
      while (row >= 0 && gameInstance.board[row][column] !== null) {
        row--;
      }

      if (row < 0) {
        throw new Error('Column is full');
      }

      // Place the piece
      gameInstance.board[row][column] = gameInstance.currentPlayer;
      gameInstance.moveCount++;

      console.log(`Player ${playerIndex} placed piece at row ${row}, column ${column}`);

      // Check for win
      const winResult = this.checkWin(gameInstance, row, column, gameInstance.currentPlayer);
      let gameEnded = false;
      
      if (winResult.isWin) {
        gameInstance.winner = gameInstance.currentPlayer;
        gameInstance.winningCells = winResult.winningCells;
        gameInstance.gameOver = true;
        gameInstance.gameState = 'finished';
        gameEnded = true;
        console.log(`Player ${playerIndex} wins with 4 in a row!`);
      } else if (gameInstance.moveCount >= 42) {
        // Board is full - tie game
        gameInstance.gameOver = true;
        gameInstance.gameState = 'finished';
        gameInstance.winner = null; // null indicates tie
        gameEnded = true;
        console.log('Game ended in a tie - board is full');
      } else {
        // Switch players
        gameInstance.currentPlayer = 1 - gameInstance.currentPlayer;
        console.log(`Turn switched to player ${gameInstance.currentPlayer}`);
      }

      // Return result
      return {
        broadcast: true,
        event: 'move-result',
        data: {
          success: true,
          gameState: gameInstance,
          move: {
            player: playerIndex,
            column,
            row,
            moveCount: gameInstance.moveCount
          }
        },
        gameEnded,
        winner: gameEnded ? gameInstance.winner : undefined,
        gameData: gameEnded ? gameInstance : undefined
      };

    } catch (error) {
      console.error('Connect 4 move error:', error.message);
      return {
        broadcast: false,
        event: 'error',
        data: { message: error.message },
        gameEnded: false
      };
    }
  }

  // Check for a win condition starting from the last placed piece
  checkWin(gameInstance, row, col, player) {
    const directions = [
      [0, 1],   // horizontal
      [1, 0],   // vertical
      [1, 1],   // diagonal \
      [1, -1]   // diagonal /
    ];

    for (const [dRow, dCol] of directions) {
      const cells = [[row, col]]; // Start with the current cell
      
      // Check in positive direction
      let r = row + dRow;
      let c = col + dCol;
      while (r >= 0 && r < 6 && c >= 0 && c < 7 && gameInstance.board[r][c] === player) {
        cells.push([r, c]);
        r += dRow;
        c += dCol;
      }
      
      // Check in negative direction
      r = row - dRow;
      c = col - dCol;
      while (r >= 0 && r < 6 && c >= 0 && c < 7 && gameInstance.board[r][c] === player) {
        cells.unshift([r, c]); // Add to beginning to maintain order
        r -= dRow;
        c -= dCol;
      }
      
      if (cells.length >= 4) {
        return {
          isWin: true,
          winningCells: cells
        };
      }
    }

    return { isWin: false, winningCells: [] };
  }

  // Get valid moves (available columns)
  getValidMoves(gameInstance) {
    if (gameInstance.gameOver) return [];
    
    const validColumns = [];
    for (let col = 0; col < 7; col++) {
      if (gameInstance.board[0][col] === null) {
        validColumns.push(col);
      }
    }
    return validColumns;
  }

  // Handle player disconnection
  handlePlayerDisconnect(gameId, playerId) {
    const gameInstance = this.getGame(gameId);
    if (!gameInstance) return null;

    console.log(`Player ${playerId} disconnected from Connect 4 game ${gameId}`);
    
    // For Connect 4, if a player disconnects, the other player wins
    if (!gameInstance.gameOver) {
      const disconnectedPlayerIndex = gameInstance.players.findIndex(p => p.id === playerId);
      if (disconnectedPlayerIndex !== -1) {
        gameInstance.winner = 1 - disconnectedPlayerIndex; // Other player wins
        gameInstance.gameOver = true;
        gameInstance.gameState = 'finished';
        
        return {
          broadcast: true,
          event: 'game-state-updated',
          data: gameInstance,
          gameEnded: true,
          winner: gameInstance.winner
        };
      }
    }
    
    return null;
  }
}