import React, { useEffect } from 'react'
import Card from './Card'
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

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Choose which card to keep face-up</h3>
        <p>You already have a face-up card with number {newCard.value}. Choose which one to keep face-up:</p>
        
        <div className="card-choices">
          <div 
            className="choice-option" 
            onClick={() => onChoose('keep-existing')}
            onKeyDown={(e) => e.key === 'Enter' && onChoose('keep-existing')}
            title="Keep the existing card face-up and place new card face-down"
            tabIndex={0}
            role="button"
          >
            <h4>Keep Existing Card</h4>
            <Card card={existingCard} />
          </div>
          
          <div 
            className="choice-option" 
            onClick={() => onChoose('keep-new')}
            onKeyDown={(e) => e.key === 'Enter' && onChoose('keep-new')}
            title="Place new card face-up and move existing card face-down"
            tabIndex={0}
            role="button"
          >
            <h4>Use New Card</h4>
            <Card card={newCard} />
          </div>
        </div>
        
        <div className="modal-actions">
          <button 
            className="cancel-button" 
            onClick={onCancel}
            title="Cancel card placement (Esc)"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default CardChoiceModal