'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileContent } from '@/hooks/use-code-builder';
import { CodeFormatter } from '@/lib/code-formatter';
import { debuggerService } from '@/lib/debugger-service';
import { gitService } from '@/lib/git-service';
import {
    ArrowDown,
    ArrowRight,
    ArrowUp,
    BarChart3,
    Bug,
    Code,
    FileText,
    GitBranch,
    Hammer,
    Keyboard,
    Package,
    Palette,
    Pause,
    Play,
    Rocket,
    Search,
    Square,
    Wrench,
    Zap
} from 'lucide-react';
import { useState } from 'react';
import FindReplacePanel from './find-replace-panel';

interface AdvancedEditorToolbarProps {
  files: FileContent[];
  selectedFile?: string;
  onNavigateToResult: (file: string, line: number, column: number) => void;
  onReplaceInFile: (file: string, searchText: string, replaceText: string, options: any) => void;
  onFormatCode: (file: string, formattedContent: string) => void;
  className?: string;
}

export default function AdvancedEditorToolbar({
  files,
  selectedFile,
  onNavigateToResult,
  onReplaceInFile,
  onFormatCode,
  className = ''
}: AdvancedEditorToolbarProps) {
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [debugSession, setDebugSession] = useState<string | null>(null);
  const [isDebugging, setIsDebugging] = useState(false);
  const [breakpoints, setBreakpoints] = useState<any[]>([]);
  const [gitStatus, setGitStatus] = useState<any>(null);

  const formatter = new CodeFormatter();

  // Initialize debug session
  const startDebugging = () => {
    if (!selectedFile) return;

    const file = files.find(f => f.name === selectedFile);
    if (!file) return;

    const sessionId = debuggerService.createSession(file.content, selectedFile);
    setDebugSession(sessionId);
    setIsDebugging(true);
  };

  // Stop debugging
  const stopDebugging = () => {
    if (debugSession) {
      debuggerService.destroySession(debugSession);
      setDebugSession(null);
      setIsDebugging(false);
    }
  };

  // Debug controls
  const debugContinue = () => {
    debuggerService.continue();
  };

  const debugPause = () => {
    debuggerService.pause();
  };

  const debugStepOver = () => {
    debuggerService.stepOver();
  };

  const debugStepInto = () => {
    debuggerService.stepInto();
  };

  const debugStepOut = () => {
    debuggerService.stepOut();
  };

  // Toggle breakpoint
  const toggleBreakpoint = (line: number) => {
    if (!selectedFile) return;

    const existingBreakpoint = breakpoints.find(
      bp => bp.file === selectedFile && bp.line === line
    );

    if (existingBreakpoint) {
      debuggerService.removeBreakpoint(existingBreakpoint.id);
      setBreakpoints(prev => prev.filter(bp => bp.id !== existingBreakpoint.id));
    } else {
      const breakpoint = debuggerService.addBreakpoint(selectedFile, line);
      setBreakpoints(prev => [...prev, breakpoint]);
    }
  };

  // Format current file
  const formatCurrentFile = () => {
    if (!selectedFile) return;

    const file = files.find(f => f.name === selectedFile);
    if (!file) return;

    const language = getLanguageFromFileName(selectedFile);
    const formatted = formatter.formatCode(file.content, language);
    onFormatCode(selectedFile, formatted);
  };

  // Get Git status
  const refreshGitStatus = () => {
    const status = gitService.getStatus(files);
    setGitStatus(status);
  };

  // Helper function
  const getLanguageFromFileName = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const langMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'html': 'html',
      'css': 'css',
      'json': 'json'
    };
    return langMap[ext || ''] || 'javascript';
  };

  return (
    <div className={`bg-white border-b p-2 ${className}`}>
      <div className="flex items-center gap-2 flex-wrap">
        {/* New App + Publish */}
        <div className="flex items-center gap-1">
          <Button variant="default" size="sm" className="flex items-center gap-2" onClick={() => (window as any).wrOpenNewAppWizard?.()}>
            <Rocket className="w-4 h-4" /> New App
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={() => (window as any).wrOpenPublishModal?.()}>
            <BarChart3 className="w-4 h-4" /> Publish
          </Button>
        </div>

        {/* Style Panel */}
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={() => (window as any).wrOpenStylePanel?.()}>
            <Palette className="w-4 h-4" /> Style
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            onClick={() => window.open('/visual-tools', '_blank')}
            title="Open Visual Tools"
          >
            <Zap className="w-4 h-4" /> Visual Tools
          </Button>
        {/* Onboarding/Shortcuts */}
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="flex items-center gap-2" onClick={() => (window as any).wrOpenOnboarding?.()}>
            <Keyboard className="w-4 h-4" /> Shortcuts
          </Button>
        </div>

        </div>

        {/* Run Controls */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => (window as any).wrRunDev?.()} title="Run Dev (npm run dev)">
            <Play className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => (window as any).wrRunBuild?.()} title="Build (npm run build)">
            <Hammer className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => (window as any).wrRunTypecheck?.()} title="Type Check (tsc -p .)">
            <Bug className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => (window as any).wrRunLint?.()} title="Lint (npm run lint)">
            <Wrench className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => (window as any).wrOpenGit?.()} title="Open Git Panel">
            <GitBranch className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => (window as any).wrOpenExtensions?.()} title="Open Extensions Console">
            <Package className="w-4 h-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        <Separator orientation="vertical" className="h-6" />

        {/* Find & Replace */}
        <div className="flex items-center gap-1">
          <Button
            onClick={() => setShowFindReplace(!showFindReplace)}
            variant={showFindReplace ? "default" : "outline"}
            size="sm"
            className="flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Find
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Code Formatting */}
        <div className="flex items-center gap-1">
          <Button
            onClick={formatCurrentFile}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            disabled={!selectedFile}
          >
            <Code className="w-4 h-4" />
            Format
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Debugging Controls */}
        <div className="flex items-center gap-1">
          {!isDebugging ? (
            <Button
              onClick={startDebugging}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
              disabled={!selectedFile}
            >
              <Play className="w-4 h-4" />
              Debug
            </Button>
          ) : (
            <>
              <Button
                onClick={debugContinue}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
              </Button>
              <Button
                onClick={debugPause}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Pause className="w-4 h-4" />
              </Button>
              <Button
                onClick={stopDebugging}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <Square className="w-4 h-4" />
              </Button>

              <Separator orientation="vertical" className="h-4" />

              <Button
                onClick={debugStepOver}
                variant="outline"
                size="sm"
                title="Step Over"
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                onClick={debugStepInto}
                variant="outline"
                size="sm"
                title="Step Into"
              >
                <ArrowDown className="w-4 h-4" />
              </Button>
              <Button
                onClick={debugStepOut}
                variant="outline"
                size="sm"
                title="Step Out"
              >
                <ArrowUp className="w-4 h-4" />
              </Button>
            </>
          )}

          {breakpoints.length > 0 && (
            <Badge variant="secondary" className="text-xs ml-2">
              {breakpoints.length} breakpoints
            </Badge>
          )}
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Git Controls */}
        <div className="flex items-center gap-1">
          <Button
            onClick={refreshGitStatus}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <GitBranch className="w-4 h-4" />
            Git
          </Button>

          {gitStatus && (
            <div className="flex items-center gap-2 ml-2">
              {gitStatus.staged.length > 0 && (
                <Badge variant="default" className="text-xs bg-green-500">
                  {gitStatus.staged.length} staged
                </Badge>
              )}
              {gitStatus.unstaged.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {gitStatus.unstaged.length} modified
                </Badge>
              )}
              {gitStatus.untracked.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {gitStatus.untracked.length} untracked
                </Badge>
              )}
            </div>
          )}
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Data Science Hub */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            title="Open Data Science Hub"
            onClick={() => window.open('/data-science', '_blank')}
          >
            <BarChart3 className="w-4 h-4" />
            Data Science
          </Button>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Quick Actions */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
            title="Quick Actions"
          >
            <Zap className="w-4 h-4" />
            Actions
          </Button>
        </div>
      </div>

      {/* Find & Replace Panel */}
      {showFindReplace && (
        <div className="mt-3 border-t pt-3">
          <FindReplacePanel
            files={files}
            selectedFile={selectedFile}
            onNavigateToResult={onNavigateToResult}
            onReplaceInFile={onReplaceInFile}
          />
        </div>
      )}

      {/* Debug Output */}
      {isDebugging && debugSession && (
        <div className="mt-3 border-t pt-3">
          <div className="bg-gray-50 rounded p-3 max-h-32 overflow-y-auto">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Bug className="w-4 h-4" />
              Debug Output
            </h4>
            <div className="text-xs font-mono space-y-1">
              {debuggerService.getDebugOutput(debugSession).map((line, index) => (
                <div key={index} className="text-gray-700">
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Git Status Panel */}
      {gitStatus && (
        <div className="mt-3 border-t pt-3">
          <div className="bg-gray-50 rounded p-3">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              Git Status - {gitStatus.branch}
            </h4>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <h5 className="font-medium text-green-600 mb-1">Staged ({gitStatus.staged.length})</h5>
                {gitStatus.staged.map((file: any) => (
                  <div key={file.file} className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {file.file}
                  </div>
                ))}
              </div>
              <div>
                <h5 className="font-medium text-orange-600 mb-1">Modified ({gitStatus.unstaged.length})</h5>
                {gitStatus.unstaged.map((file: any) => (
                  <div key={file.file} className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {file.file}
                  </div>
                ))}
              </div>
              <div>
                <h5 className="font-medium text-gray-600 mb-1">Untracked ({gitStatus.untracked.length})</h5>
                {gitStatus.untracked.map((file: string) => (
                  <div key={file} className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {file}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
