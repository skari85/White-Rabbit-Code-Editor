/**
 * White Rabbit Code Editor - Language Server Manager Component
 * Copyright (c) 2025 White Rabbit Team. All rights reserved.
 * 
 * This software is licensed for personal and educational use only.
 * Commercial use requires a separate license agreement.
 * 
 * For licensing information, see LICENSE file.
 * For commercial licensing, contact: licensing@whiterabbit.dev
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Server,
  Play,
  Square,
  Settings,
  Plus,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Code,
  ChevronDown,
  Download,
  ExternalLink
} from 'lucide-react'
import { 
  LanguageServerClient, 
  SupportedLanguage, 
  LSPServerConfig,
  Diagnostic
} from '@/lib/language-server-client'
import { useAnalytics } from '@/hooks/use-analytics'

interface LanguageServerManagerProps {
  lspClient: LanguageServerClient
  onDiagnosticsUpdate?: (uri: string, diagnostics: Diagnostic[]) => void
  className?: string
}

interface ServerStatus {
  language: SupportedLanguage
  running: boolean
  initialized: boolean
  error?: string
  diagnosticsCount: number
}

export function LanguageServerManager({ 
  lspClient, 
  onDiagnosticsUpdate,
  className 
}: LanguageServerManagerProps) {
  const [serverStatuses, setServerStatuses] = useState<Map<SupportedLanguage, ServerStatus>>(new Map())
  const [showAddServerDialog, setShowAddServerDialog] = useState(false)
  const [isStartingServer, setIsStartingServer] = useState<SupportedLanguage | null>(null)
  const [diagnostics, setDiagnostics] = useState<Map<string, Diagnostic[]>>(new Map())

  const { trackFeatureUsed } = useAnalytics()

  // Initialize server statuses
  useEffect(() => {
    const supportedLanguages = lspClient.getSupportedLanguages()
    const initialStatuses = new Map<SupportedLanguage, ServerStatus>()
    
    for (const language of supportedLanguages) {
      initialStatuses.set(language, {
        language,
        running: false,
        initialized: false,
        diagnosticsCount: 0
      })
    }
    
    setServerStatuses(initialStatuses)
  }, [lspClient])

  // Handle diagnostics updates
  useEffect(() => {
    const handleDiagnostics = (uri: string, diagnostics: Diagnostic[]) => {
      setDiagnostics(prev => new Map(prev.set(uri, diagnostics)))
      onDiagnosticsUpdate?.(uri, diagnostics)
      
      // Update diagnostics count for the language
      // In a real implementation, you'd determine language from URI
      const language = getLanguageFromUri(uri)
      if (language) {
        setServerStatuses(prev => {
          const newStatuses = new Map(prev)
          const status = newStatuses.get(language)
          if (status) {
            status.diagnosticsCount = diagnostics.length
            newStatuses.set(language, status)
          }
          return newStatuses
        })
      }
    }

    // Set up diagnostics callback
    lspClient['onDiagnostics'] = handleDiagnostics

    return () => {
      lspClient['onDiagnostics'] = undefined
    }
  }, [lspClient, onDiagnosticsUpdate])

  // Get language from URI (simplified)
  const getLanguageFromUri = (uri: string): SupportedLanguage | null => {
    const extension = uri.split('.').pop()?.toLowerCase()
    
    const extensionMap: Record<string, SupportedLanguage> = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'py': 'python',
      'rs': 'rust',
      'go': 'go',
      'java': 'java',
      'cs': 'csharp',
      'cpp': 'cpp',
      'cc': 'cpp',
      'cxx': 'cpp',
      'php': 'php',
      'rb': 'ruby'
    }
    
    return extensionMap[extension || ''] || null
  }

  // Start language server
  const handleStartServer = async (language: SupportedLanguage) => {
    setIsStartingServer(language)
    
    try {
      await lspClient.startLanguageServer(language)
      
      setServerStatuses(prev => {
        const newStatuses = new Map(prev)
        const status = newStatuses.get(language)
        if (status) {
          status.running = true
          status.initialized = true
          status.error = undefined
          newStatuses.set(language, status)
        }
        return newStatuses
      })
      
      trackFeatureUsed('language_server_start', { language })
    } catch (error) {
      setServerStatuses(prev => {
        const newStatuses = new Map(prev)
        const status = newStatuses.get(language)
        if (status) {
          status.running = false
          status.initialized = false
          status.error = error instanceof Error ? error.message : 'Failed to start server'
          newStatuses.set(language, status)
        }
        return newStatuses
      })
      
      console.error(`Failed to start ${language} language server:`, error)
    } finally {
      setIsStartingServer(null)
    }
  }

  // Stop language server
  const handleStopServer = async (language: SupportedLanguage) => {
    try {
      await lspClient.stopLanguageServer(language)
      
      setServerStatuses(prev => {
        const newStatuses = new Map(prev)
        const status = newStatuses.get(language)
        if (status) {
          status.running = false
          status.initialized = false
          status.error = undefined
          status.diagnosticsCount = 0
          newStatuses.set(language, status)
        }
        return newStatuses
      })
      
      trackFeatureUsed('language_server_stop', { language })
    } catch (error) {
      console.error(`Failed to stop ${language} language server:`, error)
    }
  }

  // Toggle language server
  const handleToggleServer = async (language: SupportedLanguage, enabled: boolean) => {
    if (enabled) {
      await handleStartServer(language)
    } else {
      await handleStopServer(language)
    }
  }

  // Get status icon
  const getStatusIcon = (status: ServerStatus) => {
    if (isStartingServer === status.language) {
      return <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
    }
    
    if (status.error) {
      return <XCircle className="w-4 h-4 text-red-500" />
    }
    
    if (status.running && status.initialized) {
      return <CheckCircle className="w-4 h-4 text-green-500" />
    }
    
    return <Square className="w-4 h-4 text-gray-500" />
  }

  // Get status text
  const getStatusText = (status: ServerStatus) => {
    if (isStartingServer === status.language) {
      return 'Starting...'
    }
    
    if (status.error) {
      return 'Error'
    }
    
    if (status.running && status.initialized) {
      return 'Running'
    }
    
    return 'Stopped'
  }

  // Get status color
  const getStatusColor = (status: ServerStatus) => {
    if (isStartingServer === status.language) {
      return 'text-blue-500'
    }
    
    if (status.error) {
      return 'text-red-500'
    }
    
    if (status.running && status.initialized) {
      return 'text-green-500'
    }
    
    return 'text-gray-500'
  }

  // Get language icon
  const getLanguageIcon = (language: SupportedLanguage) => {
    const icons = {
      typescript: '🔷',
      javascript: '🟨',
      python: '🐍',
      rust: '🦀',
      go: '🐹',
      java: '☕',
      csharp: '🔷',
      cpp: '⚙️',
      php: '🐘',
      ruby: '💎'
    }
    
    return icons[language] || '📄'
  }

  // Get installation instructions
  const getInstallationInstructions = (language: SupportedLanguage) => {
    const instructions = {
      typescript: 'npm install -g typescript-language-server typescript',
      javascript: 'npm install -g typescript-language-server typescript',
      python: 'pip install python-lsp-server',
      rust: 'rustup component add rust-analyzer',
      go: 'go install golang.org/x/tools/gopls@latest',
      java: 'Download Eclipse JDT Language Server',
      csharp: 'Download OmniSharp language server',
      cpp: 'Install clangd language server',
      php: 'composer global require phpactor/phpactor',
      ruby: 'gem install solargraph'
    }
    
    return instructions[language] || 'Check language server documentation'
  }

  const runningServers = Array.from(serverStatuses.values()).filter(s => s.running).length
  const totalDiagnostics = Array.from(serverStatuses.values()).reduce((sum, s) => sum + s.diagnosticsCount, 0)

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Server className="w-4 h-4" />
            Language Servers
            <Badge variant="outline" className="text-xs">
              {runningServers}/{serverStatuses.size}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setShowAddServerDialog(true)}>
              <Plus className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4" />
            <span>Active: {runningServers}</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Issues: {totalDiagnostics}</span>
          </div>
        </div>

        <Separator />

        {/* Language Servers List */}
        <ScrollArea className="h-64">
          <div className="space-y-2">
            {Array.from(serverStatuses.values()).map((status) => (
              <div key={status.language} className="flex items-center justify-between p-3 rounded border">
                <div className="flex items-center gap-3">
                  <span className="text-lg">{getLanguageIcon(status.language)}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">{status.language}</span>
                      {status.diagnosticsCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {status.diagnosticsCount}
                        </Badge>
                      )}
                    </div>
                    <div className={`text-xs ${getStatusColor(status)}`}>
                      {getStatusText(status)}
                      {status.error && (
                        <span className="ml-2 text-red-500">- {status.error}</span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {getStatusIcon(status)}
                  <Switch
                    checked={status.running}
                    onCheckedChange={(enabled) => handleToggleServer(status.language, enabled)}
                    disabled={isStartingServer === status.language}
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <ChevronDown className="w-3 h-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {!status.running && (
                        <DropdownMenuItem onClick={() => handleStartServer(status.language)}>
                          <Play className="w-3 h-3 mr-2" />
                          Start Server
                        </DropdownMenuItem>
                      )}
                      {status.running && (
                        <DropdownMenuItem onClick={() => handleStopServer(status.language)}>
                          <Square className="w-3 h-3 mr-2" />
                          Stop Server
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem>
                        <Settings className="w-3 h-3 mr-2" />
                        Configure
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <ExternalLink className="w-3 h-3 mr-2" />
                        Documentation
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const stoppedServers = Array.from(serverStatuses.values()).filter(s => !s.running)
              stoppedServers.forEach(s => handleStartServer(s.language))
            }}
            className="flex-1"
          >
            <Play className="w-3 h-3 mr-2" />
            Start All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const runningServersList = Array.from(serverStatuses.values()).filter(s => s.running)
              runningServersList.forEach(s => handleStopServer(s.language))
            }}
            className="flex-1"
          >
            <Square className="w-3 h-3 mr-2" />
            Stop All
          </Button>
        </div>

        {/* Installation Help */}
        {Array.from(serverStatuses.values()).some(s => s.error) && (
          <div className="p-3 rounded border border-yellow-200 bg-yellow-50">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">Installation Required</span>
            </div>
            <div className="text-xs text-yellow-700 space-y-1">
              {Array.from(serverStatuses.values())
                .filter(s => s.error)
                .map(s => (
                  <div key={s.language}>
                    <strong>{s.language}:</strong> {getInstallationInstructions(s.language)}
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* Add Server Dialog */}
        <Dialog open={showAddServerDialog} onOpenChange={setShowAddServerDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Language Server</DialogTitle>
              <DialogDescription>
                Configure a custom language server for additional language support
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm">
                <p className="mb-2">Popular language servers you can add:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• <strong>Lua:</strong> lua-language-server</li>
                  <li>• <strong>Kotlin:</strong> kotlin-language-server</li>
                  <li>• <strong>Swift:</strong> sourcekit-lsp</li>
                  <li>• <strong>Dart:</strong> dart language server</li>
                  <li>• <strong>Elixir:</strong> elixir-ls</li>
                </ul>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddServerDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowAddServerDialog(false)}>
                  <ExternalLink className="w-3 h-3 mr-2" />
                  View Documentation
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
