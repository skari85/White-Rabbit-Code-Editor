'use client';

import { FileContent } from '@/hooks/use-code-builder';
import { FileText, Plus, X } from 'lucide-react';
import { Button } from './ui/button';

interface FileExplorerProps {
  files: FileContent[];
  selectedFile: string | null;
  onFileSelect: (filename: string) => void;
  onAddFile: () => void;
  onNewProject: () => void;
  onDeleteFile: (filename: string) => void;
}

// Helper function to get file type icon
const getFileTypeIcon = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js': case 'jsx': return '📄';
    case 'ts': case 'tsx': return '🔷';
    case 'html': return '🌐';
    case 'css': return '🎨';
    case 'json': return '📋';
    case 'md': return '📝';
    case 'py': return '🐍';
    case 'txt': return '📄';
    default: return '📄';
  }
};

export default function FileExplorer({
  files,
  selectedFile,
  onFileSelect,
  onAddFile,
  onNewProject,
  onDeleteFile
}: FileExplorerProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium">Files</h3>
          <div className="flex items-center gap-1">
            <Button
              onClick={onNewProject}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              title="New Project"
            >
              <FileText className="w-3 h-3" />
            </Button>
            <Button
              onClick={onAddFile}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              title="Add File"
            >
              <Plus className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <div className="space-y-1">
          {files.map((file) => (
            <button
              key={file.name}
              onClick={() => onFileSelect(file.name)}
              className={`w-full text-left p-2 rounded text-sm flex items-center gap-2 ${
                selectedFile === file.name
                  ? "bg-blue-50 text-blue-700"
                  : "hover:bg-gray-50"
              }`}
            >
              <span className="text-sm">{getFileTypeIcon(file.name)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {new Date(file.lastModified).toLocaleDateString()}
                </p>
              </div>
              {selectedFile === file.name && (
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFile(file.name);
                  }}
                  className="h-4 w-4 p-0 opacity-50 hover:opacity-100 cursor-pointer inline-flex items-center justify-center rounded hover:bg-gray-200"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      onDeleteFile(file.name);
                    }
                  }}
                >
                  <X className="w-3 h-3" />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
