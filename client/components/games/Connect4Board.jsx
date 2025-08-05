import React, { useState, useEffect } from 'react';
import './Connect4Board.css';

const Connect4Board = ({ 
  user, 
  gameInfo, 
  socketService, 
  onGameStateChange, 
  onReturnToMenu 
}) => {
  const [gameState, setGameState] = useState(null);
  const [selectedColumn, setSelectedColumn] = useState(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);
  const [hoveredColumn, setHoveredColumn] = useState(null);

  useEffect(() => {
    // Listen for game state updates
    const handleGameUpdate = (newGameState) => {
      console.log('Connect 4 game state updated:', newGameState);
      setGameState(newGameState);
      onGameStateChange?.(newGameState);
      
      const myPlayerIndex = gameInfo?.playerIndex;
      setIsMyTurn(newGameState.currentPlayer === myPlayerIndex && !newGameState.gameOver);
      
      // Show win modal if game is over
      if (newGameState.gameOver && !showWinModal) {
        setTimeout(() => setShowWinModal(true), 1000);
      }
    };

    const handleMoveResult = (result) => {
      console.log('Move result:', result);
      if (result.gameState) {
        handleGameUpdate(result.gameState);
      }
    };

    socketService.onGameStarted(handleGameUpdate);
    socketService.socket?.on('move-result', handleMoveResult);
    socketService.socket?.on('game-state-updated', handleGameUpdate);

    return () => {
      socketService.socket?.off('move-result', handleMoveResult);
      socketService.socket?.off('game-state-updated', handleGameUpdate);
    };
  }, [gameInfo?.playerIndex, onGameStateChange, showWinModal, socketService]);

  const handleColumnClick = async (column) => {
    if (!isMyTurn || !gameState || gameState.gameOver) return;
    
    if (!gameState.validMoves.includes(column)) {
      console.log('Invalid move - column full');
      return;
    }

    try {
      setSelectedColumn(column);
      
      // Send move to server
      await socketService.makeMove({
        type: 'connect4-move',
        column: column
      });
      
      console.log(`Made move in column ${column}`);
    } catch (error) {
      console.error('Error making move:', error);
      setSelectedColumn(null);
    }
  };

  const getPlayerColor = (playerIndex) => {
    return playerIndex === 0 ? 'red' : 'yellow';
  };

  const getCurrentPlayerName = () => {
    if (!gameState?.players) return '';
    return gameState.players[gameState.currentPlayer]?.name || `Player ${gameState.currentPlayer + 1}`;
  };

  const getWinnerName = () => {
    if (gameState?.winner === null) return 'Tie Game!';
    if (!gameState?.players) return '';
    return gameState.players[gameState.winner]?.name || `Player ${gameState.winner + 1}`;
  };

  const isWinningCell = (row, col) => {
    return gameState?.winningCells?.some(([winRow, winCol]) => winRow === row && winCol === col);
  };

  const renderCell = (row, col) => {
    const cellValue = gameState?.board[row][col];
    const isEmpty = cellValue === null;
    const playerColor = isEmpty ? null : getPlayerColor(cellValue);
    const isWinning = isWinningCell(row, col);
    const isPreview = isEmpty && hoveredColumn === col && row === getLowestEmptyRow(col) && isMyTurn;

    return (
      <div
        key={`${row}-${col}`}
        className={`connect4-cell ${isEmpty ? 'empty' : 'filled'} ${isWinning ? 'winning' : ''}`}
        onClick={() => handleColumnClick(col)}
        onMouseEnter={() => setHoveredColumn(col)}
        onMouseLeave={() => setHoveredColumn(null)}
      >
        {!isEmpty && (
          <div className={`connect4-piece ${playerColor} ${isWinning ? 'winning-piece' : ''}`} />
        )}
        {isPreview && (
          <div className={`connect4-piece ${getPlayerColor(gameState.currentPlayer)} preview`} />
        )}
      </div>
    );
  };

  const getLowestEmptyRow = (col) => {
    if (!gameState?.board) return -1;
    for (let row = 5; row >= 0; row--) {
      if (gameState.board[row][col] === null) {
        return row;
      }
    }
    return -1;
  };

  const renderBoard = () => {
    if (!gameState?.board) return null;

    return (
      <div className="connect4-board">
        {gameState.board.map((row, rowIndex) => (
          <div key={rowIndex} className="connect4-row">
            {row.map((_, colIndex) => renderCell(rowIndex, colIndex))}
          </div>
        ))}
      </div>
    );
  };

  if (!gameState) {
    return (
      <div className="connect4-container">
        <div className="loading-game">
          <div className="loading-spinner">⟳</div>
          <p>Loading Connect 4...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="connect4-container">
      {/* Game Header */}
      <div className="connect4-header">
        <div className="game-info">
          <h2>Connect 4</h2>
          <div className="players-info">
            {gameState.players?.map((player, index) => (
              <div 
                key={index} 
                className={`player-info ${gameState.currentPlayer === index ? 'current-player' : ''}`}
              >
                <div className={`player-indicator ${getPlayerColor(index)}`} />
                <span>{player.name}</span>
                {gameState.currentPlayer === index && !gameState.gameOver && (
                  <span className="turn-indicator">• Turn</span>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <button className="back-to-menu-btn" onClick={onReturnToMenu}>
          ← Back to Games
        </button>
      </div>

      {/* Game Status */}
      <div className="game-status">
        {gameState.gameOver ? (
          <div className="game-over-status">
            {gameState.winner !== null ? (
              <span className="winner-announcement">🎉 {getWinnerName()} Wins!</span>
            ) : (
              <span className="tie-announcement">🤝 It's a Tie!</span>
            )}
          </div>
        ) : (
          <div className="turn-status">
            {isMyTurn ? (
              <span className="your-turn">🎯 Your Turn - Choose a column!</span>
            ) : (
              <span className="waiting-turn">⏳ Waiting for {getCurrentPlayerName()}...</span>
            )}
          </div>
        )}
      </div>

      {/* Game Board */}
      <div className="connect4-game-area">
        {renderBoard()}
      </div>

      {/* Win Modal */}
      {showWinModal && gameState.gameOver && (
        <div className="connect4-modal-overlay" onClick={() => setShowWinModal(false)}>
          <div className="connect4-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              {gameState.winner !== null ? (
                <>
                  <h2>🎉 Game Over!</h2>
                  <p><strong>{getWinnerName()}</strong> wins with 4 in a row!</p>
                </>
              ) : (
                <>
                  <h2>🤝 Tie Game!</h2>
                  <p>The board is full - well played both!</p>
                </>
              )}
            </div>
            
            <div className="modal-actions">
              <button 
                className="primary-button"
                onClick={() => {
                  setShowWinModal(false);
                  onReturnToMenu();
                }}
              >
                Back to Games
              </button>
              <button 
                className="secondary-button"
                onClick={() => setShowWinModal(false)}
              >
                View Board
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Connect4Board;