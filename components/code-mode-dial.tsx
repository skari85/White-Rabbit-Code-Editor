"use client"

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { PersonalityMode } from '@/lib/personality-system';
import { FileText, Wrench, Zap } from 'lucide-react';

export type CodeMode = 'descriptive' | 'minimal' | 'obfuscated';

export interface CodeModeConfig {
  id: CodeMode;
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

export const CODE_MODES: Record<CodeMode, CodeModeConfig> = {
  descriptive: {
    id: 'descriptive',
    name: 'Descriptive',
    icon: <FileText className="w-4 h-4" />,
    description: 'Heavily annotated, human-readable with explanations',
    color: '#10b981'
  },
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    icon: <Wrench className="w-4 h-4" />,
    description: 'Raw logic only, no fluff',
    color: '#6b7280'
  },
  obfuscated: {
    id: 'obfuscated',
    name: 'Obfuscated',
    icon: <Zap className="w-4 h-4" />,
    description: 'Intentionally complex for education/fun',
    color: '#ef4444'
  }
};

interface CodeModeDialProps {
  currentMode: CodeMode;
  onModeChange: (mode: CodeMode) => void;
  personality: PersonalityMode;
}

export function CodeModeDial({ currentMode, onModeChange, personality }: CodeModeDialProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd+Shift+↑↓ (Mac) or Ctrl+Shift+↑↓ (Windows/Linux)
      if ((event.metaKey || event.ctrlKey) && event.shiftKey) {
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          cycleModeUp();
        } else if (event.key === 'ArrowDown') {
          event.preventDefault();
          cycleModeDown();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [currentMode]);

  const modes = Object.values(CODE_MODES);
  const currentIndex = modes.findIndex(mode => mode.id === currentMode);

  const cycleModeUp = () => {
    const nextIndex = (currentIndex - 1 + modes.length) % modes.length;
    changeMode(modes[nextIndex].id);
  };

  const cycleModeDown = () => {
    const nextIndex = (currentIndex + 1) % modes.length;
    changeMode(modes[nextIndex].id);
  };

  const changeMode = (mode: CodeMode) => {
    setIsAnimating(true);
    onModeChange(mode);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const getDialRotation = () => {
    const angle = (currentIndex * 120) - 60; // 120 degrees per mode, offset by -60
    return `rotate(${angle}deg)`;
  };

  return (
    <div className="flex items-center gap-4">
      {/* Mode Dial */}
      <div className="relative">
        <div
          className={`w-16 h-16 rounded-full border-4 relative transition-all duration-300 ${
            isAnimating ? 'scale-110' : 'scale-100'
          }`}
          style={{
            borderColor: CODE_MODES[currentMode].color,
            background: `conic-gradient(from 0deg, ${CODE_MODES[currentMode].color}20, transparent 120deg, ${CODE_MODES[currentMode].color}20 240deg, transparent)`
          }}
        >
          {/* Dial pointer */}
          <div
            className="absolute top-1 left-1/2 w-1 h-6 bg-gray-800 rounded-full transform -translate-x-1/2 origin-bottom transition-transform duration-300"
            style={{ transform: `translateX(-50%) ${getDialRotation()}` }}
          />
          
          {/* Center icon */}
          <div
            className="absolute inset-2 rounded-full flex items-center justify-center text-white font-bold transition-all duration-300"
            style={{
              background: CODE_MODES[currentMode].color,
              boxShadow: isAnimating ? `0 0 20px ${CODE_MODES[currentMode].color}` : 'none'
            }}
          >
            {CODE_MODES[currentMode].icon}
          </div>
        </div>
        
        {/* Mode labels around the dial */}
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
          <div className={`text-xs font-medium transition-opacity duration-200 ${
            currentMode === 'descriptive' ? 'opacity-100' : 'opacity-40'
          }`}>
            ✍️
          </div>
        </div>
        <div className="absolute top-1/2 -right-8 transform -translate-y-1/2">
          <div className={`text-xs font-medium transition-opacity duration-200 ${
            currentMode === 'minimal' ? 'opacity-100' : 'opacity-40'
          }`}>
            🛠️
          </div>
        </div>
        <div className="absolute top-1/2 -left-8 transform -translate-y-1/2">
          <div className={`text-xs font-medium transition-opacity duration-200 ${
            currentMode === 'obfuscated' ? 'opacity-100' : 'opacity-40'
          }`}>
            🤯
          </div>
        </div>
      </div>

      {/* Mode Info */}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-sm" style={{ color: CODE_MODES[currentMode].color }}>
            {CODE_MODES[currentMode].name} Mode
          </h3>
          <div
            className="px-2 py-1 rounded-full text-xs font-medium"
            style={{
              background: `${CODE_MODES[currentMode].color}20`,
              color: CODE_MODES[currentMode].color
            }}
          >
            Active
          </div>
        </div>
        <p className="text-xs text-gray-600 mb-2">
          {CODE_MODES[currentMode].description}
        </p>
        
        {/* Mode buttons */}
        <div className="flex gap-1">
          {modes.map((mode) => (
            <Button
              key={mode.id}
              variant={currentMode === mode.id ? "default" : "outline"}
              size="sm"
              onClick={() => changeMode(mode.id)}
              className="h-6 px-2 text-xs"
              style={{
                borderColor: mode.color,
                color: currentMode === mode.id ? 'white' : mode.color,
                backgroundColor: currentMode === mode.id ? mode.color : 'transparent'
              }}
            >
              {mode.icon}
            </Button>
          ))}
        </div>
      </div>

      {/* Keyboard Shortcut Hint */}
      <div className="text-xs text-gray-500 hidden md:block">
        <div className="flex items-center gap-1">
          <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">⌘⇧↑↓</kbd>
        </div>
      </div>
    </div>
  );
}

// Code transformer utility
export class CodeTransformer {
  static transform(code: string, fromMode: CodeMode, toMode: CodeMode, personality: PersonalityMode): string {
    if (fromMode === toMode) return code;

    switch (toMode) {
      case 'descriptive':
        return this.toDescriptive(code, personality);
      case 'minimal':
        return this.toMinimal(code, personality);
      case 'obfuscated':
        return this.toObfuscated(code, personality);
      default:
        return code;
    }
  }

  private static toDescriptive(code: string, personality: PersonalityMode): string {
    const lines = code.split('\n');
    const annotated = lines.map(line => {
      if (line.trim() === '') return line;
      
      // Add descriptive comments based on personality
      if (personality === 'hex') {
        // HEX: Professional, precise annotations
        if (line.includes('function')) {
          return `${line}\n  // Function definition: Clean, single-purpose implementation`;
        }
        if (line.includes('const') || line.includes('let')) {
          return `${line}\n  // Variable declaration: Following strict naming conventions`;
        }
        if (line.includes('return')) {
          return `${line}\n  // Return statement: Explicit value return for clarity`;
        }
      } else {
        // KEX: Creative, playful annotations
        if (line.includes('function')) {
          return `${line}\n  // 🚀 FUNCTION MAGIC: This bad boy does the thing!`;
        }
        if (line.includes('const') || line.includes('let')) {
          return `${line}\n  // 💫 Variable summoning: Bringing data to life!`;
        }
        if (line.includes('return')) {
          return `${line}\n  // 🎯 BOOM! Returning the goods like a boss`;
        }
      }
      
      return line;
    });

    return annotated.join('\n');
  }

  private static toMinimal(code: string, personality: PersonalityMode): string {
    const lines = code.split('\n');
    const minimal = lines
      .map(line => line.trim())
      .filter(line => {
        // Remove comments and empty lines
        return line !== '' && !line.startsWith('//') && !line.startsWith('/*');
      })
      .map(line => {
        // Compress syntax where possible
        return line
          .replace(/\s+/g, ' ') // Multiple spaces to single
          .replace(/;\s*$/, ';') // Clean semicolons
          .replace(/{\s*$/, '{') // Clean braces
          .replace(/}\s*$/, '}');
      });

    return minimal.join('\n');
  }

  private static toObfuscated(code: string, personality: PersonalityMode): string {
    const lines = code.split('\n');
    const obfuscated = lines.map(line => {
      if (line.trim() === '') return line;
      
      // Add complexity based on personality
      if (personality === 'hex') {
        // HEX: Academic obfuscation
        return line
          .replace(/function\s+(\w+)/g, 'const $1 = (function(){return function')
          .replace(/const\s+(\w+)\s*=/g, 'const $1/*academic_notation*/=')
          .replace(/return\s+/g, 'return/*explicit_return*/');
      } else {
        // KEX: Chaotic obfuscation
        return line
          .replace(/function/g, '/*🔥FUNC🔥*/function')
          .replace(/const/g, '/*💀CONST💀*/const')
          .replace(/return/g, '/*🎪RETURN🎪*/return')
          .replace(/=/g, '/*⚡ASSIGN⚡*/=');
      }
    });

    return obfuscated.join('\n');
  }
}

// Hook for managing code mode
export function useCodeMode() {
  const [currentMode, setCurrentMode] = useState<CodeMode>('minimal');
  const [codeHistory, setCodeHistory] = useState<Record<CodeMode, string>>({
    descriptive: '',
    minimal: '',
    obfuscated: ''
  });

  const transformCode = (code: string, newMode: CodeMode, personality: PersonalityMode) => {
    const transformed = CodeTransformer.transform(code, currentMode, newMode, personality);
    
    setCodeHistory(prev => ({
      ...prev,
      [newMode]: transformed
    }));
    
    setCurrentMode(newMode);
    return transformed;
  };

  const setMode = (mode: CodeMode) => {
    setCurrentMode(mode);
  };

  return {
    currentMode,
    codeHistory,
    transformCode,
    setMode
  };
}
