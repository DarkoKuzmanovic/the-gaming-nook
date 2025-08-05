import React, { useEffect, useState } from "react";
import "./Confetti.css";

const Confetti = ({ cardId, onComplete }) => {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    console.log("🎉 Confetti component mounted for cardId:", cardId);
    // Generate confetti pieces
    const newPieces = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      animationDelay: Math.random() * 0.5,
      color: ["#ff6b6b", "#4ecdc4", "#45b7d1", "#96ceb4", "#feca57", "#ff9ff3", "#54a0ff", "#5f27cd"][i],
    }));

    setPieces(newPieces);
    console.log("🎉 Generated confetti pieces:", newPieces.length);

    // Clean up after animation
    const timer = setTimeout(() => {
      console.log("🎉 Confetti animation complete for cardId:", cardId);
      if (onComplete) onComplete(cardId);
    }, 1500);

    return () => {
      console.log("🎉 Confetti component unmounting for cardId:", cardId);
      clearTimeout(timer);
    };
  }, [cardId, onComplete]);

  return (
    <div className="confetti-container">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="confetti-piece"
          style={{
            left: `${piece.left}%`,
            backgroundColor: piece.color,
            animationDelay: `${piece.animationDelay}s`,
          }}
        />
      ))}
    </div>
  );
};

export default Confetti;