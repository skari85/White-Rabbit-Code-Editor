'use client';

import { CompileVibes } from '@/components/compile-vibes';
import { useCompileVibes } from '@/hooks/use-compile-vibes';
import { useEffect, useMemo } from 'react';

export interface CompileVibesOverlayProps {
  enabled?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  size?: 'small' | 'medium' | 'large';
  sensitivity?: 'low' | 'medium' | 'high';
  className?: string;
}

export function CompileVibesOverlay({
  enabled = true,
  position = 'top-right',
  size = 'medium',
  sensitivity = 'medium',
  className = ''
}: CompileVibesOverlayProps) {
  const compileVibesOptions = useMemo(() => ({
    enabled,
    position,
    size,
    sensitivity
  }), [enabled, position, size, sensitivity]);

  const {
    shouldShowAnimation,
    getCurrentState,
    getCurrentProgress,
    getAnimationDuration,
    getPositionStyles,
    currentCommand
  } = useCompileVibes(compileVibesOptions);

  // CSS styles are imported globally in globals.css

  if (!shouldShowAnimation()) {
    return null;
  }

  return (
    <div 
      className={`compile-vibes-overlay ${className}`}
      style={getPositionStyles()}
    >
      <CompileVibes
        state={getCurrentState()}
        progress={getCurrentProgress()}
        duration={getAnimationDuration()}
        size={size}
        onAnimationComplete={() => {
          // Animation completed - could trigger additional effects
          console.log(`Compile vibe animation completed for: ${currentCommand}`);
        }}
      />
      
      {/* Optional command label */}
      {currentCommand && (
        <div className="mt-2 text-center">
          <div className="text-xs text-gray-600 bg-white/80 backdrop-blur-sm rounded px-2 py-1 shadow-sm">
            {currentCommand.length > 30 ? `${currentCommand.substring(0, 30)}...` : currentCommand}
          </div>
        </div>
      )}
    </div>
  );
}

// Enhanced version with more features
export interface CompileVibesManagerProps {
  enabled?: boolean;
  showCommandLabel?: boolean;
  showProgress?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  size?: 'small' | 'medium' | 'large';
  sensitivity?: 'low' | 'medium' | 'high';
  className?: string;
  onVibeStart?: (command: string) => void;
  onVibeComplete?: (command: string, success: boolean) => void;
}

export function CompileVibesManager({
  enabled = true,
  showCommandLabel = true,
  showProgress = true,
  position = 'top-right',
  size = 'medium',
  sensitivity = 'medium',
  className = '',
  onVibeStart,
  onVibeComplete
}: CompileVibesManagerProps) {
  const {
    shouldShowAnimation,
    getCurrentState,
    getCurrentProgress,
    getAnimationDuration,
    getPositionStyles,
    currentCommand,
    currentEvent,
    getStats
  } = useCompileVibes({
    enabled,
    position,
    size,
    sensitivity
  });

  // Notify parent components of vibe events
  useEffect(() => {
    if (currentEvent) {
      if (currentEvent.state === 'building' || currentEvent.state === 'progress') {
        onVibeStart?.(currentEvent.command);
      } else if (currentEvent.state === 'success' || currentEvent.state === 'failure') {
        onVibeComplete?.(currentEvent.command, currentEvent.state === 'success');
      }
    }
  }, [currentEvent, onVibeStart, onVibeComplete]);

  // CSS styles are imported globally in globals.css

  if (!shouldShowAnimation()) {
    return null;
  }

  const stats = getStats();
  const currentState = getCurrentState();
  const currentProgress = getCurrentProgress();

  return (
    <div 
      className={`compile-vibes-manager ${className}`}
      style={getPositionStyles()}
    >
      {/* Main animation */}
      <div className="relative">
        <CompileVibes
          state={currentState}
          progress={currentProgress}
          duration={getAnimationDuration()}
          size={size}
          onAnimationComplete={() => {
            console.log(`Compile vibe animation completed for: ${currentCommand}`);
          }}
        />
        
        {/* Progress indicator overlay for progress state */}
        {showProgress && currentState === 'progress' && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
            <div className="text-xs font-medium text-blue-600 bg-white/90 backdrop-blur-sm rounded px-2 py-1 shadow-sm">
              {Math.round(currentProgress)}%
            </div>
          </div>
        )}
      </div>
      
      {/* Command label */}
      {showCommandLabel && currentCommand && (
        <div className="mt-3 text-center max-w-48">
          <div className="text-xs text-gray-700 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm border">
            <div className="font-medium truncate">
              {currentCommand.length > 25 ? `${currentCommand.substring(0, 25)}...` : currentCommand}
            </div>
            {currentState === 'building' && (
              <div className="text-gray-500 mt-1">Building...</div>
            )}
            {currentState === 'progress' && (
              <div className="text-blue-600 mt-1">
                Progress: {Math.round(currentProgress)}%
              </div>
            )}
            {currentState === 'success' && (
              <div className="text-green-600 mt-1">✓ Success!</div>
            )}
            {currentState === 'failure' && (
              <div className="text-red-600 mt-1">✗ Failed</div>
            )}
          </div>
        </div>
      )}
      
      {/* Stats indicator (only show if there have been multiple builds) */}
      {stats.total > 1 && (
        <div className="mt-2 text-center">
          <div className="text-xs text-gray-500 bg-white/70 backdrop-blur-sm rounded px-2 py-1">
            {stats.successful}/{stats.total} successful
          </div>
        </div>
      )}
    </div>
  );
}

// Simple wrapper for easy integration
export interface CompileVibesIndicatorProps {
  className?: string;
}

export function CompileVibesIndicator({ className = '' }: CompileVibesIndicatorProps) {
  return (
    <CompileVibesManager
      enabled={true}
      showCommandLabel={false}
      showProgress={false}
      position="top-right"
      size="small"
      sensitivity="medium"
      className={className}
    />
  );
}

// Minimal version for status bar
export function CompileVibesStatusIndicator() {
  const { hasActiveEvents, getCurrentState, getCurrentProgress } = useCompileVibes({
    enabled: true,
    size: 'small'
  });

  if (!hasActiveEvents) {
    return null;
  }

  const state = getCurrentState();
  const progress = getCurrentProgress();

  const getStateIcon = () => {
    switch (state) {
      case 'building':
        return '🌱';
      case 'progress':
        return '🌿';
      case 'success':
        return '🌸';
      case 'failure':
        return '🥀';
      default:
        return '';
    }
  };

  const getStateColor = () => {
    switch (state) {
      case 'building':
        return 'text-green-600';
      case 'progress':
        return 'text-blue-600';
      case 'success':
        return 'text-green-500';
      case 'failure':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className={`flex items-center gap-1 ${getStateColor()}`}>
      <span className="text-sm">{getStateIcon()}</span>
      {state === 'progress' && (
        <span className="text-xs font-medium">{Math.round(progress)}%</span>
      )}
    </div>
  );
}
