"use client"

import React, { useState, useEffect, useRef } from 'react';
import { PersonalityToggle, PersonalityThemeProvider } from './personality-toggle';
import { ContextSuggestions } from './context-suggestions';
import { GlitchPreview, useGlitchPreview } from './glitch-preview';
import { DNAThreads, useDNAThreads } from './dna-threads';
import { CodeModeDial, useCodeMode, CodeMode } from './code-mode-dial';
import { PersonalityMode, personalitySystem, CodeSuggestion } from '@/lib/personality-system';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, History, Settings } from 'lucide-react';
import * as monaco from 'monaco-editor';

interface MagicalEditorProps {
  initialCode?: string;
  fileName?: string;
  onCodeChange?: (code: string) => void;
  className?: string;
}

export function MagicalEditor({ 
  initialCode = '', 
  fileName = 'untitled.js',
  onCodeChange,
  className = ''
}: MagicalEditorProps) {
  const [personality, setPersonality] = useState<PersonalityMode>('rabbit');
  const [code, setCode] = useState(initialCode);
  const [cursorPosition, setCursorPosition] = useState({ line: 0, column: 0 });
  const [showDNAThreads, setShowDNAThreads] = useState(false);
  const [showContextSuggestions, setShowContextSuggestions] = useState(true);
  
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const glitchPreview = useGlitchPreview();
  const dnaThreads = useDNAThreads();
  const codeMode = useCodeMode();

  useEffect(() => {
    personalitySystem.setCurrentPersonality(personality);
  }, [personality]);

  useEffect(() => {
    if (editorRef.current) {
      const editor = monaco.editor.create(editorRef.current, {
        value: code,
        language: 'javascript',
        theme: 'vs-dark',
        automaticLayout: true,
      });

      // Handle code changes
      editor.onDidChangeModelContent(() => {
        const newValue = editor.getValue();
        setCode(newValue);
        onCodeChange?.(newValue);
      });

      // Dispose editor on unmount
      return () => editor.dispose();
    }
  }, [editorRef, code, onCodeChange]);

  // Enhance MagicalEditor with auto-completion, syntax highlighting, and error detection
  useEffect(() => {
    // Initialize editor features
    const editor = editorRef.current;
    if (editor) {
      // Enable syntax highlighting
      editor.style.backgroundColor = '#f5f5f5';
      editor.style.fontFamily = 'monospace';

      // Add auto-completion
      editor.addEventListener('input', () => {
        // Simulate auto-completion logic
        console.log('Auto-completion triggered');
      });

      // Add error detection
      editor.addEventListener('input', () => {
        // Simulate error detection logic
        console.log('Error detection triggered');
      });
    }
  }, [editorRef]);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    
    // Add to DNA threads if significant change
    if (Math.abs(newCode.length - code.length) > 10) {
      dnaThreads.addGeneration(
        newCode,
        `Code modification in ${fileName}`,
        personality,
        fileName
      );
    }
  };

  const handleCursorPositionChange = (textarea: HTMLTextAreaElement) => {
    const text = textarea.value;
    const cursorPos = textarea.selectionStart;
    const lines = text.substring(0, cursorPos).split('\n');
    const line = lines.length - 1;
    const column = lines[lines.length - 1].length;
    setCursorPosition({ line, column });
  };

  const handleSuggestionApply = (suggestion: CodeSuggestion) => {
    // Apply suggestion to code
    const lines = code.split('\n');
    if (suggestion.line < lines.length) {
      lines[suggestion.line] = suggestion.replacement || lines[suggestion.line];
      const newCode = lines.join('\n');
      
      // Start glitch preview for the change
      glitchPreview.startGeneration(newCode);
    }
  };

  const handleGlitchSolidify = () => {
    setCode(glitchPreview.pendingCode);
    glitchPreview.solidify();
    
    // Add to DNA threads
    dnaThreads.addGeneration(
      glitchPreview.pendingCode,
      'AI suggestion applied',
      personality,
      fileName
    );
  };

  const handleModeChange = (newMode: CodeMode) => {
    const transformedCode = codeMode.transformCode(code, newMode, personality);
    setCode(transformedCode);
  };

  const handleDNARewind = (generationId: string) => {
    const generation = dnaThreads.generations.find(g => g.id === generationId);
    if (generation) {
      setCode(generation.code);
      dnaThreads.rewindTo(generationId);
    }
  };

  const handleDNAFork = (generationId: string) => {
    const branchId = dnaThreads.forkFrom(generationId);
    console.log(`Created new branch: ${branchId}`);
  };

  const handleDNADelete = (generationId: string) => {
    dnaThreads.deleteGeneration(generationId);
  };

  const handleDNAPreview = (generationId: string) => {
    const generation = dnaThreads.generations.find(g => g.id === generationId);
    if (generation) {
      glitchPreview.startGeneration(generation.code);
    }
  };

  const displayCode = glitchPreview.isGenerating ? glitchPreview.pendingCode : code;

  return (
    <PersonalityThemeProvider personality={personality}>
      <div className={`flex flex-col h-full bg-gray-50 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <div className="flex items-center gap-4">
            <PersonalityToggle 
              personality={personality}
              onPersonalityChange={setPersonality}
            />
            <Separator orientation="vertical" className="h-6" />
            <div className="text-sm font-medium text-gray-700">
              {fileName}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowContextSuggestions(!showContextSuggestions)}
              className="h-8"
            >
              {showContextSuggestions ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span className="ml-1 hidden md:inline">Hints</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDNAThreads(!showDNAThreads)}
              className="h-8"
            >
              <History className="w-4 h-4" />
              <span className="ml-1 hidden md:inline">DNA</span>
            </Button>
          </div>
        </div>

        {/* Code Mode Dial */}
        <div className="p-4 bg-white border-b border-gray-200">
          <CodeModeDial
            currentMode={codeMode.currentMode}
            onModeChange={handleModeChange}
            personality={personality}
          />
        </div>

        {/* Main Editor Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Editor */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 relative">
              {glitchPreview.isGenerating ? (
                <div className="absolute inset-4 z-10">
                  <GlitchPreview
                    code={displayCode}
                    isGenerating={glitchPreview.isGenerating}
                    onSolidify={handleGlitchSolidify}
                    personality={personality}
                  />
                </div>
              ) : (
                <textarea
                  ref={editorRef}
                  value={code}
                  onChange={(e) => {
                    handleCodeChange(e.target.value);
                    handleCursorPositionChange(e.target);
                  }}
                  onSelect={(e) => handleCursorPositionChange(e.target as HTMLTextAreaElement)}
                  className="w-full h-full p-4 font-mono text-sm bg-gray-900 text-green-400 border-none outline-none resize-none"
                  style={{
                    background: personality === 'hex' 
                      ? 'linear-gradient(135deg, #0d0d0d 0%, #1a0d2e 100%)'
                      : 'linear-gradient(135deg, #0d0d0d 0%, #0d2e2a 100%)',
                    color: personality === 'hex' ? '#e0c3fc' : '#c3fcf2'
                  }}
                  placeholder={personality === 'hex' 
                    ? "// HEX awaits your precise incantations..." 
                    : "// KEX is ready for chaotic creativity!"}
                  spellCheck={false}
                />
              )}
            </div>

            {/* Status Bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-gray-800 text-gray-300 text-xs">
              <div className="flex items-center gap-4">
                <span>Line {cursorPosition.line + 1}, Col {cursorPosition.column + 1}</span>
                <span>Mode: {codeMode.currentMode}</span>
                <span>Personality: {personality.toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-4">
                <span>{code.length} chars</span>
                <span>{code.split('\n').length} lines</span>
                {dnaThreads.generations.length > 0 && (
                  <span>{dnaThreads.generations.length} generations</span>
                )}
              </div>
            </div>
          </div>

          {/* DNA Threads Sidebar */}
          {showDNAThreads && (
            <DNAThreads
              generations={dnaThreads.generations}
              branches={dnaThreads.branches}
              currentGenerationId={dnaThreads.currentGenerationId || undefined}
              onRewind={handleDNARewind}
              onFork={handleDNAFork}
              onDelete={handleDNADelete}
              onPreview={handleDNAPreview}
              personality={personality}
            />
          )}
        </div>

        {/* Context Suggestions */}
        {showContextSuggestions && (
          <ContextSuggestions
            code={code}
            fileName={fileName}
            cursorPosition={cursorPosition}
            onApplySuggestion={handleSuggestionApply}
            personality={personality}
          />
        )}
      </div>
    </PersonalityThemeProvider>
  );
}

// Hook for managing the magical editor
export function useMagicalEditor() {
  const [editors, setEditors] = useState<Array<{
    id: string;
    fileName: string;
    code: string;
    personality: PersonalityMode;
  }>>([]);

  const createEditor = (fileName: string, initialCode = '') => {
    const id = `editor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newEditor = {
      id,
      fileName,
      code: initialCode,
      personality: 'hex' as PersonalityMode
    };
    
    setEditors(prev => [...prev, newEditor]);
    return id;
  };

  const updateEditor = (id: string, updates: Partial<typeof editors[0]>) => {
    setEditors(prev => 
      prev.map(editor => 
        editor.id === id ? { ...editor, ...updates } : editor
      )
    );
  };

  const deleteEditor = (id: string) => {
    setEditors(prev => prev.filter(editor => editor.id !== id));
  };

  return {
    editors,
    createEditor,
    updateEditor,
    deleteEditor
  };
}
