"use client"

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PersonalityMode, personalitySystem, PERSONALITIES } from '@/lib/personality-system';
import { Zap, Sparkles } from 'lucide-react';

interface PersonalityToggleProps {
  personality: PersonalityMode;
  onPersonalityChange: (personality: PersonalityMode) => void;
}

export function PersonalityToggle({ personality, onPersonalityChange }: PersonalityToggleProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        togglePersonality();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [personality]);

  const togglePersonality = () => {
    setIsAnimating(true);
    const newPersonality = personalitySystem.togglePersonality();
    onPersonalityChange(newPersonality);
    
    // Reset animation after a short delay
    setTimeout(() => setIsAnimating(false), 600);
  };

  const currentConfig = PERSONALITIES[personality];
  const isKex = personality === 'kex';

  return (
    <div className="flex items-center gap-2">
      {/* Personality Status Indicator */}
      <div 
        className={`px-3 py-1 rounded-full text-xs font-bold transition-all duration-300 ${
          isAnimating ? 'scale-110' : 'scale-100'
        }`}
        style={{
          background: currentConfig.style.background,
          color: currentConfig.style.textColor,
          boxShadow: isAnimating ? `0 0 20px ${currentConfig.color}` : 'none'
        }}
      >
        <span className="mr-1">{currentConfig.icon}</span>
        {currentConfig.name}
      </div>

      {/* Toggle Button */}
      <Button
        onClick={togglePersonality}
        variant="outline"
        size="sm"
        className={`relative overflow-hidden transition-all duration-300 ${
          isAnimating ? 'scale-105' : 'scale-100'
        }`}
        style={{
          borderColor: currentConfig.color,
          color: currentConfig.color,
          background: isAnimating ? `${currentConfig.color}20` : 'transparent'
        }}
      >
        <div className={`flex items-center gap-2 ${isAnimating ? 'animate-pulse' : ''}`}>
          {isKex ? (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Tame KEX</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              <span>Unleash KEX</span>
            </>
          )}
        </div>
        
        {/* Glitch effect for KEX */}
        {isKex && isAnimating && (
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              background: `linear-gradient(45deg, transparent 30%, ${currentConfig.color} 50%, transparent 70%)`,
              animation: 'glitch 0.3s ease-in-out'
            }}
          />
        )}
      </Button>

      {/* Keyboard Shortcut Hint */}
      <div className="text-xs text-gray-500 hidden md:block">
        <kbd className="px-1 py-0.5 bg-gray-100 rounded text-xs">⌘K</kbd>
      </div>

      <style jsx>{`
        @keyframes glitch {
          0% { transform: translateX(0); }
          20% { transform: translateX(-2px); }
          40% { transform: translateX(2px); }
          60% { transform: translateX(-1px); }
          80% { transform: translateX(1px); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

// Personality-aware theme provider
export function PersonalityThemeProvider({ 
  personality, 
  children 
}: { 
  personality: PersonalityMode; 
  children: React.ReactNode;
}) {
  const config = PERSONALITIES[personality];
  
  useEffect(() => {
    // Apply personality theme to document root
    const root = document.documentElement;
    root.style.setProperty('--personality-color', config.color);
    root.style.setProperty('--personality-bg', config.style.background);
    root.style.setProperty('--personality-text', config.style.textColor);
  }, [personality, config]);

  return (
    <div 
      className="personality-theme"
      data-personality={personality}
      style={{
        '--personality-color': config.color,
        '--personality-bg': config.style.background,
        '--personality-text': config.style.textColor
      } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
