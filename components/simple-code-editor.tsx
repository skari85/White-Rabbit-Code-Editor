'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-react';

interface SimpleCodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  theme?: string;
  height?: string | number;
  width?: string | number;
}

export default function SimpleCodeEditor({
  value,
  onChange,
  language = 'javascript',
  theme = 'vs-dark',
  height = '400px',
  width = '100%'
}: SimpleCodeEditorProps) {
  const isDark = theme.includes('dark');

  const containerStyle = {
    position: 'relative' as const,
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: isDark ? '#1f2937' : '#ffffff',
    height,
    width
  };

  const toolbarStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    borderBottom: '1px solid #e5e7eb',
    backgroundColor: isDark ? '#374151' : '#f9fafb'
  };

  const textareaStyle = {
    width: '100%',
    height: 'calc(100% - 40px)',
    padding: '16px',
    fontSize: '14px',
    fontFamily: '"Monaco", "Menlo", "Ubuntu Mono", monospace',
    resize: 'none' as const,
    border: 'none',
    outline: 'none',
    backgroundColor: isDark ? '#1f2937' : '#ffffff',
    color: isDark ? '#f3f4f6' : '#1f2937'
  };

  return (
    <div style={containerStyle}>
      {/* Simple toolbar */}
      <div style={toolbarStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', color: isDark ? '#9ca3af' : '#6b7280' }}>
            Language: {language}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Button
            variant="ghost"
            size="sm"
            style={{ height: '28px', width: '28px', padding: 0 }}
            title="Theme toggle"
            disabled
          >
            {isDark ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
          </Button>
        </div>
      </div>

      {/* Simple textarea editor */}
      <textarea
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        style={textareaStyle}
        placeholder={`Enter your ${language} code here...`}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        data-gramm="false"
      />
    </div>
  );
}
