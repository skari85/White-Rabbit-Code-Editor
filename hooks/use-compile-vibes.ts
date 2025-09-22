import { CompileVibeState } from '@/components/compile-vibes';
import { CompileVibeConfig, CompileVibeEvent, CompileVibesService } from '@/lib/compile-vibes-service';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface UseCompileVibesOptions {
  enabled?: boolean;
  position?: CompileVibeConfig['position'];
  size?: CompileVibeConfig['size'];
  sensitivity?: CompileVibeConfig['sensitivity'];
  autoHideDelay?: number;
}

export interface CompileVibesState {
  activeEvents: CompileVibeEvent[];
  currentEvent: CompileVibeEvent | null;
  isVisible: boolean;
  config: CompileVibeConfig;
}

export function useCompileVibes(options: UseCompileVibesOptions = {}) {
  const [state, setState] = useState<CompileVibesState>({
    activeEvents: [],
    currentEvent: null,
    isVisible: false,
    config: {
      enabled: true,
      showForCommands: [],
      animationDuration: 2000,
      autoHideDelay: 3000,
      position: 'top-right',
      size: 'medium',
      sensitivity: 'medium'
    }
  });

  const serviceRef = useRef<CompileVibesService | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Initialize service
  useEffect(() => {
    if (!serviceRef.current) {
      serviceRef.current = new CompileVibesService({
        enabled: options.enabled ?? true,
        position: options.position ?? 'top-right',
        size: options.size ?? 'medium',
        sensitivity: options.sensitivity ?? 'medium',
        autoHideDelay: options.autoHideDelay ?? 3000
      });
    } else {
      // Update existing service configuration
      serviceRef.current.updateConfig({
        enabled: options.enabled ?? true,
        position: options.position ?? 'top-right',
        size: options.size ?? 'medium',
        sensitivity: options.sensitivity ?? 'medium',
        autoHideDelay: options.autoHideDelay ?? 3000
      });
    }

    // Only subscribe once
    if (!unsubscribeRef.current) {
      unsubscribeRef.current = serviceRef.current.subscribe((event: CompileVibeEvent) => {
        setState(prev => {
          const activeEvents = serviceRef.current?.getActiveEvents() || [];
          const currentEvent = activeEvents.length > 0 ? activeEvents[activeEvents.length - 1] : null;

          return {
            ...prev,
            activeEvents,
            currentEvent,
            isVisible: !!currentEvent,
            config: serviceRef.current?.getConfig() || prev.config
          };
        });
      });
    }

    return () => {
      // Don't unsubscribe on every effect run, only on unmount
    };
  }, [options.enabled, options.position, options.size, options.sensitivity, options.autoHideDelay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
    };
  }, []);

  // Start tracking a command
  const startCommand = useCallback((command: string): string => {
    if (!serviceRef.current) return '';
    return serviceRef.current.startCommand(command);
  }, []);

  // Update command progress
  const updateProgress = useCallback((eventId: string, progress: number): void => {
    if (!serviceRef.current) return;
    serviceRef.current.updateProgress(eventId, progress);
  }, []);

  // Complete command with success
  const completeSuccess = useCallback((eventId: string, output?: string): void => {
    if (!serviceRef.current) return;
    serviceRef.current.completeSuccess(eventId, output);
  }, []);

  // Complete command with failure
  const completeFailure = useCallback((eventId: string, exitCode: number, error?: string): void => {
    if (!serviceRef.current) return;
    serviceRef.current.completeFailure(eventId, exitCode, error);
  }, []);

  // Cancel command
  const cancelCommand = useCallback((eventId: string): void => {
    if (!serviceRef.current) return;
    serviceRef.current.cancelCommand(eventId);
  }, []);

  // Clear all events
  const clearAll = useCallback((): void => {
    if (!serviceRef.current) return;
    serviceRef.current.clearAll();
  }, []);

  // Auto-track command execution with output parsing
  const trackCommand = useCallback(async (
    command: string,
    executeCommand: () => Promise<{ exitCode: number; output: string; error?: string }>
  ): Promise<{ exitCode: number; output: string; error?: string }> => {
    const eventId = startCommand(command);
    
    if (!eventId) {
      // Command not tracked, just execute normally
      return executeCommand();
    }

    try {
      const result = await executeCommand();
      
      // Parse progress from output if available
      if (serviceRef.current && result.output) {
        const progress = serviceRef.current.parseProgressFromOutput(result.output);
        if (progress !== null) {
          updateProgress(eventId, progress);
        }
      }

      // Determine success or failure
      if (result.exitCode === 0) {
        completeSuccess(eventId, result.output);
      } else {
        completeFailure(eventId, result.exitCode, result.error || result.output);
      }

      return result;
    } catch (error) {
      completeFailure(eventId, 1, error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }, [startCommand, updateProgress, completeSuccess, completeFailure]);

  // Track command with streaming output
  const trackStreamingCommand = useCallback((
    command: string,
    onOutput?: (output: string) => void,
    onError?: (error: string) => void
  ): {
    eventId: string;
    updateProgress: (progress: number) => void;
    complete: (success: boolean, finalOutput?: string) => void;
  } => {
    const eventId = startCommand(command);
    
    return {
      eventId,
      updateProgress: (progress: number) => updateProgress(eventId, progress),
      complete: (success: boolean, finalOutput?: string) => {
        if (success) {
          completeSuccess(eventId, finalOutput);
        } else {
          completeFailure(eventId, 1, finalOutput);
        }
      }
    };
  }, [startCommand, updateProgress, completeSuccess, completeFailure]);

  // Get position styles for the animation
  const getPositionStyles = useCallback((): React.CSSProperties => {
    const position = state.config.position;
    const baseStyles: React.CSSProperties = {
      position: 'fixed',
      zIndex: 9999,
      pointerEvents: 'none'
    };

    switch (position) {
      case 'top-right':
        return { ...baseStyles, top: '20px', right: '20px' };
      case 'top-left':
        return { ...baseStyles, top: '20px', left: '20px' };
      case 'bottom-right':
        return { ...baseStyles, bottom: '20px', right: '20px' };
      case 'bottom-left':
        return { ...baseStyles, bottom: '20px', left: '20px' };
      case 'center':
        return { 
          ...baseStyles, 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)' 
        };
      default:
        return { ...baseStyles, top: '20px', right: '20px' };
    }
  }, [state.config.position]);

  // Get current animation state
  const getCurrentState = useCallback((): CompileVibeState => {
    if (!state.currentEvent) return 'idle';
    return state.currentEvent.state;
  }, [state.currentEvent]);

  // Get current progress
  const getCurrentProgress = useCallback((): number => {
    return state.currentEvent?.progress || 0;
  }, [state.currentEvent]);

  // Check if should show animation
  const shouldShowAnimation = useCallback((): boolean => {
    return state.config.enabled && state.isVisible && !!state.currentEvent;
  }, [state.config.enabled, state.isVisible, state.currentEvent]);

  // Get animation duration
  const getAnimationDuration = useCallback((): number => {
    if (state.currentEvent && serviceRef.current) {
      return serviceRef.current.estimateCommandDuration(state.currentEvent.command);
    }
    return state.config.animationDuration;
  }, [state.currentEvent, state.config.animationDuration]);

  // Enable/disable compile vibes
  const setEnabled = useCallback((enabled: boolean): void => {
    if (serviceRef.current) {
      serviceRef.current.updateConfig({ enabled });
    }
  }, []);

  // Update configuration
  const updateConfig = useCallback((updates: Partial<CompileVibeConfig>): void => {
    if (serviceRef.current) {
      serviceRef.current.updateConfig(updates);
    }
  }, []);

  // Get statistics
  const getStats = useCallback(() => {
    const events = state.activeEvents;
    const totalEvents = events.length;
    const successfulEvents = events.filter(e => e.state === 'success').length;
    const failedEvents = events.filter(e => e.state === 'failure').length;
    const activeEvents = events.filter(e => e.state === 'building' || e.state === 'progress').length;

    return {
      total: totalEvents,
      successful: successfulEvents,
      failed: failedEvents,
      active: activeEvents,
      successRate: totalEvents > 0 ? (successfulEvents / totalEvents) * 100 : 0
    };
  }, [state.activeEvents]);

  // Check if command would trigger animation
  const wouldTriggerAnimation = useCallback((command: string): boolean => {
    if (!serviceRef.current) return false;
    return serviceRef.current['shouldShowVibeForCommand'](command);
  }, []);

  return {
    // State
    ...state,
    
    // Actions
    startCommand,
    updateProgress,
    completeSuccess,
    completeFailure,
    cancelCommand,
    clearAll,
    trackCommand,
    trackStreamingCommand,
    setEnabled,
    updateConfig,
    
    // Utilities
    getPositionStyles,
    getCurrentState,
    getCurrentProgress,
    shouldShowAnimation,
    getAnimationDuration,
    getStats,
    wouldTriggerAnimation,
    
    // Computed values
    hasActiveEvents: state.activeEvents.length > 0,
    isAnimating: shouldShowAnimation(),
    currentCommand: state.currentEvent?.command || '',
    currentEventId: state.currentEvent?.id || '',
    animationState: getCurrentState(),
    animationProgress: getCurrentProgress()
  };
}
