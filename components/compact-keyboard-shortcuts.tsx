'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Keyboard, 
  Search, 
  Edit3, 
  X, 
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Zap,
  Code,
  GitBranch,
  Eye,
  Terminal,
  Palette,
  FileText,
  Settings,
  Command,
  ArrowUp,
  ArrowDown,
  Minimize2,
  Maximize2
} from 'lucide-react';

interface KeyboardShortcut {
  id: string;
  name: string;
  description: string;
  defaultKey: string;
  currentKey: string;
  category: string;
  action: string;
  isGlobal: boolean;
  isEnabled: boolean;
}

const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  // Editor Shortcuts
  {
    id: 'new-file',
    name: 'New File',
    description: 'Create a new file',
    defaultKey: 'Ctrl+N',
    currentKey: 'Ctrl+N',
    category: 'File',
    action: 'file.new',
    isGlobal: true,
    isEnabled: true
  },
  {
    id: 'save-file',
    name: 'Save File',
    description: 'Save current file',
    defaultKey: 'Ctrl+S',
    currentKey: 'Ctrl+S',
    category: 'File',
    action: 'file.save',
    isGlobal: true,
    isEnabled: true
  },
  {
    id: 'find',
    name: 'Find',
    description: 'Find in current file',
    defaultKey: 'Ctrl+F',
    currentKey: 'Ctrl+F',
    category: 'Editor',
    action: 'editor.find',
    isGlobal: false,
    isEnabled: true
  },
  {
    id: 'replace',
    name: 'Find & Replace',
    description: 'Find and replace in current file',
    defaultKey: 'Ctrl+H',
    currentKey: 'Ctrl+H',
    category: 'Editor',
    action: 'editor.replace',
    isGlobal: false,
    isEnabled: true
  },
  {
    id: 'comment',
    name: 'Toggle Comment',
    description: 'Comment/uncomment selected lines',
    defaultKey: 'Ctrl+/',
    currentKey: 'Ctrl+/',
    category: 'Editor',
    action: 'editor.comment',
    isGlobal: false,
    isEnabled: true
  },
  
  // Navigation
  {
    id: 'command-palette',
    name: 'Command Palette',
    description: 'Open command palette',
    defaultKey: 'Ctrl+K',
    currentKey: 'Ctrl+K',
    category: 'Navigation',
    action: 'navigation.commandPalette',
    isGlobal: true,
    isEnabled: true
  },
  {
    id: 'quick-open',
    name: 'Quick Open',
    description: 'Quick file navigation',
    defaultKey: 'Ctrl+P',
    currentKey: 'Ctrl+P',
    category: 'Navigation',
    action: 'navigation.quickOpen',
    isGlobal: true,
    isEnabled: true
  },
  
  // View Management
  {
    id: 'toggle-sidebar',
    name: 'Toggle Sidebar',
    description: 'Show/hide file explorer',
    defaultKey: 'Ctrl+B',
    currentKey: 'Ctrl+B',
    category: 'View',
    action: 'view.toggleSidebar',
    isGlobal: true,
    isEnabled: true
  },
  {
    id: 'toggle-terminal',
    name: 'Toggle Terminal',
    description: 'Show/hide integrated terminal',
    defaultKey: 'Ctrl+`',
    currentKey: 'Ctrl+`',
    category: 'View',
    action: 'view.toggleTerminal',
    isGlobal: true,
    isEnabled: true
  },
  
  // Development
  {
    id: 'run-code',
    name: 'Run Code',
    description: 'Execute current file',
    defaultKey: 'F5',
    currentKey: 'F5',
    category: 'Development',
    action: 'dev.runCode',
    isGlobal: false,
    isEnabled: true
  },
  {
    id: 'debug',
    name: 'Start Debugging',
    description: 'Start debugging session',
    defaultKey: 'F5',
    currentKey: 'F5',
    category: 'Development',
    action: 'dev.startDebug',
    isGlobal: false,
    isEnabled: true
  },
  
  // Git Operations
  {
    id: 'git-commit',
    name: 'Git Commit',
    description: 'Commit changes',
    defaultKey: 'Ctrl+Shift+G',
    currentKey: 'Ctrl+Shift+G',
    category: 'Git',
    action: 'git.commit',
    isGlobal: true,
    isEnabled: true
  },
  
  // AI Features
  {
    id: 'ai-chat',
    name: 'AI Chat',
    description: 'Open AI assistant',
    defaultKey: 'Ctrl+Shift+A',
    currentKey: 'Ctrl+Shift+A',
    category: 'AI',
    action: 'ai.openChat',
    isGlobal: true,
    isEnabled: true
  }
];

