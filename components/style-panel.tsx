'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import type { ScopeGlowConfig } from '@/lib/scope-detection-engine';
import { useEffect, useState } from 'react';

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
const DEFAULTS = { font: 'geist', radius: 8, shadow: 12 } as const;


export default function StylePanel({ open, onOpenChange }: StylePanelProps) {
  const [font, setFont] = useState('geist');
  const [radius, setRadius] = useState(8);
  const [shadow, setShadow] = useState(12);
  const [scopeGlow, setScopeGlow] = useState<ScopeGlowConfig>({
    enabled: true,
    intensity: 0.8,
    colorScheme: 'hybrid',
    animationSpeed: 1800,
    fadeInDuration: 250,
    fadeOutDuration: 200
  });
  const reset = () => {
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
        if (v.font) setFont(v.font);
        if (typeof v.radius === 'number') setRadius(v.radius);
        if (typeof v.shadow === 'number') setShadow(v.shadow);
        if (v.scopeGlow) setScopeGlow(v.scopeGlow as ScopeGlowConfig);
      }
    } catch {}
  }, []);


  // Apply live CSS variables (instant preview)
  useEffect(() => {
    const root = document.documentElement;
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
  }, [font, radius, shadow]);

  // Persist to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem('wr-style', JSON.stringify({ font, radius, shadow, scopeGlow }));
    } catch {}
  }, [font, radius, shadow, scopeGlow]);


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Style</DialogTitle>
          <DialogDescription>
            Customize the overall look and feel of your application.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">

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

          {/* Scope Glow */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Scope Glow</Label>
              <input type="checkbox" checked={scopeGlow.enabled} onChange={(e) => setScopeGlow({ ...scopeGlow, enabled: e.target.checked })} />
            </div>
            {scopeGlow.enabled && (
              <div className="grid gap-3">
                <div className="space-y-2">
                  <Label>Intensity</Label>
                  <Slider value={[Math.round(scopeGlow.intensity * 100)]} max={100} step={1} onValueChange={([v]) => setScopeGlow({ ...scopeGlow, intensity: v / 100 })} />
                </div>
                <div className="space-y-2">
                  <Label>Color Scheme</Label>
                  <select className="px-2 py-1 border rounded-md bg-white" value={scopeGlow.colorScheme} onChange={(e) => setScopeGlow({ ...scopeGlow, colorScheme: e.target.value as any })}>
                    <option value="depth-based">Depth-based</option>
                    <option value="type-based">Type-based</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Animation Speed (ms)</Label>
                    <input type="number" className="px-2 py-1 border rounded-md w-full" value={scopeGlow.animationSpeed} min={600} max={5000} step={100} onChange={(e) => setScopeGlow({ ...scopeGlow, animationSpeed: parseInt(e.target.value || '0', 10) })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Fade In (ms)</Label>
                    <input type="number" className="px-2 py-1 border rounded-md w-full" value={scopeGlow.fadeInDuration} min={0} max={2000} step={50} onChange={(e) => setScopeGlow({ ...scopeGlow, fadeInDuration: parseInt(e.target.value || '0', 10) })} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-2">
            <Button variant="outline" size="sm" onClick={reset}>Reset</Button>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}

