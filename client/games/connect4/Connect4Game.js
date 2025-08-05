import BaseGame from '../base/BaseGame.js';

export default class Connect4Game extends BaseGame {
  constructor(config) {
    super(config);
    this.board = Array(6).fill().map(() => Array(7).fill(null)); // 6 rows, 7 columns
    this.currentPlayer = 0; // 0 for player 1, 1 for player 2
    this.winner = null;
    this.winningCells = [];
    this.gameOver = false;
    this.moveCount = 0;
  }

  // Initialize the game with players
  initializeGame(players) {
    this.players = players.map(player => ({
      ...player,
      color: player.name === players[0].name ? 'red' : 'yellow'
    }));
    this.gameState = 'playing';
    console.log(`Connect 4 game initialized with players:`, this.players.map(p => p.name));
  }

  // Make a move - drop a piece in the specified column
  makeMove(playerId, moveData) {
    const { column } = moveData;
    
    // Validate move
    if (this.gameOver) {
      throw new Error('Game is already over');
    }

    if (column < 0 || column >= 7) {
      throw new Error('Invalid column');
    }

    if (this.board[0][column] !== null) {
      throw new Error('Column is full');
    }

    const playerIndex = this.players.findIndex(p => p.id === playerId);
    if (playerIndex !== this.currentPlayer) {
      throw new Error('Not your turn');
    }

    // Find the lowest empty row in the column
    let row = 5;
    while (row >= 0 && this.board[row][column] !== null) {
      row--;
    }

    if (row < 0) {
      throw new Error('Column is full');
    }

    // Place the piece
    this.board[row][column] = this.currentPlayer;
    this.moveCount++;

    // Check for win
    const winResult = this.checkWin(row, column, this.currentPlayer);
    if (winResult.isWin) {
      this.winner = this.currentPlayer;
      this.winningCells = winResult.winningCells;
      this.gameOver = true;
      this.gameState = 'finished';
    } else if (this.moveCount >= 42) {
      // Board is full - tie game
      this.gameOver = true;
      this.gameState = 'finished';
      this.winner = null; // null indicates tie
    } else {
      // Switch players
      this.currentPlayer = 1 - this.currentPlayer;
    }

    return {
      success: true,
      gameState: this.serialize(),
      gameOver: this.gameOver,
      winner: this.winner,
      move: {
        player: playerIndex,
        column,
        row,
        moveCount: this.moveCount
      }
    };
  }

  // Check for a win condition starting from the last placed piece
  checkWin(row, col, player) {
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
      while (r >= 0 && r < 6 && c >= 0 && c < 7 && this.board[r][c] === player) {
        cells.push([r, c]);
        r += dRow;
        c += dCol;
      }
      
      // Check in negative direction
      r = row - dRow;
      c = col - dCol;
      while (r >= 0 && r < 6 && c >= 0 && c < 7 && this.board[r][c] === player) {
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
  getValidMoves() {
    if (this.gameOver) return [];
    
    const validColumns = [];
    for (let col = 0; col < 7; col++) {
      if (this.board[0][col] === null) {
        validColumns.push(col);
      }
    }
    return validColumns;
  }

  // Get the current game state for sending to clients
  serialize() {
    return {
      id: this.id,
      gameType: this.gameType,
      players: this.players,
      board: this.board,
      currentPlayer: this.currentPlayer,
      gameState: this.gameState,
      winner: this.winner,
      winningCells: this.winningCells,
      gameOver: this.gameOver,
      moveCount: this.moveCount,
      validMoves: this.getValidMoves(),
      phase: 'playing' // Connect 4 only has one phase
    };
  }

  // Get game information for the registry
  static getGameInfo() {
    return {
      id: 'connect4',
      displayName: 'Connect 4',
      description: 'Classic connection game - get 4 in a row to win!',
      minPlayers: 2,
      maxPlayers: 2,
      category: 'strategy',
      difficulty: 'easy',
      estimatedTime: '5-10 minutes',
      thumbnail: '/icons/connect4.svg',
      rules: [
        'Players take turns dropping colored pieces into a 7x6 grid',
        'Pieces fall to the lowest available space in the column',
        'First player to get 4 pieces in a row (horizontal, vertical, or diagonal) wins',
        'If the board fills up with no winner, the game is a tie'
      ]
    };
  }
}