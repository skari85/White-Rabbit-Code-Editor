'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  AlertTriangle, 
  Code, 
  Settings, 
  ChevronUp, 
  ChevronDown,
  Terminal,
  GitBranch,
  Package,
  Bug,
  Zap,
  Sparkles,
  CheckCircle
} from 'lucide-react';
import SearchReplacePanel from './search-replace-panel';
import ErrorDetectionPanel from './error-detection-panel';
import DebuggerPanel from './debugger-panel';
import GitPanel from './git-panel';
import { cn } from '@/lib/utils';

export interface DevelopmentToolsPanelProps {
  files: Record<string, { name: string; content: string; language?: string }>;
  onFileSelect?: (fileId: string, line?: number, column?: number) => void;
  onReplace?: (fileId: string, line: number, column: number, oldText: string, newText: string) => void;
  onFixApply?: (fileId: string, line: number, column: number, oldText: string, newText: string) => void;
  onSendToChat?: (message: string) => void;
  className?: string;
}

const DevelopmentToolsPanel: React.FC<DevelopmentToolsPanelProps> = ({
  files,
  onFileSelect,
  onReplace,
  onFixApply,
  onSendToChat,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('search');

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Code className="w-4 h-4" />
            Development Tools
            <Badge variant="secondary" className="ml-2 text-xs">
              Dev
            </Badge>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="search" className="flex items-center gap-1 text-xs">
                <Search className="w-3 h-3" />
                Search
              </TabsTrigger>
              <TabsTrigger value="errors" className="flex items-center gap-1 text-xs">
                <AlertTriangle className="w-3 h-3" />
                Errors
              </TabsTrigger>
              <TabsTrigger value="debug" className="flex items-center gap-1 text-xs">
                <Bug className="w-3 h-3" />
                Debug
              </TabsTrigger>
              <TabsTrigger value="intellisense" className="flex items-center gap-1 text-xs">
                <Sparkles className="w-3 h-3" />
                IntelliSense
              </TabsTrigger>
              <TabsTrigger value="terminal" className="flex items-center gap-1 text-xs">
                <Terminal className="w-3 h-3" />
                Terminal
              </TabsTrigger>
              <TabsTrigger value="git" className="flex items-center gap-1 text-xs">
                <GitBranch className="w-3 h-3" />
                Git
              </TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="mt-4">
              <SearchReplacePanel
                files={files}
                onFileSelect={onFileSelect}
                onReplace={onReplace}
              />
            </TabsContent>

            <TabsContent value="errors" className="mt-4">
              <ErrorDetectionPanel
                files={files}
                onFileSelect={onFileSelect}
                onFixApply={onFixApply}
              />
            </TabsContent>

            <TabsContent value="debug" className="mt-4">
              <DebuggerPanel className="w-full" />
            </TabsContent>

            <TabsContent value="intellisense" className="mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    IntelliSense
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Language Server</span>
                      <Badge variant="outline" className="text-xs text-green-400">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Auto-complete</span>
                      <Badge variant="outline" className="text-xs text-green-400">Enabled</Badge>
                    </div>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <Sparkles className="w-3 h-3 mr-2" />
                        Refresh Completions
                      </Button>
                      <Button variant="outline" size="sm" className="w-full justify-start">
                        <CheckCircle className="w-3 h-3 mr-2" />
                        Check Types
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="terminal" className="mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Terminal className="w-4 h-4" />
                    Integrated Terminal
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-900 rounded p-3 font-mono text-sm">
                    <div className="text-green-400">$ npm run dev</div>
                    <div className="text-gray-400 mt-1">
                      Starting development server...
                    </div>
                    <div className="text-gray-400 mt-1">
                      Ready on http://localhost:3000
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Package className="w-3 h-3 mr-2" />
                      Install Dependencies
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Bug className="w-3 h-3 mr-2" />
                      Run Tests
                    </Button>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Zap className="w-3 h-3 mr-2" />
                      Build Project
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="git" className="mt-4">
              <GitPanel className="w-full" />
            </TabsContent>
          </Tabs>
        </CardContent>
      )}
    </Card>
  );
};

export default DevelopmentToolsPanel; 