'use client';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { useAIEditorActions } from '@/hooks/use-ai-editor-actions';
import { 
  Sparkles, 
  RefreshCw, 
  Bug, 
  Code, 
  FileText, 
  FileCode,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

interface AIEditorContextMenuProps {
  children: React.ReactNode;
  selectedText?: string;
  fullFileContent?: string;
  fileName?: string;
  language?: string;
  errorMessage?: string;
  onCodeGenerated?: (code: string) => void;
  onCodeReplaced?: (code: string) => void;
}

export function AIEditorContextMenu({
  children,
  selectedText,
  fullFileContent,
  fileName,
  language,
  errorMessage,
  onCodeGenerated,
  onCodeReplaced,
}: AIEditorContextMenuProps) {
  const {
    explainCode,
    refactorSelection,
    fixError,
    generateFunction,
    generateFile,
    documentCode,
    loading,
  } = useAIEditorActions();

  const handleAction = async (
    action: () => Promise<string | null>,
    actionName: string
  ) => {
    const result = await action();
    if (result) {
      toast.success(`${actionName} completed`);
      if (onCodeGenerated) {
        onCodeGenerated(result);
      }
    }
  };

  const handleReplaceAction = async (
    action: () => Promise<string | null>,
    actionName: string
  ) => {
    const result = await action();
    if (result) {
      toast.success(`${actionName} completed`);
      if (onCodeReplaced) {
        onCodeReplaced(result);
      }
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        <ContextMenuItem
          onClick={() => handleAction(
            () => explainCode({ selectedText, fullFileContent, fileName, language }),
            'Explanation'
          )}
          disabled={loading || (!selectedText && !fullFileContent)}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Explain Code
        </ContextMenuItem>
        
        <ContextMenuItem
          onClick={() => handleReplaceAction(
            () => refactorSelection({ selectedText, fullFileContent, fileName, language }),
            'Refactoring'
          )}
          disabled={loading || (!selectedText && !fullFileContent)}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refactor Selection
        </ContextMenuItem>

        {errorMessage && (
          <ContextMenuItem
            onClick={() => handleReplaceAction(
              () => fixError({ selectedText, fullFileContent, fileName, language, errorMessage }),
              'Error fix'
            )}
            disabled={loading}
          >
            <Bug className="w-4 h-4 mr-2" />
            Fix Error
          </ContextMenuItem>
        )}

        <ContextMenuSeparator />

        <ContextMenuItem
          onClick={() => handleAction(
            () => generateFunction({ selectedText, fullFileContent, fileName, language }),
            'Function generation'
          )}
          disabled={loading}
        >
          <Code className="w-4 h-4 mr-2" />
          Generate Function
        </ContextMenuItem>

        <ContextMenuItem
          onClick={() => handleAction(
            () => generateFile({ selectedText, fullFileContent, fileName, language }),
            'File generation'
          )}
          disabled={loading}
        >
          <FileText className="w-4 h-4 mr-2" />
          Generate File
        </ContextMenuItem>

        <ContextMenuItem
          onClick={() => handleReplaceAction(
            () => documentCode({ selectedText, fullFileContent, fileName, language }),
            'Documentation'
          )}
          disabled={loading || (!selectedText && !fullFileContent)}
        >
          <FileCode className="w-4 h-4 mr-2" />
          Document This
        </ContextMenuItem>

        {loading && (
          <>
            <ContextMenuSeparator />
            <ContextMenuItem disabled>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}
