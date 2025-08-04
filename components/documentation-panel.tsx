'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Copy, 
  Download, 
  RefreshCw, 
  FileText, 
  Code, 
  Lightbulb,
  CheckCircle,
  AlertCircle,
  Info,
  X,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { toast } from 'sonner';

interface DocumentationSection {
  id: string;
  title: string;
  content: string;
  type: 'overview' | 'parameters' | 'returns' | 'examples' | 'usage' | 'notes';
  language?: string;
}

interface DocumentationData {
  fileName: string;
  fileType: string;
  generatedAt: Date;
  sections: DocumentationSection[];
  summary: string;
  complexity: 'low' | 'medium' | 'high';
  tags: string[];
}

interface DocumentationPanelProps {
  documentation: DocumentationData | null;
  isLoading: boolean;
  onGenerate: (fileName: string, code: string) => Promise<void>;
  onClose: () => void;
  currentFile: string;
  currentCode: string;
  className?: string;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

const DocumentationPanel: React.FC<DocumentationPanelProps> = ({
  documentation,
  isLoading,
  onGenerate,
  onClose,
  currentFile,
  currentCode,
  className = '',
  isExpanded = false,
  onToggleExpand
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  // Handle copy to clipboard
  const handleCopy = useCallback(async (content: string, type: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopySuccess(type);
      toast.success(`${type} copied to clipboard`);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  }, []);

  // Handle documentation generation
  const handleGenerate = useCallback(async () => {
    if (!currentFile || !currentCode.trim()) {
      toast.error('No code to document');
      return;
    }
    
    try {
      await onGenerate(currentFile, currentCode);
    } catch (error) {
      toast.error('Failed to generate documentation');
    }
  }, [currentFile, currentCode, onGenerate]);

  // Handle download documentation
  const handleDownload = useCallback(() => {
    if (!documentation) return;

    const docContent = `# Documentation for ${documentation.fileName}

Generated on: ${documentation.generatedAt.toLocaleString()}
Complexity: ${documentation.complexity}
Tags: ${documentation.tags.join(', ')}

## Summary
${documentation.summary}

${documentation.sections.map(section => `
## ${section.title}
${section.content}
`).join('\n')}
`;

    const blob = new Blob([docContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${documentation.fileName.replace(/\.[^/.]+$/, '')}-docs.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Documentation downloaded');
  }, [documentation]);

  // Get complexity color
  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get section icon
  const getSectionIcon = (type: string) => {
    switch (type) {
      case 'overview': return <Info className="w-4 h-4" />;
      case 'parameters': return <Code className="w-4 h-4" />;
      case 'returns': return <CheckCircle className="w-4 h-4" />;
      case 'examples': return <Lightbulb className="w-4 h-4" />;
      case 'usage': return <FileText className="w-4 h-4" />;
      case 'notes': return <AlertCircle className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  // Render section content with syntax highlighting
  const renderSectionContent = (section: DocumentationSection) => {
    if (section.language && section.content.includes('```')) {
      return (
        <div className="space-y-2">
          <pre className="bg-gray-50 p-3 rounded-md overflow-x-auto text-sm">
            <code>{section.content}</code>
          </pre>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleCopy(section.content, section.title)}
            className="ml-auto flex items-center gap-1"
          >
            {copySuccess === section.title ? (
              <CheckCircle className="w-3 h-3 text-green-600" />
            ) : (
              <Copy className="w-3 h-3" />
            )}
            Copy
          </Button>
        </div>
      );
    }

    return (
      <div className="prose prose-sm max-w-none">
        <div dangerouslySetInnerHTML={{ __html: section.content.replace(/\n/g, '<br>') }} />
      </div>
    );
  };

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      <CardHeader className="flex-shrink-0 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">Documentation</CardTitle>
            {documentation && (
              <Badge className={getComplexityColor(documentation.complexity)}>
                {documentation.complexity}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {onToggleExpand && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleExpand}
                title={isExpanded ? "Minimize" : "Maximize"}
              >
                {isExpanded ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              title="Close documentation panel"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {documentation && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>{documentation.fileName}</span>
            <span>•</span>
            <span>{documentation.generatedAt.toLocaleString()}</span>
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-sm text-gray-600">Generating documentation...</p>
            </div>
          </div>
        ) : !documentation ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto" />
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Documentation Generated
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Generate AI-powered documentation for your code
                </p>
                <Button onClick={handleGenerate} disabled={!currentCode.trim()}>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Generate Documentation
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {/* Summary and Actions */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 mb-2">{documentation.summary}</p>
              <div className="flex items-center gap-2">
                {documentation.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerate}
                disabled={isLoading}
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Regenerate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="w-3 h-3 mr-1" />
                Download
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCopy(documentation.sections.map(s => s.content).join('\n\n'), 'Documentation')}
              >
                <Copy className="w-3 h-3 mr-1" />
                Copy All
              </Button>
            </div>

            {/* Documentation Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
                {documentation.sections.map((section) => (
                  <TabsTrigger
                    key={section.id}
                    value={section.type}
                    className="flex items-center gap-1 text-xs"
                  >
                    {getSectionIcon(section.type)}
                    <span className="hidden sm:inline">{section.title}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
              
              <div className="flex-1 overflow-y-auto mt-2">
                {documentation.sections.map((section) => (
                  <TabsContent
                    key={section.id}
                    value={section.type}
                    className="h-full"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">{section.title}</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(section.content, section.title)}
                        >
                          {copySuccess === section.title ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      {renderSectionContent(section)}
                    </div>
                  </TabsContent>
                ))}
              </div>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentationPanel;
