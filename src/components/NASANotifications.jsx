import React from 'react';

// Real-time Notifications System
const NASANotifications = ({ notifications, onDismiss }) => {
  if (notifications.length === 0) return null;
  
  return (
    <div className="nasa-notifications">
      {notifications.map((notification, index) => (
        <div key={index} className={`nasa-notification ${notification.type}`}>
          <div className="notification-icon">
            {notification.type === 'discovery' ? '🚀' : notification.type === 'sample' ? '🧪' : '📡'}
          </div>
          <div className="notification-content">
            <div className="notification-title">{notification.title}</div>
            <div className="notification-message">{notification.message}</div>
            <div className="notification-time">SOL {notification.sol}</div>
          </div>
          <button className="notification-close" onClick={() => onDismiss(index)}>×</button>
        </div>
      ))}
    </div>
  );
};

export default NASANotifications;