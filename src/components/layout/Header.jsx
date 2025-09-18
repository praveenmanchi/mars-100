import React from 'react';
import logo from '../../assets/logo.svg';

const Header = ({ roverData }) => {
  return (
    <header className="nasa-header">
      <div className="header-left">
        <div className="nasa-logo"><img src={logo} alt="NASA" width={120} /></div>
        <div className="mission-info">
          <div className="mission-name">Mars Perseverance Rover</div>
          <div className="mission-location">Advanced Planetary Exploration Vehicle Dashboard (<span style={{color: 'white', fontWeight: 'bold'}}>Not Official site</span>)</div>
        </div>
      </div>
      
      <div className="header-right">
        <div className="status-group">
          <div className="status-item">
            <div className="status-label">TOTAL MISSION SOL</div>
            <div className="status-value">{roverData.header.maxSol}</div>
          </div>
          <div className="status-item">
            <div className="status-label">TOTAL DISTANCE</div>
            <div className="status-value">{roverData.header.totalDistance} km</div>
          </div>
          <div className="status-item">
            <div className="status-label">SYSTEM STATUS</div>
            <div className={`status-value status-${roverData.header.status.toLowerCase()}`}>
              {roverData.header.status}
            </div>
          </div>
          <div className="status-item">
            <div className="status-label">MARTIAN TIME</div>
            <div className="status-value">
              {(() => {
                const EARTH_DAY_MS = 24 * 60 * 60 * 1000;
                const MARS_DAY_OFFSET_MS = 39 * 60 * 1000 + 35.244 * 1000;
                const MARS_SOL_MS = EARTH_DAY_MS + MARS_DAY_OFFSET_MS;
                const now = Date.now();
                const sols = Math.floor(now / MARS_SOL_MS);
                const remainder = now % MARS_SOL_MS;
                const hours = Math.floor(remainder / (60 * 60 * 1000));
                const minutes = Math.floor((remainder % (60 * 60 * 1000)) / (60 * 1000));
                return `${sols}:${hours.toString().padStart(2,'0')}:${minutes.toString().padStart(2,'0')}`;
              })()}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;