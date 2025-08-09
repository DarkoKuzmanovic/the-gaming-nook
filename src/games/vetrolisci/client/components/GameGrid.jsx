import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Card from './Card.jsx'
import Confetti from './Confetti.jsx'
import './GameGrid.css'

const GameGrid = ({
  grid,
  isOpponent = false,
  newlyPlacedCards = new Set(),
  glowingCards = new Set(),
  confettiCards = new Set(),
  onConfettiComplete
}) => {
  return (
    <motion.div 
      className={`game-grid ${isOpponent ? 'opponent' : ''}`}
      initial={false}
      layout
    >
      {grid.map((card, index) => (
        <motion.div
          key={index}
          className="grid-space"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            transition: {
              duration: 0.3,
              delay: index * 0.05,
              ease: "easeOut"
            }
          }}
          layout
        >
          {!card && (
            <motion.div 
              className="space-number"
              initial={{ opacity: 0.3 }}
              animate={{ opacity: 0.6 }}
            >
              {index + 1}
            </motion.div>
          )}
          <AnimatePresence mode="wait">
            {card && (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1, 
                  rotateY: 0,
                  transition: {
                    duration: 0.5,
                    ease: "backOut"
                  }
                }}
              >
                <Card
                  card={card}
                  isPlaced={true}
                  showBack={!card.faceUp}
                  className={`${newlyPlacedCards.has(card.id) ? 'card-fade-in' : ''} ${
                    glowingCards.has(card.id) ? 'card-glow' : ''
                  }`}
                />
                {confettiCards.has(card.id) && (
                  <Confetti cardId={card.id} onComplete={onConfettiComplete} />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </motion.div>
  )
}

export default GameGrid