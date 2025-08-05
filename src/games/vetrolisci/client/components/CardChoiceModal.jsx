import React, { useEffect } from 'react'
import Card from './Card.jsx'
import Modal from '../../../../shared/client/components/Modal.jsx'
import Button from '../../../../shared/client/components/Button.jsx'
import './CardChoiceModal.css'

const CardChoiceModal = ({ 
  isOpen, 
  existingCard, 
  newCard, 
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

  if (!isOpen || !newCard) return null

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="Choose which card to keep face-up">
      <div className="card-choice-modal">
        <p>You already have a face-up card with value {newCard.value}. Choose which one to keep face-up:</p>
        
        <div className="card-choices">
          <div className="choice-option">
            <h4>Keep Existing Card</h4>
            {existingCard && <Card card={existingCard} />}
            <Button 
              variant="outline" 
              onClick={() => onChoose('keep-existing')}
              className="choice-button"
            >
              Keep This One
            </Button>
          </div>
          
          <div className="choice-option">
            <h4>Use New Card</h4>
            <Card card={newCard} />
            <Button 
              variant="primary" 
              onClick={() => onChoose('keep-new')}
              className="choice-button"
            >
              Use This One
            </Button>
          </div>
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

export default CardChoiceModal