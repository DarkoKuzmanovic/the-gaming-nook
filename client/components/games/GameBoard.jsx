import React from "react";
import VetrolisciBoard from "./VetrolisciBoard";
import Connect4Board from "./Connect4Board";
import "./GameBoard.css";

const GameBoard = ({
  user,
  gameInfo,
  socketService,
  onGameStateChange,
  onDraftStateChange,
  onReturnToMenu,
  hideScoreBoard = false,
  hideTurnIndicator = false,
}) => {
  // Router function to render the appropriate game component
  const renderGameComponent = () => {
    const gameType = gameInfo?.gameType || 'vetrolisci';
    
    switch (gameType) {
      case 'connect4':
        return (
          <Connect4Board
            user={user}
            gameInfo={gameInfo}
            socketService={socketService}
            onGameStateChange={onGameStateChange}
            onReturnToMenu={onReturnToMenu}
          />
        );
      
      case 'vetrolisci':
      default:
        return (
          <VetrolisciBoard
            user={user}
            gameInfo={gameInfo}
            socketService={socketService}
            onGameStateChange={onGameStateChange}
            onDraftStateChange={onDraftStateChange}
            onReturnToMenu={onReturnToMenu}
            hideScoreBoard={hideScoreBoard}
            hideTurnIndicator={hideTurnIndicator}
          />
        );
    }
  };

  return renderGameComponent();
};

export default GameBoard;