import React, { useState } from "react";
import SyntaxHighlighter from 'react-syntax-highlighter';
import { darcula, github } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { Copy, Check, Eye, EyeOff } from 'lucide-react';

interface CodeBlock {
  code: string;
  lang?: string;
  messageId?: string;
}

interface AICodeSpaceProps {
  codeBlocks: CodeBlock[];
  personality?: 'hex' | 'kex';
}

export function AICodeSpace({ codeBlocks, personality }: AICodeSpaceProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const selected = codeBlocks[selectedIdx] || codeBlocks[0];
  
  // Determine if KEX mode is active
  const isKex = personality === 'kex';

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  // Enhanced White Rabbit themed color scheme
  const whiteRabbitStyle = {
    ...darcula,
    'pre[class*="language-"]': {
      ...darcula['pre[class*="language-"]'],
      background: isKex ? '#0F1419' : '#0d1117',
      borderRadius: '8px',
      border: isKex ? '2px solid #00ffe1' : '1px solid #30363d',
      boxShadow: isKex ? '0 0 20px #00ffe155' : '0 4px 12px rgba(0, 0, 0, 0.3)',
    },
    'code[class*="language-"]': {
      ...darcula['code[class*="language-"]'],
      color: isKex ? '#BFBDB6' : '#e6edf3',
      fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, monospace',
      fontSize: '14px',
      lineHeight: '1.5',
    },
    // Enhanced syntax highlighting for White Rabbit
    '.token.keyword': {
      color: isKex ? '#00FFE1' : '#569CD6',
      fontWeight: 'bold'
    },
    '.token.string': {
      color: isKex ? '#CE9178' : '#a5d6ff'
    },
    '.token.function': { 
      color: isKex ? '#DCDCAA' : '#d2a8ff' 
    },
    '.token.number': { 
      color: isKex ? '#B5CEA8' : '#79c0ff' 
    },
    '.token.operator': { 
      color: isKex ? '#00D4AA' : '#ff7b72' 
    },
    '.token.comment': { 
      color: isKex ? '#6A9955' : '#8b949e', 
      fontStyle: 'italic' 
    },
    '.token.variable': { 
      color: isKex ? '#9CDCFE' : '#ffa657' 
    },
    '.token.class-name': { 
      color: isKex ? '#4EC9B0' : '#f0883e' 
    },
    '.token.builtin': { 
      color: isKex ? '#4FC1FF' : '#f69d50' 
    },
    '.token.boolean': { 
      color: isKex ? '#569CD6' : '#79c0ff' 
    },
    '.token.punctuation': { 
      color: isKex ? '#D4D4D4' : '#e6edf3' 
    },
    '.token.property': { 
      color: isKex ? '#9CDCFE' : '#79c0ff' 
    },
    '.token.tag': { 
      color: isKex ? '#569CD6' : '#7ee787' 
    },
    '.token.attr-name': { 
      color: isKex ? '#92C5F8' : '#79c0ff' 
    },
    '.token.attr-value': { 
      color: isKex ? '#CE9178' : '#a5d6ff' 
    },
    '.token.selector': { 
      color: isKex ? '#D7BA7D' : '#ffa657' 
    },
    '.token.important': { 
      color: isKex ? '#569CD6' : '#ff7b72',
      fontWeight: 'bold'
    },
    '.token.regex': { 
      color: isKex ? '#D16969' : '#7ee787' 
    },
    '.token.constant': { 
      color: isKex ? '#4FC1FF' : '#79c0ff' 
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Enhanced Tab header */}
      <div className={`flex gap-1 border-b px-2 py-1 overflow-x-auto ${
        isKex 
          ? 'bg-gray-900 border-[#00ffe1]' 
          : 'bg-gray-800 border-gray-700'
      }`}>
        {codeBlocks.map((block, idx) => (
          <button
            key={idx}
            className={`px-3 py-1 rounded-t text-xs font-mono border-b-2 focus:outline-none transition-all duration-200 ${
              idx === selectedIdx 
                ? isKex
                  ? 'border-[#00ffe1] bg-gray-800 text-[#00ffe1] shadow-md'
                  : 'border-blue-500 bg-gray-700 text-blue-400 shadow-md'
                : isKex
                  ? 'border-transparent bg-gray-800 text-gray-400 hover:text-[#00d4aa] hover:bg-gray-750'
                  : 'border-transparent bg-gray-800 text-gray-400 hover:text-gray-300 hover:bg-gray-700'
            }`}
            onClick={() => setSelectedIdx(idx)}
          >
            <span className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${
                isKex ? 'bg-[#00ffe1]' : 'bg-blue-400'
              }`} />
              {block.lang || 'text'} {block.messageId ? `#${block.messageId.slice(0, 6)}` : `#${idx + 1}`}
            </span>
          </button>
        ))}
        
        {/* Theme toggle and copy button */}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => setIsDarkTheme(!isDarkTheme)}
            className={`p-1 rounded text-xs transition-colors ${
              isKex 
                ? 'text-gray-400 hover:text-[#00ffe1]'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            title="Toggle theme"
          >
            {isDarkTheme ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          </button>
          {selected && (
            <button
              onClick={() => copyToClipboard(selected.code)}
              className={`p-1 rounded text-xs transition-colors ${
                isKex 
                  ? 'text-gray-400 hover:text-[#00ffe1]'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              title="Copy code"
            >
              {copiedCode === selected.code ? (
                <Check className="w-3 h-3 text-green-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          )}
        </div>
      </div>
      
      {/* Enhanced Code block with Hex/Kex styling */}
      <div className={`flex-1 overflow-auto ${
        isKex ? 'bg-[#0F1419]' : 'bg-[#0d1117]'
      }`}>
        {selected && (
          <div className="relative">
            <SyntaxHighlighter
              language={selected.lang || 'javascript'}
              style={isDarkTheme ? whiteRabbitStyle : github}
              showLineNumbers={true}
              lineNumberStyle={{
                minWidth: '3em',
                paddingRight: '1em',
                color: isKex ? '#495162' : '#6e7681',
                backgroundColor: isKex ? '#0F1419' : '#0d1117',
                borderRight: isKex ? '1px solid #00ffe120' : '1px solid #30363d',
                textAlign: 'right',
                userSelect: 'none',
                fontSize: '12px',
                fontFamily: '"JetBrains Mono", "Fira Code", monospace',
              }}
              customStyle={{
                background: isKex ? '#0F1419' : '#0d1117',
                margin: 0,
                padding: '1rem',
                fontSize: '14px',
                fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, monospace',
                lineHeight: '1.5',
                border: isKex ? '1px solid #00ffe120' : '1px solid #21262d',
                borderRadius: '8px',
                boxShadow: isKex ? '0 0 15px #00ffe110' : 'none',
                minHeight: '200px',
              }}
              codeTagProps={{
                style: {
                  fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", Consolas, monospace',
                  fontSize: '14px',
                  lineHeight: '1.5',
                }
              }}
              wrapLines={true}
              wrapLongLines={true}
            >
              {selected.code}
            </SyntaxHighlighter>
            
            {/* Hex/Kex enhancement effects */}
            {isKex && (
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(135deg, transparent 0%, rgba(0, 255, 225, 0.02) 50%, transparent 100%)',
                  borderRadius: '8px',
                }}
              />
            )}
          </div>
        )}
        
        {!selected && (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                isKex ? 'bg-[#00ffe1] text-black' : 'bg-gray-700 text-gray-400'
              }`}>
                <span className="text-lg font-mono">&lt;/&gt;</span>
              </div>
              <p className="text-sm">Ready for AI Code Generation</p>
              <p className="text-xs text-gray-600 mt-1">
                {isKex 
                  ? 'KEX is ready to glitch some code! Ask for any programming task.' 
                  : 'Ask the AI to generate code and it will appear here with syntax highlighting!'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
