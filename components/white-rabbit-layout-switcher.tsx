'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TerminalComponent } from '@/components/terminal';
import { FunctionNavigator } from '@/components/function-navigator';
import { DNAThreads } from '@/components/dna-threads';
import { Code, Terminal as TerminalIcon, FolderTree, Eye, Layers, Settings } from 'lucide-react';

type LayoutMode = 'single' | 'split-horizontal' | 'split-vertical' | 'grid';
type PaneContent = 'code' | 'terminal' | 'navigator' | 'preview' | 'dna' | 'context';

interface PaneConfig {
  id: string;
  title: string;
  content: PaneContent;
  icon: React.ReactNode;
}

interface WhiteRabbitLayoutSwitcherProps {
  children?: React.ReactNode;
  onLayoutChange?: (layout: LayoutMode) => void;
  selectedFile?: { name: string; content: string; type: string } | null;
  generatedFiles?: Array<{ name: string; content: string; type: string }>;
  onFileSelect?: (fileName: string) => void;
  dnaProps?: any;
  terminalProps?: any;
}

export default function WhiteRabbitLayoutSwitcher({
  children,
  onLayoutChange,
  selectedFile,
  generatedFiles = [],
  onFileSelect,
  dnaProps,
  terminalProps
}: WhiteRabbitLayoutSwitcherProps) {
  const [layout, setLayout] = useState<LayoutMode>('single');
  const [paneConfigs, setPaneConfigs] = useState<PaneConfig[]>([]);

  const handleLayoutChange = (newLayout: LayoutMode) => {
    setLayout(newLayout);
    onLayoutChange?.(newLayout);
    
    // Set default pane configurations based on layout
    const configs = getDefaultPaneConfigs(newLayout);
    setPaneConfigs(configs);
  };

  const getDefaultPaneConfigs = (layoutMode: LayoutMode): PaneConfig[] => {
    switch (layoutMode) {
      case 'single':
        return [
          { id: 'main', title: 'Code Editor', content: 'code', icon: <Code className="w-4 h-4" /> }
        ];
      case 'split-horizontal':
        return [
          { id: 'top', title: 'Code Editor', content: 'code', icon: <Code className="w-4 h-4" /> },
          { id: 'bottom', title: 'Terminal', content: 'terminal', icon: <TerminalIcon className="w-4 h-4" /> }
        ];
      case 'split-vertical':
        return [
          { id: 'left', title: 'Code Editor', content: 'code', icon: <Code className="w-4 h-4" /> },
          { id: 'right', title: 'File Navigator', content: 'navigator', icon: <FolderTree className="w-4 h-4" /> }
        ];
      case 'grid':
        return [
          { id: 'tl', title: 'Code Editor', content: 'code', icon: <Code className="w-4 h-4" /> },
          { id: 'tr', title: 'File Navigator', content: 'navigator', icon: <FolderTree className="w-4 h-4" /> },
          { id: 'bl', title: 'Terminal', content: 'terminal', icon: <TerminalIcon className="w-4 h-4" /> },
          { id: 'br', title: 'DNA Threads', content: 'dna', icon: <Layers className="w-4 h-4" /> }
        ];
      default:
        return [];
    }
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

  const changePaneContent = (paneId: string, newContent: PaneContent) => {
    setPaneConfigs(prev => prev.map(config => 
      config.id === paneId 
        ? { ...config, content: newContent, title: getContentTitle(newContent) }
        : config
    ));
  };

  const getContentTitle = (content: PaneContent): string => {
    switch (content) {
      case 'code': return 'Code Editor';
      case 'terminal': return 'Terminal';
      case 'navigator': return 'File Navigator';
      case 'preview': return 'Preview';
      case 'dna': return 'DNA Threads';
      case 'context': return 'Context';
      default: return 'Unknown';
    }
  };

  const renderPaneContent = (config: PaneConfig) => {
    switch (config.content) {
      case 'code':
        return (
          <div className="h-full">
            {selectedFile ? (
              <div className="h-full">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-green-400 font-mono text-sm">{selectedFile.name}</span>
                  <Badge variant="outline" className="text-xs">{selectedFile.type}</Badge>
                </div>
                <div className="bg-black/40 p-4 rounded border border-green-500/20 h-[calc(100%-2rem)] overflow-auto">
                  <pre className="text-green-300 font-mono text-sm">
                    <code>{selectedFile.content}</code>
                  </pre>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-green-400/60">
                <div className="text-center">
                  <Code className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-mono text-sm">No file selected</p>
                </div>
              </div>
            )}
          </div>
        );
      
      case 'terminal':
        return (
          <div className="h-full">
            {terminalProps && terminalProps.session ? (
              <TerminalComponent {...terminalProps} />
            ) : (
              <div className="flex items-center justify-center h-full text-green-400/60">
                <div className="text-center">
                  <TerminalIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-mono text-sm">Terminal</p>
                  <p className="font-mono text-xs mt-1 opacity-60">Terminal session not available</p>
                </div>
              </div>
            )}
          </div>
        );
      
      case 'navigator':
        return (
          <div className="h-full">
            <div className="mb-4">
              <h4 className="text-green-400 font-mono text-sm mb-2">Generated Files</h4>
              <div className="space-y-1">
                {generatedFiles.map((file) => (
                  <button
                    key={file.name}
                    className="w-full text-left p-2 rounded text-sm hover:bg-green-500/10 border border-green-500/20 flex items-center gap-2"
                    onClick={() => onFileSelect?.(file.name)}
                  >
                    <div className="w-2 h-2 rounded-full bg-green-400 opacity-60" />
                    <span className="text-green-300 font-mono">{file.name}</span>
                    <Badge variant="outline" className="text-xs ml-auto">{file.type}</Badge>
                  </button>
                ))}
              </div>
            </div>
            <FunctionNavigator 
              code={selectedFile?.content || ''}
              fileName={selectedFile?.name || 'untitled'}
              onJumpToFunction={(line) => console.log('Jump to line:', line)}
              onEditFunction={(func) => console.log('Edit function:', func)}
              personality="rabbit"
              isVisible={true}
              onToggleVisibility={(visible) => console.log('Toggle visibility:', visible)}
            />
          </div>
        );
      
      case 'preview':
        return (
          <div className="h-full flex items-center justify-center text-green-400/60">
            <div className="text-center">
              <Eye className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-mono text-sm">Preview Panel</p>
              <p className="font-mono text-xs mt-1 opacity-60">HTML preview coming soon</p>
            </div>
          </div>
        );
      
      case 'dna':
        return (
          <div className="h-full">
            {dnaProps ? (
              <DNAThreads {...dnaProps} />
            ) : (
              <div className="flex items-center justify-center h-full text-green-400/60">
                <div className="text-center">
                  <Layers className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-mono text-sm">DNA Threads</p>
                  <p className="font-mono text-xs mt-1 opacity-60">Code evolution tracking</p>
                </div>
              </div>
            )}
          </div>
        );
      
      case 'context':
        return (
          <div className="h-full flex items-center justify-center text-green-400/60">
            <div className="text-center">
              <Settings className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-mono text-sm">Context Panel</p>
              <p className="font-mono text-xs mt-1 opacity-60">AI context & suggestions</p>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="text-green-300/60 font-mono text-sm">
            // Your content here...
            <br />
            // Ready for White Rabbit magic ✨
          </div>
        );
    }
  };

  const renderPanes = () => {
    if (paneConfigs.length === 0) {
      // Initialize with default config
      const configs = getDefaultPaneConfigs(layout);
      setPaneConfigs(configs);
      return null;
    }

    return paneConfigs.map((config, i) => (
      <Card key={config.id} className="p-4 min-h-[300px] bg-gradient-to-br from-slate-900 to-slate-800 border-green-500/20">
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {config.icon}
              <span className="text-green-400 font-mono text-sm">{config.title}</span>
            </div>
            
            {/* Pane Content Switcher */}
            <div className="flex items-center gap-1">
              <Button
                variant={config.content === 'code' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => changePaneContent(config.id, 'code')}
                className="p-1 h-6 w-6"
              >
                <Code className="w-3 h-3" />
              </Button>
              <Button
                variant={config.content === 'terminal' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => changePaneContent(config.id, 'terminal')}
                className="p-1 h-6 w-6"
              >
                <TerminalIcon className="w-3 h-3" />
              </Button>
              <Button
                variant={config.content === 'navigator' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => changePaneContent(config.id, 'navigator')}
                className="p-1 h-6 w-6"
              >
                <FolderTree className="w-3 h-3" />
              </Button>
              <Button
                variant={config.content === 'dna' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => changePaneContent(config.id, 'dna')}
                className="p-1 h-6 w-6"
              >
                <Layers className="w-3 h-3" />
              </Button>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse ml-2"></div>
            </div>
          </div>
          
          <div className="flex-1 bg-black/20 rounded border border-green-500/10 p-4 overflow-auto">
            {renderPaneContent(config)}
          </div>
        </div>
      </Card>
    ));
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
          ⬌ Code + Terminal
        </Button>
        
        <Button
          variant={layout === 'split-vertical' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleLayoutChange('split-vertical')}
          className="font-mono text-xs"
        >
          ⬍ Code + Navigator
        </Button>
        
        <Button
          variant={layout === 'grid' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleLayoutChange('grid')}
          className="font-mono text-xs"
        >
          ⊞ Full Grid
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
export function useWhiteRabbitLayout() {
  const [layout, setLayout] = useState<LayoutMode>('single');

  return {
    layout,
    setLayout,
    isSplit: layout.includes('split'),
    isGrid: layout === 'grid',
    paneCount: layout === 'grid' ? 4 : layout.includes('split') ? 2 : 1
  };
}
