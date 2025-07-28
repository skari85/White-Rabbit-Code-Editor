'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type LayoutMode = 'single' | 'split-horizontal' | 'split-vertical' | 'grid';

interface HexLayoutSwitcherProps {
  children?: React.ReactNode;
  onLayoutChange?: (layout: LayoutMode) => void;
}

export default function HexLayoutSwitcher({ children, onLayoutChange }: HexLayoutSwitcherProps) {
  const [layout, setLayout] = useState<LayoutMode>('single');

  const handleLayoutChange = (newLayout: LayoutMode) => {
    setLayout(newLayout);
    onLayoutChange?.(newLayout);
  };

  const getLayoutClasses = () => {
    switch (layout) {
      case 'split-horizontal':
        return 'grid grid-cols-2 gap-4';
      case 'split-vertical':
        return 'grid grid-rows-2 gap-4';
      case 'grid':
        return 'grid grid-cols-2 grid-rows-2 gap-4';
      default:
        return 'grid grid-cols-1';
    }
  };

  const renderPanes = () => {
    const paneCount = layout === 'grid' ? 4 : layout.includes('split') ? 2 : 1;
    const panes = [];

    for (let i = 0; i < paneCount; i++) {
      panes.push(
        <Card key={i} className="p-4 min-h-[300px] bg-gradient-to-br from-slate-900 to-slate-800 border-green-500/20">
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <span className="text-green-400 font-mono text-sm">
                {layout === 'grid' ? `Pane ${i + 1}` : layout.includes('split') ? (i === 0 ? 'Primary' : 'Secondary') : 'Main'}
              </span>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <div className="flex-1 bg-black/20 rounded border border-green-500/10 p-4">
              {children || (
                <div className="text-green-300/60 font-mono text-sm">
                  // Your content here...
                  <br />
                  // Ready for hex magic ✨
                </div>
              )}
            </div>
          </div>
        </Card>
      );
    }

    return panes;
  };

  return (
    <div className="w-full space-y-4">
      {/* Layout Controls */}
      <div className="flex items-center gap-2 p-4 bg-slate-900/50 rounded-lg border border-green-500/20">
        <span className="text-green-400 font-mono text-sm mr-4">Layout:</span>
        
        <Button
          variant={layout === 'single' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleLayoutChange('single')}
          className="font-mono text-xs"
        >
          🧿 Single
        </Button>
        
        <Button
          variant={layout === 'split-horizontal' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleLayoutChange('split-horizontal')}
          className="font-mono text-xs"
        >
          ⬌ Split H
        </Button>
        
        <Button
          variant={layout === 'split-vertical' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleLayoutChange('split-vertical')}
          className="font-mono text-xs"
        >
          ⬍ Split V
        </Button>
        
        <Button
          variant={layout === 'grid' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleLayoutChange('grid')}
          className="font-mono text-xs"
        >
          ⊞ Grid
        </Button>

        <div className="ml-auto text-green-400/60 font-mono text-xs">
          {layout.replace('-', ' ').toUpperCase()} MODE
        </div>
      </div>

      {/* Layout Container */}
      <div className={`w-full min-h-[400px] ${getLayoutClasses()}`}>
        {renderPanes()}
      </div>
    </div>
  );
}

// Hook for using layout state in other components
export function useHexLayout() {
  const [layout, setLayout] = useState<LayoutMode>('single');
  
  return {
    layout,
    setLayout,
    isSplit: layout.includes('split'),
    isGrid: layout === 'grid',
    paneCount: layout === 'grid' ? 4 : layout.includes('split') ? 2 : 1
  };
}
