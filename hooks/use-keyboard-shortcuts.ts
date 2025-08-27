'use client';

import { useCallback, useEffect, useRef } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  description: string;
  action: () => void;
  preventDefault?: boolean;
  enabled?: boolean;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
  target?: HTMLElement | null;
}

export function useKeyboardShortcuts({ 
  shortcuts, 
  enabled = true, 
  target 
}: UseKeyboardShortcutsOptions) {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback((event: Event) => {
    if (!enabled) return;
    
    const keyboardEvent = event as KeyboardEvent;

    const activeShortcuts = shortcutsRef.current.filter(shortcut => 
      shortcut.enabled !== false
    );

    for (const shortcut of activeShortcuts) {
      const keyMatches = keyboardEvent.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatches = !!keyboardEvent.ctrlKey === !!shortcut.ctrlKey;
      const shiftMatches = !!keyboardEvent.shiftKey === !!shortcut.shiftKey;
      const altMatches = !!keyboardEvent.altKey === !!shortcut.altKey;
      const metaMatches = !!keyboardEvent.metaKey === !!shortcut.metaKey;

      if (keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches) {
        if (shortcut.preventDefault !== false) {
          keyboardEvent.preventDefault();
        }
        shortcut.action();
        break;
      }
    }
  }, [enabled]);

  useEffect(() => {
    const element = target || document;
    element.addEventListener('keydown', handleKeyDown);
    
    return () => {
      element.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, target]);

  return {
    shortcuts: shortcutsRef.current
  };
}

// Common IDE shortcuts
export function useIDEShortcuts({
  onSave,
  onOpen,
  onNew,
  onFind,
  onReplace,
  onToggleTerminal,
  onToggleSidebar,
  onFormatCode,
  onToggleComment,
  onDuplicate,
  onDelete,
  enabled = true
}: {
  onSave?: () => void;
  onOpen?: () => void;
  onNew?: () => void;
  onFind?: () => void;
  onReplace?: () => void;
  onToggleTerminal?: () => void;
  onToggleSidebar?: () => void;
  onFormatCode?: () => void;
  onToggleComment?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  enabled?: boolean;
}) {
  const shortcuts: KeyboardShortcut[] = [
    // File operations
    {
      key: 's',
      ctrlKey: true,
      description: 'Save file',
      action: onSave || (() => {}),
      enabled: !!onSave
    },
    {
      key: 'o',
      ctrlKey: true,
      description: 'Open file',
      action: onOpen || (() => {}),
      enabled: !!onOpen
    },
    {
      key: 'n',
      ctrlKey: true,
      description: 'New file',
      action: onNew || (() => {}),
      enabled: !!onNew
    },
    
    // Search and replace
    {
      key: 'f',
      ctrlKey: true,
      description: 'Find',
      action: onFind || (() => {}),
      enabled: !!onFind
    },
    {
      key: 'h',
      ctrlKey: true,
      description: 'Replace',
      action: onReplace || (() => {}),
      enabled: !!onReplace
    },
    
    // UI toggles
    {
      key: '`',
      ctrlKey: true,
      description: 'Toggle terminal',
      action: onToggleTerminal || (() => {}),
      enabled: !!onToggleTerminal
    },
    {
      key: 'b',
      ctrlKey: true,
      description: 'Toggle sidebar',
      action: onToggleSidebar || (() => {}),
      enabled: !!onToggleSidebar
    },
    
    // Code editing
    {
      key: 'i',
      ctrlKey: true,
      shiftKey: true,
      description: 'Format code',
      action: onFormatCode || (() => {}),
      enabled: !!onFormatCode
    },
    {
      key: '/',
      ctrlKey: true,
      description: 'Toggle comment',
      action: onToggleComment || (() => {}),
      enabled: !!onToggleComment
    },
    {
      key: 'd',
      ctrlKey: true,
      description: 'Duplicate line',
      action: onDuplicate || (() => {}),
      enabled: !!onDuplicate
    },
    {
      key: 'Delete',
      ctrlKey: true,
      description: 'Delete line',
      action: onDelete || (() => {}),
      enabled: !!onDelete
    }
  ];

  return useKeyboardShortcuts({ shortcuts, enabled });
}

// AI-specific shortcuts
export function useAIShortcuts({
  onAIChat,
  onGenerateCode,
  onExplainCode,
  onOptimizeCode,
  enabled = true
}: {
  onAIChat?: () => void;
  onGenerateCode?: () => void;
  onExplainCode?: () => void;
  onOptimizeCode?: () => void;
  enabled?: boolean;
}) {
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'k',
      ctrlKey: true,
      description: 'Open AI chat',
      action: onAIChat || (() => {}),
      enabled: !!onAIChat
    },
    {
      key: 'g',
      ctrlKey: true,
      shiftKey: true,
      description: 'Generate code',
      action: onGenerateCode || (() => {}),
      enabled: !!onGenerateCode
    },
    {
      key: 'e',
      ctrlKey: true,
      shiftKey: true,
      description: 'Explain code',
      action: onExplainCode || (() => {}),
      enabled: !!onExplainCode
    },
    {
      key: 'o',
      ctrlKey: true,
      shiftKey: true,
      description: 'Optimize code',
      action: onOptimizeCode || (() => {}),
      enabled: !!onOptimizeCode
    }
  ];

  return useKeyboardShortcuts({ shortcuts, enabled });
}

// Utility function to format shortcut display
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];
  
  if (shortcut.ctrlKey) parts.push('Ctrl');
  if (shortcut.shiftKey) parts.push('Shift');
  if (shortcut.altKey) parts.push('Alt');
  if (shortcut.metaKey) parts.push('Cmd');
  
  parts.push(shortcut.key.toUpperCase());
  
  return parts.join(' + ');
}
