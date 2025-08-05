import React, { useState, useRef, useEffect, memo } from 'react'

const LazyImage = memo(({ 
  src, 
  alt, 
  className = '', 
  placeholder = null,
  onLoad = () => {},
  onError = () => {},
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isIntersecting, setIsIntersecting] = useState(false)
  const imgRef = useRef(null)
  const observerRef = useRef(null)

  // Set up intersection observer for lazy loading
  useEffect(() => {
    if (!imgRef.current) return

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true)
          observerRef.current?.disconnect()
        }
      },
      {
        rootMargin: '50px' // Start loading 50px before the image enters viewport
      }
    )

    observerRef.current.observe(imgRef.current)

    return () => {
      observerRef.current?.disconnect()
    }
  }, [src])

  // Handle image loading
  const handleLoad = () => {
    setIsLoaded(true)
    setHasError(false)
    onLoad()
  }

  const handleError = () => {
    setHasError(true)
    setIsLoaded(false)
    onError()
  }

  return (
    <div ref={imgRef} className={`lazy-image-container ${className}`} {...props}>
      {isIntersecting && (
        <img
          src={src}
          alt={alt}
          className={`lazy-image ${isLoaded ? 'loaded' : ''} ${hasError ? 'error' : ''}`}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease'
          }}
        />
      )}
      
      {(!isLoaded || hasError) && placeholder && (
        <div className="lazy-image-placeholder">
          {placeholder}
        </div>
      )}
      
      {!isIntersecting && !isLoaded && (
        <div className="lazy-image-loading">
          {placeholder || <div className="loading-spinner-small"></div>}
        </div>
      )}
    </div>
  )
})

export default LazyImage