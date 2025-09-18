// Mission Milestone Celebration System
import React, { useState, useEffect } from 'react';

const MilestoneCelebration = () => {
  const [celebrations, setCelebrations] = useState([]);
  const [achievementCount, setAchievementCount] = useState(0);

  useEffect(() => {
    // Listen for milestone celebration events
    const handleMilestoneCelebration = (event) => {
      const milestone = event.detail;
      const celebrationId = `celebration-${Date.now()}`;
      
      setCelebrations(prev => [...prev, {
        id: celebrationId,
        ...milestone,
        timestamp: Date.now()
      }]);
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        setCelebrations(prev => prev.filter(c => c.id !== celebrationId));
      }, 5000);
      
      // Update achievement count
      setAchievementCount(prev => prev + 1);
      
      // Play celebration sound effect (if available)
      try {
        const audio = new Audio('/sounds/achievement.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => {
          // Fallback: use system beep or silence
          console.log('🎉 Achievement unlocked!');
        });
      } catch (error) {
        // Silent fallback
      }
    };

    window.addEventListener('milestone-celebration', handleMilestoneCelebration);
    
    return () => {
      window.removeEventListener('milestone-celebration', handleMilestoneCelebration);
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 pointer-events-none">
      <div>
        {celebrations.map((celebration) => (
          <div
            key={celebration.id}
            className="mb-4 relative pointer-events-auto animate-scale-in"
          >
            {/* Main Celebration Card */}
            <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg p-4 shadow-2xl border-2 border-yellow-300 max-w-sm">
              {/* Celebration Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl animate-bounce">
                    🏆
                  </span>
                  <span className="font-orbitron font-bold text-sm">
                    MILESTONE ACHIEVED!
                  </span>
                </div>
                <div className="text-xl animate-spin">
                  {celebration.icon}
                </div>
              </div>
              
              {/* Milestone Details */}
              <div className="mb-3">
                <h3 className="font-orbitron font-bold text-lg mb-1">
                  {celebration.name}
                </h3>
                <p className="text-sm opacity-90 leading-relaxed">
                  {celebration.description}
                </p>
                <div className="mt-2 text-xs opacity-75 font-orbitron">
                  Sol {celebration.sol}
                </div>
              </div>
              
              {/* Progress Indicator */}
              <div className="bg-white/20 rounded-full h-2 mb-2">
                <div className="bg-white rounded-full h-full animate-pulse" />
              </div>
              
              {/* Achievement Badge */}
              <div className="flex items-center justify-center">
                <div className="bg-white/20 rounded-full px-3 py-1">
                  <span className="text-xs font-orbitron font-bold">
                    🎖️ ACHIEVEMENT UNLOCKED
                  </span>
                </div>
              </div>
            </div>
            
            {/* Particle Effects - simplified */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-pulse"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${i * 0.2}s`
                  }}
                />
              ))}
            </div>
            
            {/* Confetti Animation */}
            <div className="absolute -top-2 -right-2">
              <div className="text-2xl animate-bounce">
                🎉
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Achievement Counter */}
      {achievementCount > 0 && (
        <div className="fixed bottom-4 right-4 bg-slate-900/90 backdrop-blur-sm text-white rounded-lg p-3 border border-slate-600 pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="text-yellow-500">🏆</span>
            <span className="font-orbitron text-sm">
              {achievementCount} Achievement{achievementCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Individual Achievement Badge Component
export const AchievementBadge = ({ achievement, isNew = false }) => {
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-orbitron ${
        isNew 
          ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg animate-bounce' 
          : 'bg-slate-800 text-slate-300 border border-slate-600'
      }`}
    >
      <span className="text-sm">{achievement.icon}</span>
      <span>{achievement.name}</span>
      {isNew && (
        <span className="text-yellow-200 animate-pulse">
          ✨
        </span>
      )}
    </div>
  );
};

// Mission Progress Display
export const MissionProgress = ({ completedMilestones, totalMilestones }) => {
  const progress = (completedMilestones / totalMilestones) * 100;
  
  return (
    <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-600">
      <h3 className="font-orbitron text-slate-200 mb-3 flex items-center gap-2">
        <span>🎯</span>
        Mission Progress
      </h3>
      
      <div className="mb-4">
        <div className="flex justify-between text-sm text-slate-400 mb-1">
          <span>Completed</span>
          <span>{completedMilestones}/{totalMilestones}</span>
        </div>
        <div className="bg-slate-700 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-green-500 rounded-full h-full transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="text-center text-lg font-orbitron text-slate-200 mt-2">
          {progress.toFixed(1)}%
        </div>
      </div>
      
      {/* Next Milestone */}
      <div className="text-center text-xs text-slate-400">
        {progress < 100 ? '🚀 Keep exploring to unlock more achievements!' : '🎉 All milestones completed!'}
      </div>
    </div>
  );
};

export default MilestoneCelebration;