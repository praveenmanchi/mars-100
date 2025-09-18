import React, { useRef, useState, useEffect } from 'react';
import windSpeedIcon from '../assets/WindSpeed.svg';


// Enhanced Telemetry Card with Real-time Updates
const NASATelemetryCard = ({ title, value, unit, data, color, type, subtitle, isLive = false, onClick, telemetryType }) => {
  const chartRef = useRef(null);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  
  useEffect(() => {
    if (!chartRef.current || !data) return;
    
    const canvas = chartRef.current;
    const ctx = canvas.getContext('2d');
    
    // Make canvas responsive to container size with proper constraints
    const container = canvas.parentElement;
    const containerWidth = container.offsetWidth - 4; // Account for padding
    const containerHeight = container.offsetHeight - 4; // Account for padding
    
    canvas.width = Math.max(120, Math.min(containerWidth, 140)); // Constrain width
    canvas.height = Math.max(35, Math.min(containerHeight, 40)); // Constrain height
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Performance: Use requestAnimationFrame for smooth rendering
    requestAnimationFrame(() => {
      ctx.clearRect(0, 0, width, height);
      
      if (type === 'line') {
        // Optimized line chart rendering
        const min = Math.min(...data);
        const max = Math.max(...data);
        const range = max - min || 1;
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        data.forEach((value, index) => {
          const x = (index / (data.length - 1)) * width;
          const y = height - ((value - min) / range) * height;
          
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        
        ctx.stroke();
        
        // Fill area with gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, `${color}40`);
        gradient.addColorStop(1, `${color}10`);
        
        ctx.fillStyle = gradient;
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();
        ctx.fill();
        
      } else if (type === 'bar') {
        // Optimized bar chart rendering
        const max = Math.max(...data);
        const barWidth = width / data.length;
        
        data.forEach((value, index) => {
          const barHeight = (value / max) * height;
          const x = index * barWidth;
          const y = height - barHeight;
          
          ctx.fillStyle = color;
          ctx.fillRect(x, y, barWidth - 1, barHeight);
        });
      }
    });
    
    if (isLive) {
      setLastUpdate(Date.now());
    }
  }, [data, color, type, value, isLive]);
  
  return (
    <div 
      className="nasa-telemetry-card" 
      style={{
        background: '#000000',
        padding: '10px',
        position: 'relative',
        borderLeft: '3px solid transparent',
        transition: 'all 0.2s ease',
        overflow: 'hidden',
        boxSizing: 'border-box',
        cursor: onClick ? 'pointer' : 'default'
      }}
      onClick={() => onClick && onClick({
        title,
        value,
        unit,
        data,
        color,
        type,
        subtitle
      }, telemetryType)}
    >
      <div className="card-header">
        <div className= "img"><img src={windSpeedIcon} alt="Wind Speed" width={16} /></div>
        <div className="card-info">
          <div className="card-title">{title}</div>
          {subtitle && <div className="card-subtitle">{subtitle}</div>}
        </div>
        {isLive && (
          <div className="live-timestamp">
            {new Date(lastUpdate).toLocaleTimeString()}
          </div>
        )}
      </div>
      <div className="card-main-value">
        <span className="main-number">{value}</span>
        <span className="main-unit">{unit}</span>
      </div>
      <div className="card-chart" style={{
        margin: '8px 0',
        height: '42px',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        padding: '2px'
      }}>
        <canvas 
          ref={chartRef} 
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            display: 'block'
          }}
        />
      </div>
      <div className="card-stats">
        <div className="stat-item">
          <span className="stat-label">MIN</span>
          <span className="stat-value">{Math.min(...(data || [0])).toFixed(0)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">MAX</span>
          <span className="stat-value">{Math.max(...(data || [0])).toFixed(0)}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">NOW</span>
          <span className="stat-value">{value}</span>
        </div>
      </div>
    </div>
  );
};

export default NASATelemetryCard;