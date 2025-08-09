// Connect 4 Game Logic
// 7 columns x 6 rows grid
// Players take turns dropping discs into columns
// Win condition: 4 in a row (horizontal, vertical, diagonal)

export const GRID_ROWS = 6
export const GRID_COLS = 7
export const PLAYER_COLORS = {
  0: 'red',
  1: 'yellow'
}

export const GAME_STATES = {
  WAITING: 'waiting',
  PLAYING: 'playing', 
  FINISHED: 'finished'
}

// Create empty grid
export const createEmptyGrid = () => {
  return Array(GRID_ROWS).fill(null).map(() => Array(GRID_COLS).fill(null))
}

// Check if a column is full
export const isColumnFull = (grid, col) => {
  return grid[0][col] !== null
}

// Get the lowest empty row in a column
export const getLowestEmptyRow = (grid, col) => {
  for (let row = GRID_ROWS - 1; row >= 0; row--) {
    if (grid[row][col] === null) {
      return row
    }
  }
  return -1 // Column is full
}

// Drop a disc into a column
export const dropDisc = (grid, col, player) => {
  const newGrid = grid.map(row => [...row])
  const row = getLowestEmptyRow(newGrid, col)
  
  if (row === -1) {
    return { success: false, grid: newGrid, row: -1 }
  }
  
  newGrid[row][col] = player
  return { success: true, grid: newGrid, row }
}

// Check for win condition
export const checkWin = (grid, row, col, player) => {
  const directions = [
    { dr: 0, dc: 1 },  // Horizontal
    { dr: 1, dc: 0 },  // Vertical
    { dr: 1, dc: 1 },  // Diagonal /
    { dr: 1, dc: -1 }  // Diagonal \
  ]
  
  for (const { dr, dc } of directions) {
    let count = 1 // Count the piece just placed
    
    // Check positive direction
    let r = row + dr
    let c = col + dc
    while (r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS && grid[r][c] === player) {
      count++
      r += dr
      c += dc
    }
    
    // Check negative direction
    r = row - dr
    c = col - dc
    while (r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS && grid[r][c] === player) {
      count++
      r -= dr
      c -= dc
    }
    
    if (count >= 4) {
      return true
    }
  }
  
  return false
}

// Check if the grid is full (draw condition)
export const isGridFull = (grid) => {
  return grid[0].every(cell => cell !== null)
}

// Get valid moves (columns that aren't full)
export const getValidMoves = (grid) => {
  const validMoves = []
  for (let col = 0; col < GRID_COLS; col++) {
    if (!isColumnFull(grid, col)) {
      validMoves.push(col)
    }
  }
  return validMoves
}

// Create initial game state
export const createInitialGameState = (players) => {
  return {
    grid: createEmptyGrid(),
    currentPlayer: 0,
    gameState: GAME_STATES.PLAYING,
    winner: null,
    winningLine: null,
    moveHistory: [],
    players: players.map((player, index) => ({
      ...player,
      color: PLAYER_COLORS[index]
    }))
  }
}

// Process a move
export const processMove = (gameState, col) => {
  const { grid, currentPlayer } = gameState
  
  // Validate move
  if (gameState.gameState !== GAME_STATES.PLAYING) {
    return { success: false, error: 'Game is not in progress' }
  }
  
  if (col < 0 || col >= GRID_COLS) {
    return { success: false, error: 'Invalid column' }
  }
  
  if (isColumnFull(grid, col)) {
    return { success: false, error: 'Column is full' }
  }
  
  // Make the move
  const dropResult = dropDisc(grid, col, currentPlayer)
  if (!dropResult.success) {
    return { success: false, error: 'Could not place disc' }
  }
  
  const newGameState = {
    ...gameState,
    grid: dropResult.grid,
    moveHistory: [...gameState.moveHistory, { player: currentPlayer, col, row: dropResult.row }]
  }
  
  // Check for win
  if (checkWin(dropResult.grid, dropResult.row, col, currentPlayer)) {
    newGameState.gameState = GAME_STATES.FINISHED
    newGameState.winner = currentPlayer
    // TODO: Calculate and store winning line for visual effect
  } else if (isGridFull(dropResult.grid)) {
    newGameState.gameState = GAME_STATES.FINISHED
    newGameState.winner = null // Draw
  } else {
    // Switch to next player
    newGameState.currentPlayer = currentPlayer === 0 ? 1 : 0
  }
  
  return { success: true, gameState: newGameState, lastMove: { row: dropResult.row, col } }
}