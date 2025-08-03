'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Menu, 
  X, 
  Play, 
  Save, 
  Share2, 
  Settings, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  MoreVertical,
  Keyboard,
  Eye,
  Code,
  Smartphone,
  Tablet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileContent } from '@/hooks/use-code-builder';

interface MobileCodeEditorProps {
  files: FileContent[];
  selectedFile?: string;
  onFileSelect: (fileName: string) => void;
  onFileChange: (fileName: string, content: string) => void;
  onSave: () => void;
  onRun: () => void;
  onShare: () => void;
  className?: string;
}

interface TouchGesture {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  startTime: number;
  type: 'tap' | 'swipe' | 'pinch' | 'long-press' | null;
}

export default function MobileCodeEditor({
  files,
  selectedFile,
  onFileSelect,
  onFileChange,
  onSave,
  onRun,
  onShare,
  className = ''
}: MobileCodeEditorProps) {
  const [showSidebar, setShowSidebar] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [viewMode, setViewMode] = useState<'code' | 'preview' | 'split'>('code');
  const [fontSize, setFontSize] = useState(14);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [isLandscape, setIsLandscape] = useState(false);
  const [touchGesture, setTouchGesture] = useState<TouchGesture | null>(null);
  
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Detect orientation changes
  useEffect(() => {
    const handleOrientationChange = () => {
      setIsLandscape(window.innerHeight < window.innerWidth);
    };

    handleOrientationChange();
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', handleOrientationChange);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', handleOrientationChange);
    };
  }, []);

  // Handle virtual keyboard
  useEffect(() => {
    const handleResize = () => {
      const viewport = window.visualViewport;
      if (viewport) {
        const keyboardHeight = window.innerHeight - viewport.height;
        setShowKeyboard(keyboardHeight > 100);
      }
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
      return () => window.visualViewport?.removeEventListener('resize', handleResize);
    }
  }, []);

  // Touch gesture handling
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    setTouchGesture({
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      startTime: Date.now(),
      type: null
    });
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchGesture) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchGesture.startX;
    const deltaY = touch.clientY - touchGesture.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance > 10 && !touchGesture.type) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        setTouchGesture(prev => prev ? { ...prev, type: 'swipe' } : null);
      }
    }

    setTouchGesture(prev => prev ? {
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY
    } : null);
  }, [touchGesture]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchGesture) return;

    const duration = Date.now() - touchGesture.startTime;
    const deltaX = touchGesture.currentX - touchGesture.startX;
    const deltaY = touchGesture.currentY - touchGesture.startY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (touchGesture.type === 'swipe' && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        // Swipe right - show sidebar
        setShowSidebar(true);
      } else {
        // Swipe left - hide sidebar
        setShowSidebar(false);
      }
    } else if (duration > 500 && distance < 10) {
      // Long press - show context menu
      handleLongPress(touchGesture.startX, touchGesture.startY);
    }

    setTouchGesture(null);
  }, [touchGesture]);

  const handleLongPress = (x: number, y: number) => {
    // Show context menu at position
    console.log('Long press at:', x, y);
  };

  // Get current file content
  const getCurrentFile = () => {
    return files.find(f => f.name === selectedFile);
  };

  // Handle text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (selectedFile) {
      onFileChange(selectedFile, e.target.value);
      updateCursorPosition(e.target);
    }
  };

  // Update cursor position
  const updateCursorPosition = (textarea: HTMLTextAreaElement) => {
    const text = textarea.value.substring(0, textarea.selectionStart);
    const lines = text.split('\n');
    const line = lines.length;
    const column = lines[lines.length - 1].length + 1;
    setCursorPosition({ line, column });
  };

  // Insert text at cursor
  const insertText = (text: string) => {
    if (editorRef.current && selectedFile) {
      const textarea = editorRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentContent = getCurrentFile()?.content || '';
      
      const newContent = currentContent.substring(0, start) + text + currentContent.substring(end);
      onFileChange(selectedFile, newContent);
      
      // Set cursor position after inserted text
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + text.length;
        textarea.focus();
      }, 0);
    }
  };

  // Quick insert buttons
  const quickInsertButtons = [
    { label: '()', text: '()', offset: -1 },
    { label: '{}', text: '{}', offset: -1 },
    { label: '[]', text: '[]', offset: -1 },
    { label: ';', text: ';', offset: 0 },
    { label: ':', text: ':', offset: 0 },
    { label: '=', text: '=', offset: 0 },
    { label: '"', text: '""', offset: -1 },
    { label: "'", text: "''", offset: -1 },
    { label: 'Tab', text: '  ', offset: 0 },
    { label: '←', text: '', offset: 0, action: 'cursor-left' },
    { label: '→', text: '', offset: 0, action: 'cursor-right' },
    { label: '↑', text: '', offset: 0, action: 'cursor-up' },
    { label: '↓', text: '', offset: 0, action: 'cursor-down' }
  ];

  const handleQuickInsert = (button: typeof quickInsertButtons[0]) => {
    if (button.action) {
      handleCursorAction(button.action);
    } else {
      insertText(button.text);
    }
  };

  const handleCursorAction = (action: string) => {
    if (!editorRef.current) return;
    
    const textarea = editorRef.current;
    const { selectionStart } = textarea;
    
    switch (action) {
      case 'cursor-left':
        textarea.selectionStart = textarea.selectionEnd = Math.max(0, selectionStart - 1);
        break;
      case 'cursor-right':
        textarea.selectionStart = textarea.selectionEnd = Math.min(textarea.value.length, selectionStart + 1);
        break;
      case 'cursor-up':
      case 'cursor-down':
        // More complex cursor movement would be implemented here
        break;
    }
    
    textarea.focus();
    updateCursorPosition(textarea);
  };

  const currentFile = getCurrentFile();

  return (
    <div 
      ref={containerRef}
      className={`flex flex-col h-screen bg-gray-50 ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Mobile Header */}
      <div className="flex items-center justify-between p-3 bg-white border-b shadow-sm">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowSidebar(!showSidebar)}
            variant="ghost"
            size="sm"
            className="p-2"
          >
            <Menu className="w-5 h-5" />
          </Button>
          
          {selectedFile && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium truncate max-w-32">
                {selectedFile}
              </span>
              <Badge variant="secondary" className="text-xs">
                {cursorPosition.line}:{cursorPosition.column}
              </Badge>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded p-1">
            <Button
              onClick={() => setViewMode('code')}
              variant={viewMode === 'code' ? 'default' : 'ghost'}
              size="sm"
              className="p-1 h-8 w-8"
            >
              <Code className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => setViewMode('preview')}
              variant={viewMode === 'preview' ? 'default' : 'ghost'}
              size="sm"
              className="p-1 h-8 w-8"
            >
              <Eye className="w-4 h-4" />
            </Button>
          </div>

          <Button onClick={onSave} variant="ghost" size="sm" className="p-2">
            <Save className="w-4 h-4" />
          </Button>
          
          <Button onClick={onRun} variant="ghost" size="sm" className="p-2">
            <Play className="w-4 h-4" />
          </Button>
          
          <Button onClick={onShare} variant="ghost" size="sm" className="p-2">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {showSidebar && (
          <div className="w-64 bg-white border-r shadow-lg z-10 absolute inset-y-0 left-0 transform transition-transform">
            <div className="p-3 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Files</h3>
                <Button
                  onClick={() => setShowSidebar(false)}
                  variant="ghost"
                  size="sm"
                  className="p-1"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="overflow-y-auto">
              {files.map(file => (
                <button
                  key={file.name}
                  onClick={() => {
                    onFileSelect(file.name);
                    setShowSidebar(false);
                  }}
                  className={`w-full text-left p-3 hover:bg-gray-50 border-b ${
                    selectedFile === file.name ? 'bg-blue-50 border-r-2 border-r-blue-500' : ''
                  }`}
                >
                  <div className="text-sm font-medium">{file.name}</div>
                  <div className="text-xs text-gray-500">
                    {file.content.split('\n').length} lines
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {viewMode === 'code' && (
            <div className="flex-1 flex flex-col">
              {/* Code Editor */}
              <div className="flex-1 relative">
                <textarea
                  ref={editorRef}
                  value={currentFile?.content || ''}
                  onChange={handleTextChange}
                  onSelect={(e) => updateCursorPosition(e.target as HTMLTextAreaElement)}
                  className="w-full h-full p-4 font-mono resize-none border-none outline-none bg-white pl-12"
                  style={{
                    fontSize: `${fontSize}px`,
                    lineHeight: 1.5,
                    tabSize: 2
                  }}
                  placeholder="Start coding..."
                  spellCheck={false}
                  autoCapitalize="off"
                  autoCorrect="off"
                  aria-label={`Code editor for ${selectedFile || 'new file'}`}
                  aria-describedby="cursor-position"
                />
                
                {/* Line numbers overlay */}
                <div className="absolute left-0 top-0 p-4 pointer-events-none text-gray-400 font-mono select-none">
                  {currentFile?.content.split('\n').map((_, index) => (
                    <div key={index} style={{ fontSize: `${fontSize}px`, lineHeight: 1.5 }}>
                      {index + 1}
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Insert Toolbar */}
              <div className="bg-gray-100 border-t p-2 overflow-x-auto">
                <div className="flex gap-1 min-w-max">
                  {quickInsertButtons.map((button, index) => (
                    <Button
                      key={index}
                      onClick={() => handleQuickInsert(button)}
                      variant="outline"
                      size="sm"
                      className="px-2 py-1 text-xs h-8 min-w-8 flex-shrink-0"
                    >
                      {button.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {viewMode === 'preview' && (
            <div className="flex-1 bg-white">
              <iframe
                src="/preview"
                className="w-full h-full border-none"
                title="Preview"
              />
            </div>
          )}
        </div>
      </div>

      {/* Font Size Controls */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-20">
        <Button
          onClick={() => setFontSize(prev => Math.min(24, prev + 2))}
          variant="outline"
          size="sm"
          className="w-10 h-10 rounded-full bg-white shadow-lg"
        >
          A+
        </Button>
        <Button
          onClick={() => setFontSize(prev => Math.max(10, prev - 2))}
          variant="outline"
          size="sm"
          className="w-10 h-10 rounded-full bg-white shadow-lg"
        >
          A-
        </Button>
      </div>

      {/* Keyboard indicator */}
      {showKeyboard && (
        <div className="fixed bottom-0 left-0 right-0 h-1 bg-blue-500 z-30" />
      )}

      {/* Orientation indicator */}
      <div className="fixed top-16 right-4 z-20">
        <Badge variant="outline" className="bg-white">
          {isLandscape ? <Tablet className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}
        </Badge>
      </div>
    </div>
  );
}
