'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Eye,
    FolderTree,
    GitBranch,
    GitCommit,
    Maximize2,
    Minimize2,
    Settings,
    Sparkles,
    Zap
} from 'lucide-react';
import { useState } from 'react';
import CodeFlowVisualizer from './code-flow-visualizer';
import GitHistoryVisualizer from './git-history-visualizer';
import SmartFileTree from './smart-file-tree';

export default function VisualToolsDemo() {
  const [activeTab, setActiveTab] = useState('git-history');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900' : 'min-h-screen'}`}>
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-blue-500" />
              <h1 className="text-2xl font-bold">Visual Tools Showcase</h1>
            </div>
            <Badge variant="outline" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
              <Zap className="w-3 h-3 mr-1" />
              Interactive
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Explore three powerful visual tools that enhance your development experience with beautiful animations and insights.
        </p>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="git-history" className="flex items-center gap-2">
              <GitBranch className="w-4 h-4" />
              Git History
            </TabsTrigger>
            <TabsTrigger value="file-tree" className="flex items-center gap-2">
              <FolderTree className="w-4 h-4" />
              Smart File Tree
            </TabsTrigger>
            <TabsTrigger value="code-flow" className="flex items-center gap-2">
              <GitCommit className="w-4 h-4" />
              Code Flow
            </TabsTrigger>
          </TabsList>

          {/* Git History Visualizer Tab */}
          <TabsContent value="git-history" className="space-y-4">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GitBranch className="w-5 h-5 text-blue-500" />
                    Git History Visualizer
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Beautiful visualization of your git commit history with branching, commit details, and smooth animations.
                  </p>
                </CardHeader>
                <CardContent>
                  <GitHistoryVisualizer 
                    className="w-full"
                    onCommitSelect={(commit) => {
                      console.log('Selected commit:', commit);
                    }}
                    onBranchSelect={(branch) => {
                      console.log('Selected branch:', branch);
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Smart File Tree Tab */}
          <TabsContent value="file-tree" className="space-y-4">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderTree className="w-5 h-5 text-green-500" />
                    Smart File Tree
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Enhanced file explorer with visual cues, file relationships, size indicators, and activity pulses.
                  </p>
                </CardHeader>
                <CardContent>
                  <SmartFileTree 
                    className="w-full"
                    files={[
                      {
                        name: 'src',
                        path: '/src',
                        type: 'folder',
                        lastModified: new Date(),
                        dependencies: ['components', 'hooks', 'lib'],
                        complexity: 8,
                        status: 'clean'
                      },
                      {
                        name: 'App.tsx',
                        path: '/src/App.tsx',
                        type: 'file',
                        size: 2048,
                        lastModified: new Date(),
                        language: 'typescript',
                        dependencies: ['react', 'components'],
                        complexity: 4,
                        status: 'modified',
                        lastActivity: new Date()
                      }
                    ]}
                    onFileSelect={(file) => {
                      console.log('Selected file:', file);
                    }}
                    onFolderToggle={(folder) => {
                      console.log('Toggled folder:', folder);
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Code Flow Visualizer Tab */}
          <TabsContent value="code-flow" className="space-y-4">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GitCommit className="w-5 h-5 text-purple-500" />
                    Code Flow Visualizer
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Interactive flowcharts showing function calls and data flow with animated connections and complexity indicators.
                  </p>
                </CardHeader>
                <CardContent>
                  <CodeFlowVisualizer 
                    className="w-full"
                    onNodeSelect={(node) => {
                      console.log('Selected node:', node);
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Features Overview */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-500" />
                Features Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                {/* Git History Features */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-blue-600 flex items-center gap-2">
                    <GitBranch className="w-4 h-4" />
                    Git History Visualizer
                  </h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Beautiful commit timeline with branching</li>
                    <li>• Interactive commit bubbles with details</li>
                    <li>• Branch filtering and search</li>
                    <li>• Fullscreen mode for detailed view</li>
                    <li>• Smooth animations and transitions</li>
                  </ul>
                </div>

                {/* File Tree Features */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-green-600 flex items-center gap-2">
                    <FolderTree className="w-4 h-4" />
                    Smart File Tree
                  </h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Visual file type indicators</li>
                    <li>• Git status and activity pulses</li>
                    <li>• Complexity and size indicators</li>
                    <li>• Advanced sorting and filtering</li>
                    <li>• Dependency visualization</li>
                  </ul>
                </div>

                {/* Code Flow Features */}
                <div className="space-y-3">
                  <h3 className="font-semibold text-purple-600 flex items-center gap-2">
                    <GitCommit className="w-4 h-4" />
                    Code Flow Visualizer
                  </h3>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Interactive function nodes</li>
                    <li>• Animated data flow connections</li>
                    <li>• Complexity-based color coding</li>
                    <li>• Real-time animation controls</li>
                    <li>• Detailed node information</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Usage Tips */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-orange-500" />
                Usage Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Getting Started</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Click on any node, commit, or file to see details</li>
                    <li>• Use the search and filter controls to focus on specific items</li>
                    <li>• Toggle animations and visual elements on/off</li>
                    <li>• Use fullscreen mode for detailed exploration</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2 text-gray-900 dark:text-gray-100">Advanced Features</h4>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <li>• Adjust animation speed for different workflows</li>
                    <li>• Explore file dependencies and relationships</li>
                    <li>• Analyze code complexity patterns</li>
                    <li>• Track development progress over time</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
