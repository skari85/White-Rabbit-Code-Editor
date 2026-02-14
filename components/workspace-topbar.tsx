'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Check,
  KeyRound,
  Loader2,
  Play,
  Save,
  Settings,
} from 'lucide-react';
import DarkModeToggleButton from '@/components/DarkModeToggleButton';

interface WorkspaceTopBarProps {
  workspaceName: string;
  categoryName: string;
  isBYOKConfigured: boolean;
  isRunning: boolean;
  hasUnsavedChanges: boolean;

  onRunTask: () => void;
  onSave: () => void;
  onOpenSettings: () => void;
}

export default function WorkspaceTopBar({
  workspaceName,
  categoryName,
  isBYOKConfigured,
  isRunning,
  hasUnsavedChanges,
  onRunTask,
  onSave,
  onOpenSettings,
}: WorkspaceTopBarProps) {
  return (
    <div className="flex items-center justify-between h-10 px-3 bg-zinc-900 border-b border-zinc-800 select-none shrink-0">
      {/* Left: breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-zinc-400 min-w-0">
        <span className="font-medium text-zinc-300 truncate max-w-[140px]">
          {workspaceName}
        </span>
        <span className="text-zinc-600">/</span>
        <span className="truncate max-w-[140px]">{categoryName}</span>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1.5">
        {/* BYOK status */}
        <div
          className={`flex items-center gap-1 text-[10px] rounded px-1.5 py-0.5 ${
            isBYOKConfigured
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-amber-500/10 text-amber-400'
          }`}
          title={
            isBYOKConfigured
              ? 'API key configured'
              : 'No API key set — click Settings to add one'
          }
        >
          <KeyRound className="w-3 h-3" />
          <span className="hidden sm:inline">
            {isBYOKConfigured ? 'Key set' : 'No key'}
          </span>
        </div>

        {/* Save indicator */}
        <div
          className={`flex items-center gap-1 text-[10px] rounded px-1.5 py-0.5 ${
            hasUnsavedChanges
              ? 'bg-amber-500/10 text-amber-400'
              : 'bg-zinc-800 text-zinc-500'
          }`}
        >
          {hasUnsavedChanges ? (
            <>
              <Save className="w-3 h-3" />
              <span className="hidden sm:inline">Unsaved</span>
            </>
          ) : (
            <>
              <Check className="w-3 h-3" />
              <span className="hidden sm:inline">Saved</span>
            </>
          )}
        </div>

        {/* Run task */}
        <Button
          size="sm"
          disabled={!isBYOKConfigured || isRunning}
          onClick={onRunTask}
          className="h-7 text-xs gap-1.5 bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40"
          title={
            !isBYOKConfigured
              ? 'Set an API key in Settings to enable Run Task'
              : 'Run task with current editor + instructions'
          }
        >
          {isRunning ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
          Run task
        </Button>

        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-200"
          onClick={onSave}
          title="Save"
        >
          <Save className="w-3.5 h-3.5" />
        </Button>

        <DarkModeToggleButton />

        <Button
          size="sm"
          variant="ghost"
          className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-200"
          onClick={onOpenSettings}
          title="AI Settings (BYOK)"
        >
          <Settings className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
