/**
 * White Rabbit Code Editor - Extensions Demo Page
 * Copyright (c) 2025 White Rabbit Team. All rights reserved.
 * 
 * This software is licensed for personal and educational use only.
 * Commercial use requires a separate license agreement.
 * 
 * For licensing information, see LICENSE file.
 * For commercial licensing, contact: licensing@whiterabbit.dev
 */

'use client'

import React from 'react'
import { ExtensionManager } from '@/components/extension-manager'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Puzzle, Download, Star, CheckCircle } from 'lucide-react'

export default function ExtensionsDemoPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Extensions Demo</h1>
        <p className="text-muted-foreground">
          Test the enhanced extension system with top VS Code extensions
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Extension Manager */}
        <div className="lg:col-span-2">
          <ExtensionManager />
        </div>

        {/* Info Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Puzzle className="w-5 h-5" />
                Extension System
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="font-medium">Features</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 50+ Popular VS Code Extensions</li>
                  <li>• Install/Uninstall Management</li>
                  <li>• Enable/Disable Toggle</li>
                  <li>• Category Filtering</li>
                  <li>• Search Functionality</li>
                  <li>• Trending Extensions</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Categories</h4>
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs">🔷 Programming</Badge>
                  <Badge variant="outline" className="text-xs">🌐 Web Dev</Badge>
                  <Badge variant="outline" className="text-xs">🤖 AI Tools</Badge>
                  <Badge variant="outline" className="text-xs">📚 Git Tools</Badge>
                  <Badge variant="outline" className="text-xs">🗄️ Database</Badge>
                  <Badge variant="outline" className="text-xs">🧪 Testing</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Top Extensions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Python</span>
                <Badge variant="secondary" className="text-xs">50M+</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>TypeScript</span>
                <Badge variant="secondary" className="text-xs">45M+</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>C/C++</span>
                <Badge variant="secondary" className="text-xs">35M+</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Prettier</span>
                <Badge variant="secondary" className="text-xs">30M+</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>GitHub Copilot</span>
                <Badge variant="secondary" className="text-xs">25M+</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Extension Manager</span>
                <Badge variant="default" className="text-xs">Active</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Marketplace</span>
                <Badge variant="default" className="text-xs">Online</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Storage</span>
                <Badge variant="default" className="text-xs">Local</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Error Handling</span>
                <Badge variant="default" className="text-xs">Enhanced</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Install Extensions</h4>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Go to Marketplace tab</li>
                <li>Browse available extensions</li>
                <li>Click Install button</li>
                <li>Check Installed tab</li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium mb-2">Manage Extensions</h4>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Toggle enable/disable</li>
                <li>Uninstall unwanted ones</li>
                <li>View extension details</li>
                <li>Check categories</li>
              </ol>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> This is a demo system. Extensions are stored locally and don't actually modify your editor functionality.
              The system demonstrates the UI and state management capabilities.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
