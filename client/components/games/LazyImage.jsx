import React, { useState, useRef, useEffect, memo } from 'react';
import imagePreloader from '../../services/imagePreloader';

const LazyImage = memo(({ 
  src, 
  alt, 
  className = '', 
  placeholder = null,
  onLoad = () => {},
  onError = () => {},
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  // Set up intersection observer for lazy loading
  useEffect(() => {
    if (!imgRef.current) return;

    // Check if image is already preloaded
    if (imagePreloader.isImageLoaded(src)) {
      setIsLoaded(true);
      setIsIntersecting(true);
      return;
    }

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);
          observerRef.current?.disconnect();
        }
      },
      {
        rootMargin: '50px' // Start loading 50px before the image enters viewport
      }
    );

    observerRef.current.observe(imgRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [src]);

  // Handle image loading
  const handleLoad = () => {
    setIsLoaded(true);
    onLoad();
  };

  const handleError = () => {
    setHasError(true);
    onError();
  };

  return (
    <div ref={imgRef} className={`lazy-image-container ${className}`} {...props}>
      {/* Show placeholder while loading */}
      {!isLoaded && !hasError && (
        <div className="lazy-image-placeholder">
          {placeholder || (
            <div className="lazy-image-skeleton">
              <div className="lazy-image-shimmer"></div>
            </div>
          )}
        </div>
      )}
      
      {/* Load actual image when intersecting */}
      {isIntersecting && (
        <img
          src={src}
          alt={alt}
          className={`lazy-image ${isLoaded ? 'loaded' : 'loading'} ${hasError ? 'error' : ''}`}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            opacity: isLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease'
          }}
        />
      )}

      {/* Show error state */}
      {hasError && (
        <div className="lazy-image-error">
          <span>🖼️</span>
          <small>Image failed to load</small>
        </div>
      )}
    </div>
  );
});

LazyImage.displayName = 'LazyImage';

export default LazyImage;