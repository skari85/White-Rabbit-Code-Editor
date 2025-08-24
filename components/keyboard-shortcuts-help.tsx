'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { 
  Keyboard, 
  Search, 
  FileText, 
  Code, 
  Terminal, 
  Zap, 
  Settings,
  HelpCircle
} from 'lucide-react';

interface ShortcutGroup {
  title: string;
  icon: React.ReactNode;
  shortcuts: {
    keys: string[];
    description: string;
    category?: string;
  }[];
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: 'File Operations',
    icon: <FileText className="w-4 h-4" />,
    shortcuts: [
      { keys: ['Ctrl', 'S'], description: 'Save current file' },
      { keys: ['Ctrl', 'O'], description: 'Open file' },
      { keys: ['Ctrl', 'N'], description: 'Create new file' },
      { keys: ['Ctrl', 'W'], description: 'Close current tab' },
      { keys: ['Ctrl', 'Shift', 'S'], description: 'Save all files' }
    ]
  },
  {
    title: 'Code Editing',
    icon: <Code className="w-4 h-4" />,
    shortcuts: [
      { keys: ['Ctrl', '/'], description: 'Toggle line comment' },
      { keys: ['Ctrl', 'Shift', 'I'], description: 'Format document' },
      { keys: ['Ctrl', 'D'], description: 'Duplicate line' },
      { keys: ['Ctrl', 'Delete'], description: 'Delete line' },
      { keys: ['Alt', '↑'], description: 'Move line up' },
      { keys: ['Alt', '↓'], description: 'Move line down' },
      { keys: ['Ctrl', 'Z'], description: 'Undo' },
      { keys: ['Ctrl', 'Y'], description: 'Redo' }
    ]
  },
  {
    title: 'Search & Navigation',
    icon: <Search className="w-4 h-4" />,
    shortcuts: [
      { keys: ['Ctrl', 'F'], description: 'Find in file' },
      { keys: ['Ctrl', 'H'], description: 'Find and replace' },
      { keys: ['Ctrl', 'Shift', 'F'], description: 'Find in all files' },
      { keys: ['Ctrl', 'G'], description: 'Go to line' },
      { keys: ['F12'], description: 'Go to definition' },
      { keys: ['Shift', 'F12'], description: 'Find all references' }
    ]
  },
  {
    title: 'AI Features',
    icon: <Zap className="w-4 h-4" />,
    shortcuts: [
      { keys: ['Ctrl', 'K'], description: 'Open AI chat' },
      { keys: ['Ctrl', 'Shift', 'G'], description: 'Generate code' },
      { keys: ['Ctrl', 'Shift', 'E'], description: 'Explain selected code' },
      { keys: ['Ctrl', 'Shift', 'O'], description: 'Optimize code' },
      { keys: ['Ctrl', 'Shift', 'D'], description: 'Generate documentation' }
    ]
  },
  {
    title: 'Interface',
    icon: <Settings className="w-4 h-4" />,
    shortcuts: [
      { keys: ['Ctrl', '`'], description: 'Toggle terminal' },
      { keys: ['Ctrl', 'B'], description: 'Toggle sidebar' },
      { keys: ['F11'], description: 'Toggle fullscreen' },
      { keys: ['Ctrl', '+'], description: 'Zoom in' },
      { keys: ['Ctrl', '-'], description: 'Zoom out' },
      { keys: ['Ctrl', '0'], description: 'Reset zoom' }
    ]
  },
  {
    title: 'Terminal',
    icon: <Terminal className="w-4 h-4" />,
    shortcuts: [
      { keys: ['Ctrl', 'Shift', '`'], description: 'New terminal' },
      { keys: ['Ctrl', 'Shift', 'C'], description: 'Copy (in terminal)' },
      { keys: ['Ctrl', 'Shift', 'V'], description: 'Paste (in terminal)' },
      { keys: ['Ctrl', 'C'], description: 'Interrupt process' }
    ]
  }
];

function ShortcutKey({ children }: { children: string }) {
  return (
    <Badge variant="outline" className="px-2 py-1 text-xs font-mono bg-muted">
      {children}
    </Badge>
  );
}

function ShortcutItem({ shortcut }: { shortcut: { keys: string[]; description: string } }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-muted-foreground">{shortcut.description}</span>
      <div className="flex gap-1">
        {shortcut.keys.map((key, index) => (
          <React.Fragment key={key}>
            <ShortcutKey>{key}</ShortcutKey>
            {index < shortcut.keys.length - 1 && (
              <span className="text-xs text-muted-foreground mx-1">+</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export function KeyboardShortcutsHelp() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredGroups = shortcutGroups.map(group => ({
    ...group,
    shortcuts: group.shortcuts.filter(shortcut =>
      shortcut.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      shortcut.keys.some(key => key.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  })).filter(group => group.shortcuts.length > 0);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Keyboard className="w-4 h-4" />
          Shortcuts
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-5 h-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search shortcuts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <ScrollArea className="h-[60vh]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
              {filteredGroups.map((group, index) => (
                <Card key={group.title} className="h-fit">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      {group.icon}
                      {group.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    {group.shortcuts.map((shortcut, shortcutIndex) => (
                      <div key={shortcutIndex}>
                        <ShortcutItem shortcut={shortcut} />
                        {shortcutIndex < group.shortcuts.length - 1 && (
                          <Separator className="my-1" />
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {filteredGroups.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No shortcuts found matching "{searchQuery}"</p>
              </div>
            )}
          </ScrollArea>

          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            <p>Press <ShortcutKey>?</ShortcutKey> to open this help dialog anytime</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Hook to show shortcuts help with ? key
export function useShortcutsHelp() {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '?' && !event.ctrlKey && !event.altKey && !event.metaKey) {
        // Only trigger if not in an input field
        const target = event.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA' && !target.isContentEditable) {
          event.preventDefault();
          // Trigger shortcuts help dialog
          const shortcutsButton = document.querySelector('[data-shortcuts-trigger]') as HTMLButtonElement;
          shortcutsButton?.click();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
}
