'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  SkipForward, 
  Copy, 
  Download,
  FileText,
  Code,
  Palette
} from 'lucide-react';
import { useLiveAIResponse } from '@/hooks/use-live-typing';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface LiveAIResponseProps {
  response: string;
  onCodeGenerated?: (filename: string, content: string, language: string) => void;
  onResponseComplete?: () => void;
  className?: string;
}

const getLanguageIcon = (language: string) => {
  switch (language.toLowerCase()) {
    case 'html':
      return <FileText className="w-4 h-4 text-orange-500" />;
    case 'css':
      return <Palette className="w-4 h-4 text-blue-500" />;
    case 'javascript':
    case 'js':
      return <Code className="w-4 h-4 text-yellow-500" />;
    case 'typescript':
    case 'ts':
      return <Code className="w-4 h-4 text-blue-600" />;
    default:
      return <Code className="w-4 h-4 text-gray-500" />;
  }
};

const getDefaultFilename = (language: string, index: number) => {
  switch (language.toLowerCase()) {
    case 'html':
      return index === 0 ? 'index.html' : `page${index + 1}.html`;
    case 'css':
      return index === 0 ? 'style.css' : `style${index + 1}.css`;
    case 'javascript':
    case 'js':
      return index === 0 ? 'script.js' : `script${index + 1}.js`;
    case 'typescript':
    case 'ts':
      return index === 0 ? 'main.ts' : `file${index + 1}.ts`;
    case 'json':
      return index === 0 ? 'data.json' : `data${index + 1}.json`;
    default:
      return `file${index + 1}.txt`;
  }
};

export default function LiveAIResponse({
  response,
  onCodeGenerated,
  onResponseComplete,
  className = ''
}: LiveAIResponseProps) {
  const {
    displayedResponse,
    isTyping,
    progress,
    codeBlocks,
    startResponse,
    skipToEnd,
    resetResponse
  } = useLiveAIResponse();

  const [hasStarted, setHasStarted] = useState(false);
  const [lastProcessedResponse, setLastProcessedResponse] = useState('');

  // Memoize the response completion callback
  const handleResponseComplete = useCallback(() => {
    onResponseComplete?.();
  }, [onResponseComplete]);

  // Start the response when it changes
  useEffect(() => {
    if (response && response !== lastProcessedResponse) {
      setHasStarted(true);
      setLastProcessedResponse(response);
      startResponse(response);
    }
  }, [response, lastProcessedResponse, startResponse]);

  // Handle completion
  useEffect(() => {
    if (!isTyping && hasStarted && displayedResponse) {
      handleResponseComplete();
    }
  }, [isTyping, hasStarted, displayedResponse, handleResponseComplete]);

  // Auto-generate files when code blocks are extracted
  useEffect(() => {
    if (codeBlocks.length > 0 && onCodeGenerated) {
      codeBlocks.forEach((block, index) => {
        const filename = block.filename || getDefaultFilename(block.language, index);
        onCodeGenerated(filename, block.code, block.language);
      });
    }
  }, [codeBlocks, onCodeGenerated]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const downloadAsFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!response) {
    return null;
  }

  return (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isTyping ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            AI Response
            {isTyping && <span className="text-sm font-normal text-gray-500">Generating...</span>}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {isTyping && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={skipToEnd}
                  title="Skip to end"
                >
                  <SkipForward className="w-4 h-4" />
                </Button>
                <div className="w-24">
                  <Progress value={progress} className="h-2" />
                </div>
              </>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(displayedResponse)}
              title="Copy response"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Response Text */}
        <div className="prose prose-sm max-w-none">
          <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
            {displayedResponse}
            {isTyping && (
              <span className="inline-block w-2 h-5 bg-blue-500 animate-pulse ml-1" />
            )}
          </div>
        </div>

        {/* Generated Code Blocks */}
        {codeBlocks.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Code className="w-4 h-4" />
              Generated Files ({codeBlocks.length})
            </div>
            
            {codeBlocks.map((block, index) => {
              const filename = block.filename || getDefaultFilename(block.language, index);
              
              return (
                <Card key={index} className="border border-gray-200">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getLanguageIcon(block.language)}
                        <span className="font-medium text-sm">{filename}</span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {block.language.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(block.code)}
                          title="Copy code"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadAsFile(block.code, filename)}
                          title="Download file"
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="pt-0">
                    <div className="relative">
                      <SyntaxHighlighter
                        language={block.language}
                        style={vscDarkPlus}
                        customStyle={{
                          margin: 0,
                          borderRadius: '6px',
                          fontSize: '13px',
                          lineHeight: '1.4'
                        }}
                        showLineNumbers
                      >
                        {block.code}
                      </SyntaxHighlighter>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
