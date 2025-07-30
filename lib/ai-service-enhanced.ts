import { AISettings, AI_PROVIDERS } from './ai-config';

export interface AIStreamResponse {
  content: string;
  isComplete: boolean;
  error?: string;
  metadata?: {
    tokens?: number;
    model?: string;
    provider?: string;
  };
}

export interface CodeFile {
  name: string;
  content: string;
  language: string;
  isActive: boolean;
}

export interface CodeGenerationEvent {
  type: 'file_created' | 'file_updated' | 'file_switched';
  file: CodeFile;
  files: CodeFile[];
}

export class AIServiceEnhanced {
  private settings: AISettings;
  private abortController: AbortController | null = null;
  private codeFiles: CodeFile[] = [];
  private currentFileIndex: number = 0;

  constructor(settings: AISettings) {
    this.settings = settings;
  }

  async streamResponse(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    onChunk: (chunk: AIStreamResponse) => void,
    onCodeEvent?: (event: CodeGenerationEvent) => void
  ): Promise<void> {
    // Cancel any ongoing request
    if (this.abortController) {
      this.abortController.abort();
    }

    this.abortController = new AbortController();

    try {
      const provider = AI_PROVIDERS.find(p => p.id === this.settings.provider);
      if (!provider) {
        throw new Error(`Unknown provider: ${this.settings.provider}`);
      }

      switch (this.settings.provider) {
        case 'openai':
          await this.streamOpenAI(messages, onChunk, onCodeEvent);
          break;
        case 'anthropic':
          await this.streamAnthropic(messages, onChunk, onCodeEvent);
          break;
        case 'groq':
          await this.streamGroq(messages, onChunk, onCodeEvent);
          break;
        default:
          throw new Error(`Provider ${this.settings.provider} not implemented`);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        onChunk({ content: '', isComplete: true, error: 'Request cancelled' });
      } else {
        onChunk({ 
          content: '', 
          isComplete: true, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }
  }

  private async streamOpenAI(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    onChunk: (chunk: AIStreamResponse) => void,
    onCodeEvent?: (event: CodeGenerationEvent) => void
  ): Promise<void> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.settings.apiKey}`,
      },
      body: JSON.stringify({
        model: this.settings.model,
        messages: [
          {
            role: 'system',
            content: `${this.settings.systemPrompt}

IMPORTANT: When generating code, follow these rules:
1. Detect when you're about to create a new file and use the format: [FILE:filename.ext]
2. For TypeScript files, use .ts extension
3. For TypeScript React files, use .tsx extension
4. For JavaScript files, use .js extension
5. For HTML files, use .html extension
6. For CSS files, use .css extension
7. After the [FILE:] marker, write the complete file content
8. You can create multiple files in one response
9. If you're not creating files, respond normally in the chat

Example:
[FILE:index.tsx]
import React from 'react';

export default function App() {
  return <div>Hello World</div>;
}

[FILE:styles.css]
body {
  margin: 0;
  padding: 20px;
}`
          },
          ...messages
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 4000,
      }),
      signal: this.abortController?.signal,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let currentFile: CodeFile | null = null;
    let isInFileMode = false;
    let accumulatedContent = '';
    let isInCodeBlock = false;
    let codeBlockLanguage = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            onChunk({ content: '', isComplete: true });
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content) {
              // Accumulate content for processing
              accumulatedContent += content;
              
              // Check for file creation markers
              if (content.includes('[FILE:')) {
                isInFileMode = true;
                const fileMatch = content.match(/\[FILE:([^\]]+)\]/);
                if (fileMatch) {
                  const fileName = fileMatch[1];
                  const language = this.getLanguageFromFileName(fileName);
                  
                  currentFile = {
                    name: fileName,
                    content: '',
                    language,
                    isActive: true
                  };

                  // Update existing files to inactive
                  this.codeFiles = this.codeFiles.map(f => ({ ...f, isActive: false }));
                  this.codeFiles.push(currentFile);
                  this.currentFileIndex = this.codeFiles.length - 1;

                  if (onCodeEvent) {
                    onCodeEvent({
                      type: 'file_created',
                      file: currentFile,
                      files: [...this.codeFiles]
                    });
                  }
                }
              } 
              // Check for markdown code block start
              else if (content.includes('```') && !isInFileMode && !isInCodeBlock) {
                isInCodeBlock = true;
                const langMatch = content.match(/```(\w+)?/);
                codeBlockLanguage = langMatch?.[1] || 'typescript';
                
                // Create a new file for the code block
                const fileName = this.generateFileName(codeBlockLanguage);
                currentFile = {
                  name: fileName,
                  content: '',
                  language: codeBlockLanguage,
                  isActive: true
                };

                // Update existing files to inactive
                this.codeFiles = this.codeFiles.map(f => ({ ...f, isActive: false }));
                this.codeFiles.push(currentFile);
                this.currentFileIndex = this.codeFiles.length - 1;

                if (onCodeEvent) {
                  onCodeEvent({
                    type: 'file_created',
                    file: currentFile,
                    files: [...this.codeFiles]
                  });
                }
              }
              // Check for markdown code block end
              else if (content.includes('```') && isInCodeBlock && currentFile) {
                isInCodeBlock = false;
                codeBlockLanguage = '';
                // Don't add the closing ``` to the file content
                const cleanContent = content.replace(/```.*$/, '');
                if (cleanContent) {
                  currentFile.content += cleanContent;
                  if (onCodeEvent) {
                    onCodeEvent({
                      type: 'file_updated',
                      file: currentFile,
                      files: [...this.codeFiles]
                    });
                  }
                }
              }
              // Append content to current file (either [FILE:] mode or code block mode)
              else if ((isInFileMode || isInCodeBlock) && currentFile) {
                currentFile.content += content;
                
                if (onCodeEvent) {
                  onCodeEvent({
                    type: 'file_updated',
                    file: currentFile,
                    files: [...this.codeFiles]
                  });
                }
              } 
              // Regular chat content
              else {
                onChunk({
                  content,
                  isComplete: false,
                  metadata: {
                    tokens: parsed.usage?.total_tokens,
                    model: this.settings.model,
                    provider: 'openai'
                  }
                });
              }
            }
          } catch (e) {
            console.warn('Failed to parse OpenAI stream data:', e);
          }
        }
      }
    }
  }

  private async streamAnthropic(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    onChunk: (chunk: AIStreamResponse) => void,
    onCodeEvent?: (event: CodeGenerationEvent) => void
  ): Promise<void> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.settings.apiKey || '',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: this.settings.model,
        messages: [
          {
            role: 'user',
            content: `${this.settings.systemPrompt}

IMPORTANT: When generating code, follow these rules:
1. Detect when you're about to create a new file and use the format: [FILE:filename.ext]
2. For TypeScript files, use .ts extension
3. For TypeScript React files, use .tsx extension
4. For JavaScript files, use .js extension
5. For HTML files, use .html extension
6. For CSS files, use .css extension
7. After the [FILE:] marker, write the complete file content
8. You can create multiple files in one response
9. If you're not creating files, respond normally in the chat

Example:
[FILE:index.tsx]
import React from 'react';

export default function App() {
  return <div>Hello World</div>;
}

[FILE:styles.css]
body {
  margin: 0;
  padding: 20px;
}`
          },
          ...messages
        ],
        stream: true,
        max_tokens: 4000,
      }),
      signal: this.abortController?.signal,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Anthropic API error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let currentFile: CodeFile | null = null;
    let isInFileMode = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            onChunk({ content: '', isComplete: true });
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.delta?.text || '';
            if (content) {
              // Check for file creation markers
              if (content.includes('[FILE:')) {
                isInFileMode = true;
                const fileMatch = content.match(/\[FILE:([^\]]+)\]/);
                if (fileMatch) {
                  const fileName = fileMatch[1];
                  const language = this.getLanguageFromFileName(fileName);
                  
                  currentFile = {
                    name: fileName,
                    content: '',
                    language,
                    isActive: true
                  };

                  // Update existing files to inactive
                  this.codeFiles = this.codeFiles.map(f => ({ ...f, isActive: false }));
                  this.codeFiles.push(currentFile);
                  this.currentFileIndex = this.codeFiles.length - 1;

                  if (onCodeEvent) {
                    onCodeEvent({
                      type: 'file_created',
                      file: currentFile,
                      files: [...this.codeFiles]
                    });
                  }
                }
              } else if (isInFileMode && currentFile) {
                // Append content to current file
                currentFile.content += content;
                
                if (onCodeEvent) {
                  onCodeEvent({
                    type: 'file_updated',
                    file: currentFile,
                    files: [...this.codeFiles]
                  });
                }
              } else {
                // Regular chat content
                onChunk({
                  content,
                  isComplete: false,
                  metadata: {
                    model: this.settings.model,
                    provider: 'anthropic'
                  }
                });
              }
            }
          } catch (e) {
            console.warn('Failed to parse Anthropic stream data:', e);
          }
        }
      }
    }
  }

  private async streamGroq(
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    onChunk: (chunk: AIStreamResponse) => void,
    onCodeEvent?: (event: CodeGenerationEvent) => void
  ): Promise<void> {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.settings.apiKey}`,
      },
      body: JSON.stringify({
        model: this.settings.model,
        messages: [
          {
            role: 'system',
            content: `${this.settings.systemPrompt}

IMPORTANT: When generating code, follow these rules:
1. Detect when you're about to create a new file and use the format: [FILE:filename.ext]
2. For TypeScript files, use .ts extension
3. For TypeScript React files, use .tsx extension
4. For JavaScript files, use .js extension
5. For HTML files, use .html extension
6. For CSS files, use .css extension
7. After the [FILE:] marker, write the complete file content
8. You can create multiple files in one response
9. If you're not creating files, respond normally in the chat

Example:
[FILE:index.tsx]
import React from 'react';

export default function App() {
  return <div>Hello World</div>;
}

[FILE:styles.css]
body {
  margin: 0;
  padding: 20px;
}`
          },
          ...messages
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 4000,
      }),
      signal: this.abortController?.signal,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Groq API error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let currentFile: CodeFile | null = null;
    let isInFileMode = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            onChunk({ content: '', isComplete: true });
            return;
          }

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content || '';
            if (content) {
              // Check for file creation markers
              if (content.includes('[FILE:')) {
                isInFileMode = true;
                const fileMatch = content.match(/\[FILE:([^\]]+)\]/);
                if (fileMatch) {
                  const fileName = fileMatch[1];
                  const language = this.getLanguageFromFileName(fileName);
                  
                  currentFile = {
                    name: fileName,
                    content: '',
                    language,
                    isActive: true
                  };

                  // Update existing files to inactive
                  this.codeFiles = this.codeFiles.map(f => ({ ...f, isActive: false }));
                  this.codeFiles.push(currentFile);
                  this.currentFileIndex = this.codeFiles.length - 1;

                  if (onCodeEvent) {
                    onCodeEvent({
                      type: 'file_created',
                      file: currentFile,
                      files: [...this.codeFiles]
                    });
                  }
                }
              } else if (isInFileMode && currentFile) {
                // Append content to current file
                currentFile.content += content;
                
                if (onCodeEvent) {
                  onCodeEvent({
                    type: 'file_updated',
                    file: currentFile,
                    files: [...this.codeFiles]
                  });
                }
              } else {
                // Regular chat content
                onChunk({
                  content,
                  isComplete: false,
                  metadata: {
                    tokens: parsed.usage?.total_tokens,
                    model: this.settings.model,
                    provider: 'groq'
                  }
                });
              }
            }
          } catch (e) {
            console.warn('Failed to parse Groq stream data:', e);
          }
        }
      }
    }
  }

  private getLanguageFromFileName(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
        return 'typescript';
      case 'tsx':
        return 'typescript';
      case 'js':
        return 'javascript';
      case 'jsx':
        return 'javascript';
      case 'html':
        return 'html';
      case 'css':
        return 'css';
      case 'json':
        return 'json';
      case 'md':
        return 'markdown';
      case 'py':
        return 'python';
      case 'java':
        return 'java';
      case 'cpp':
        return 'cpp';
      case 'c':
        return 'c';
      case 'php':
        return 'php';
      case 'rb':
        return 'ruby';
      case 'go':
        return 'go';
      case 'rs':
        return 'rust';
      case 'swift':
        return 'swift';
      case 'kt':
        return 'kotlin';
      default:
        return 'typescript';
    }
  }

  private generateFileName(language: string): string {
    const timestamp = Date.now();
    switch (language) {
      case 'typescript':
        return `component-${timestamp}.tsx`;
      case 'javascript':
        return `script-${timestamp}.js`;
      case 'html':
        return `page-${timestamp}.html`;
      case 'css':
        return `styles-${timestamp}.css`;
      case 'json':
        return `data-${timestamp}.json`;
      case 'python':
        return `script-${timestamp}.py`;
      default:
        return `file-${timestamp}.ts`;
    }
  }

  getCodeFiles(): CodeFile[] {
    return [...this.codeFiles];
  }

  setActiveFile(index: number): void {
    if (index >= 0 && index < this.codeFiles.length) {
      this.codeFiles = this.codeFiles.map((file, i) => ({
        ...file,
        isActive: i === index
      }));
      this.currentFileIndex = index;
    }
  }

  updateFileContent(index: number, content: string): void {
    if (index >= 0 && index < this.codeFiles.length) {
      this.codeFiles[index].content = content;
    }
  }

  clearCodeFiles(): void {
    this.codeFiles = [];
    this.currentFileIndex = 0;
  }

  cancelRequest(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  updateSettings(newSettings: AISettings): void {
    this.settings = newSettings;
  }
}
