"use client"

import { CodeSpirit, CodeSpiritTracker } from '@/lib/code-spirits'
import { useCallback, useEffect, useRef, useState } from 'react'

interface MonacoSpiritsExtensionProps {
  editor: any
  enabled?: boolean
}

export function MonacoSpiritsExtension({ editor, enabled = true }: MonacoSpiritsExtensionProps) {
  const trackerRef = useRef<CodeSpiritTracker | null>(null)
  const [spirits, setSpirits] = useState<CodeSpirit[]>([])
  const decorationsRef = useRef<string[]>([])
  const styleInjectedRef = useRef(false)

  // Inject minimal CSS once
  const injectCss = useCallback(() => {
    if (styleInjectedRef.current) return
    const id = 'wr-spirits-styles'
    if (document.getElementById(id)) {
      styleInjectedRef.current = true
      return
    }
    const style = document.createElement('style')
    style.id = id
    style.textContent = `
      .wr-spirit-line { position: relative; background-image: linear-gradient(90deg, rgba(255,255,255,0.05), transparent); }
      .wr-spirit-glyph { background: radial-gradient(circle, rgba(255,255,255,0.25), transparent); border-radius: 50%; width: 6px; height: 6px; }
      @keyframes wrSpiritFade { from { opacity: 0.7 } to { opacity: 0 } }
    `
    document.head.appendChild(style)
    styleInjectedRef.current = true
  }, [])

  // Setup change listener
  useEffect(() => {
    if (!editor || !enabled) return
    injectCss()
    if (!trackerRef.current) trackerRef.current = new CodeSpiritTracker()

    const model = editor.getModel?.()
    const modelId = model?.id || 'default'
    let lastValue: string = model?.getValue?.() || ''

    const dispose = editor.onDidChangeModelContent(() => {
      try {
        const current = editor.getValue()
        if (current === lastValue) return
        const changes = trackerRef.current!.getChanges(modelId, lastValue, current)
        lastValue = current
        if (changes.length === 0) return
        const newSpirits = changes.map(ch => trackerRef.current!.createSpirit(ch))
        setSpirits(prev => [...prev, ...newSpirits])
      } catch {}
    })

    return () => dispose?.dispose?.()
  }, [editor, enabled, injectCss])

  // Render spirits as decorations
  useEffect(() => {
    if (!editor) return
    const now = Date.now()
    const active = spirits.filter(s => now - s.timestamp < s.spiritDuration)
    if (active.length !== spirits.length) setSpirits(active)

    try {
      const monaco = (window as any).monaco
      const decos = active.map(spirit => ({
        range: new monaco.Range(spirit.originalPosition.line, 1, spirit.originalPosition.line, 1),
        options: {
          isWholeLine: true,
          className: 'wr-spirit-line',
          linesDecorationsClassName: 'wr-spirit-glyph',
          hoverMessage: { value: `Ghost of ${spirit.type}: ${escapeForHover(spirit.originalContent)}` },
          zIndex: 3
        }
      }))
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, decos)
    } catch {}
  }, [editor, spirits])

  return null
}

function escapeForHover(text: string): string {
  // Limit and sanitize
  const safe = text.replace(/`/g, '\\`').replace(/\*/g, '\\*')
  return safe.length > 120 ? `${safe.slice(0, 120)}…` : safe
}


