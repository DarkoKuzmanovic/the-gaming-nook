import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="modal-overlay" 
          onClick={handleOverlayClick}
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: 1,
            transition: { duration: 0.2, ease: "easeOut" }
          }}
          exit={{ 
            opacity: 0,
            transition: { duration: 0.15, ease: "easeIn" }
          }}
        >
          <motion.div 
            className={`modal-content ${className}`}
            initial={{ 
              opacity: 0, 
              scale: 0.8, 
              y: -50,
              rotateX: -15
            }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              rotateX: 0,
              transition: { 
                duration: 0.3, 
                ease: "backOut",
                type: "spring",
                damping: 25,
                stiffness: 300
              }
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.85, 
              y: -30,
              rotateX: 15,
              transition: { 
                duration: 0.2, 
                ease: "easeIn" 
              }
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {title && (
              <motion.div 
                className="modal-header"
                initial={{ opacity: 0, y: -10 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  transition: { delay: 0.1, duration: 0.2 }
                }}
              >
                <h2 className="modal-title">{title}</h2>
                {showCloseButton && (
                  <motion.button 
                    className="modal-close" 
                    onClick={onClose}
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    ×
                  </motion.button>
                )}
              </motion.div>
            )}
            <motion.div 
              className="modal-body"
              initial={{ opacity: 0, y: 10 }}
              animate={{ 
                opacity: 1, 
                y: 0,
                transition: { delay: 0.15, duration: 0.2 }
              }}
            >
              {children}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default Modal