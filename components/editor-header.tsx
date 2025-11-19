'use client';

import { Settings } from 'lucide-react';
import { useSession } from 'next-auth/react';
import DarkModeToggleButton from './DarkModeToggleButton';
import { Button } from './ui/button';

interface EditorHeaderProps {
  onAISettingsToggle: () => void;
}

export default function EditorHeader({ onAISettingsToggle }: EditorHeaderProps) {
  const { data: session } = useSession();

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

          {/* User Profile */}
          {session?.user ? (
            <div className="flex items-center gap-2">
              {session.user.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name || 'User'}
                  className="w-6 h-6 rounded-full"
                />
              )}
              <span className="text-xs text-gray-300">
                {session.user.name || session.user.email}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/setup'}
              >
                Setup GitHub
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/auth/signin'}
              >
                Sign In
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
