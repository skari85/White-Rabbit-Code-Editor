"use client"

import { ScopeDetectionEngine, type ScopeGlowConfig } from '@/lib/scope-detection-engine'
import { ScopeGlowColorSystem } from '@/lib/scope-glow-colors'
import { useEffect, useRef, useState } from 'react'

interface ScopeGlowExtensionProps {
  editor: any
  code: string
  language: string
  config: ScopeGlowConfig
  onScopeChange?: (scope: any | null) => void
}

export function ScopeGlowExtension({ editor, code, language, config, onScopeChange }: ScopeGlowExtensionProps) {
  const engineRef = useRef<ScopeDetectionEngine | null>(null)
  const colorRef = useRef<ScopeGlowColorSystem | null>(null)
  const [decorationIds, setDecorationIds] = useState<string[]>([])
  const currentScopeRef = useRef<any | null>(null)

  // Init helpers
  useEffect(() => {
    if (!engineRef.current) engineRef.current = new ScopeDetectionEngine()
    if (!colorRef.current) colorRef.current = new ScopeGlowColorSystem()
  }, [])

  // Re-parse scopes when code/language changes
  useEffect(() => {
    if (!editor || !code || !engineRef.current) return
    engineRef.current.parseScopes(code, language)
    // On content change, re-apply highlight at current cursor
    try {
      const pos = editor.getPosition?.()
      if (pos) {
        applyForPosition(pos.lineNumber, pos.column)
      }
    } catch {}
  }, [editor, code, language])

  // Listen to cursor changes
  useEffect(() => {
    if (!editor) return
    const dispose = editor.onDidChangeCursorPosition((e: any) => {
      applyForPosition(e.position.lineNumber, e.position.column)
    })
    return () => dispose?.dispose?.()
  }, [editor, config])

  const clearDecorations = () => {
    if (!editor) return
    try {
      const empty: any[] = []
      const ids = editor.deltaDecorations(decorationIds, empty)
      setDecorationIds(ids)
    } catch {}
  }

  const applyForPosition = (line: number, column: number) => {
    if (!editor || !engineRef.current || !colorRef.current || !config?.enabled) {
      clearDecorations()
      currentScopeRef.current = null
      onScopeChange?.(null)
      return
    }

    const scope = engineRef.current.getScopeAtPosition(line, column)
    if (!scope) {
      if (currentScopeRef.current) {
        clearDecorations()
        currentScopeRef.current = null
        onScopeChange?.(null)
      }
      return
    }

    if (currentScopeRef.current?.id === scope.id) return
    currentScopeRef.current = scope
    onScopeChange?.(scope)

    // Apply decorations
    try {
      const colors = colorRef.current.getGlowColor(scope, config)
      injectStyles(colors, config)
      const next = editor.deltaDecorations(decorationIds, [
        {
          range: new (window as any).monaco.Range(scope.startLine + 1, 1, scope.endLine + 1, 1),
          options: {
            isWholeLine: true,
            className: `wr-scope-glow-bg`,
            linesDecorationsClassName: `wr-scope-glow-lines`,
            zIndex: 8
          }
        }
      ])
      setDecorationIds(next)
    } catch {}
  }

  const injectStyles = (colors: { primary: string; secondary: string; background: string; border: string }, cfg: ScopeGlowConfig) => {
    const id = 'wr-scope-glow-styles'
    let style = document.getElementById(id)
    const css = `
      .wr-scope-glow-bg {
        background: ${colors.background} !important;
        border-left: 3px solid ${colors.border} !important;
        transition: background ${cfg.fadeInDuration}ms ease, border-color ${cfg.fadeInDuration}ms ease;
      }
      .wr-scope-glow-lines {
        background: linear-gradient(90deg, ${colors.secondary}33, transparent) !important;
      }
      @keyframes wrScopePulse { 0%{ box-shadow: 0 0 0 0 ${colors.primary}33 } 50%{ box-shadow: 0 0 0 6px ${colors.primary}11 } 100%{ box-shadow: 0 0 0 0 ${colors.primary}33 } }
      .wr-scope-glow-bg { animation: wrScopePulse ${Math.max(600, cfg.animationSpeed)}ms ease-in-out infinite; }
    `
    if (!style) {
      style = document.createElement('style')
      style.id = id
      style.textContent = css
      document.head.appendChild(style)
    } else {
      style.textContent = css
    }
  }

  // Cleanup
  useEffect(() => {
    return () => {
      clearDecorations()
    }
  }, [])

  return null
}


