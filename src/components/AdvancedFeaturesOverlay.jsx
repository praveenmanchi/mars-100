// Advanced Features Overlay - Non-disruptive integration
import React, { useState, useEffect } from 'react';
import EnhancedDashboard from './EnhancedDashboard';

const AdvancedFeaturesOverlay = ({ roverData, selectedSol, onSolChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasSeenFeatures, setHasSeenFeatures] = useState(false);

  useEffect(() => {
    // Remove localStorage hiding logic - ADVANCED button always visible in header

    // Listen for the custom event to open advanced features
    const handleOpenAdvancedFeatures = () => {
      setIsOpen(true);
    };

    window.addEventListener('open-advanced-features', handleOpenAdvancedFeatures);
    return () => {
      window.removeEventListener('open-advanced-features', handleOpenAdvancedFeatures);
    };
  }, []);

  // Removed motion variants - using CSS animations instead

  return (
    <>
      {/* ADVANCED button moved to header */}

      {/* Overlay Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Modal Content */}
          <div className="relative w-full h-full max-w-7xl max-h-[95vh] m-4 bg-slate-900/95 backdrop-blur-lg rounded-lg border border-slate-600 shadow-2xl overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 bg-slate-800/50 border-b border-slate-600">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🚀</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-100 font-orbitron">
                    Advanced Mission Control
                  </h2>
                  <p className="text-sm text-slate-400">
                    Trend Analysis • Mission Replay • Achievement Tracking
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-xs text-slate-400 font-orbitron">
                  ESC to close
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 bg-slate-700 hover:bg-red-600 text-slate-300 hover:text-white rounded-full flex items-center justify-center transition-all duration-200 hover:scale-110 hover:rotate-90"
                >
                  ×
                </button>
              </div>
            </div>
            
            {/* Modal Body */}
            <div className="h-[calc(100%-80px)] overflow-auto p-4">
              <EnhancedDashboard
                roverData={roverData}
                selectedSol={selectedSol}
                onSolChange={onSolChange}
              />
            </div>
          </div>
        </div>
      )}

      {/* Keyboard shortcuts */}
      {isOpen && (
        <div
          style={{ position: 'fixed', top: 0, left: 0, width: 0, height: 0 }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setIsOpen(false);
            }
          }}
          tabIndex={-1}
          autoFocus
        />
      )}
    </>
  );
};

export default AdvancedFeaturesOverlay;