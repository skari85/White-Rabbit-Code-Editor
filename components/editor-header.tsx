'use client';

import { Settings } from 'lucide-react';
import DarkModeToggleButton from './DarkModeToggleButton';
import { Button } from './ui/button';

interface EditorHeaderProps {
  onAISettingsToggle: () => void;
}

export default function EditorHeader({ onAISettingsToggle }: EditorHeaderProps) {
  return (
    <div className="p-4 border-b border-gray-700 bg-gray-750">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded flex items-center justify-center p-1">
                <img
                  src="/hexkexlogo.png"
                  alt="White Rabbit"
                  className="w-full h-full object-contain"
                />
              </div>
          <div>
            <h2 className="font-semibold text-sm text-white">White Rabbit</h2>
            <p className="text-xs text-gray-400">Code Editor</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Dark Mode Toggle */}
          <DarkModeToggleButton />

          {/* Settings Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onAISettingsToggle}
            className="h-8 w-8 p-0"
            title="AI Settings (BYOK)"
          >
            <Settings className="w-4 h-4" />
          </Button>

          <span className="text-xs text-gray-400">White Rabbit</span>
        </div>
      </div>
    </div>
  );
}
