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
    <div className="ios-glass-panel-header flex items-center justify-between h-11 px-3 select-none shrink-0">
      {/* Left: breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs text-foreground/65 min-w-0">
        <span className="font-medium text-foreground/90 truncate max-w-[140px]">
          {workspaceName}
        </span>
        <span className="text-foreground/35">/</span>
        <span className="truncate max-w-[140px]">{categoryName}</span>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1.5">
        {/* BYOK status */}
        <div
          className={`ios-glass-chip flex items-center gap-1 text-[10px] px-2 py-0.5 ${
            isBYOKConfigured
              ? 'border-emerald-500/45 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
              : 'border-amber-500/45 bg-amber-500/15 text-amber-600 dark:text-amber-300'
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
          className={`ios-glass-chip flex items-center gap-1 text-[10px] px-2 py-0.5 ${
            hasUnsavedChanges
              ? 'border-amber-500/45 bg-amber-500/15 text-amber-600 dark:text-amber-300'
              : 'text-foreground/55'
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
          className="h-8 text-xs gap-1.5 px-3 disabled:opacity-40"
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
          className="h-8 w-8 p-0 text-foreground/60 hover:text-foreground"
          onClick={onSave}
          title="Save"
        >
          <Save className="w-3.5 h-3.5" />
        </Button>

        <DarkModeToggleButton />

        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0 text-foreground/60 hover:text-foreground"
          onClick={onOpenSettings}
          title="AI Settings (BYOK)"
        >
          <Settings className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
