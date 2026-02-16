'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Code2,
  Download,
  FileText,
  Package,
  Pencil,
  StickyNote,
  Trash2,
  X,
} from 'lucide-react';
import type { Artifact, ArtifactType } from '@/types/workspace';

// ---------------------------------------------------------------------------
// Icon helper
// ---------------------------------------------------------------------------

function ArtifactIcon({ type }: { type: ArtifactType }) {
  switch (type) {
    case 'code':
      return <Code2 className="w-3.5 h-3.5 text-purple-400" />;
    case 'note':
      return <StickyNote className="w-3.5 h-3.5 text-amber-400" />;
    case 'file':
      return <FileText className="w-3.5 h-3.5 text-blue-400" />;
  }
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ArtifactsPanelProps {
  artifacts: Artifact[];
  onSelect?: (artifact: Artifact) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ArtifactsPanel({
  artifacts,
  onSelect,
  onDelete,
  onRename,
  className = '',
}: ArtifactsPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleRename = (id: string) => {
    const trimmed = editingName.trim();
    if (trimmed) onRename(id, trimmed);
    setEditingId(null);
  };

  const handleDownload = (artifact: Artifact) => {
    const blob = new Blob([artifact.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = artifact.title;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`flex flex-col h-full bg-zinc-950 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400">
          <Package className="w-3.5 h-3.5" />
          <span>Artifacts</span>
          {artifacts.length > 0 && (
            <span className="text-zinc-600 ml-0.5">({artifacts.length})</span>
          )}
        </div>
      </div>

      {/* List */}
      <ScrollArea className="flex-1">
        <div className="px-2 py-2 space-y-1">
          {artifacts.length === 0 && (
            <p className="text-zinc-600 italic text-xs px-2 py-4 text-center">
              No artifacts yet. Save output or files to see them here.
            </p>
          )}

          {artifacts.map((a) => {
            const isEditing = editingId === a.id;

            return (
              <div
                key={a.id}
                className="group flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-zinc-800/50 transition-colors cursor-pointer"
                onClick={() => onSelect?.(a)}
              >
                <ArtifactIcon type={a.type} />

                {isEditing ? (
                  <Input
                    autoFocus
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename(a.id);
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    onBlur={() => handleRename(a.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-6 text-xs bg-zinc-800 border-zinc-700 flex-1"
                  />
                ) : (
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-zinc-300 truncate">{a.title}</p>
                    <p className="text-[10px] text-zinc-600">
                      {a.type}
                      {a.language ? ` · ${a.language}` : ''}
                    </p>
                  </div>
                )}

                {/* Action buttons */}
                <span className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-60">
                  <Download
                    className="w-3 h-3 hover:!opacity-100 cursor-pointer text-zinc-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(a);
                    }}
                  />
                  <Pencil
                    className="w-3 h-3 hover:!opacity-100 cursor-pointer text-zinc-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(a.id);
                      setEditingName(a.title);
                    }}
                  />
                  <Trash2
                    className="w-3 h-3 hover:!opacity-100 cursor-pointer text-zinc-400"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(a.id);
                    }}
                  />
                </span>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
