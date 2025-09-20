'use client'

import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { FileContent } from '@/hooks/use-code-builder'
import { useResponsiveLayout } from '@/hooks/use-responsive-layout'
import { useSplitLayout } from '@/hooks/use-split-layout'
import {
    MoreVertical,
    SplitSquareHorizontal,
    SplitSquareVertical,
    X
} from 'lucide-react'
import React, { useCallback } from 'react'
import { ErrorBoundary } from './error-boundary'
import FileTabs from './file-tabs'
import LazyMonacoEditor from './lazy-monaco-editor'
import LiveCodingMonaco from './live-coding-monaco'

export interface EditorPaneConfig {
  id: string
  files: FileContent[]
  selectedFile: string | null
  size: number
  minSize?: number
  maxSize?: number
}

export interface SplitConfig {
  id: string
  direction: 'horizontal' | 'vertical'
  panes: (EditorPaneConfig | SplitConfig)[]
  size?: number
}

export interface SplitEditorLayoutProps {
  files: FileContent[]
  selectedFile: string | null
  onSelectFile: (filename: string) => void
  onCloseFile: (filename: string) => void
  onUpdateFileContent: (filename: string, content: string) => void
  getFileContent: (filename: string) => string
  getLanguageFromFileName: (filename: string) => string
  hasUnsavedChanges?: boolean
  useAIEnhancedEditor?: boolean
  aiConfigured?: boolean
  theme?: string
  className?: string
  // Additional props for documentation and inspections
  showDocumentation?: boolean
  onToggleDocumentation?: () => void
  hasDocumentation?: boolean
  showInspections?: boolean
  onToggleInspections?: () => void
  onRunInspections?: () => void
  inspectionCount?: number
  onToggleAIEditor?: () => void
  // File creation callbacks for live coding
  onFileCreate?: (filename: string, content: string, language: string) => void
  onMultipleFilesCreate?: (fileList: Array<{filename: string, content: string, language: string}>) => void
}

interface EditorPaneProps {
  pane: EditorPaneConfig
  files: FileContent[]
  onSelectFile: (filename: string) => void
  onCloseFile: (filename: string) => void
  onUpdateFileContent: (filename: string, content: string) => void
  getFileContent: (filename: string) => string
  getLanguageFromFileName: (filename: string) => string
  hasUnsavedChanges?: boolean
  useAIEnhancedEditor?: boolean
  aiConfigured?: boolean
  theme?: string
  onSplitHorizontal: (paneId: string) => void
  onSplitVertical: (paneId: string) => void
  onClosePane: (paneId: string) => void
  showSplitControls?: boolean
  // Tab-related props
  showDocumentation?: boolean
  onToggleDocumentation?: () => void
  hasDocumentation?: boolean
  showInspections?: boolean
  onToggleInspections?: () => void
  onRunInspections?: () => void
  inspectionCount?: number
  onToggleAIEditor?: () => void
  // File creation callbacks for live coding
  onFileCreate?: (filename: string, content: string, language: string) => void
  onMultipleFilesCreate?: (fileList: Array<{filename: string, content: string, language: string}>) => void
}

// Individual Editor Pane Component
function EditorPane({
  pane,
  files,
  onSelectFile,
  onCloseFile,
  onUpdateFileContent,
  getFileContent,
  getLanguageFromFileName,
  hasUnsavedChanges = false,
  useAIEnhancedEditor = false,
  aiConfigured = false,
  theme = 'kex-dark',
  onSplitHorizontal,
  onSplitVertical,
  onClosePane,
  showSplitControls = true,
  showDocumentation = false,
  onToggleDocumentation,
  hasDocumentation = false,
  showInspections = false,
  onToggleInspections,
  onRunInspections,
  inspectionCount = 0,
  onToggleAIEditor,
  onFileCreate,
  onMultipleFilesCreate
}: EditorPaneProps) {
  // Filter files that are relevant to this pane
  const paneFiles = files.filter(file => pane.files.some(pf => pf.name === file.name))
  const currentSelectedFile = pane.selectedFile || (paneFiles.length > 0 ? paneFiles[0].name : null)

  return (
    <div className="h-full flex flex-col bg-white">
      {/* File Tabs with Split Controls */}
      <div className="flex items-center border-b border-gray-200">
        <div className="flex-1">
          <FileTabs
            files={paneFiles}
            selectedFile={currentSelectedFile || ''}
            onSelectFile={onSelectFile}
            onCloseFile={onCloseFile}
            hasUnsavedChanges={hasUnsavedChanges}
            showDocumentation={showDocumentation}
            onToggleDocumentation={onToggleDocumentation}
            hasDocumentation={hasDocumentation}
            useAIEnhancedEditor={useAIEnhancedEditor}
            onToggleAIEditor={onToggleAIEditor}
            aiConfigured={aiConfigured}
            showInspections={showInspections}
            onToggleInspections={onToggleInspections}
            onRunInspections={onRunInspections}
            inspectionCount={inspectionCount}
          />
        </div>
        
        {/* Split Controls - Hidden on mobile/tablet */}
        {showSplitControls && (
          <div className="flex items-center gap-1 px-2 border-l border-gray-200 hidden sm:flex">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreVertical className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onSplitVertical(pane.id)}>
                  <SplitSquareVertical className="w-4 h-4 mr-2" />
                  Split Right
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onSplitHorizontal(pane.id)}>
                  <SplitSquareHorizontal className="w-4 h-4 mr-2" />
                  Split Down
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onClosePane(pane.id)}>
                  <X className="w-4 h-4 mr-2" />
                  Close Pane
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* Editor Content */}
      <div className="flex-1">
        <ErrorBoundary>
          {useAIEnhancedEditor && aiConfigured ? (
            <LiveCodingMonaco
              value={currentSelectedFile ? getFileContent(currentSelectedFile) : ''}
              onChange={(content) => {
                if (currentSelectedFile && content !== undefined) {
                  onUpdateFileContent(currentSelectedFile, content)
                }
              }}
              language={currentSelectedFile ? getLanguageFromFileName(currentSelectedFile) : 'javascript'}
              theme={theme}
              height="100%"
              onFileCreate={(filename, content, language) => {
                // Use the callback if provided, otherwise fallback to local handling
                if (onFileCreate) {
                  onFileCreate(filename, content, language);
                } else {
                  // Fallback: use existing file update mechanism
                  onUpdateFileContent(filename, content);
                  onSelectFile(filename);
                }
              }}
              onMultipleFilesCreate={(fileList) => {
                // Use the callback if provided, otherwise fallback to local handling
                if (onMultipleFilesCreate) {
                  onMultipleFilesCreate(fileList);
                } else {
                  // Fallback: create multiple files using existing mechanism
                  fileList.forEach((file, index) => {
                    setTimeout(() => {
                      onUpdateFileContent(file.filename, file.content);
                      if (index === 0) {
                        onSelectFile(file.filename);
                      }
                    }, index * 100);
                  });
                }
              }}
            />
          ) : (
            <LazyMonacoEditor
              value={currentSelectedFile ? getFileContent(currentSelectedFile) : ''}
              onChange={(content) => {
                if (currentSelectedFile && content !== undefined) {
                  onUpdateFileContent(currentSelectedFile, content)
                }
              }}
              language={currentSelectedFile ? getLanguageFromFileName(currentSelectedFile) : 'javascript'}
              theme={theme}
              height="100%"
            />
          )}
        </ErrorBoundary>
      </div>
    </div>
  )
}

