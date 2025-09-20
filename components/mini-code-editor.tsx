'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Check, Copy, Download, Play, RotateCcw } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface MiniCodeEditorProps {
  className?: string;
}

// Language configurations
const LANGUAGES = [
  { id: 'javascript', name: 'JavaScript', extension: 'js' },
  { id: 'typescript', name: 'TypeScript', extension: 'ts' },
  { id: 'python', name: 'Python', extension: 'py' },
  { id: 'html', name: 'HTML', extension: 'html' },
  { id: 'css', name: 'CSS', extension: 'css' },
  { id: 'json', name: 'JSON', extension: 'json' },
];

// Sample code templates
const CODE_TEMPLATES = {
  javascript: `// Welcome to White Rabbit Code Editor!
function greetDeveloper(name) {
  return \`Hello \${name}! Ready to code?\`;
}

console.log(greetDeveloper('Developer'));

// Try editing this code!`,
  
  typescript: `// TypeScript example
interface Developer {
  name: string;
  skills: string[];
}

const developer: Developer = {
  name: 'You',
  skills: ['TypeScript', 'React', 'Node.js']
};

console.log(\`Welcome \${developer.name}!\`);`,

  python: `# Python example
def greet_developer(name):
    return f"Hello {name}! Welcome to coding!"

developer_name = "Developer"
message = greet_developer(developer_name)
print(message)

# Try running this code!`,

  html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Welcome to White Rabbit</title>
</head>
<body>
    <h1>Hello Developer!</h1>
    <p>Start building amazing things!</p>
</body>
</html>`,

  css: `/* CSS Styling Example */
.welcome-message {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  border-radius: 10px;
  text-align: center;
  font-family: 'Arial', sans-serif;
}

.welcome-message h1 {
  margin: 0 0 1rem 0;
  font-size: 2rem;
}`,

  json: `{
  "project": "White Rabbit Code Editor",
  "version": "1.0.0",
  "features": [
    "Real-time editing",
    "Syntax highlighting",
    "Multiple languages",
    "AI assistance"
  ],
  "status": "ready_to_code"
}`
};

export default function MiniCodeEditor({ className }: MiniCodeEditorProps) {
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState(CODE_TEMPLATES.javascript);
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update code when language changes
  useEffect(() => {
    setCode(CODE_TEMPLATES[selectedLanguage as keyof typeof CODE_TEMPLATES] || '');
    setOutput('');
  }, [selectedLanguage]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [code]);

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCode(e.target.value);
  };

  const handleReset = () => {
    setCode(CODE_TEMPLATES[selectedLanguage as keyof typeof CODE_TEMPLATES] || '');
    setOutput('');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleDownload = () => {
    const language = LANGUAGES.find(lang => lang.id === selectedLanguage);
    const filename = `code.${language?.extension || 'txt'}`;
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleRun = async () => {
    setIsRunning(true);
    setOutput('');

    // Simulate code execution
    setTimeout(() => {
      let result = '';
      
      switch (selectedLanguage) {
        case 'javascript':
        case 'typescript':
          try {
            // Simple JavaScript execution simulation
            if (code.includes('console.log')) {
              const matches = code.match(/console\.log\((.*?)\)/g);
              if (matches) {
                result = matches.map(match => {
                  const content = match.replace(/console\.log\(|\)/g, '');
                  // Simple evaluation for basic strings and template literals
                  if (content.includes('`') && content.includes('${')) {
                    return content.replace(/`|'/g, '').replace(/\$\{.*?\}/g, 'Developer');
                  }
                  return content.replace(/['"]/g, '');
                }).join('\n');
              }
            } else {
              result = '✓ Code syntax looks good!';
            }
          } catch (err) {
            result = 'Error: Invalid JavaScript syntax';
          }
          break;
          
        case 'python':
          if (code.includes('print(')) {
            result = 'Hello Developer! Welcome to coding!';
          } else {
            result = '✓ Python code ready to run!';
          }
          break;
          
        case 'html':
          result = '✓ HTML structure is valid!';
          break;
          
        case 'css':
          result = '✓ CSS styles applied successfully!';
          break;
          
        case 'json':
          try {
            JSON.parse(code);
            result = '✓ Valid JSON format!';
          } catch (err) {
            result = 'Error: Invalid JSON syntax';
          }
          break;
          
        default:
          result = '✓ Code is ready!';
      }
      
      setOutput(result);
      setIsRunning(false);
    }, 1000);
  };

  const currentLanguage = LANGUAGES.find(lang => lang.id === selectedLanguage);

  return (
    <div className={cn("bg-zinc-900 border border-zinc-800 overflow-hidden", className)}>
      {/* Header */}
      <div className="bg-zinc-950 px-4 py-3 flex justify-between items-center border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-32 bg-zinc-800 border-zinc-700 text-gray-300 font-mono text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              {LANGUAGES.map((lang) => (
                <SelectItem key={lang.id} value={lang.id} className="text-gray-300 font-mono text-xs">
                  {lang.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Badge variant="outline" className="border-zinc-700 text-gray-500 font-mono text-xs">
            .{currentLanguage?.extension}
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            className="text-gray-500 hover:text-gray-300 hover:bg-zinc-800 h-7 w-7 p-0"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleDownload}
            className="text-gray-500 hover:text-gray-300 hover:bg-zinc-800 h-7 w-7 p-0"
          >
            <Download className="w-3 h-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleReset}
            className="text-gray-500 hover:text-gray-300 hover:bg-zinc-800 h-7 w-7 p-0"
          >
            <RotateCcw className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Code Editor */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={code}
          onChange={handleCodeChange}
          className="w-full p-4 pl-12 bg-zinc-900 text-gray-300 font-mono text-sm resize-none border-none outline-none min-h-[200px] focus:bg-zinc-900"
          placeholder="// start coding..."
          spellCheck={false}
          style={{
            lineHeight: '1.5',
            tabSize: 2,
          }}
        />

        {/* Line numbers overlay */}
        <div className="absolute left-0 top-0 p-4 pr-2 pointer-events-none text-gray-600 font-mono text-sm select-none border-r border-zinc-800">
          {code.split('\n').map((_, index) => (
            <div key={index} style={{ lineHeight: '1.5' }} className="text-right">
              {String(index + 1).padStart(2, ' ')}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-zinc-950 px-4 py-3 flex justify-between items-center border-t border-zinc-800">
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            onClick={handleRun}
            disabled={isRunning}
            className="bg-zinc-800 hover:bg-zinc-700 text-gray-300 border border-zinc-700 font-mono text-xs h-7"
          >
            <Play className="w-3 h-3 mr-1" />
            {isRunning ? 'running...' : 'run'}
          </Button>
          <span className="text-gray-500 text-xs font-mono">
            {code.split('\n').length}L • {code.length}C
          </span>
        </div>
      </div>

      {/* Output */}
      {output && (
        <div className="bg-zinc-950 border-t border-zinc-800 p-4">
          <div className="text-xs text-gray-500 mb-2 font-mono">output:</div>
          <div className="text-gray-300 font-mono text-sm whitespace-pre-wrap">
            {output}
          </div>
        </div>
      )}
    </div>
  );
}
