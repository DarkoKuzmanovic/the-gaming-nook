import React from 'react';
import './SkeletonLoader.css';

const SkeletonLoader = ({ type = 'card', count = 1, className = '' }) => {
  const renderCardSkeleton = () => (
    <div className="skeleton-card">
      <div className="skeleton-line skeleton-header"></div>
      <div className="skeleton-circle skeleton-center"></div>
      <div className="skeleton-line skeleton-footer"></div>
    </div>
  );

  const renderGridSkeleton = () => (
    <div className="skeleton-grid">
      {Array(9).fill().map((_, i) => (
        <div key={i} className="skeleton-grid-slot">
          <div className="skeleton-card-mini"></div>
        </div>
      ))}
    </div>
  );

  const renderHandSkeleton = () => (
    <div className="skeleton-hand">
      {Array(5).fill().map((_, i) => (
        <div key={i} className="skeleton-card-small">
          <div className="skeleton-line"></div>
          <div className="skeleton-circle"></div>
        </div>
      ))}
    </div>
  );

  const renderScoreSkeleton = () => (
    <div className="skeleton-score">
      <div className="skeleton-line skeleton-wide"></div>
      <div className="skeleton-line skeleton-medium"></div>
      <div className="skeleton-line skeleton-narrow"></div>
    </div>
  );

  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return renderCardSkeleton();
      case 'grid':
        return renderGridSkeleton();
      case 'hand':
        return renderHandSkeleton();
      case 'score':
        return renderScoreSkeleton();
      default:
        return renderCardSkeleton();
    }
  };

  if (count === 1) {
    return <div className={`skeleton-loader ${className}`}>{renderSkeleton()}</div>;
  }

  return (
    <div className={`skeleton-loader ${className}`}>
      {Array(count).fill().map((_, i) => (
        <div key={i}>{renderSkeleton()}</div>
      ))}
    </div>
  );
};

export default SkeletonLoader;