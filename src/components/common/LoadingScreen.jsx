import React from 'react';

const LoadingScreen = () => {
  return (
    <div className="nasa-loading">
      <div className="loading-container">
        <div className="nasa-loading-spinner"></div>
        <div className="loading-text">
          <div className="primary-text">NASA MARS MISSION CONTROL</div>
          <div className="secondary-text">Establishing real-time connection to Perseverance rover...</div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;