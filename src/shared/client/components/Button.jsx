import React from 'react'
import './Button.css'

const Button = ({
  children,
  onClick,
  variant = 'primary', // 'primary', 'secondary', 'success', 'danger', 'outline'
  size = 'medium', // 'small', 'medium', 'large'
  disabled = false,
  loading = false,
  className = '',
  type = 'button',
  ...props
}) => {
  const handleClick = (e) => {
    if (disabled || loading) return
    onClick?.(e)
  }

  const buttonClass = [
    'button',
    `button--${variant}`,
    `button--${size}`,
    disabled && 'button--disabled',
    loading && 'button--loading',
    className
  ].filter(Boolean).join(' ')

  return (
    <button
      type={type}
      className={buttonClass}
      onClick={handleClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <span className="button-spinner"></span>}
      <span className={loading ? 'button-text--hidden' : 'button-text'}>
        {children}
      </span>
    </button>
  )
}

export default Button