import React, { useState } from "react";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeBlock {
  code: string;
  lang?: string;
  messageId?: string;
}

interface AICodeSpaceProps {
  codeBlocks: CodeBlock[];
}

export function AICodeSpace({ codeBlocks }: AICodeSpaceProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const selected = codeBlocks[selectedIdx] || codeBlocks[0];

  return (
    <div className="flex flex-col h-full">
      {/* Tab header */}
      <div className="flex gap-1 border-b bg-gray-200 px-2 py-1 overflow-x-auto">
        {codeBlocks.map((block, idx) => (
          <button
            key={idx}
            className={`px-3 py-1 rounded-t text-xs font-mono border-b-2 focus:outline-none ${
              idx === selectedIdx ? 'border-blue-500 bg-white' : 'border-transparent bg-gray-100 text-gray-500'
            }`}
            onClick={() => setSelectedIdx(idx)}
          >
            {block.lang || 'text'} {block.messageId ? `#${block.messageId}` : ''}
          </button>
        ))}
      </div>
      {/* Code block */}
      <div className="flex-1 overflow-auto bg-white p-2">
        {selected && (
          <SyntaxHighlighter
            language={selected.lang || 'javascript'}
            style={oneDark}
            showLineNumbers
            customStyle={{
              background: '#fff',
              borderRadius: '0.5rem',
              fontSize: 14,
              margin: 0,
              padding: '1rem',
              overflowX: 'auto',
              minHeight: '3rem',
            }}
            codeTagProps={{ style: { fontFamily: 'var(--font-mono, monospace)' } }}
          >
            {selected.code}
          </SyntaxHighlighter>
        )}
      </div>
    </div>
  );
}
