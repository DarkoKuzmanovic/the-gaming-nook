import React, { useEffect } from 'react'
import './PlacementChoiceModal.css'

const PlacementChoiceModal = ({ 
  isOpen, 
  card,
  availablePositions,
  onChoose, 
  onCancel 
}) => {
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onCancel()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onCancel])

  if (!isOpen) return null

  const getPositionLabel = (index) => {
    const position = index + 1
    return `Position ${position}`
  }

  const getGridStyle = (index) => {
    // Create a 3x3 grid layout
    const row = Math.floor(index / 3)
    const col = index % 3
    return {
      gridRow: row + 1,
      gridColumn: col + 1
    }
  }

  return (
    <div className="placement-modal-overlay">
      <div className="placement-modal-content">
        <h3>Choose placement position</h3>
        <p>Place {card?.color} {card?.value} face-down on any empty space:</p>
        
        <div className="placement-grid-container">
          <div className="placement-grid">
            {Array(9).fill().map((_, index) => {
              const isAvailable = availablePositions.some(pos => pos.index === index)
              return (
                <div 
                  key={index}
                  className={`placement-slot ${isAvailable ? 'available' : 'occupied'}`}
                  style={getGridStyle(index)}
                  onClick={isAvailable ? () => onChoose(index) : undefined}
                  title={isAvailable ? `Click to place on position ${index + 1}` : `Position ${index + 1} is occupied`}
                >
                  <span className="position-number">{index + 1}</span>
                  {isAvailable && (
                    <div className="available-indicator">
                      <span className="card-preview">📄</span>
                      <span className="click-hint">Click</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="placement-modal-actions">
          <button 
            className="placement-cancel-button" 
            onClick={onCancel}
            title="Cancel placement (Esc)"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default PlacementChoiceModal