import React from "react";
import Card from "./Card";
import Confetti from "./Confetti";
import { getValidPlacementPositions } from "../game/placement";
import "./GameGrid.css";

const GameGrid = ({
  grid,
  onCardPlace,
  canPlace,
  selectedCard,
  isOpponent = false,
  placingCards = new Set(),
  newlyPlacedCards = new Set(),
  glowingCards = new Set(),
  confettiCards = new Set(),
  onConfettiComplete,
}) => {
  const handleGridClick = (index) => {
    if (canPlace && selectedCard) {
      onCardPlace(index);
    }
  };

  const getPlacementHint = (index) => {
    if (!canPlace || !selectedCard) return null;

    const validPositions = getValidPlacementPositions(selectedCard, grid);
    const position = validPositions.find((pos) => pos.index === index);

    if (position && position.valid) {
      return {
        type: position.type,
        description: position.description,
      };
    }

    return null;
  };

  return (
    <div className={`game-grid ${isOpponent ? "opponent" : ""}`}>
      {grid.map((card, index) => (
        <div
          key={index}
          className={`grid-space ${getPlacementHint(index)?.type || ""}`}
          onClick={() => handleGridClick(index)}
        >
          {!card && <div className="space-number">{index + 1}</div>}
          {card && (
            <>
              <Card
                card={card}
                isPlaced={true}
                showBack={!card.faceUp}
                className={`${placingCards.has(card.id) ? "card-placing" : ""} ${
                  newlyPlacedCards.has(card.id) ? "card-fade-in" : ""
                } ${glowingCards.has(card.id) ? "card-glow" : ""}`}
              />
              {(() => {
                if (confettiCards.size > 0) {
                  console.log("🎉 CONFETTI RENDER CHECK:", {
                    gridCardId: card.id,
                    confettiCards: Array.from(confettiCards),
                    hasConfetti: confettiCards.has(card.id),
                    cardPosition: index,
                  });
                }
                return confettiCards.has(card.id) ? (
                  <Confetti cardId={card.id} onComplete={onConfettiComplete} />
                ) : null;
              })()}
            </>
          )}
          {getPlacementHint(index) && <div className="placement-hint">{getPlacementHint(index).description}</div>}
        </div>
      ))}
    </div>
  );
};

export default GameGrid;
