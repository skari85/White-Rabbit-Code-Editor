'use client';

import { useEffect, useState } from 'react';

export type CompileVibeState = 'idle' | 'building' | 'success' | 'failure' | 'progress';

export interface CompileVibesProps {
  state: CompileVibeState;
  progress?: number; // 0-100 for progress indication
  duration?: number; // Animation duration in ms
  size?: 'small' | 'medium' | 'large';
  className?: string;
  onAnimationComplete?: () => void;
}

export function CompileVibes({
  state,
  progress = 0,
  duration = 2000,
  size = 'medium',
  className = '',
  onAnimationComplete
}: CompileVibesProps) {
  const [animationPhase, setAnimationPhase] = useState<'enter' | 'active' | 'exit'>('enter');
  const [showAnimation, setShowAnimation] = useState(false);

  // Size configurations
  const sizeConfig = {
    small: { width: 60, height: 60, strokeWidth: 2 },
    medium: { width: 100, height: 100, strokeWidth: 3 },
    large: { width: 140, height: 140, strokeWidth: 4 }
  };

  const { width, height, strokeWidth } = sizeConfig[size];

  useEffect(() => {
    if (state !== 'idle') {
      setShowAnimation(true);
      setAnimationPhase('enter');
      
      // Transition to active phase
      const enterTimer = setTimeout(() => {
        setAnimationPhase('active');
      }, 300);

      // Handle completion for success/failure states
      if (state === 'success' || state === 'failure') {
        const completeTimer = setTimeout(() => {
          setAnimationPhase('exit');
          setTimeout(() => {
            setShowAnimation(false);
            onAnimationComplete?.();
          }, 500);
        }, duration);

        return () => {
          clearTimeout(enterTimer);
          clearTimeout(completeTimer);
        };
      }

      return () => clearTimeout(enterTimer);
    } else {
      setShowAnimation(false);
    }
  }, [state, duration, onAnimationComplete]);

  if (!showAnimation) return null;

  return (
    <div className={`compile-vibes ${className}`}>
      <div 
        className="relative flex items-center justify-center"
        style={{ width, height }}
      >
        {state === 'building' && <BuildingAnimation {...{ width, height, strokeWidth, animationPhase }} />}
        {state === 'progress' && <ProgressAnimation {...{ width, height, strokeWidth, progress, animationPhase }} />}
        {state === 'success' && <BloomAnimation {...{ width, height, strokeWidth, animationPhase }} />}
        {state === 'failure' && <WiltAnimation {...{ width, height, strokeWidth, animationPhase }} />}
      </div>
    </div>
  );
}

