'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  GitBranch, 
  FolderTree, 
  GitCommit, 
  Sparkles,
  Zap,
  Eye,
  Settings,
  Maximize2,
  Minimize2
} from 'lucide-react';

export default function VisualToolsDemoSimple() {
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
                  <div className="h-96 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border-2 border-dashed border-blue-200 dark:border-blue-800 flex items-center justify-center">
                    <div className="text-center">
                      <GitBranch className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-300 mb-2">
                        Git History Visualizer
                      </h3>
                      <p className="text-blue-600 dark:text-blue-400 text-sm">
                        Interactive commit timeline with branching visualization
                      </p>
                    </div>
                  </div>
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
                  <div className="h-96 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border-2 border-dashed border-green-200 dark:border-green-800 flex items-center justify-center">
                    <div className="text-center">
                      <FolderTree className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-green-700 dark:text-green-300 mb-2">
                        Smart File Tree
                      </h3>
                      <p className="text-green-600 dark:text-green-400 text-sm">
                        Visual file explorer with smart indicators and relationships
                      </p>
                    </div>
                  </div>
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
                  <div className="h-96 bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/20 rounded-lg border-2 border-dashed border-purple-200 dark:border-purple-800 flex items-center justify-center">
                    <div className="text-center">
                      <GitCommit className="w-16 h-16 text-purple-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-purple-700 dark:text-purple-300 mb-2">
                        Code Flow Visualizer
                      </h3>
                      <p className="text-purple-600 dark:text-purple-400 text-sm">
                        Function call visualization with data flow analysis
                      </p>
                    </div>
                  </div>
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

        {/* Coming Soon Message */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-orange-500" />
                Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Sparkles className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Visual Tools Coming Soon!
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  We're working on bringing these beautiful, interactive tools to your White Rabbit Code Editor.
                </p>
                <div className="flex items-center justify-center gap-4">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    <GitBranch className="w-3 h-3 mr-1" />
                    Git History
                  </Badge>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <FolderTree className="w-3 h-3 mr-1" />
                    File Tree
                  </Badge>
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    <GitCommit className="w-3 h-3 mr-1" />
                    Code Flow
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
