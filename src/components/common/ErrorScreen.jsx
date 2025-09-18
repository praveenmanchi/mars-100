import React from 'react';

const ErrorScreen = ({ error, onRetry }) => {
  return (
    <div className="nasa-error">
      <div className="error-container">
        <div className="error-icon">⚠</div>
        <div className="error-text">
          <div className="error-title">{error}</div>
          <div className="error-subtitle">Unable to establish communication link</div>
        </div>
        <button onClick={onRetry} className="nasa-button">
          RETRY CONNECTION
        </button>
      </div>
    </div>
  );
};

export default ErrorScreen;