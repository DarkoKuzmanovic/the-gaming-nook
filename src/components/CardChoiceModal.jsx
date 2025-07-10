import React from 'react'
import Card from './Card'
import './CardChoiceModal.css'

const CardChoiceModal = ({ 
  isOpen, 
  existingCard, 
  newCard, 
  onChoose, 
  onCancel 
}) => {
  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Choose which card to keep face-up</h3>
        <p>You already have a face-up card with number {newCard.number}. Choose which one to keep face-up:</p>
        
        <div className="card-choices">
          <div className="choice-option">
            <h4>Keep Existing Card</h4>
            <Card card={existingCard} />
            <button 
              className="choice-button"
              onClick={() => onChoose('existing')}
            >
              Choose This
            </button>
          </div>
          
          <div className="choice-option">
            <h4>Use New Card</h4>
            <Card card={newCard} />
            <button 
              className="choice-button"
              onClick={() => onChoose('new')}
            >
              Choose This
            </button>
          </div>
        </div>
        
        <div className="modal-actions">
          <button className="cancel-button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export default CardChoiceModal