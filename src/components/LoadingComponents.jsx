// Enhanced Loading Components with Smooth CSS Animations
import React, { useState, useEffect } from 'react';
// Removed Framer Motion for stability

// Main Loading Spinner with NASA Theme
export const NASALoader = ({ 
  message = "Loading mission data...", 
  progress = null, 
  size = "medium",
  showRover = true 
}) => {
  const sizeClasses = {
    small: "w-8 h-8",
    medium: "w-12 h-12", 
    large: "w-16 h-16"
  };

  const textSizes = {
    small: "text-sm",
    medium: "text-base",
    large: "text-lg"
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 animate-fade-in">
      {/* Spinning Loader */}
      <div className="relative">
        <div className={`${sizeClasses[size]} border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin`} />
        
        {showRover && (
          <div className="absolute inset-0 flex items-center justify-center text-2xl animate-bounce">
            🚗
          </div>
        )}
      </div>

      {/* Loading Message */}
      <p className={`text-slate-300 font-orbitron ${textSizes[size]} text-center animate-fade-in`}>
        {message}
      </p>

      {/* Progress Bar */}
      {progress !== null && (
        <div className="w-48 bg-slate-700 rounded-full h-2 animate-fade-in">
          <div
            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

// Photo Loading Component with Preview
export const PhotoLoader = ({ 
  src, 
  alt, 
  className = "", 
  showPreview = true,
  onLoad,
  onError 
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showImage, setShowImage] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
    setShowImage(true);
    onLoad && onLoad();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    onError && onError();
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800/50 backdrop-blur-sm animate-fade-in">
          {showPreview ? (
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-400 font-orbitron">
                📸 Loading photo...
              </p>
            </div>
          ) : (
            <div className="w-8 h-8 bg-slate-700 rounded animate-pulse" />
          )}
        </div>
      )}

      {showImage && !hasError && (
        <img
          src={src}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className="w-full h-full object-cover animate-fade-in"
        />
      )}

      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800/80 text-slate-400 animate-fade-in">
          <div className="text-center">
            <div className="text-2xl mb-2">📷</div>
            <p className="text-xs font-orbitron">Photo unavailable</p>
          </div>
        </div>
      )}
      
      {/* Hidden image to trigger loading */}
      <img
        src={src}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        className="hidden"
      />
    </div>
  );
};

// Data Sync Progress Indicator
export const DataSyncIndicator = ({ 
  steps = [], 
  currentStep = 0, 
  isComplete = false 
}) => {
  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-600 animate-scale-in">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-orbitron text-slate-200 text-sm">
          🔄 Data Synchronization
        </h3>
        {isComplete && (
          <span className="text-green-500 animate-bounce">
            ✅
          </span>
        )}
      </div>

      <div className="space-y-2">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`flex items-center gap-3 ${
              index <= currentStep ? 'opacity-100' : 'opacity-50'
            } transition-opacity`}
          >
            <div className="relative">
              {index < currentStep ? (
                <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
              ) : index === currentStep ? (
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              ) : (
                <div className="w-4 h-4 bg-slate-600 rounded-full" />
              )}
            </div>
            
            <span className={`text-xs font-orbitron ${
              index <= currentStep ? 'text-slate-200' : 'text-slate-500'
            }`}>
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Skeleton Loader for Content
export const SkeletonLoader = ({ 
  lines = 3, 
  showAvatar = false, 
  className = "" 
}) => {
  return (
    <div className={`animate-pulse ${className}`}>
      {showAvatar && (
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-10 h-10 bg-slate-700 rounded-full" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-slate-700 rounded w-1/4" />
            <div className="h-3 bg-slate-700 rounded w-1/3" />
          </div>
        </div>
      )}
      
      <div className="space-y-3">
        {[...Array(lines)].map((_, i) => (
          <div
            key={i}
            className={`h-4 bg-slate-700 rounded ${
              i === lines - 1 ? 'w-3/4' : 'w-full'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// Advanced Progress Ring
export const ProgressRing = ({ 
  progress = 0, 
  size = 120, 
  strokeWidth = 8,
  color = '#3b82f6',
  backgroundColor = '#374151',
  showPercentage = true,
  label = ""
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000"
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          {showPercentage && (
            <div className="text-slate-200 font-orbitron font-bold text-lg animate-fade-in">
              {Math.round(progress)}%
            </div>
          )}
          {label && (
            <div className="text-slate-400 font-orbitron text-xs mt-1">
              {label}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Loading State Manager Hook
export const useLoadingState = (initialSteps = []) => {
  const [steps, setSteps] = useState(initialSteps);
  const [currentStep, setCurrentStep] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  const nextStep = (stepName) => {
    if (stepName) {
      const stepIndex = steps.findIndex(step => step === stepName);
      if (stepIndex !== -1) {
        setCurrentStep(stepIndex + 1);
      }
    } else {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const completeLoading = () => {
    setCurrentStep(steps.length);
    setIsComplete(true);
  };

  const resetLoading = () => {
    setCurrentStep(0);
    setIsComplete(false);
  };

  const addStep = (stepName) => {
    setSteps(prev => [...prev, stepName]);
  };

  return {
    steps,
    currentStep,
    isComplete,
    nextStep,
    completeLoading,
    resetLoading,
    addStep,
    progress: steps.length > 0 ? (currentStep / steps.length) * 100 : 0
  };
};

export default NASALoader;