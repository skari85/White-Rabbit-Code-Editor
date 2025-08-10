'use client';

import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Keyboard, Rocket, Palette, BarChart3, Terminal, Command as CmdIcon, Copy } from 'lucide-react';

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function OnboardingModal({ open, onOpenChange }: OnboardingModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [copied, setCopied] = useState(false);

  const shortcuts = [
    { keys: ['Cmd/Ctrl', 'R'], label: 'Run Dev (switches to Terminal)' },
    { keys: ['Cmd/Ctrl', 'B'], label: 'Build' },
    { keys: ['Cmd/Ctrl', 'Shift', 'T'], label: 'Type-check' },
    { keys: ['Cmd/Ctrl', 'Shift', 'L'], label: 'Lint' },
    { keys: ['Cmd/Ctrl', 'K'], label: 'Open Command Palette' },
  ];

  const copyShortcuts = async () => {
    try {
      const text = shortcuts
        .map(s => `${s.label}: ${s.keys.join(' + ')}`)
        .join('\n');
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  useEffect(() => {
    if (!open && dontShowAgain) {
      try { localStorage.setItem('wr-onboarded', '1'); } catch {}
    }
  }, [open, dontShowAgain]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="w-4 h-4" /> Getting Started & Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Quick start */}
          <div className="grid md:grid-cols-3 gap-3">
            <div className="rounded border p-3">
              <div className="flex items-center gap-2 text-sm font-medium"><Rocket className="w-4 h-4"/>New App</div>
              <p className="text-xs text-muted-foreground mt-1">Use the New App wizard to scaffold a starter with nav, hero and features.</p>
              <Badge variant="secondary" className="mt-2">Toolbar → New App</Badge>
            </div>
            <div className="rounded border p-3">
              <div className="flex items-center gap-2 text-sm font-medium"><Palette className="w-4 h-4"/>Style</div>
              <p className="text-xs text-muted-foreground mt-1">Adjust brand color, fonts, radius & shadows with instant preview.</p>
              <Badge variant="secondary" className="mt-2">Toolbar → Style</Badge>
            </div>
            <div className="rounded border p-3">
              <div className="flex items-center gap-2 text-sm font-medium"><BarChart3 className="w-4 h-4"/>Publish</div>
              <p className="text-xs text-muted-foreground mt-1">One‑click deploy to Vercel and get a shareable preview URL.</p>
              <Badge variant="secondary" className="mt-2">Toolbar → Publish</Badge>
            </div>
          </div>

          <Separator />

          {/* Shortcuts */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-sm font-medium"><CmdIcon className="w-4 h-4"/>Keyboard Shortcuts</div>
              <Button variant="outline" size="sm" onClick={copyShortcuts}>
                <Copy className="w-3 h-3 mr-1" /> {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
            <div className="grid md:grid-cols-2 gap-2">
              {shortcuts.map((s, i) => (
                <div key={i} className="flex items-center justify-between rounded border p-2">
                  <span className="text-sm">{s.label}</span>
                  <div className="flex items-center gap-1">
                    {s.keys.map((k, idx) => (
                      <kbd key={idx} className="px-2 py-1 text-xs bg-gray-100 rounded border">{k}</kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Command Palette lets you run actions by name. Try typing “build”, “lint”, or “insert”.</p>
          </div>

          {/* Terminal note */}
          <div className="rounded border p-3 bg-gray-50">
            <div className="flex items-center gap-2 text-sm font-medium"><Terminal className="w-4 h-4"/>Terminal & Logs</div>
            <p className="text-xs text-muted-foreground mt-1">Run/Build/Type‑check/Lint stream to the Terminal tab with statuses and collapsible sections. Use Cmd/Ctrl+R to start Dev quickly.</p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <label className="text-xs flex items-center gap-2">
              <input type="checkbox" checked={dontShowAgain} onChange={(e) => setDontShowAgain(e.target.checked)} />
              Don’t show this again
            </label>
            <div className="flex gap-2 items-center">
              <Button variant="ghost" size="sm" onClick={() => { try { window.open('/shortcuts', '_blank'); } catch {} }}>View all shortcuts</Button>
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Close</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

