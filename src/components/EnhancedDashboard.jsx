// Enhanced Mars Rover Dashboard with Advanced Features
import React, { useState, useEffect } from 'react';
// Removed Framer Motion for stability
import TrendAnalysisDashboard from './TrendAnalysisDashboard';
import MissionReplaySystem from './MissionReplaySystem';
import MilestoneCelebration, { MissionProgress, AchievementBadge } from './MilestoneCelebration';
import { NASALoader, DataSyncIndicator, useLoadingState } from './LoadingComponents';

const EnhancedDashboard = ({ roverData = {}, selectedSol = 100, onSolChange = () => {}, className = "" }) => {
  const [activeTab, setActiveTab] = useState('trends');
  const [syncStatus, setSyncStatus] = useState('idle');
  
  // Loading state management for data synchronization
  const {
    steps,
    currentStep,
    isComplete,
    nextStep,
    completeLoading,
    resetLoading,
    progress
  } = useLoadingState([
    'Fetching NASA data',
    'Processing telemetry',
    'Analyzing trends',
    'Loading photos',
    'Synchronizing timeline'
  ]);

  // Mission achievements tracking
  const [completedMilestones, setCompletedMilestones] = useState(3);
  const totalMilestones = 8;

  const tabs = [
    {
      id: 'trends',
      name: 'Trend Analysis',
      icon: '📈',
      description: 'Power, temperature & weather patterns over time'
    },
    {
      id: 'replay',
      name: 'Mission Replay',
      icon: '🎮',
      description: 'Animated rover journey with time-lapse photography'
    },
    {
      id: 'overview',
      name: 'Mission Overview',
      icon: '🎯',
      description: 'Progress tracking and achievements'
    }
  ];

  // Simulate data synchronization when Sol changes
  useEffect(() => {
    if (selectedSol !== undefined) {
      setSyncStatus('syncing');
      resetLoading();
      
      // Simulate sync steps
      const syncSteps = [
        () => nextStep('Fetching NASA data'),
        () => nextStep('Processing telemetry'),
        () => nextStep('Analyzing trends'),
        () => nextStep('Loading photos'),
        () => nextStep('Synchronizing timeline')
      ];

      syncSteps.forEach((step, index) => {
        setTimeout(step, (index + 1) * 400);
      });

      setTimeout(() => {
        completeLoading();
        setSyncStatus('complete');
      }, 2500);

      setTimeout(() => {
        setSyncStatus('idle');
      }, 4000);
    }
  }, [selectedSol, resetLoading, nextStep, completeLoading]);

  const tabVariants = {
    inactive: { 
      opacity: 0.7, 
      scale: 0.95,
      transition: { duration: 0.2 }
    },
    active: { 
      opacity: 1, 
      scale: 1,
      transition: { duration: 0.2 }
    },
    hover: { 
      opacity: 0.9, 
      scale: 1.02,
      transition: { duration: 0.1 }
    }
  };

  const contentVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
    transition: { duration: 0.3 }
  };

  return (
    <div className={`enhanced-dashboard ${className}`}>
      {/* Milestone Celebration System */}
      <MilestoneCelebration />
      
      {/* Header with Sync Status */}
      <div className="dashboard-header mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-100 font-orbitron mb-2">
              🚀 Advanced Mission Control
            </h1>
            <p className="text-slate-400 font-orbitron text-sm">
              Sol {selectedSol} • Enhanced telemetry and mission analysis
            </p>
          </div>
          
          {/* Sync Status Indicator */}
          <div className="flex items-center gap-4">
            {syncStatus !== 'idle' && (
              <DataSyncIndicator
                steps={steps}
                currentStep={currentStep}
                isComplete={isComplete}
              />
            )}
            
            <div className="text-right">
              <div className="text-sm text-slate-400 font-orbitron">
                Data Sync Status
              </div>
              <div className={`text-sm font-orbitron ${
                syncStatus === 'complete' ? 'text-green-400' : 
                syncStatus === 'syncing' ? 'text-blue-400' : 'text-slate-300'
              }`}>
                {syncStatus === 'complete' ? '✅ Synchronized' :
                 syncStatus === 'syncing' ? '🔄 Syncing...' : '⚪ Ready'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="dashboard-tabs mb-6">
        <div className="flex gap-2 p-1 bg-slate-900/50 rounded-lg border border-slate-700">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-3 rounded-md font-orbitron text-sm transition-all hover:scale-105 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <span className="text-lg">{tab.icon}</span>
                <span className="font-semibold">{tab.name}</span>
              </div>
              <div className="text-xs opacity-80">
                {tab.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content animate-fade-in">
          {activeTab === 'trends' && (
            <TrendAnalysisDashboard
              currentSol={selectedSol}
              missionData={roverData}
              onSolSelect={onSolChange}
            />
          )}

          {activeTab === 'replay' && (
            <MissionReplaySystem
              currentSol={selectedSol}
              onSolChange={onSolChange}
              missionData={roverData}
            />
          )}

          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Mission Progress */}
              <MissionProgress
                completedMilestones={completedMilestones}
                totalMilestones={totalMilestones}
              />

              {/* Recent Achievements */}
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
                <h3 className="font-orbitron text-slate-200 mb-4 flex items-center gap-2">
                  <span>🏆</span>
                  Recent Achievements
                </h3>
                
                <div className="space-y-3">
                  <AchievementBadge
                    achievement={{ icon: '🚀', name: 'Landing Success' }}
                    isNew={false}
                  />
                  <AchievementBadge
                    achievement={{ icon: '🚗', name: 'First Drive' }}
                    isNew={false}
                  />
                  <AchievementBadge
                    achievement={{ icon: '🔬', name: 'Sample Collection' }}
                    isNew={true}
                  />
                </div>
              </div>

              {/* Mission Statistics */}
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600 lg:col-span-2">
                <h3 className="font-orbitron text-slate-200 mb-4 flex items-center gap-2">
                  <span>📊</span>
                  Mission Statistics
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400 font-orbitron">
                      {selectedSol}
                    </div>
                    <div className="text-xs text-slate-400">Current Sol</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400 font-orbitron">
                      {(selectedSol * 0.025).toFixed(1)}
                    </div>
                    <div className="text-xs text-slate-400">Distance (km)</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-400 font-orbitron">
                      {Math.floor(selectedSol * 2.3)}
                    </div>
                    <div className="text-xs text-slate-400">Photos Taken</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400 font-orbitron">
                      {Math.floor(selectedSol / 7)}
                    </div>
                    <div className="text-xs text-slate-400">Weeks Active</div>
                  </div>
                </div>
              </div>
            </div>
          )}
      </div>

      {/* Quick Actions Bar */}
      <div className="fixed bottom-4 right-4 flex gap-2 animate-fade-in">
        <button
          onClick={() => {
            const event = new CustomEvent('milestone-celebration', {
              detail: {
                sol: selectedSol,
                name: 'Manual Celebration',
                icon: '🎉',
                description: 'User triggered celebration!'
              }
            });
            window.dispatchEvent(event);
          }}
          className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded-lg font-orbitron text-sm shadow-lg hover:scale-105 transition-all"
        >
          🎉 Test Celebration
        </button>
        
        <button
          onClick={() => {
            setCompletedMilestones(prev => Math.min(prev + 1, totalMilestones));
          }}
          className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg font-orbitron text-sm shadow-lg hover:scale-105 transition-all"
        >
          📈 Update Progress
        </button>
      </div>
    </div>
  );
};

export default EnhancedDashboard;