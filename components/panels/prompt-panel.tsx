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
    <div className={`flex flex-col h-full bg-zinc-950 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
          <ClipboardList className="w-3.5 h-3.5" />
          <span>Instructions</span>
          {categoryName && (
            <span className="text-zinc-600 ml-1">— {categoryName}</span>
          )}
        </div>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 w-6 p-0 text-zinc-500 hover:text-zinc-300"
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
        placeholder="Write instructions or context for this category…&#10;&#10;Examples:&#10;• Build a REST API for user management&#10;• Use TypeScript with Zod validation&#10;• Follow the existing project conventions"
        className="flex-1 w-full resize-none bg-transparent text-sm text-zinc-300 placeholder:text-zinc-600 px-3 py-2 focus:outline-none font-mono leading-relaxed"
        spellCheck={false}
      />
    </div>
  );
}
