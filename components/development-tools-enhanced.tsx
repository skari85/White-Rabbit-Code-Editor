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
  CheckCircle,
  Users,
  Monitor,
  Database,
  FileText,
  Play,
  Square,
  RotateCcw
} from 'lucide-react';
import SearchReplacePanel from './search-replace-panel';
import ErrorDetectionPanel from './error-detection-panel';
import DebuggerPanel from './debugger-panel';
import GitPanel from './git-panel';
import { PerformanceMonitorPanel } from './performance-monitor-panel';
import { CollaborationPanel } from './collaboration-panel';
import { CollaborationService } from '@/lib/collaboration-service';
import { cn } from '@/lib/utils';

export interface DevelopmentToolsEnhancedProps {
  files: Record<string, { name: string; content: string; language?: string }>;
  onFileSelect?: (fileId: string, line?: number, column?: number) => void;
  onReplace?: (fileId: string, line: number, column: number, oldText: string, newText: string) => void;
  onFixApply?: (fileId: string, line: number, column: number, oldText: string, newText: string) => void;
  onSendToChat?: (message: string) => void;
  collaborationService?: CollaborationService;
  className?: string;
}

export function DevelopmentToolsEnhanced({ 
  files, 
  onFileSelect, 
  onReplace, 
  onFixApply, 
  onSendToChat,
  collaborationService,
  className = '' 
}: DevelopmentToolsEnhancedProps) {
  const [activeTab, setActiveTab] = useState('search');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const tabs = [
    { id: 'search', label: 'Search', icon: Search },
    { id: 'errors', label: 'Errors', icon: AlertTriangle },
    { id: 'debug', label: 'Debug', icon: Bug },
    { id: 'git', label: 'Git', icon: GitBranch },
    { id: 'performance', label: 'Performance', icon: Zap },
    { id: 'collaboration', label: 'Collaboration', icon: Users },
    { id: 'terminal', label: 'Terminal', icon: Terminal },
  ];

  const handleRunProject = () => {
    setIsRunning(true);
    // Simulate running the project
    setTimeout(() => {
      setIsRunning(false);
    }, 2000);
  };

  const handleStopProject = () => {
    setIsRunning(false);
  };

  const handleRestartProject = () => {
    setIsRunning(false);
    setTimeout(() => {
      setIsRunning(true);
    }, 1000);
  };

  return (
    <Card className={cn("transition-all duration-300", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Code className="w-4 h-4" />
            Development Tools
            <Badge variant="outline" className="text-xs">
              {Object.keys(files).length} files
            </Badge>
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Project Controls */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRunProject}
                disabled={isRunning}
                className="h-6 px-2 text-xs"
              >
                <Play className="w-3 h-3" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleStopProject}
                disabled={!isRunning}
                className="h-6 px-2 text-xs"
              >
                <Square className="w-3 h-3" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRestartProject}
                className="h-6 px-2 text-xs"
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-6 px-2"
            >
              {isCollapsed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </Button>
          </div>
        </div>
        
        {/* Status Bar */}
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <div className={cn("w-2 h-2 rounded-full", isRunning ? "bg-green-400" : "bg-gray-400")} />
            <span>{isRunning ? "Running" : "Stopped"}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Database className="w-3 h-3" />
            <span>No Database</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Monitor className="w-3 h-3" />
            <span>Port 3000</span>
          </div>
        </div>
      </CardHeader>
      
      {!isCollapsed && (
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-7 bg-gray-800">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger 
                    key={tab.id} 
                    value={tab.id} 
                    className="data-[state=active]:bg-blue-600 text-xs"
                  >
                    <Icon className="w-3 h-3 mr-1" />
                    {tab.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
            
            <TabsContent value="search" className="mt-4">
              <SearchReplacePanel
                files={files}
                onFileSelect={onFileSelect}
                onReplace={onReplace}
                onSendToChat={onSendToChat}
              />
            </TabsContent>
            
            <TabsContent value="errors" className="mt-4">
              <ErrorDetectionPanel
                files={files}
                onFileSelect={onFileSelect}
                onFixApply={onFixApply}
                onSendToChat={onSendToChat}
              />
            </TabsContent>
            
            <TabsContent value="debug" className="mt-4">
              <DebuggerPanel
                files={files}
                onFileSelect={onFileSelect}
                onSendToChat={onSendToChat}
              />
            </TabsContent>
            
            <TabsContent value="git" className="mt-4">
              <GitPanel
                files={files}
                onFileSelect={onFileSelect}
                onSendToChat={onSendToChat}
              />
            </TabsContent>
            
            <TabsContent value="performance" className="mt-4">
              <PerformanceMonitorPanel />
            </TabsContent>
            
            <TabsContent value="collaboration" className="mt-4">
              {collaborationService ? (
                <CollaborationPanel collaborationService={collaborationService} />
              ) : (
                <div className="text-center p-4 text-gray-400">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Collaboration service not available</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="terminal" className="mt-4">
              <div className="bg-black p-4 rounded border border-gray-700">
                <div className="flex items-center gap-2 mb-2">
                  <Terminal className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium">Terminal</span>
                </div>
                <div className="text-green-400 font-mono text-xs">
                  <div>$ npm start</div>
                  <div className="text-gray-500">Starting development server...</div>
                  <div className="text-gray-500">Local: http://localhost:3000</div>
                  <div className="text-gray-500">Ready in 1.2s</div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      )}
    </Card>
  );
} 