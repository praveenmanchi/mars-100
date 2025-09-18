import React from 'react';

// Skeleton Loader Components
const SkeletonLoader = ({ width = "100%", height = "20px", className = "" }) => (
  <div className={`skeleton-loader ${className}`} style={{ width, height }}>
    <div className="skeleton-shimmer"></div>
  </div>
);

const TelemetryCardSkeleton = () => (
  <div className="nasa-telemetry-card skeleton-card">
    <div className="card-header">
      <SkeletonLoader width="8px" height="8px" className="skeleton-circle" />
      <div className="card-info">
        <SkeletonLoader width="80px" height="12px" />
        <SkeletonLoader width="120px" height="10px" />
      </div>
    </div>
    <div className="card-main-value">
      <SkeletonLoader width="60px" height="24px" />
      <SkeletonLoader width="30px" height="12px" />
    </div>
    <div className="card-chart">
      <SkeletonLoader width="150px" height="45px" />
    </div>
    <div className="card-stats">
      <SkeletonLoader width="30px" height="20px" />
      <SkeletonLoader width="30px" height="20px" />
      <SkeletonLoader width="30px" height="20px" />
    </div>
  </div>
);

const MapSkeleton = () => (
  <div className="map-skeleton">
    <SkeletonLoader width="100%" height="100%" />
    <div className="skeleton-overlay">
      <SkeletonLoader width="200px" height="16px" className="map-title-skeleton" />
      <SkeletonLoader width="300px" height="12px" className="map-coords-skeleton" />
    </div>
  </div>
);

const ImageSkeleton = () => (
  <div className="nasa-camera-image-enhanced skeleton-image">
    <SkeletonLoader width="100%" height="100%" />
  </div>
);

export {
  SkeletonLoader,
  TelemetryCardSkeleton,
  MapSkeleton,
  ImageSkeleton
};