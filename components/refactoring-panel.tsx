'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  RefreshCw, 
  Wand2, 
  Code, 
  FileText,
  AlertTriangle,
  CheckCircle,
  X,
  Eye,
  Play,
  Undo,
  Settings
} from 'lucide-react';
import { RefactoringOperation, RefactoringContext, ExtractMethodOptions, RenameOptions } from '@/lib/refactoring-service';
import { toast } from 'sonner';

interface RefactoringPanelProps {
  context: RefactoringContext;
  availableRefactorings: RefactoringOperation[];
  isLoading: boolean;
  onRefresh: () => void;
  onExecuteRefactoring: (operation: RefactoringOperation, options?: any) => Promise<void>;
  onPreviewRefactoring: (operation: RefactoringOperation) => Promise<Map<string, { before: string; after: string }>>;
  onClose: () => void;
  className?: string;
}

const RefactoringPanel: React.FC<RefactoringPanelProps> = ({
  context,
  availableRefactorings,
  isLoading,
  onRefresh,
  onExecuteRefactoring,
  onPreviewRefactoring,
  onClose,
  className = ''
}) => {
  const [selectedOperation, setSelectedOperation] = useState<RefactoringOperation | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [renameOptions, setRenameOptions] = useState<RenameOptions>({ newName: '' });
  const [extractMethodOptions, setExtractMethodOptions] = useState<ExtractMethodOptions>({
    methodName: 'extractedMethod',
    parameters: []
  });
  const [preview, setPreview] = useState<Map<string, { before: string; after: string }> | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Group refactorings by type
  const groupedRefactorings = useMemo(() => {
    const groups: Record<string, RefactoringOperation[]> = {};
    availableRefactorings.forEach(op => {
      if (!groups[op.type]) groups[op.type] = [];
      groups[op.type].push(op);
    });
    return groups;
  }, [availableRefactorings]);

  // Get icon for refactoring type
  const getRefactoringIcon = (type: string) => {
    switch (type) {
      case 'rename': return '✏️';
      case 'extract-method': return '🔧';
      case 'extract-variable': return '📦';
      case 'inline': return '📥';
      case 'convert-function': return '🔄';
      case 'move-file': return '📁';
      default: return '⚙️';
    }
  };

  // Handle operation selection
  const handleSelectOperation = useCallback((operation: RefactoringOperation) => {
    setSelectedOperation(operation);
    setShowOptions(operation.type === 'rename' || operation.type === 'extract-method');
    setShowPreview(false);
    setPreview(null);

    // Set default options based on operation type
    if (operation.type === 'rename' && context.symbol) {
      setRenameOptions({ newName: context.symbol });
    } else if (operation.type === 'extract-method') {
      setExtractMethodOptions({
        methodName: 'extractedMethod',
        parameters: []
      });
    }
  }, [context.symbol]);

  // Handle preview
  const handlePreview = useCallback(async () => {
    if (!selectedOperation) return;

    try {
      const previewData = await onPreviewRefactoring(selectedOperation);
      setPreview(previewData);
      setShowPreview(true);
    } catch (error) {
      toast.error('Failed to generate preview');
      console.error('Preview error:', error);
    }
  }, [selectedOperation, onPreviewRefactoring]);

  // Handle execution
  const handleExecute = useCallback(async () => {
    if (!selectedOperation) return;

    try {
      let options: any = undefined;
      
      if (selectedOperation.type === 'rename') {
        if (!renameOptions.newName.trim()) {
          toast.error('Please enter a new name');
          return;
        }
        options = renameOptions;
      } else if (selectedOperation.type === 'extract-method') {
        if (!extractMethodOptions.methodName.trim()) {
          toast.error('Please enter a method name');
          return;
        }
        options = extractMethodOptions;
      }

      await onExecuteRefactoring(selectedOperation, options);
      toast.success(`Refactoring "${selectedOperation.title}" applied successfully`);
      setSelectedOperation(null);
      setShowOptions(false);
      setShowPreview(false);
    } catch (error) {
      toast.error('Refactoring failed');
      console.error('Refactoring error:', error);
    }
  }, [selectedOperation, renameOptions, extractMethodOptions, onExecuteRefactoring]);

  // Render refactoring operation
  const renderOperation = (operation: RefactoringOperation) => (
    <div
      key={operation.id}
      className={`flex items-start gap-3 p-3 border rounded cursor-pointer transition-colors ${
        selectedOperation?.id === operation.id
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-200 hover:bg-gray-50'
      }`}
      onClick={() => handleSelectOperation(operation)}
    >
      <div className="flex-shrink-0 mt-1">
        <span className="text-lg">{getRefactoringIcon(operation.type)}</span>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm text-gray-900">
            {operation.title}
          </span>
          <Badge variant={operation.safe ? 'default' : 'destructive'} className="text-xs">
            {operation.safe ? 'Safe' : 'Advanced'}
          </Badge>
          {operation.reversible && (
            <Badge variant="outline" className="text-xs">
              <Undo className="w-3 h-3 mr-1" />
              Reversible
            </Badge>
          )}
        </div>
        
        <p className="text-xs text-gray-600 mb-2">
          {operation.description}
        </p>
        
        {operation.preview && (
          <code className="text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded block">
            {operation.preview}
          </code>
        )}
      </div>
      
      <div className="flex-shrink-0">
        {operation.safe ? (
          <CheckCircle className="w-4 h-4 text-green-500" />
        ) : (
          <AlertTriangle className="w-4 h-4 text-yellow-500" />
        )}
      </div>
    </div>
  );

  // Render options form
  const renderOptionsForm = () => {
    if (!selectedOperation || !showOptions) return null;

    if (selectedOperation.type === 'rename') {
      return (
        <div className="space-y-3">
          <div>
            <Label htmlFor="newName">New Name</Label>
            <Input
              id="newName"
              value={renameOptions.newName || ''}
              onChange={(e) => setRenameOptions({ ...renameOptions, newName: e.target.value })}
              placeholder="Enter new name"
              className="mt-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="updateComments"
              checked={renameOptions.updateComments || false}
              onChange={(e) => setRenameOptions({ ...renameOptions, updateComments: e.target.checked })}
            />
            <Label htmlFor="updateComments" className="text-sm">Update comments</Label>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="updateStrings"
              checked={renameOptions.updateStrings || false}
              onChange={(e) => setRenameOptions({ ...renameOptions, updateStrings: e.target.checked })}
            />
            <Label htmlFor="updateStrings" className="text-sm">Update strings</Label>
          </div>
        </div>
      );
    }

    if (selectedOperation.type === 'extract-method') {
      return (
        <div className="space-y-3">
          <div>
            <Label htmlFor="methodName">Method Name</Label>
            <Input
              id="methodName"
              value={extractMethodOptions.methodName || ''}
              onChange={(e) => setExtractMethodOptions({ ...extractMethodOptions, methodName: e.target.value })}
              placeholder="Enter method name"
              className="mt-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isAsync"
              checked={extractMethodOptions.isAsync || false}
              onChange={(e) => setExtractMethodOptions({ ...extractMethodOptions, isAsync: e.target.checked })}
            />
            <Label htmlFor="isAsync" className="text-sm">Async method</Label>
          </div>
          <div>
            <Label htmlFor="visibility">Visibility</Label>
            <select
              id="visibility"
              value={extractMethodOptions.visibility || 'public'}
              onChange={(e) => setExtractMethodOptions({ 
                ...extractMethodOptions, 
                visibility: e.target.value as 'public' | 'private' | 'protected'
              })}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="protected">Protected</option>
            </select>
          </div>
        </div>
      );
    }

    return null;
  };

  // Render preview
  const renderPreview = () => {
    if (!showPreview || !preview) return null;

    return (
      <div className="space-y-3">
        <h4 className="font-medium text-sm">Preview Changes</h4>
        {Array.from(preview.entries()).map(([fileName, { before, after }]) => (
          <div key={fileName} className="border rounded">
            <div className="bg-gray-50 px-3 py-2 border-b">
              <span className="text-sm font-medium">{fileName}</span>
            </div>
            <div className="p-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-red-600 font-medium mb-1">Before</div>
                  <pre className="bg-red-50 p-2 rounded overflow-x-auto">
                    {before.substring(0, 200)}...
                  </pre>
                </div>
                <div>
                  <div className="text-green-600 font-medium mb-1">After</div>
                  <pre className="bg-green-50 p-2 rounded overflow-x-auto">
                    {after.substring(0, 200)}...
                  </pre>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      <CardHeader className="flex-shrink-0 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-purple-600" />
            <CardTitle className="text-lg">Refactoring</CardTitle>
            {availableRefactorings.length > 0 && (
              <Badge variant="secondary">
                {availableRefactorings.length}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              title="Refresh refactoring suggestions"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              title="Close refactoring panel"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Context Info */}
        <div className="text-xs text-gray-600 mt-2">
          <div>File: {context.file}</div>
          <div>Line: {context.line}, Column: {context.column}</div>
          {context.symbol && <div>Symbol: {context.symbol}</div>}
          {context.selectedText && (
            <div>Selected: "{context.selectedText.substring(0, 50)}..."</div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-3">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
              <p className="text-sm text-gray-600">Analyzing code...</p>
            </div>
          </div>
        ) : availableRefactorings.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3">
              <Code className="w-12 h-12 text-gray-400 mx-auto" />
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Refactorings Available
                </h3>
                <p className="text-sm text-gray-600">
                  Select code or position cursor on a symbol to see refactoring options
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {/* Available Refactorings */}
            <div className="flex-1 overflow-y-auto space-y-4">
              {Object.entries(groupedRefactorings).map(([type, operations]) => (
                <div key={type}>
                  <h4 className="font-medium text-sm text-gray-700 mb-2 capitalize">
                    {type.replace('-', ' ')} ({operations.length})
                  </h4>
                  <div className="space-y-2">
                    {operations.map(renderOperation)}
                  </div>
                </div>
              ))}
            </div>

            {/* Selected Operation Details */}
            {selectedOperation && (
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-sm">
                    {selectedOperation.title}
                  </h4>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreview}
                      className="text-xs h-7 px-2"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Preview
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleExecute}
                      className="text-xs h-7 px-2"
                    >
                      <Play className="w-3 h-3 mr-1" />
                      Apply
                    </Button>
                  </div>
                </div>

                {/* Options Form */}
                {renderOptionsForm()}

                {/* Preview */}
                {renderPreview()}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RefactoringPanel;