interface CompactKeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CompactKeyboardShortcuts({ isOpen, onClose }: CompactKeyboardShortcutsProps) {
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>(DEFAULT_SHORTCUTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingShortcut, setEditingShortcut] = useState<string | null>(null);
  const [recordingKey, setRecordingKey] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showConflicts, setShowConflicts] = useState(false);

  // Load shortcuts from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('wr-keyboard-shortcuts');
      if (saved) {
        const savedShortcuts = JSON.parse(saved);
        setShortcuts(prev => prev.map(s => 
          savedShortcuts[s.id] ? { ...s, currentKey: savedShortcuts[s.id] } : s
        ));
      }
    } catch (error) {
      console.warn('Failed to load keyboard shortcuts:', error);
    }
  }, []);

  // Save shortcuts to localStorage
  const saveShortcuts = useCallback((newShortcuts: KeyboardShortcut[]) => {
    try {
      const shortcutsMap = newShortcuts.reduce((acc, s) => {
        acc[s.id] = s.currentKey;
        return acc;
      }, {} as Record<string, string>);
      localStorage.setItem('wr-keyboard-shortcuts', JSON.stringify(shortcutsMap));
    } catch (error) {
      console.warn('Failed to save keyboard shortcuts:', error);
    }
  }, []);

  // Filter shortcuts
  const filteredShortcuts = shortcuts.filter(shortcut => {
    const matchesSearch = shortcut.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         shortcut.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || shortcut.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get categories
  const categories = Array.from(new Set(shortcuts.map(s => s.category)));

  // Check for key conflicts
  const checkConflicts = (key: string, excludeId?: string) => {
    return shortcuts.find(s => s.currentKey === key && s.id !== excludeId);
  };

  // Start editing a shortcut
  const startEditing = (shortcutId: string) => {
    setEditingShortcut(shortcutId);
    setRecordingKey(shortcutId);
  };

  // Handle key recording
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!recordingKey) return;

    e.preventDefault();
    e.stopPropagation();

    const keys: string[] = [];
    if (e.ctrlKey) keys.push('Ctrl');
    if (e.shiftKey) keys.push('Shift');
    if (e.altKey) keys.push('Alt');
    if (e.metaKey) keys.push('Cmd');
    
    if (e.key !== 'Control' && e.key !== 'Shift' && e.key !== 'Alt' && e.key !== 'Meta') {
      keys.push(e.key.toUpperCase());
    }

    if (keys.length > 0) {
      const newKey = keys.join('+');
      const conflict = checkConflicts(newKey, recordingKey);
      
      if (conflict) {
        setShowConflicts(true);
        setTimeout(() => setShowConflicts(false), 3000);
      } else {
        setShortcuts(prev => {
          const newShortcuts = prev.map(s => 
            s.id === recordingKey ? { ...s, currentKey: newKey } : s
          );
          saveShortcuts(newShortcuts);
          return newShortcuts;
        });
      }
      
      setRecordingKey(null);
      setEditingShortcut(null);
    }
  }, [recordingKey, saveShortcuts]);

  // Reset shortcut to default
  const resetShortcut = (shortcutId: string) => {
    setShortcuts(prev => {
      const newShortcuts = prev.map(s => 
        s.id === shortcutId ? { ...s, currentKey: s.defaultKey } : s
      );
      saveShortcuts(newShortcuts);
      return newShortcuts;
    });
  };

  // Toggle shortcut enabled state
  const toggleShortcut = (shortcutId: string) => {
    setShortcuts(prev => {
      const newShortcuts = prev.map(s => 
        s.id === shortcutId ? { ...s, isEnabled: !s.isEnabled } : s
      );
      saveShortcuts(newShortcuts);
      return newShortcuts;
    });
  };

  // Add event listener for key recording
  useEffect(() => {
    if (recordingKey) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [recordingKey, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      {/* Compact Floating Panel */}
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 transition-all duration-300 ${
        isExpanded ? 'w-96 h-96' : 'w-80 h-64'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4 text-blue-500" />
            <span className="font-medium text-sm">Keyboard Shortcuts</span>
            <Badge variant="outline" className="text-xs">
              {shortcuts.filter(s => s.isEnabled).length} active
            </Badge>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-6 w-6 p-0"
            >
              {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Search shortcuts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2 py-1 border rounded text-xs h-8"
            >
              <option value="all">All</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Shortcuts List */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="space-y-2">
            {filteredShortcuts.slice(0, isExpanded ? 20 : 8).map(shortcut => (
              <div
                key={shortcut.id}
                className={`p-2 rounded border transition-colors ${
                  !shortcut.isEnabled 
                    ? 'opacity-60 bg-gray-50 dark:bg-gray-700' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium truncate">{shortcut.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {shortcut.category}
                      </Badge>
                      {shortcut.isGlobal && (
                        <Badge variant="secondary" className="text-xs">
                          Global
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                      {shortcut.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1 ml-2">
                    {editingShortcut === shortcut.id ? (
                      <div className="flex items-center gap-1">
                        <div className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 border border-yellow-300 dark:border-yellow-700 rounded text-xs font-mono">
                          {recordingKey === shortcut.id ? 'Press keys...' : shortcut.currentKey}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingShortcut(null);
                            setRecordingKey(null);
                          }}
                          className="h-6 w-6 p-0"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 border rounded text-xs font-mono">
                          {shortcut.currentKey}
                        </kbd>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(shortcut.id)}
                          className="h-6 w-6 p-0"
                        >
                          <Edit3 className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => resetShortcut(shortcut.id)}
                      disabled={shortcut.currentKey === shortcut.defaultKey}
                      className="h-6 w-6 p-0"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleShortcut(shortcut.id)}
                      className="h-6 w-6 p-0"
                    >
                      {shortcut.isEnabled ? <CheckCircle className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {!isExpanded && filteredShortcuts.length > 8 && (
            <div className="mt-3 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(true)}
                className="text-xs"
              >
                Show {filteredShortcuts.length - 8} more shortcuts
                <ChevronDown className="w-3 h-3 ml-1" />
              </Button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-2">
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>Press Ctrl+K to open command palette</span>
            <span>{filteredShortcuts.filter(s => s.isEnabled).length}/{filteredShortcuts.length} active</span>
          </div>
        </div>
      </div>

      {/* Conflict Warning */}
      {showConflicts && (
        <div className="fixed top-20 right-4 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-200 px-3 py-2 rounded-lg shadow-lg text-sm">
          ⚠️ Key combination already in use! Choose a different combination.
        </div>
      )}
    </div>
  );
}
