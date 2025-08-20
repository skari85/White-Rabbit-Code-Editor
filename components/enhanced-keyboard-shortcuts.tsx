'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Keyboard, 
  Search, 
  Edit3, 
  Save, 
  X, 
  Plus,
  Trash2,
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
  CheckCircle
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
    id: 'open-file',
    name: 'Open File',
    description: 'Open file dialog',
    defaultKey: 'Ctrl+O',
    currentKey: 'Ctrl+O',
    category: 'File',
    action: 'file.open',
    isGlobal: true,
    isEnabled: true
  },
  
  // Editor Actions
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
    name: 'Find and Replace',
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
  {
    id: 'format',
    name: 'Format Document',
    description: 'Format current document',
    defaultKey: 'Alt+Shift+F',
    currentKey: 'Alt+Shift+F',
    category: 'Editor',
    action: 'editor.format',
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
  {
    id: 'go-to-line',
    name: 'Go to Line',
    description: 'Navigate to specific line',
    defaultKey: 'Ctrl+G',
    currentKey: 'Ctrl+G',
    category: 'Navigation',
    action: 'navigation.goToLine',
    isGlobal: false,
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
    id: 'toggle-panel',
    name: 'Toggle Panel',
    description: 'Show/hide bottom panel',
    defaultKey: 'Ctrl+J',
    currentKey: 'Ctrl+J',
    category: 'View',
    action: 'view.togglePanel',
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
  {
    id: 'toggle-breakpoint',
    name: 'Toggle Breakpoint',
    description: 'Add/remove breakpoint',
    defaultKey: 'F9',
    currentKey: 'F9',
    category: 'Development',
    action: 'dev.toggleBreakpoint',
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
  {
    id: 'git-push',
    name: 'Git Push',
    description: 'Push to remote',
    defaultKey: 'Ctrl+Shift+P',
    currentKey: 'Ctrl+Shift+P',
    category: 'Git',
    action: 'git.push',
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
  },
  {
    id: 'ai-complete',
    name: 'AI Complete',
    description: 'Trigger AI code completion',
    defaultKey: 'Ctrl+Shift+Space',
    currentKey: 'Ctrl+Shift+Space',
    category: 'AI',
    action: 'ai.complete',
    isGlobal: false,
    isEnabled: true
  }
];

interface EnhancedKeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EnhancedKeyboardShortcuts({ isOpen, onClose }: EnhancedKeyboardShortcutsProps) {
  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>(DEFAULT_SHORTCUTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingShortcut, setEditingShortcut] = useState<string | null>(null);
  const [recordingKey, setRecordingKey] = useState<string | null>(null);
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

  // Reset all shortcuts
  const resetAllShortcuts = () => {
    setShortcuts(prev => {
      const newShortcuts = prev.map(s => ({ ...s, currentKey: s.defaultKey }));
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="border-b p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
              <Keyboard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Keyboard Shortcuts</h2>
              <p className="text-sm text-gray-600">Customize your keyboard shortcuts for maximum productivity</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={resetAllShortcuts}>
              Reset All
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search shortcuts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Shortcuts List */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {filteredShortcuts.map(shortcut => (
              <Card key={shortcut.id} className={`${!shortcut.isEnabled ? 'opacity-60' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium">{shortcut.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {shortcut.category}
                        </Badge>
                        {shortcut.isGlobal && (
                          <Badge variant="secondary" className="text-xs">
                            Global
                          </Badge>
                        )}
                        {!shortcut.isEnabled && (
                          <Badge variant="destructive" className="text-xs">
                            Disabled
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{shortcut.description}</p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {editingShortcut === shortcut.id ? (
                        <div className="flex items-center gap-2">
                          <div className="px-3 py-1 bg-yellow-100 border border-yellow-300 rounded text-sm font-mono">
                            {recordingKey === shortcut.id ? 'Press keys...' : shortcut.currentKey}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingShortcut(null);
                              setRecordingKey(null);
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <kbd className="px-3 py-1 bg-gray-100 border rounded text-sm font-mono">
                            {shortcut.currentKey}
                          </kbd>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditing(shortcut.id)}
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => resetShortcut(shortcut.id)}
                        disabled={shortcut.currentKey === shortcut.defaultKey}
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleShortcut(shortcut.id)}
                      >
                        {shortcut.isEnabled ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <span>Total Shortcuts: {shortcuts.length}</span>
              <span>Enabled: {shortcuts.filter(s => s.isEnabled).length}</span>
              <span>Customized: {shortcuts.filter(s => s.currentKey !== s.defaultKey).length}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs">💡 Tip: Global shortcuts work everywhere, editor shortcuts only in code editor</span>
            </div>
          </div>
        </div>

        {/* Conflict Warning */}
        {showConflicts && (
          <div className="fixed top-4 right-4 bg-red-100 border border-red-300 text-red-800 px-4 py-2 rounded-lg shadow-lg">
            ⚠️ Key combination already in use! Choose a different combination.
          </div>
        )}
      </div>
    </div>
  );
}
