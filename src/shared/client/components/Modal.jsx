import React from 'react'
import './Modal.css'

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  className = '',
  showCloseButton = true,
  closeOnOverlayClick = true 
}) => {
  if (!isOpen) return null

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className={`modal-content ${className}`}>
        {title && (
          <div className="modal-header">
            <h2 className="modal-title">{title}</h2>
            {showCloseButton && (
              <button className="modal-close" onClick={onClose}>
                ×
              </button>
            )}
          </div>
        )}
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Modal