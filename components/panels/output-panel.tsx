'use client';

import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookmarkPlus, Terminal, Trash2 } from 'lucide-react';
import type { OutputEntry } from '@/types/workspace';

interface OutputPanelProps {
  outputs: OutputEntry[];
  onClear: () => void;
  onSaveAsArtifact?: (content: string) => void;
  streamingContent?: string;
  isStreaming?: boolean;
  className?: string;
}

export default function OutputPanel({
  outputs,
  onClear,
  onSaveAsArtifact,
  streamingContent,
  isStreaming,
  className = '',
}: OutputPanelProps) {
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [outputs, streamingContent]);

  return (
    <div className={`ios-glass-surface flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="ios-glass-panel-header flex items-center justify-between px-3 py-1.5">
        <div className="flex items-center gap-1.5 text-xs font-medium text-foreground/70">
          <Terminal className="w-3.5 h-3.5" />
          <span>Output</span>
          {isStreaming && (
            <span className="flex items-center gap-1 text-primary animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              streaming
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 w-7 p-0 text-foreground/55 hover:text-foreground"
            onClick={onClear}
            title="Clear output"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Log entries */}
      <ScrollArea className="flex-1">
        <div className="px-3 py-2 font-mono text-xs leading-relaxed space-y-2">
          {outputs.length === 0 && !streamingContent && (
            <p className="text-foreground/45 italic">
              No output yet. Run a task to see results here.
            </p>
          )}

          {outputs.map((entry) => (
            <div key={entry.id} className="group">
              <div className="flex items-start gap-2">
                <span
                  className={`shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full ${
                    entry.role === 'assistant'
                      ? 'bg-purple-400'
                      : entry.role === 'user'
                      ? 'bg-blue-400'
                      : 'bg-zinc-500'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <pre className="whitespace-pre-wrap break-words text-foreground/88">
                    {entry.content}
                  </pre>
                </div>
                {onSaveAsArtifact && entry.role === 'assistant' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-5 w-5 p-0 shrink-0 opacity-0 group-hover:opacity-70 hover:!opacity-100 text-foreground/60"
                    onClick={() => onSaveAsArtifact(entry.content)}
                    title="Save as artifact"
                  >
                    <BookmarkPlus className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}

          {/* Streaming preview */}
          {streamingContent && (
            <div className="flex items-start gap-2">
              <span className="shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
              <pre className="whitespace-pre-wrap break-words text-foreground/65 flex-1">
                {streamingContent}
                <span className="animate-pulse">▍</span>
              </pre>
            </div>
          )}

          <div ref={endRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