// Main Split Editor Layout Component
export default function SplitEditorLayout({
  files,
  selectedFile,
  onSelectFile,
  onCloseFile,
  onUpdateFileContent,
  getFileContent,
  getLanguageFromFileName,
  hasUnsavedChanges = false,
  useAIEnhancedEditor = false,
  aiConfigured = false,
  theme = 'kex-dark',
  className = '',
  showDocumentation = false,
  onToggleDocumentation,
  hasDocumentation = false,
  showInspections = false,
  onToggleInspections,
  onRunInspections,
  inspectionCount = 0,
  onToggleAIEditor,
  onFileCreate,
  onMultipleFilesCreate
}: SplitEditorLayoutProps) {
  // Use responsive layout to determine capabilities
  const responsiveConfig = useResponsiveLayout();

  // Use the split layout hook for state management
  const {
    splitConfig,
    splitHorizontal: handleSplitHorizontal,
    splitVertical: handleSplitVertical,
    closePane: handleClosePane
  } = useSplitLayout(files, selectedFile)

  // Render split configuration recursively
  const renderSplitConfig = useCallback((config: SplitConfig | EditorPaneConfig): React.ReactNode => {
    if ('files' in config) {
      // This is an EditorPaneConfig - render the editor pane
      return (
        <EditorPane
          key={config.id}
          pane={config}
          files={files}
          onSelectFile={onSelectFile}
          onCloseFile={onCloseFile}
          onUpdateFileContent={onUpdateFileContent}
          getFileContent={getFileContent}
          getLanguageFromFileName={getLanguageFromFileName}
          hasUnsavedChanges={hasUnsavedChanges}
          useAIEnhancedEditor={useAIEnhancedEditor}
          aiConfigured={aiConfigured}
          theme={theme}
          onSplitHorizontal={handleSplitHorizontal}
          onSplitVertical={handleSplitVertical}
          onClosePane={handleClosePane}
          showDocumentation={showDocumentation}
          onToggleDocumentation={onToggleDocumentation}
          hasDocumentation={hasDocumentation}
          showInspections={showInspections}
          onToggleInspections={onToggleInspections}
          onRunInspections={onRunInspections}
          inspectionCount={inspectionCount}
          onToggleAIEditor={onToggleAIEditor}
          onFileCreate={onFileCreate}
          onMultipleFilesCreate={onMultipleFilesCreate}
        />
      )
    } else {
      // This is a SplitConfig - render resizable panel group
      return (
        <ResizablePanelGroup
          key={config.id}
          direction={config.direction}
          className="h-full"
        >
          {config.panes.map((pane, index) => (
            <React.Fragment key={pane.id}>
              <ResizablePanel
                defaultSize={pane.size || 50}
                minSize={('minSize' in pane ? pane.minSize : undefined) || 20}
                maxSize={('maxSize' in pane ? pane.maxSize : undefined) || 80}
              >
                {renderSplitConfig(pane)}
              </ResizablePanel>
              {index < config.panes.length - 1 && (
                <ResizableHandle withHandle />
              )}
            </React.Fragment>
          ))}
        </ResizablePanelGroup>
      )
    }
  }, [
    files,
    onSelectFile,
    onCloseFile,
    onUpdateFileContent,
    getFileContent,
    getLanguageFromFileName,
    hasUnsavedChanges,
    useAIEnhancedEditor,
    aiConfigured,
    theme,
    handleSplitHorizontal,
    handleSplitVertical,
    handleClosePane,
    showDocumentation,
    onToggleDocumentation,
    hasDocumentation,
    showInspections,
    onToggleInspections,
    onRunInspections,
    inspectionCount,
    onToggleAIEditor
  ])

  return (
    <div className={`h-full ${className}`}>
      {renderSplitConfig(splitConfig)}
    </div>
  )
}
