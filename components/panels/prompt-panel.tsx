'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ClipboardList, RotateCcw } from 'lucide-react';

interface PromptPanelProps {
  instructionsText: string;
  onInstructionsChange: (text: string) => void;
  categoryName?: string;
  className?: string;
}

export default function PromptPanel({
  instructionsText,
  onInstructionsChange,
  categoryName,
  className = '',
}: PromptPanelProps) {
  const [localText, setLocalText] = useState(instructionsText);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sync external changes (e.g. category switch)
  useEffect(() => {
    setLocalText(instructionsText);
  }, [instructionsText]);

  // Debounced persistence
  useEffect(() => {
    const t = setTimeout(() => {
      if (localText !== instructionsText) {
        onInstructionsChange(localText);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [localText, instructionsText, onInstructionsChange]);

  return (
    <div className={`ios-glass-surface flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="ios-glass-panel-header flex items-center justify-between px-3 py-1.5">
        <div className="flex items-center gap-1.5 text-xs font-medium text-foreground/70">
          <ClipboardList className="w-3.5 h-3.5" />
          <span>Instructions</span>
          {categoryName && (
            <span className="text-foreground/45 ml-1">- {categoryName}</span>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-foreground/55 hover:text-foreground"
          onClick={() => {
            setLocalText('');
            onInstructionsChange('');
          }}
          title="Clear instructions"
        >
          <RotateCcw className="w-3 h-3" />
        </Button>
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={localText}
        onChange={(e) => setLocalText(e.target.value)}
        placeholder="Write instructions or context for this category...&#10;&#10;Examples:&#10;• Build a REST API for user management&#10;• Use TypeScript with Zod validation&#10;• Follow the existing project conventions"
        className="flex-1 w-full resize-none bg-transparent text-sm text-foreground/90 placeholder:text-foreground/45 px-3 py-2 focus:outline-none font-sans leading-relaxed"
        spellCheck={false}
      />
    </div>
  );
}
