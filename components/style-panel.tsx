'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

interface StylePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FONT_OPTIONS = [
  { id: 'system', label: 'System' },
  { id: 'geist', label: 'Geist' },
  { id: 'inter', label: 'Inter' },
];
const DEFAULTS = { brandColor: '#6c2fff', font: 'geist', radius: 8, shadow: 12 } as const;


export default function StylePanel({ open, onOpenChange }: StylePanelProps) {
  const [brandColor, setBrandColor] = useState('#6c2fff');
  const [font, setFont] = useState('geist');
  const [radius, setRadius] = useState(8);
  const [shadow, setShadow] = useState(12);
  const reset = () => {
    setBrandColor(DEFAULTS.brandColor);
    setFont(DEFAULTS.font);
    setRadius(DEFAULTS.radius);
    setShadow(DEFAULTS.shadow);
    try { localStorage.removeItem('wr-style'); } catch {}
  };

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('wr-style');
      if (raw) {
        const v = JSON.parse(raw);
        if (v.brandColor) setBrandColor(v.brandColor);
        if (v.font) setFont(v.font);
        if (typeof v.radius === 'number') setRadius(v.radius);
        if (typeof v.shadow === 'number') setShadow(v.shadow);
      }
    } catch {}
  }, []);


  // Apply live CSS variables (instant preview)
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--brand', brandColor);
    root.style.setProperty('--radius', `${radius}px`);
    root.style.setProperty('--shadow', `${shadow}px`);

    // Font handling: switch CSS variables used in app/layout
    if (font === 'geist') {
      root.style.setProperty('--font-sans', 'var(--font-geist-sans)');
      root.style.setProperty('--font-mono', 'var(--font-geist-mono)');
    } else if (font === 'inter') {
      root.style.setProperty('--font-sans', 'Inter, system-ui, sans-serif');
      root.style.setProperty('--font-mono', 'JetBrains Mono, Fira Code, monospace');
    } else {
      root.style.setProperty('--font-sans', 'system-ui, -apple-system, Segoe UI, sans-serif');
      root.style.setProperty('--font-mono', 'monospace');
    }
  }, [brandColor, font, radius, shadow]);

  // Persist to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem('wr-style', JSON.stringify({ brandColor, font, radius, shadow }));
    } catch {}
  }, [brandColor, font, radius, shadow]);


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Style</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Brand color */}
          <div className="space-y-2">
            <Label>Brand Color</Label>
            <div className="flex items-center gap-2">
              <input type="color" value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="h-9 w-12 rounded" />
              <Input value={brandColor} onChange={(e) => setBrandColor(e.target.value)} className="font-mono text-xs" />
            </div>
          </div>

          {/* Font pair */}
          <div className="space-y-2">
            <Label>Font</Label>
            <Select value={font} onValueChange={setFont}>
              <SelectTrigger>
                <SelectValue placeholder="Choose font" />
              </SelectTrigger>
              <SelectContent>
                {FONT_OPTIONS.map(f => (
                  <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Radius */}
          <div className="space-y-2">
            <Label>Radius</Label>
            <Slider value={[radius]} max={24} step={1} onValueChange={(v) => setRadius(v[0])} />
          </div>

          {/* Shadows */}
          <div className="space-y-2">
            <Label>Shadow</Label>
            <Slider value={[shadow]} max={32} step={1} onValueChange={(v) => setShadow(v[0])} />
            <div className="text-xs text-muted-foreground">Components can use var(--shadow) to standardize depth.</div>
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="outline" size="sm" onClick={reset}>Reset</Button>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}

