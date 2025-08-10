'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Command as CmdIcon, Keyboard, Play, Hammer, Bug, Wrench, Search, Code, Terminal } from 'lucide-react';

const sections: Array<{ title: string; items: Array<{ label: string; keys: string[] }> }> = [
  {
    title: 'Run & Build',
    items: [
      { label: 'Run Dev (switches to Terminal)', keys: ['Cmd/Ctrl', 'R'] },
      { label: 'Build', keys: ['Cmd/Ctrl', 'B'] },
      { label: 'Type-check', keys: ['Cmd/Ctrl', 'Shift', 'T'] },
      { label: 'Lint', keys: ['Cmd/Ctrl', 'Shift', 'L'] },
    ],
  },
  {
    title: 'Command Palette',
    items: [
      { label: 'Open Command Palette', keys: ['Cmd/Ctrl', 'K'] },
    ],
  },
  {
    title: 'Search & Navigation',
    items: [
      { label: 'Find in Files', keys: ['Cmd/Ctrl', 'Shift', 'F'] },
      { label: 'Find', keys: ['Cmd/Ctrl', 'F'] },
      { label: 'Replace', keys: ['Cmd/Ctrl', 'Alt', 'F'] },
    ],
  },
  {
    title: 'Editor',
    items: [
      { label: 'Save File', keys: ['Cmd/Ctrl', 'S'] },
      { label: 'Undo', keys: ['Cmd/Ctrl', 'Z'] },
      { label: 'Redo', keys: ['Cmd/Ctrl', 'Shift', 'Z'] },
      { label: 'Select All', keys: ['Cmd/Ctrl', 'A'] },
    ],
  },
];

export default function ShortcutsPage() {
  return (
    <div className="container mx-auto max-w-3xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Keyboard className="w-5 h-5" />
        <h1 className="text-lg font-semibold">Keyboard Shortcuts</h1>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <CmdIcon className="w-4 h-4" /> All Shortcuts
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sections.map((section) => (
            <div key={section.title}>
              <div className="text-sm font-medium mb-2">{section.title}</div>
              <div className="space-y-2">
                {section.items.map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded border p-2">
                    <span className="text-sm">{item.label}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((k) => (
                        <kbd key={k} className="px-2 py-1 text-xs bg-gray-100 rounded border">{k}</kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">Tip: Use Cmd/Ctrl+K and type to find any command quickly (e.g., "build", "lint").</p>
        </CardContent>
      </Card>
    </div>
  );
}

