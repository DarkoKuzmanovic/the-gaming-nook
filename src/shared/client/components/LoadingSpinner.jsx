import React from 'react'
import './LoadingSpinner.css'

const LoadingSpinner = ({ 
  size = 'medium', // 'small', 'medium', 'large'
  color = 'primary', // 'primary', 'secondary', 'white'
  text = '',
  className = '' 
}) => {
  const spinnerClass = [
    'loading-spinner',
    `loading-spinner--${size}`,
    `loading-spinner--${color}`,
    className
  ].filter(Boolean).join(' ')

  return (
    <div className="loading-container">
      <div className={spinnerClass}></div>
      {text && <p className="loading-text">{text}</p>}
    </div>
  )
}

export default LoadingSpinner