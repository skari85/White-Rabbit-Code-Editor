"use client"

import React, { useState, useEffect, useRef } from 'react';
import { PersonalityMode } from '@/lib/personality-system';

interface GlitchPreviewProps {
  code: string;
  isGenerating: boolean;
  onSolidify: () => void;
  personality: PersonalityMode;
}

export function GlitchPreview({ code, isGenerating, onSolidify, personality }: GlitchPreviewProps) {
  const [glitchIntensity, setGlitchIntensity] = useState(0);
  const [flickerState, setFlickerState] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isGenerating) {
      // Start glitch animation
      setGlitchIntensity(1);
      
      // Flicker effect
      const flickerInterval = setInterval(() => {
        setFlickerState(prev => !prev);
      }, 150);

      // Gradually reduce glitch intensity
      const glitchTimeout = setTimeout(() => {
        setGlitchIntensity(0.5);
      }, 1000);

      return () => {
        clearInterval(flickerInterval);
        clearTimeout(glitchTimeout);
      };
    } else {
      setGlitchIntensity(0);
      setFlickerState(false);
    }
  }, [isGenerating]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isGenerating && (event.key === 'Tab' || event.key === 'Enter')) {
        event.preventDefault();
        onSolidify();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isGenerating, onSolidify]);

  const getGlitchStyle = () => {
    if (!isGenerating) return {};

    const baseColor = personality === 'hex' ? '#6c2fff' : '#00ffe1';
    const secondaryColor = personality === 'hex' ? '#4c1bff' : '#00d4aa';

    return {
      position: 'relative' as const,
      filter: `hue-rotate(${Math.random() * 360}deg) saturate(${1 + glitchIntensity})`,
      textShadow: flickerState 
        ? `0 0 5px ${baseColor}, 0 0 10px ${secondaryColor}, 0 0 15px ${baseColor}`
        : `0 0 2px ${baseColor}`,
      animation: glitchIntensity > 0.5 ? 'glitch-text 0.3s infinite' : 'none',
    };
  };

  const renderGlitchLayers = () => {
    if (!isGenerating || glitchIntensity < 0.5) return null;

    return (
      <>
        {/* Glitch layer 1 - Red channel */}
        <div
          className="absolute inset-0 opacity-70 mix-blend-multiply"
          style={{
            color: '#ff0000',
            transform: `translateX(${Math.random() * 2 - 1}px)`,
            clipPath: `polygon(0 ${Math.random() * 100}%, 100% ${Math.random() * 100}%, 100% ${Math.random() * 100}%, 0 ${Math.random() * 100}%)`
          }}
        >
          {code}
        </div>
        
        {/* Glitch layer 2 - Cyan channel */}
        <div
          className="absolute inset-0 opacity-70 mix-blend-multiply"
          style={{
            color: '#00ffff',
            transform: `translateX(${Math.random() * 2 - 1}px)`,
            clipPath: `polygon(0 ${Math.random() * 100}%, 100% ${Math.random() * 100}%, 100% ${Math.random() * 100}%, 0 ${Math.random() * 100}%)`
          }}
        >
          {code}
        </div>
      </>
    );
  };

  return (
    <div className="relative">
      <div
        ref={previewRef}
        className={`font-mono text-sm leading-relaxed transition-all duration-300 ${
          isGenerating ? 'select-none' : 'select-text'
        }`}
        style={getGlitchStyle()}
      >
        {/* Main content */}
        <div className="relative z-10">
          {code}
        </div>
        
        {/* Glitch layers */}
        {renderGlitchLayers()}
        
        {/* Scan lines effect */}
        {isGenerating && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `repeating-linear-gradient(
                0deg,
                transparent,
                transparent 2px,
                rgba(${personality === 'hex' ? '108, 47, 255' : '0, 255, 225'}, 0.1) 2px,
                rgba(${personality === 'hex' ? '108, 47, 255' : '0, 255, 225'}, 0.1) 4px
              )`,
              animation: 'scan-lines 2s linear infinite'
            }}
          />
        )}
        
        {/* Neon border when generating */}
        {isGenerating && (
          <div
            className="absolute inset-0 pointer-events-none rounded"
            style={{
              boxShadow: `inset 0 0 20px ${personality === 'hex' ? '#6c2fff' : '#00ffe1'}`,
              border: `1px solid ${personality === 'hex' ? '#6c2fff' : '#00ffe1'}`,
              opacity: flickerState ? 0.8 : 0.4
            }}
          />
        )}
      </div>
      
      {/* Solidify hint */}
      {isGenerating && (
        <div className="absolute -bottom-8 left-0 right-0 text-center">
          <div
            className="inline-block px-3 py-1 rounded-full text-xs font-medium animate-pulse"
            style={{
              background: `${personality === 'hex' ? '#6c2fff' : '#00ffe1'}20`,
              color: personality === 'hex' ? '#6c2fff' : '#00ffe1',
              border: `1px solid ${personality === 'hex' ? '#6c2fff' : '#00ffe1'}`
            }}
          >
            Press Tab or Enter to solidify the spell ✨
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes glitch-text {
          0% { transform: translateX(0); }
          20% { transform: translateX(-2px) skewX(5deg); }
          40% { transform: translateX(2px) skewX(-5deg); }
          60% { transform: translateX(-1px) skewX(2deg); }
          80% { transform: translateX(1px) skewX(-2deg); }
          100% { transform: translateX(0); }
        }
        
        @keyframes scan-lines {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
      `}</style>
    </div>
  );
}

// Hook for managing glitch preview state
export function useGlitchPreview() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [pendingCode, setPendingCode] = useState('');
  const [solidifiedCode, setSolidifiedCode] = useState('');

  const startGeneration = (code: string) => {
    setPendingCode(code);
    setIsGenerating(true);
  };

  const solidify = () => {
    setSolidifiedCode(pendingCode);
    setIsGenerating(false);
    setPendingCode('');
  };

  const cancel = () => {
    setIsGenerating(false);
    setPendingCode('');
  };

  return {
    isGenerating,
    pendingCode,
    solidifiedCode,
    startGeneration,
    solidify,
    cancel
  };
}
