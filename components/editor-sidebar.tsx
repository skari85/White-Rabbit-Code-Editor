'use client';

import { FileContent } from '@/hooks/use-code-builder';
import EditorHeader from './editor-header';
import FileExplorer from './file-explorer';
import LiveCodingEngine from './live-coding-engine';

interface EditorSidebarProps {
  files: FileContent[];
  selectedFile: string | null;
  showAISettings: boolean;
  onFileSelect: (filename: string) => void;
  onAddFile: () => void;
  onNewProject: () => void;
  onDeleteFile: (filename: string) => void;
  onAISettingsToggle: () => void;
  onFileCreate: (name: string, content: string) => void;
  onFileUpdate: (filename: string, content: string) => void;
  onFileSelectAICreated: (name: string) => void;
}

export default function EditorSidebar({
  files,
  selectedFile,
  showAISettings,
  onFileSelect,
  onAddFile,
  onNewProject,
  onDeleteFile,
  onAISettingsToggle,
  onFileCreate,
  onFileUpdate,
  onFileSelectAICreated
}: EditorSidebarProps) {
  return (
    <div className="bg-gray-800 border-r border-gray-700 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <EditorHeader onAISettingsToggle={onAISettingsToggle} />

      {/* File Explorer */}
      <FileExplorer
        files={files}
        selectedFile={selectedFile}
        onFileSelect={onFileSelect}
        onAddFile={onAddFile}
        onNewProject={onNewProject}
        onDeleteFile={onDeleteFile}
      />

      {/* AI Chat - Expanded */}
      <div className="border-t flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 overflow-hidden">
          {/* AI Chat component would go here - extracted separately */}
        </div>

        {/* Live Coding Engine - Fixed at bottom */}
        <LiveCodingEngine
          onFileCreate={onFileCreate}
          onFileUpdate={onFileUpdate}
          onFileSelect={onFileSelectAICreated}
        />
      </div>
    </div>
  );
}
