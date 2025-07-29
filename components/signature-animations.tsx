"use client"

import React, { useState, useEffect, useRef } from 'react';
import { PersonalityMode } from '@/lib/personality-system';

interface SignatureAnimationsProps {
  personality: PersonalityMode;
  isTyping: boolean;
  isCodeAccepted: boolean;
  children: React.ReactNode;
}

export function SignatureAnimations({
  personality,
  isTyping,
  isCodeAccepted,
  children
}: SignatureAnimationsProps) {
  const [glyphs, setGlyphs] = useState<Array<{
    id: string;
    char: string;
    x: number;
    y: number;
    opacity: number;
    scale: number;
  }>>([]);
  const [isAnimating, setIsAnimating] = useState(false);

  // HEX: Show glyphs when typing
  useEffect(() => {
    if (personality === 'hex' && isTyping) {
      const hexGlyphs = ['{', '}', '=', '>', '(', ')', '[', ']', ';', ':', '<', '/'];
      const newGlyphs = [];
      
      for (let i = 0; i < 3; i++) {
        const glyph = hexGlyphs[Math.floor(Math.random() * hexGlyphs.length)];
        newGlyphs.push({
          id: `hex-${Date.now()}-${i}`,
          char: glyph,
          x: Math.random() * 100,
          y: Math.random() * 100,
          opacity: 0.7,
          scale: 0.8 + Math.random() * 0.4
        });
      }
      
      setGlyphs(newGlyphs);
      
      const timer = setTimeout(() => {
        setGlyphs([]);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [personality, isTyping]);

  // KEX: Animate when code is accepted
  useEffect(() => {
    if (personality === 'kex' && isCodeAccepted) {
      setIsAnimating(true);
      
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [personality, isCodeAccepted]);

  return (
    <div 
      className={`relative ${
        personality === 'kex' && isAnimating 
          ? 'animate-pulse' 
          : ''
      }`}
    >
      {children}
      
      {/* HEX Glyphs */}
      {personality === 'hex' && glyphs.map((glyph) => (
        <div
          key={glyph.id}
          className="absolute pointer-events-none text-blue-400 font-mono text-sm animate-ping"
          style={{
            left: `${glyph.x}%`,
            top: `${glyph.y}%`,
            opacity: glyph.opacity,
            transform: `scale(${glyph.scale})`,
            zIndex: 10
          }}
        >
          {glyph.char}
        </div>
      ))}
      
      {/* KEX Dance Animation */}
      {personality === 'kex' && isAnimating && (
        <>
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-green-500/10 animate-pulse" />
          
          {[...Array(6)].map((_, i) => (
            <div
              key={`sparkle-${i}`}
              className="absolute pointer-events-none text-purple-400 animate-bounce"
              style={{
                left: `${20 + i * 15}%`,
                top: `${10 + (i % 2) * 80}%`,
                animationDelay: `${i * 0.2}s`
              }}
            >
              ✨
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// Hook for managing signature animations
export function useSignatureAnimations() {
  const [isTyping, setIsTyping] = useState(false);
  const [isCodeAccepted, setIsCodeAccepted] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const triggerTyping = () => {
    setIsTyping(true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 500);
  };

  const triggerCodeAccepted = () => {
    setIsCodeAccepted(true);
    const timer = setTimeout(() => {
      setIsCodeAccepted(false);
    }, 100);
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    isTyping,
    isCodeAccepted,
    triggerTyping,
    triggerCodeAccepted
  };
}

// Enhanced code editor with signature animations
interface AnimatedCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  personality: PersonalityMode;
  language?: string;
  className?: string;
}

export function AnimatedCodeEditor({
  value,
  onChange,
  personality,
  language = 'javascript',
  className = ''
}: AnimatedCodeEditorProps) {
  const { isTyping, isCodeAccepted, triggerTyping, triggerCodeAccepted } = useSignatureAnimations();
  const [localValue, setLocalValue] = useState(value);

  const handleChange = (newValue: string) => {
    setLocalValue(newValue);
    onChange(newValue);
    triggerTyping();
  };

  const handleAccept = () => {
    triggerCodeAccepted();
  };

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <SignatureAnimations
      personality={personality}
      isTyping={isTyping}
      isCodeAccepted={isCodeAccepted}
    >
      <div className={`relative ${className}`}>
        <textarea
          value={localValue}
          onChange={(e) => handleChange(e.target.value)}
          className={`w-full h-full bg-gray-900 text-gray-100 font-mono text-sm p-4 border border-gray-700 rounded-lg resize-none focus:outline-none focus:ring-2 ${
            personality === 'hex' 
              ? 'focus:ring-blue-500' 
              : 'focus:ring-purple-500'
          } ${
            isCodeAccepted && personality === 'kex'
              ? 'animate-bounce'
              : ''
          }`}
          placeholder={
            personality === 'hex' 
              ? '// Enter your code here...' 
              : '// Let\'s create some magic! ✨'
          }
          spellCheck={false}
        />
        
        {personality === 'kex' && localValue.trim() && (
          <button
            onClick={handleAccept}
            className="absolute bottom-2 right-2 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded-md transition-colors"
          >
            Accept ✨
          </button>
        )}
        
        {personality === 'hex' && isTyping && (
          <div className="absolute top-2 right-2 flex items-center gap-1 text-xs text-blue-400">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
            <span>Analyzing...</span>
          </div>
        )}
      </div>
    </SignatureAnimations>
  );
}

// Typing effect component for HEX personality
export function HexTypingEffect({ text }: { text: string }) {
  const [displayText, setDisplayText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, 50 + Math.random() * 50);
      
      return () => clearTimeout(timer);
    }
  }, [currentIndex, text]);

  return (
    <div className="relative">
      <span className="font-mono text-blue-400">
        {displayText}
        {currentIndex < text.length && (
          <span className="animate-pulse">|</span>
        )}
      </span>
    </div>
  );
}

// Code folding animation for KEX personality
export function KexCodeFold({ children, isVisible }: { children: React.ReactNode; isVisible: boolean }) {
  return (
    <div 
      className={`transition-all duration-500 ease-in-out overflow-hidden ${
        isVisible 
          ? 'max-h-screen opacity-100 transform scale-100' 
          : 'max-h-0 opacity-0 transform scale-95'
      }`}
    >
      <div className={`${isVisible ? 'animate-slideDown' : ''}`}>
        {children}
      </div>
    </div>
  );
}
