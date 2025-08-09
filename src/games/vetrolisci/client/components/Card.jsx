import React, { memo } from 'react'
import { motion } from 'framer-motion'
import LazyImage from './LazyImage.jsx'
import ValidationStar from './ValidationStar.jsx'
import { getCardImagePath, getCardBackImagePath } from '../../shared/cards.js'
import './Card.css'

const Card = memo(({ 
  card, 
  isSelected, 
  onClick, 
  isPlaced = false, 
  showBack = false, 
  className = "",
  layoutId = null,
  initial = null,
  animate = null,
  exit = null,
  transition = null
}) => {
  const getColorClass = (color) => {
    const colorMap = {
      blue: "card-blue",
      green: "card-green", 
      yellow: "card-yellow",
      red: "card-red",
      multi: "card-multi",
    }
    return colorMap[color] || "card-default"
  }

  const getScoringSymbols = (scoring) => {
    if (scoring > 0) {
      return Array(Math.min(scoring, 5))
        .fill()
        .map((_, i) => (
          <span key={i} className="spiral">
            🌀
          </span>
        ))
    } else if (scoring < 0) {
      return Array(Math.min(Math.abs(scoring), 5))
        .fill()
        .map((_, i) => (
          <span key={i} className="cross">
            ✖️
          </span>
        ))
    }
    return null
  }

  if (showBack) {
    const backImagePath = getCardBackImagePath()
    const MotionDiv = layoutId ? motion.div : 'div'
    const motionProps = layoutId ? { 
      layoutId, 
      initial, 
      animate, 
      exit, 
      transition: transition || { duration: 0.3, ease: "easeInOut" }
    } : {}
    
    return (
      <MotionDiv 
        className={`card card-back ${isPlaced ? "placed" : ""} ${className}`}
        {...motionProps}
      >
        <LazyImage
          src={`/vetrolisci/cards/backs/${backImagePath}`}
          alt="Card back"
          className="card-image"
        />
      </MotionDiv>
    )
  }

  if (!card) {
    const MotionDiv = layoutId ? motion.div : 'div'
    const motionProps = layoutId ? { 
      layoutId, 
      initial, 
      animate, 
      exit, 
      transition: transition || { duration: 0.3, ease: "easeInOut" }
    } : {}
    
    return (
      <MotionDiv 
        className={`card card-empty ${className}`}
        {...motionProps}
      >
      </MotionDiv>
    )
  }

  const frontImagePath = getCardImagePath(card)

  const MotionDiv = layoutId ? motion.div : 'div'
  const motionProps = layoutId ? { 
    layoutId, 
    initial, 
    animate, 
    exit, 
    transition: transition || { duration: 0.3, ease: "easeInOut" }
  } : {}
  
  return (
    <MotionDiv
      className={`card ${getColorClass(card.color)} ${isSelected ? "selected" : ""} ${isPlaced ? "placed" : ""} ${
        card.validated ? "validated" : ""
      } ${className}`}
      onClick={onClick}
      {...motionProps}
    >
      {frontImagePath ? (
        <LazyImage
          src={`/vetrolisci/cards/fronts/${frontImagePath}`}
          alt={`${card.color} ${card.value}`}
          className="card-image"
          placeholder={
            <div className="card-fallback">
              <div className="card-header">
                <div className="card-number">{card.value}</div>
                <div className="card-symbols">{getScoringSymbols(card.scoring)}</div>
              </div>

              <div className="card-center">
                <div className="card-color-indicator"></div>
                {card.special && <div className="special-indicator">⭐</div>}
              </div>

              <div className="card-footer">
                <div className="card-scoring">{card.scoring > 0 ? `+${card.scoring}` : card.scoring}</div>
                <div className="card-number-small">{card.value}</div>
              </div>
            </div>
          }
        />
      ) : (
        <div className="card-fallback">
          <div className="card-header">
            <div className="card-number">{card.value}</div>
            <div className="card-symbols">{getScoringSymbols(card.scoring)}</div>
          </div>

          <div className="card-center">
            <div className="card-color-indicator"></div>
            {card.special && <div className="special-indicator">⭐</div>}
          </div>

          <div className="card-footer">
            <div className="card-scoring">{card.scoring > 0 ? `+${card.scoring}` : card.scoring}</div>
            <div className="card-number-small">{card.value}</div>
          </div>
        </div>
      )}
      
      {card.validated && <ValidationStar color={card.color} />}
    </MotionDiv>
  )
})

export default Card