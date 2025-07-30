

"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface EditorTabsProps {
  openFiles: string[];
  activeFile: string | null;
  onTabClick: (fileName: string) => void;
  onTabClose: (fileName: string) => void;
  className?: string;
}

export function EditorTabs({
  openFiles,
  activeFile,
  onTabClick,
  onTabClose,
  className,
}: EditorTabsProps) {
  if (openFiles.length === 0) {
    return null;
  }

  return (
    <div className={`flex items-center border-b border-gray-800 bg-gray-900/50 ${className}`}>
      <div className="flex gap-1 overflow-x-auto p-2">
        {openFiles.map((fileName) => (
          <div
            key={fileName}
            className={`flex items-center gap-2 px-3 py-1 rounded-t-md text-sm whitespace-nowrap cursor-pointer ${activeFile === fileName
              ? 'bg-gray-800 text-white'
              : 'bg-gray-950 text-gray-400 hover:bg-gray-800/50'
              }`}
            onClick={() => onTabClick(fileName)}
          >
            <span>{fileName}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 rounded-full hover:bg-gray-700"
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(fileName);
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