// Building Animation - Growing plant with gentle sway
function BuildingAnimation({ width, height, strokeWidth, animationPhase }: any) {
  return (
    <svg width={width} height={height} viewBox="0 0 100 100" className="absolute">
      <defs>
        <linearGradient id="stemGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
        <radialGradient id="leafGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#86efac" />
          <stop offset="100%" stopColor="#22c55e" />
        </radialGradient>
      </defs>
      
      {/* Stem */}
      <path
        d="M50 90 Q50 70 50 50 Q50 30 50 10"
        fill="none"
        stroke="url(#stemGradient)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        className={`
          ${animationPhase === 'enter' ? 'animate-grow-up' : ''}
          ${animationPhase === 'active' ? 'animate-gentle-sway' : ''}
        `}
        style={{
          transformOrigin: '50% 90%',
          strokeDasharray: animationPhase === 'enter' ? '80' : 'none',
          strokeDashoffset: animationPhase === 'enter' ? '80' : '0',
          animation: animationPhase === 'enter' 
            ? 'growStem 1s ease-out forwards' 
            : animationPhase === 'active' 
            ? 'gentleSway 3s ease-in-out infinite' 
            : 'none'
        }}
      />
      
      {/* Leaves */}
      <ellipse
        cx="35"
        cy="40"
        rx="8"
        ry="12"
        fill="url(#leafGradient)"
        className={`
          ${animationPhase === 'enter' ? 'opacity-0' : 'opacity-100'}
          transition-opacity duration-500 delay-700
        `}
        style={{
          transformOrigin: '43% 52%',
          animation: animationPhase === 'active' ? 'leafSway 3s ease-in-out infinite' : 'none'
        }}
      />
      <ellipse
        cx="65"
        cy="30"
        rx="8"
        ry="12"
        fill="url(#leafGradient)"
        className={`
          ${animationPhase === 'enter' ? 'opacity-0' : 'opacity-100'}
          transition-opacity duration-500 delay-1000
        `}
        style={{
          transformOrigin: '57% 42%',
          animation: animationPhase === 'active' ? 'leafSway 3s ease-in-out infinite 0.5s' : 'none'
        }}
      />
      
      {/* Growing buds */}
      <circle
        cx="50"
        cy="15"
        r="3"
        fill="#fbbf24"
        className={`
          ${animationPhase === 'enter' ? 'scale-0' : 'scale-100'}
          transition-transform duration-300 delay-1200
        `}
        style={{
          animation: animationPhase === 'active' ? 'budPulse 2s ease-in-out infinite' : 'none'
        }}
      />
    </svg>
  );
}

// Progress Animation - Expanding ripples with growing elements
function ProgressAnimation({ width, height, strokeWidth, progress, animationPhase }: any) {
  const normalizedProgress = Math.max(0, Math.min(100, progress));
  
  return (
    <svg width={width} height={height} viewBox="0 0 100 100" className="absolute">
      <defs>
        <radialGradient id="rippleGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
          <stop offset="70%" stopColor="#1d4ed8" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#1e40af" stopOpacity="0" />
        </radialGradient>
      </defs>
      
      {/* Ripple circles */}
      {[0, 1, 2].map((index) => (
        <circle
          key={index}
          cx="50"
          cy="50"
          r="20"
          fill="none"
          stroke="url(#rippleGradient)"
          strokeWidth={strokeWidth / 2}
          className="animate-ripple"
          style={{
            animation: `rippleExpand 2s ease-out infinite ${index * 0.6}s`,
            opacity: animationPhase === 'active' ? 1 : 0
          }}
        />
      ))}
      
      {/* Progress circle */}
      <circle
        cx="50"
        cy="50"
        r="25"
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={strokeWidth}
      />
      <circle
        cx="50"
        cy="50"
        r="25"
        fill="none"
        stroke="#3b82f6"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={`${2 * Math.PI * 25}`}
        strokeDashoffset={`${2 * Math.PI * 25 * (1 - normalizedProgress / 100)}`}
        className="transition-all duration-300"
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
      />
      
      {/* Central growing element */}
      <circle
        cx="50"
        cy="50"
        r={5 + (normalizedProgress / 100) * 10}
        fill="#3b82f6"
        className="transition-all duration-300"
        style={{
          animation: animationPhase === 'active' ? 'pulse 1.5s ease-in-out infinite' : 'none'
        }}
      />
    </svg>
  );
}

// Bloom Animation - Flower blooming with vibrant colors
function BloomAnimation({ width, height, strokeWidth, animationPhase }: any) {
  return (
    <svg width={width} height={height} viewBox="0 0 100 100" className="absolute">
      <defs>
        <radialGradient id="petalGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </radialGradient>
        <radialGradient id="centerGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </radialGradient>
      </defs>
      
      {/* Petals */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
        <ellipse
          key={index}
          cx="50"
          cy="30"
          rx="8"
          ry="20"
          fill="url(#petalGradient)"
          style={{
            transformOrigin: '50% 50%',
            transform: `rotate(${index * 45}deg)`,
            animation: animationPhase === 'active' 
              ? `bloomPetal 1.5s ease-out forwards ${index * 0.1}s` 
              : 'none',
            opacity: animationPhase === 'enter' ? 0 : 1,
            scale: animationPhase === 'enter' ? 0 : 1
          }}
        />
      ))}
      
      {/* Center */}
      <circle
        cx="50"
        cy="50"
        r="8"
        fill="url(#centerGradient)"
        style={{
          animation: animationPhase === 'active' 
            ? 'bloomCenter 1s ease-out forwards 0.5s' 
            : 'none',
          scale: animationPhase === 'enter' ? 0 : 1
        }}
      />
      
      {/* Success sparkles */}
      {[0, 1, 2, 3, 4].map((index) => (
        <circle
          key={`sparkle-${index}`}
          cx={30 + index * 10}
          cy={20 + (index % 2) * 60}
          r="2"
          fill="#fbbf24"
          style={{
            animation: animationPhase === 'active' 
              ? `sparkle 0.8s ease-out forwards ${1 + index * 0.2}s` 
              : 'none',
            opacity: 0
          }}
        />
      ))}
    </svg>
  );
}

// Wilt Animation - Plant wilting with muted colors
function WiltAnimation({ width, height, strokeWidth, animationPhase }: any) {
  return (
    <svg width={width} height={height} viewBox="0 0 100 100" className="absolute">
      <defs>
        <linearGradient id="wiltStemGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#a3a3a3" />
          <stop offset="100%" stopColor="#525252" />
        </linearGradient>
        <radialGradient id="wiltLeafGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#d4a574" />
          <stop offset="100%" stopColor="#92400e" />
        </radialGradient>
      </defs>
      
      {/* Wilting stem */}
      <path
        d="M50 90 Q50 70 50 50 Q50 30 50 10"
        fill="none"
        stroke="url(#wiltStemGradient)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        style={{
          transformOrigin: '50% 90%',
          animation: animationPhase === 'active' ? 'wiltStem 1.5s ease-in forwards' : 'none'
        }}
      />
      
      {/* Wilting leaves */}
      <ellipse
        cx="35"
        cy="40"
        rx="8"
        ry="12"
        fill="url(#wiltLeafGradient)"
        style={{
          transformOrigin: '43% 52%',
          animation: animationPhase === 'active' ? 'wiltLeaf 1.2s ease-in forwards 0.3s' : 'none'
        }}
      />
      <ellipse
        cx="65"
        cy="30"
        rx="8"
        ry="12"
        fill="url(#wiltLeafGradient)"
        style={{
          transformOrigin: '57% 42%',
          animation: animationPhase === 'active' ? 'wiltLeaf 1.2s ease-in forwards 0.6s' : 'none'
        }}
      />
      
      {/* Falling particles */}
      {[0, 1, 2, 3].map((index) => (
        <circle
          key={`particle-${index}`}
          cx={40 + index * 5}
          cy={60 + index * 5}
          r="1.5"
          fill="#92400e"
          style={{
            animation: animationPhase === 'active' 
              ? `fallParticle 2s ease-in forwards ${0.5 + index * 0.3}s` 
              : 'none',
            opacity: 0
          }}
        />
      ))}
    </svg>
  );
}
