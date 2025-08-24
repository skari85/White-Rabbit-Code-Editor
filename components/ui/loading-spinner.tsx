'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, Code, Terminal, FileText, Zap } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'code' | 'terminal' | 'file' | 'ai';
  className?: string;
  text?: string;
  fullScreen?: boolean;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
};

const variantIcons = {
  default: Loader2,
  code: Code,
  terminal: Terminal,
  file: FileText,
  ai: Zap
};

export function LoadingSpinner({ 
  size = 'md', 
  variant = 'default', 
  className, 
  text,
  fullScreen = false 
}: LoadingSpinnerProps) {
  const Icon = variantIcons[variant];
  
  const spinner = (
    <div className={cn(
      "flex flex-col items-center justify-center gap-2",
      fullScreen && "fixed inset-0 bg-background/80 backdrop-blur-sm z-50",
      className
    )}>
      <Icon 
        className={cn(
          sizeClasses[size],
          "animate-spin text-primary",
          variant === 'ai' && "text-blue-500",
          variant === 'code' && "text-green-500",
          variant === 'terminal' && "text-yellow-500",
          variant === 'file' && "text-purple-500"
        )} 
      />
      {text && (
        <p className={cn(
          "text-sm text-muted-foreground animate-pulse",
          size === 'sm' && "text-xs",
          size === 'lg' && "text-base",
          size === 'xl' && "text-lg"
        )}>
          {text}
        </p>
      )}
    </div>
  );

  return spinner;
}

// Specialized loading components
export function CodeLoadingSpinner({ className, ...props }: Omit<LoadingSpinnerProps, 'variant'>) {
  return <LoadingSpinner variant="code" className={className} {...props} />;
}

export function AILoadingSpinner({ className, ...props }: Omit<LoadingSpinnerProps, 'variant'>) {
  return <LoadingSpinner variant="ai" className={className} {...props} />;
}

export function FileLoadingSpinner({ className, ...props }: Omit<LoadingSpinnerProps, 'variant'>) {
  return <LoadingSpinner variant="file" className={className} {...props} />;
}

export function TerminalLoadingSpinner({ className, ...props }: Omit<LoadingSpinnerProps, 'variant'>) {
  return <LoadingSpinner variant="terminal" className={className} {...props} />;
}

// Loading overlay for specific areas
export function LoadingOverlay({ 
  isLoading, 
  children, 
  text = "Loading...",
  variant = 'default',
  className 
}: {
  isLoading: boolean;
  children: React.ReactNode;
  text?: string;
  variant?: LoadingSpinnerProps['variant'];
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center z-10">
          <LoadingSpinner variant={variant} text={text} />
        </div>
      )}
    </div>
  );
}

// Progress indicator for longer operations
export function ProgressIndicator({ 
  progress, 
  text, 
  className 
}: { 
  progress: number; 
  text?: string; 
  className?: string; 
}) {
  return (
    <div className={cn("w-full space-y-2", className)}>
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
      <div className="w-full bg-secondary rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground text-right">
        {Math.round(progress)}%
      </p>
    </div>
  );
}
