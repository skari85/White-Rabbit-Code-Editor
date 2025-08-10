"use client";

import React, { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export interface DiffEntry {
  filename: string;
  before: string;
  after: string;
  applied?: boolean;
}

interface LiveDiffDockProps {
  diffs: DiffEntry[];
  onRevertChunk?: (filename: string) => void;
  onApproveAll?: () => void;
  className?: string;
}

export default function LiveDiffDock({ diffs, onRevertChunk, onApproveAll, className = '' }: LiveDiffDockProps) {
  const changed = useMemo(() => diffs.filter(d => d.before !== d.after), [diffs]);

  if (changed.length === 0) return null;

  return (
    <div className={`fixed bottom-0 left-0 right-0 bg-gray-900/95 border-t border-gray-700 p-2 z-40 ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">Live Diff</Badge>
          <span className="text-xs text-gray-300">{changed.length} file{changed.length>1?'s':''} updated</span>
        </div>
        {onApproveAll && (
          <Button size="sm" onClick={onApproveAll} className="h-7">Approve all</Button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-56 overflow-y-auto">
        {changed.slice(-6).map(d => (
          <div key={d.filename} className="p-2 bg-gray-800/60 rounded border border-gray-700">
            <div className="flex items-center justify-between mb-1">
              <div className="text-xs font-mono text-gray-300 truncate">{d.filename}</div>
              {onRevertChunk && (
                <Button variant="ghost" size="sm" className="h-7" onClick={() => onRevertChunk(d.filename)}>Revert</Button>
              )}
            </div>
            <pre className="text-[11px] leading-4 whitespace-pre-wrap text-gray-300"><code>{previewDiff(d.before, d.after)}</code></pre>
          </div>
        ))}
      </div>
    </div>
  );
}

function previewDiff(before: string, after: string): string {
  // naive line-level preview: show +/- counts and last few changes
  if (before === after) return 'No changes';
  const bLines = before.split('\n');
  const aLines = after.split('\n');
  const delta = aLines.length - bLines.length;
  const tail = aLines.slice(-6).join('\n');
  const sign = delta >= 0 ? '+' : '-';
  return `${sign}${Math.abs(delta)} lines\n${tail}`;
}

