import React, { useEffect } from 'react'
import Card from './Card.jsx'
import Modal from '../../../../shared/client/components/Modal.jsx'
import Button from '../../../../shared/client/components/Button.jsx'
import './PlacementChoiceModal.css'

const PlacementChoiceModal = ({ 
  isOpen, 
  card, 
  availablePositions = [], 
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

  if (!isOpen || !card) return null

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="Choose placement position">
      <div className="placement-choice-modal">
        <p>This card would be placed face-down. Choose an empty position:</p>
        
        <div className="placement-card">
          <Card card={card} />
        </div>

        <div className="position-grid">
          {Array.from({ length: 9 }, (_, index) => (
            <Button
              key={index}
              variant={availablePositions.includes(index) ? "primary" : "disabled"}
              disabled={!availablePositions.includes(index)}
              onClick={() => availablePositions.includes(index) && onChoose(index)}
              className="position-button"
            >
              {index + 1}
            </Button>
          ))}
        </div>

        <div className="modal-actions">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default PlacementChoiceModal