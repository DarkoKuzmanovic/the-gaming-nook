import React, { useEffect } from 'react'
import './BackToMenuModal.css'

const BackToMenuModal = ({ isOpen, onConfirm, onCancel }) => {
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
    <div className="modal-overlay" onClick={onCancel}>
      <div className="back-to-menu-modal" onClick={(e) => e.stopPropagation()}>
        <div className="back-to-menu-header">
          <h2>⚠️ Leave Game</h2>
        </div>
        
        <div className="back-to-menu-content">
          <p>Are you sure you want to return to the main menu?</p>
          <p className="warning-text">This will end the current game and disconnect you from your opponent.</p>
        </div>

        <div className="back-to-menu-actions">
          <button 
            className="cancel-button"
            onClick={onCancel}
            title="Continue playing (Esc)"
          >
            Cancel
          </button>
          <button 
            className="confirm-button"
            onClick={onConfirm}
            title="Return to main menu"
          >
            Leave Game
          </button>
        </div>
      </div>
    </div>
  )
}

export default BackToMenuModal