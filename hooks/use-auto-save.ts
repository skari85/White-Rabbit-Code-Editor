import { useEffect, useRef, useState } from 'react';

interface AutoSaveOptions {
  delay?: number;
  enabled?: boolean;
  onSave?: (data: any) => Promise<void>;
  onError?: (error: Error) => void;
}

interface AutoSaveState {
  isSaving: boolean;
  lastSaved: Date | null;
  lastError: Error | null;
  saveCount: number;
}

interface ExtendedAutoSaveState extends AutoSaveState {
  performSave: () => void;
}

export function useAutoSave<T>(
  data: T,
  options: AutoSaveOptions = {}
): ExtendedAutoSaveState {
  const {
    delay = 2000, // 2 seconds default
    enabled = true,
    onSave,
    onError
  } = options;

  const [state, setState] = useState<AutoSaveState>({
    isSaving: false,
    lastSaved: null,
    lastError: null,
    saveCount: 0
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDataRef = useRef<T | null>(null);

  // Auto-save to localStorage as fallback
  const saveToLocalStorage = (data: T) => {
    try {
      const key = `auto-save-${Date.now()}`;
      const saveData = {
        data,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
      
      // Keep only last 10 auto-saves
      const existingKeys = Object.keys(localStorage)
        .filter(key => key.startsWith('auto-save-'))
        .sort()
        .slice(-9);
      
      // Remove old saves
      existingKeys.forEach(key => localStorage.removeItem(key));
      
      localStorage.setItem(key, JSON.stringify(saveData));
      return true;
    } catch (error) {
      console.warn('Failed to save to localStorage:', error);
      return false;
    }
  };

  // Load from localStorage
  const loadFromLocalStorage = (): T | null => {
    try {
      const keys = Object.keys(localStorage)
        .filter(key => key.startsWith('auto-save-'))
        .sort()
        .reverse();
      
      if (keys.length === 0) return null;
      
      const latestKey = keys[0];
      const savedData = localStorage.getItem(latestKey);
      
      if (!savedData) return null;
      
      const parsed = JSON.parse(savedData);
      return parsed.data;
    } catch (error) {
      console.warn('Failed to load from localStorage:', error);
      return null;
    }
  };

  // Main auto-save function
  const performSave = async (data: T) => {
    if (!enabled) return;

    setState(prev => ({ ...prev, isSaving: true, lastError: null }));

    try {
      // Try custom save function first
      if (onSave) {
        await onSave(data);
      } else {
        // Fallback to localStorage
        saveToLocalStorage(data);
      }

      setState(prev => ({
        ...prev,
        isSaving: false,
        lastSaved: new Date(),
        saveCount: prev.saveCount + 1
      }));
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      
      setState(prev => ({
        ...prev,
        isSaving: false,
        lastError: errorObj
      }));

      // Fallback to localStorage on error
      saveToLocalStorage(data);

      if (onError) {
        onError(errorObj);
      }
    }
  };

  // Debounced auto-save
  useEffect(() => {
    if (!enabled || !data) return;

    // Skip if data hasn't changed
    if (JSON.stringify(data) === JSON.stringify(lastDataRef.current)) {
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      lastDataRef.current = data;
      performSave(data);
    }, delay);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, enabled, onSave, onError]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    // Expose utility functions
    performSave: () => performSave(data)
  };
}

// Hook for file-specific auto-save
export function useFileAutoSave(
  fileName: string,
  content: string,
  options: Omit<AutoSaveOptions, 'onSave'> = {}
) {
  const { onError, ...restOptions } = options;

  return useAutoSave(
    { fileName, content, timestamp: Date.now() },
    {
      ...restOptions,
      onSave: async (data) => {
        // Save to localStorage with file-specific key
        const key = `file-auto-save-${fileName}`;
        localStorage.setItem(key, JSON.stringify(data));
      },
      onError
    }
  );
}
