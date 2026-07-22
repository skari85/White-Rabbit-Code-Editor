'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import {
  ChevronDown,
  ClipboardList,
  Code2,
  Download,
  FolderPlus,
  LayoutTemplate,
  Pencil,
  Plus,
  StickyNote,
  Trash2,
  X,
} from 'lucide-react';
import type { Category, Workspace } from '@/types/workspace';

// ---------------------------------------------------------------------------
// Icon resolver – maps string names stored in Category.icon to Lucide icons
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, React.ReactNode> = {
  Code2: <Code2 className="w-4 h-4" />,
  LayoutTemplate: <LayoutTemplate className="w-4 h-4" />,
  ClipboardList: <ClipboardList className="w-4 h-4" />,
  StickyNote: <StickyNote className="w-4 h-4" />,
  Download: <Download className="w-4 h-4" />,
};

function CategoryIcon({ icon }: { icon?: string }) {
  if (!icon) return <Code2 className="w-4 h-4 text-foreground/45" />;
  return (
    <span className="text-foreground/60">
      {ICON_MAP[icon] ?? <Code2 className="w-4 h-4" />}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface WorkspaceSidebarProps {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  categories: Category[];
  activeCategory: Category | null;

  onSelectWorkspace: (id: string) => void;
  onCreateWorkspace: (name: string) => void;
  onRenameWorkspace: (id: string, name: string) => void;
  onDeleteWorkspace: (id: string) => void;

  onSelectCategory: (id: string) => void;
  onCreateCategory: (name: string) => void;
  onRenameCategory: (id: string, name: string) => void;
  onDeleteCategory: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function WorkspaceSidebar({
  workspaces,
  activeWorkspace,
  categories,
  activeCategory,

  onSelectWorkspace,
  onCreateWorkspace,
  onRenameWorkspace: _onRenameWorkspace,
  onDeleteWorkspace,

  onSelectCategory,
  onCreateCategory,
  onRenameCategory,
  onDeleteCategory,
}: WorkspaceSidebarProps) {
  // local UI state
  const [wsOpen, setWsOpen] = useState(true);
  const [addingWs, setAddingWs] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [addingCat, setAddingCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');

  // ---- workspace creation ----
  const handleCreateWs = () => {
    const trimmed = newWsName.trim();
    if (!trimmed) return;
    onCreateWorkspace(trimmed);
    setNewWsName('');
    setAddingWs(false);
  };

  // ---- category creation ----
  const handleCreateCat = () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    onCreateCategory(trimmed);
    setNewCatName('');
    setAddingCat(false);
  };

  // ---- category rename ----
  const handleRenameCat = (id: string) => {
    const trimmed = editingCatName.trim();
    if (!trimmed) {
      setEditingCatId(null);
      return;
    }
    onRenameCategory(id, trimmed);
    setEditingCatId(null);
  };

  return (
    <div className="ios-glass-surface flex flex-col h-full border-r border-white/15 text-foreground/90 select-none">
      {/* ------- Header ------- */}
      <div className="ios-glass-panel-header px-4 py-3 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg border border-white/40 bg-white/80 dark:border-white/20 dark:bg-white/10 flex items-center justify-center p-0.5 shrink-0 shadow-sm backdrop-blur-sm">
          <Image
            src="/whiterabbitlogo.png"
            alt="White Rabbit"
            width={24}
            height={24}
            className="w-full h-full object-contain"
          />
        </div>
        <span className="font-semibold text-sm tracking-wide truncate text-foreground">
          White Rabbit
        </span>
      </div>

      <ScrollArea className="flex-1">
        {/* ------- Workspaces ------- */}
        <div className="px-2 pt-3">
          <button
            type="button"
            className="flex items-center justify-between w-full px-2 py-1 text-xs font-medium uppercase tracking-wider text-foreground/55 hover:text-foreground/80"
            onClick={() => setWsOpen((v) => !v)}
          >
            Workspaces
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${wsOpen ? '' : '-rotate-90'}`}
            />
          </button>

          {wsOpen && (
            <div className="mt-1 space-y-0.5">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  type="button"
                  onClick={() => onSelectWorkspace(ws.id)}
                  className={`ios-glass-list-item group flex items-center gap-2 w-full px-2 py-1.5 text-sm ${
                    activeWorkspace?.id === ws.id
                      ? 'ios-glass-list-item-active text-foreground'
                      : 'text-foreground/65 hover:text-foreground'
                  }`}
                >
                  <FolderPlus className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate flex-1 text-left">{ws.name}</span>
                  {workspaces.length > 1 && (
                    <Trash2
                      className="w-3 h-3 opacity-0 group-hover:opacity-60 hover:!opacity-100 shrink-0 text-foreground/60"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteWorkspace(ws.id);
                      }}
                    />
                  )}
                </button>
              ))}

              {/* Add workspace inline */}
              {addingWs ? (
                <div className="flex items-center gap-1 px-1 py-1">
                  <Input
                    autoFocus
                    value={newWsName}
                    onChange={(e) => setNewWsName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateWs();
                      if (e.key === 'Escape') setAddingWs(false);
                    }}
                    placeholder="Workspace name"
                    className="ios-glass-input h-7 text-xs"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-foreground/65 hover:text-foreground"
                    onClick={handleCreateWs}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7 p-0 text-foreground/65 hover:text-foreground"
                    onClick={() => setAddingWs(false)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingWs(true)}
                  className="ios-glass-list-item flex items-center gap-2 w-full px-2 py-1.5 text-xs text-foreground/55 hover:text-foreground transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  New workspace
                </button>
              )}
            </div>
          )}
        </div>

        <Separator className="my-3 bg-white/15 dark:bg-white/10" />

        {/* ------- Categories ------- */}
        <div className="px-2">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-xs font-medium uppercase tracking-wider text-foreground/55">
              Categories
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="h-5 w-5 p-0 text-foreground/55 hover:text-foreground"
              onClick={() => setAddingCat(true)}
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="mt-1 space-y-0.5">
            {categories.map((cat) => {
              const isActive = activeCategory?.id === cat.id;
              const isEditing = editingCatId === cat.id;

              if (isEditing) {
                return (
                  <div key={cat.id} className="flex items-center gap-1 px-1 py-0.5">
                    <Input
                      autoFocus
                      value={editingCatName}
                      onChange={(e) => setEditingCatName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameCat(cat.id);
                        if (e.key === 'Escape') setEditingCatId(null);
                      }}
                      onBlur={() => handleRenameCat(cat.id)}
                      className="ios-glass-input h-7 text-xs"
                    />
                  </div>
                );
              }

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => onSelectCategory(cat.id)}
                  className={`ios-glass-list-item group flex items-center gap-2 w-full px-2 py-1.5 text-sm ${
                    isActive
                      ? 'ios-glass-list-item-active text-foreground font-medium'
                      : 'text-foreground/65 hover:text-foreground'
                  }`}
                >
                  <CategoryIcon icon={cat.icon} />
                  <span className="truncate flex-1 text-left">{cat.name}</span>
                  <span className="flex items-center gap-0.5 opacity-0 group-hover:opacity-70">
                    <Pencil
                      className="w-3 h-3 hover:!opacity-100 cursor-pointer text-foreground/65"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCatId(cat.id);
                        setEditingCatName(cat.name);
                      }}
                    />
                    <Trash2
                      className="w-3 h-3 hover:!opacity-100 cursor-pointer text-foreground/65"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCategory(cat.id);
                      }}
                    />
                  </span>
                </button>
              );
            })}

            {/* Add category inline */}
            {addingCat && (
              <div className="flex items-center gap-1 px-1 py-1">
                <Input
                  autoFocus
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateCat();
                    if (e.key === 'Escape') setAddingCat(false);
                  }}
                  placeholder="Category name"
                  className="ios-glass-input h-7 text-xs"
                />
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-foreground/65 hover:text-foreground"
                  onClick={handleCreateCat}
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-foreground/65 hover:text-foreground"
                  onClick={() => setAddingCat(false)}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </ScrollArea>

      {/* ------- Footer ------- */}
      <div className="px-4 py-2 border-t border-white/15 text-[10px] text-foreground/45">
        {activeWorkspace?.name ?? 'No workspace'}
        {activeCategory ? ` / ${activeCategory.name}` : ''}
      </div>
    </div>
  );
}
