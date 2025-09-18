import React from 'react';
import NASATelemetryCard from '../NASATelemetryCard';
import { TelemetryCardSkeleton } from '../SkeletonLoaders';

const TelemetryPanel = ({
  leftPanelCollapsed,
  telemetryMode,
  isLiveMode,
  telemetryGroup,
  setTelemetryGroup,
  handleTelemetryCardClick,
  telemetryData,
  roverData,
  loading
}) => {
  return (
    <div className={`nasa-left-panel ${leftPanelCollapsed ? 'collapsed' : ''} ${telemetryMode === 'horizontal' ? 'horizontal-mode' : ''}`}>
      <div className="panel-header">
        <h3>TELEMETRY DATA</h3>
        <div className={`live-indicator ${isLiveMode ? 'live' : 'offline'}`}>
          {isLiveMode ? 'LIVE' : 'OFFLINE'}
        </div>
      </div>
      
      {/* Telemetry Grouping Tabs */}
      <div className="telemetry-tabs">
        <button 
          className={`telemetry-tab ${telemetryGroup === 'all' ? 'active' : ''}`}
          onClick={() => setTelemetryGroup('all')}
        >
          ALL
        </button>
        <button 
          className={`telemetry-tab ${telemetryGroup === 'environmental' ? 'active' : ''}`}
          onClick={() => setTelemetryGroup('environmental')}
        >
          ENV
        </button>
        <button 
          className={`telemetry-tab ${telemetryGroup === 'systems' ? 'active' : ''}`}
          onClick={() => setTelemetryGroup('systems')}
        >
          SYS
        </button>
        <button 
          className={`telemetry-tab ${telemetryGroup === 'atmospheric' ? 'active' : ''}`}
          onClick={() => setTelemetryGroup('atmospheric')}
        >
          ATM
        </button>
      </div>
      
      <div className="telemetry-stack">
        {loading ? (
          <>
            <TelemetryCardSkeleton />
            <TelemetryCardSkeleton />
            <TelemetryCardSkeleton />
            <TelemetryCardSkeleton />
            <TelemetryCardSkeleton />
          </>
        ) : (
          <>
            {(telemetryGroup === 'all' || telemetryGroup === 'environmental') && (
              <NASATelemetryCard
                title="Temperature"
                value={Math.round((roverData.overlays?.metrics?.temperature || -63) + 273)}
                unit={`K (${Math.round(roverData.overlays?.metrics?.temperature || -63)}°C)`}
                data={telemetryData.tempData}
                color="#00ff88"
                type="line"
                
                isLive={isLiveMode}
                onClick={handleTelemetryCardClick}
                subtitle="AVERAGE 200K | RANGE 180K-220K"
                telemetryType="temperature"
              />
            )}
            
            {(telemetryGroup === 'all' || telemetryGroup === 'environmental') && (
              <NASATelemetryCard
                title="Wind Speed"
                value={Math.round((roverData.overlays?.metrics?.wind_speed || 8.9) * 3.6)}
                unit="KMH"
                data={telemetryData.windData}
                color="#0ea5e9"
                type="bar"
                subtitle="MAX 45 KMH | DIR NE"
                isLive={isLiveMode}
                onClick={handleTelemetryCardClick}
                telemetryType="wind-speed"
              />
            )}
            
            {(telemetryGroup === 'all' || telemetryGroup === 'systems') && (
              <NASATelemetryCard
                title="Radiation"
                value={(roverData.overlays?.metrics?.radiation || 0.24).toFixed(2)}
                unit="mSv/day"
                data={telemetryData.radiationData}
                color="#f59e0b"
                type="bar"
                subtitle="LEVEL NORMAL | SAFE RANGE"
                isLive={isLiveMode}
                onClick={handleTelemetryCardClick}
                telemetryType="radiation"
              />
            )}
            
            {(telemetryGroup === 'all' || telemetryGroup === 'systems') && (
              <NASATelemetryCard
                title="Distance Traveled"
                value={(roverData.overlays?.metrics?.distance_traveled || 2.0).toFixed(1)}
                unit="km total"
                data={telemetryData.distanceData}
                color="#10b981"
                type="line"
                subtitle="CUMULATIVE DISTANCE"
                isLive={isLiveMode}
                onClick={handleTelemetryCardClick}
                telemetryType="distance-traveled"
              />
            )}
            
            {(telemetryGroup === 'all' || telemetryGroup === 'atmospheric') && (
              <NASATelemetryCard
                title="Dust Properties"
                value={Math.round(telemetryData.dustData[telemetryData.dustData.length - 1] || 0)}  
                unit="μg/m³"
                data={telemetryData.dustData}
                color="#8b5cf6"
                type="bar"
                subtitle="ATMOSPHERIC DUST LEVEL | OPACITY 0.8"
                isLive={isLiveMode}
                onClick={handleTelemetryCardClick}
                telemetryType="dust-properties"
              />
            )}
            
            {(telemetryGroup === 'all' || telemetryGroup === 'systems') && (
              <NASATelemetryCard
                title="Battery Charge"
                value={Math.round(roverData.overlays?.metrics?.battery_charge || 92)}
                unit="%"
                data={telemetryData.batteryData}
                color="#e11d48"
                type="line"
                subtitle="POWER SYSTEM NOMINAL"
                isLive={isLiveMode}
                onClick={handleTelemetryCardClick}
                telemetryType="battery-charge"
              />
            )}
            
            {(telemetryGroup === 'all' || telemetryGroup === 'systems') && (
              <NASATelemetryCard
                title="Power Generation"
                value={Math.round(roverData.overlays?.metrics?.power_generation || 410)}
                unit="Watts"
                data={telemetryData.powerData}
                color="#f59e0b"
                type="bar"
                subtitle="SOLAR ARRAY EFFICIENCY 98%"
                isLive={isLiveMode}
                onClick={handleTelemetryCardClick}
                telemetryType="power-generation"
              />
            )}
            
            {(telemetryGroup === 'all' || telemetryGroup === 'atmospheric') && (
              <NASATelemetryCard
                title="Atmospheric Pressure"
                value={(roverData.overlays?.metrics?.atmospheric_pressure || 6.35).toFixed(2)}
                unit="mbar"
                data={telemetryData.pressureData}
                color="#06b6d4"
                type="line"
                subtitle="SEASONAL VARIATION NOMINAL"
                isLive={isLiveMode}
                onClick={handleTelemetryCardClick}
                telemetryType="atmospheric-pressure"
              />
            )}
            
            {(telemetryGroup === 'all' || telemetryGroup === 'systems') && (
              <NASATelemetryCard
                title="Communications"
                value={Math.floor(Math.random() * 100 + 85)}
                unit="% Signal"
                data={telemetryData.commData}
                color="#10b981"
                type="bar"
                subtitle="UPLINK/DOWNLINK NOMINAL"
                isLive={isLiveMode}
                onClick={handleTelemetryCardClick}
                telemetryType="communications"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default TelemetryPanel;