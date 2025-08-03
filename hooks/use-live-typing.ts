'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface LiveTypingOptions {
  speed?: number; // Characters per second
  onComplete?: () => void;
  onProgress?: (progress: number) => void;
}

interface LiveTypingState {
  displayedText: string;
  isTyping: boolean;
  progress: number;
  currentIndex: number;
}

export function useLiveTyping(
  targetText: string,
  options: LiveTypingOptions = {}
) {
  const {
    speed = 50, // Default 50 characters per second
    onComplete,
    onProgress
  } = options;

  const [state, setState] = useState<LiveTypingState>({
    displayedText: '',
    isTyping: false,
    progress: 0,
    currentIndex: 0
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const targetTextRef = useRef(targetText);
  const isActiveRef = useRef(false);

  // Memoize callbacks to prevent infinite re-renders
  const onCompleteRef = useRef(onComplete);
  const onProgressRef = useRef(onProgress);

  // Update refs when callbacks change
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  // Update target text when it changes
  useEffect(() => {
    targetTextRef.current = targetText;
  }, [targetText]);

  const startTyping = useCallback(() => {
    if (isActiveRef.current) return;
    
    isActiveRef.current = true;
    setState(prev => ({
      ...prev,
      isTyping: true,
      displayedText: '',
      currentIndex: 0,
      progress: 0
    }));

    const intervalMs = 1000 / speed;
    let currentIndex = 0;

    intervalRef.current = setInterval(() => {
      const currentTargetText = targetTextRef.current;
      
      if (currentIndex >= currentTargetText.length) {
        // Typing complete
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        
        setState(prev => ({
          ...prev,
          isTyping: false,
          progress: 100,
          displayedText: currentTargetText
        }));
        
        isActiveRef.current = false;
        onCompleteRef.current?.();
        onProgressRef.current?.(100);
        return;
      }

      // Add next character(s)
      const nextChar = currentTargetText[currentIndex];
      currentIndex++;

      // Handle special cases for smoother typing
      if (nextChar === '\n') {
        // Add slight pause for line breaks
        setTimeout(() => {
          setState(prev => ({
            ...prev,
            displayedText: currentTargetText.slice(0, currentIndex),
            currentIndex,
            progress: (currentIndex / currentTargetText.length) * 100
          }));

          onProgressRef.current?.((currentIndex / currentTargetText.length) * 100);
        }, 100);
      } else {
        setState(prev => ({
          ...prev,
          displayedText: currentTargetText.slice(0, currentIndex),
          currentIndex,
          progress: (currentIndex / currentTargetText.length) * 100
        }));

        onProgressRef.current?.((currentIndex / currentTargetText.length) * 100);
      }
    }, intervalMs);
  }, [speed]);

  const stopTyping = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    isActiveRef.current = false;
    setState(prev => ({
      ...prev,
      isTyping: false,
      displayedText: targetTextRef.current,
      progress: 100,
      currentIndex: targetTextRef.current.length
    }));

    onCompleteRef.current?.();
    onProgressRef.current?.(100);
  }, []);

  const resetTyping = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    isActiveRef.current = false;
    setState({
      displayedText: '',
      isTyping: false,
      progress: 0,
      currentIndex: 0
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    ...state,
    startTyping,
    stopTyping,
    resetTyping,
    setInstantText: (text: string) => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      isActiveRef.current = false;
      setState({
        displayedText: text,
        isTyping: false,
        progress: 100,
        currentIndex: text.length
      });
    }
  };
}

// Hook for live code generation with syntax awareness
export function useLiveCodeGeneration(options: LiveTypingOptions = {}) {
  const [generatedCode, setGeneratedCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const onComplete = useCallback(() => {
    setIsGenerating(false);
    options.onComplete?.();
  }, [options.onComplete]);

  const liveTyping = useLiveTyping(generatedCode, {
    ...options,
    speed: options.speed || 30, // Slower for code to be readable
    onComplete
  });

  const generateCode = useCallback((code: string) => {
    setGeneratedCode(code);
    setIsGenerating(true);
    liveTyping.resetTyping();

    // Start typing after a brief delay
    setTimeout(() => {
      liveTyping.startTyping();
    }, 100);
  }, [liveTyping]);

  const skipToEnd = useCallback(() => {
    liveTyping.stopTyping();
    setIsGenerating(false);
  }, [liveTyping]);

  return {
    displayedCode: liveTyping.displayedText,
    isGenerating: liveTyping.isTyping || isGenerating,
    progress: liveTyping.progress,
    generateCode,
    skipToEnd,
    resetGeneration: () => {
      liveTyping.resetTyping();
      setGeneratedCode('');
      setIsGenerating(false);
    }
  };
}

// Hook for live AI response with multiple code blocks
export function useLiveAIResponse() {
  const [fullResponse, setFullResponse] = useState('');
  const [codeBlocks, setCodeBlocks] = useState<Array<{
    language: string;
    code: string;
    filename?: string;
  }>>([]);
  
  const extractCodeBlocks = useCallback((text: string) => {
    const codeBlockRegex = /```(\w+)?\s*(?:\/\/\s*(.+?)\s*)?\n([\s\S]*?)```/g;
    const blocks: Array<{ language: string; code: string; filename?: string }> = [];
    let match;

    while ((match = codeBlockRegex.exec(text)) !== null) {
      const [, language = 'text', filename, code] = match;
      blocks.push({
        language: language.toLowerCase(),
        code: code.trim(),
        filename: filename?.trim()
      });
    }

    setCodeBlocks(blocks);
  }, []);

  const onComplete = useCallback(() => {
    // Extract code blocks when typing is complete
    extractCodeBlocks(fullResponse);
  }, [fullResponse, extractCodeBlocks]);

  const liveTyping = useLiveTyping(fullResponse, {
    speed: 40,
    onComplete
  });

  const startResponse = useCallback((response: string) => {
    setFullResponse(response);
    setCodeBlocks([]);
    liveTyping.resetTyping();

    setTimeout(() => {
      liveTyping.startTyping();
    }, 100);
  }, [liveTyping]);

  return {
    displayedResponse: liveTyping.displayedText,
    isTyping: liveTyping.isTyping,
    progress: liveTyping.progress,
    codeBlocks,
    startResponse,
    skipToEnd: liveTyping.stopTyping,
    resetResponse: () => {
      liveTyping.resetTyping();
      setFullResponse('');
      setCodeBlocks([]);
    }
  };
}
