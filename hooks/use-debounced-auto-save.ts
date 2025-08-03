import { useCallback, useEffect, useRef, useState } from 'react';

interface UseAutoSaveOptions {
  delay?: number;
  onSave: (data: any) => Promise<void> | void;
  enabled?: boolean;
}

interface UseAutoSaveReturn {
  save: (data: any) => void;
  forceSave: () => Promise<void>;
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  clearUnsavedChanges: () => void;
}

export function useAutoSave({
  delay = 2000,
  onSave,
  enabled = true
}: UseAutoSaveOptions): UseAutoSaveReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingDataRef = useRef<any>(null);
  const isEnabledRef = useRef(enabled);

  // Update enabled ref when prop changes
  useEffect(() => {
    isEnabledRef.current = enabled;
  }, [enabled]);

  const performSave = useCallback(async (data: any) => {
    if (!isEnabledRef.current) return;
    
    setIsSaving(true);
    try {
      await onSave(data);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      pendingDataRef.current = null;
    } catch (error) {
      console.error('Auto-save failed:', error);
      // Keep unsaved changes flag true on error
    } finally {
      setIsSaving(false);
    }
  }, [onSave]);

  const save = useCallback((data: any) => {
    if (!isEnabledRef.current) return;

    pendingDataRef.current = data;
    setHasUnsavedChanges(true);

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      if (pendingDataRef.current !== null) {
        performSave(pendingDataRef.current);
      }
    }, delay);
  }, [delay, performSave]);

  const forceSave = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (pendingDataRef.current !== null) {
      await performSave(pendingDataRef.current);
    }
  }, [performSave]);

  const clearUnsavedChanges = useCallback(() => {
    setHasUnsavedChanges(false);
    pendingDataRef.current = null;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Save on page unload if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges && pendingDataRef.current !== null) {
        // Try to save synchronously (limited time)
        try {
          onSave(pendingDataRef.current);
        } catch (error) {
          console.error('Failed to save on page unload:', error);
        }
        
        // Show confirmation dialog
        event.preventDefault();
        event.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return event.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, onSave]);

  return {
    save,
    forceSave,
    isSaving,
    lastSaved,
    hasUnsavedChanges,
    clearUnsavedChanges
  };
}

// Specialized hook for localStorage auto-save
export function useLocalStorageAutoSave(key: string, delay = 1000) {
  return useAutoSave({
    delay,
    onSave: useCallback((data: any) => {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (error) {
        console.error('Failed to save to localStorage:', error);
        throw error;
      }
    }, [key])
  });
}
