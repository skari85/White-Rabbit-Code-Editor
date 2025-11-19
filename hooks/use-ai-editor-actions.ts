import { useState, useCallback } from 'react';
import { getAIClient, AIClientOptions } from '@/lib/ai-client';
import { toast } from 'sonner';

export interface EditorActionContext {
  selectedText?: string;
  fullFileContent?: string;
  fileName?: string;
  language?: string;
  errorMessage?: string;
  cursorPosition?: { line: number; column: number };
}

export interface UseAIEditorActionsReturn {
  explainCode: (context: EditorActionContext) => Promise<string | null>;
  refactorSelection: (context: EditorActionContext) => Promise<string | null>;
  fixError: (context: EditorActionContext) => Promise<string | null>;
  generateFunction: (context: EditorActionContext, functionName?: string) => Promise<string | null>;
  generateFile: (context: EditorActionContext, fileName?: string) => Promise<string | null>;
  documentCode: (context: EditorActionContext) => Promise<string | null>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook for AI-powered editor actions
 * All requests go directly from browser → AI provider
 */
export function useAIEditorActions(): UseAIEditorActionsReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeAction = useCallback(async (
    prompt: string,
    options?: AIClientOptions
  ): Promise<string | null> => {
    const client = getAIClient();

    if (!client.isConfigured()) {
      const errorMsg = 'AI provider not configured. Please set up your API key in settings.';
      toast.error(errorMsg);
      setError(errorMsg);
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await client.send(prompt, options);
      return response.content;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'AI request failed';
      console.error('AI action error:', err);
      
      // Check for common errors
      if (errorMessage.includes('API key') || errorMessage.includes('authentication') || errorMessage.includes('401')) {
        toast.error('Authentication failed', {
          description: 'Please check your API key in settings',
          action: {
            label: 'Open Settings',
            onClick: () => {
              // Trigger settings open (can be handled by parent)
              window.dispatchEvent(new CustomEvent('open-ai-settings'));
            },
          },
        });
      } else if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        toast.error('Rate limit exceeded', {
          description: 'Please try again later or switch providers',
          action: {
            label: 'Switch Provider',
            onClick: () => {
              window.dispatchEvent(new CustomEvent('open-ai-settings'));
            },
          },
        });
      } else if (errorMessage.includes('model') || errorMessage.includes('404')) {
        toast.error('Model not found', {
          description: 'Please check your model selection in settings',
          action: {
            label: 'Open Settings',
            onClick: () => {
              window.dispatchEvent(new CustomEvent('open-ai-settings'));
            },
          },
        });
      } else {
        toast.error('AI request failed', {
          description: errorMessage,
          action: {
            label: 'Open Settings',
            onClick: () => {
              window.dispatchEvent(new CustomEvent('open-ai-settings'));
            },
          },
        });
      }

      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const explainCode = useCallback(async (context: EditorActionContext): Promise<string | null> => {
    const code = context.selectedText || context.fullFileContent || '';
    if (!code.trim()) {
      toast.error('No code selected');
      return null;
    }

    const language = context.language || 'code';
    const prompt = `Explain the following ${language} code in detail. Break down what it does, how it works, and any important concepts:

\`\`\`${language}
${code}
\`\`\`

Provide a clear, comprehensive explanation.`;

    return executeAction(prompt);
  }, [executeAction]);

  const refactorSelection = useCallback(async (context: EditorActionContext): Promise<string | null> => {
    const code = context.selectedText || context.fullFileContent || '';
    if (!code.trim()) {
      toast.error('No code selected');
      return null;
    }

    const language = context.language || 'javascript';
    const prompt = `Refactor the following ${language} code to make it cleaner, more maintainable, and follow best practices. Return only the refactored code without explanations:

\`\`\`${language}
${code}
\`\`\`

Refactored code:`;

    return executeAction(prompt, { temperature: 0.3 });
  }, [executeAction]);

  const fixError = useCallback(async (context: EditorActionContext): Promise<string | null> => {
    const code = context.selectedText || context.fullFileContent || '';
    const errorMsg = context.errorMessage || 'There is an error in this code';
    
    if (!code.trim()) {
      toast.error('No code selected');
      return null;
    }

    const language = context.language || 'javascript';
    const prompt = `Fix the error in the following ${language} code. The error is: "${errorMsg}"

\`\`\`${language}
${code}
\`\`\`

Return only the fixed code without explanations:`;

    return executeAction(prompt, { temperature: 0.2 });
  }, [executeAction]);

  const generateFunction = useCallback(async (
    context: EditorActionContext,
    functionName?: string
  ): Promise<string | null> => {
    const language = context.language || 'javascript';
    const name = functionName || 'newFunction';
    const surroundingCode = context.fullFileContent || '';
    
    const prompt = `Generate a ${language} function named "${name}". 

${context.selectedText ? `Requirements:\n${context.selectedText}\n\n` : ''}
${surroundingCode ? `Surrounding code context:\n\`\`\`${language}\n${surroundingCode}\n\`\`\`\n\n` : ''}
Return only the function code without explanations, following the style and patterns of the surrounding code:`;

    return executeAction(prompt, { temperature: 0.7 });
  }, [executeAction]);

  const generateFile = useCallback(async (
    context: EditorActionContext,
    fileName?: string
  ): Promise<string | null> => {
    const language = context.language || 'javascript';
    const name = fileName || 'new-file';
    const extension = name.split('.').pop() || language;
    
    const prompt = `Generate a complete ${extension} file named "${name}".

${context.selectedText ? `Requirements:\n${context.selectedText}\n\n` : ''}
${context.fullFileContent ? `Reference code:\n\`\`\`${language}\n${context.fullFileContent}\n\`\`\`\n\n` : ''}
Return only the complete file code without explanations:`;

    return executeAction(prompt, { temperature: 0.7, maxTokens: 4000 });
  }, [executeAction]);

  const documentCode = useCallback(async (context: EditorActionContext): Promise<string | null> => {
    const code = context.selectedText || context.fullFileContent || '';
    if (!code.trim()) {
      toast.error('No code selected');
      return null;
    }

    const language = context.language || 'javascript';
    const prompt = `Add comprehensive documentation (comments, JSDoc, etc.) to the following ${language} code. Return the code with documentation added:

\`\`\`${language}
${code}
\`\`\`

Documented code:`;

    return executeAction(prompt, { temperature: 0.3 });
  }, [executeAction]);

  return {
    explainCode,
    refactorSelection,
    fixError,
    generateFunction,
    generateFile,
    documentCode,
    loading,
    error,
  };
}
