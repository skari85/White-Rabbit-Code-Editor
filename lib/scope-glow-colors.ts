import type { CodeScope, ScopeGlowConfig, ScopeType } from './scope-detection-engine'

export interface GlowColor {
  primary: string
  secondary: string
  background: string
  border: string
}

const TYPE_COLORS: Record<ScopeType, GlowColor> = {
  function: {
    primary: '#3b82f6',
    secondary: '#60a5fa',
    background: 'rgba(59,130,246,0.10)',
    border: 'rgba(59,130,246,0.35)'
  },
  class: {
    primary: '#10b981',
    secondary: '#34d399',
    background: 'rgba(16,185,129,0.10)',
    border: 'rgba(16,185,129,0.35)'
  },
  interface: {
    primary: '#8b5cf6',
    secondary: '#a78bfa',
    background: 'rgba(139,92,246,0.10)',
    border: 'rgba(139,92,246,0.35)'
  },
  loop: {
    primary: '#f59e0b',
    secondary: '#fbbf24',
    background: 'rgba(245,158,11,0.10)',
    border: 'rgba(245,158,11,0.35)'
  },
  conditional: {
    primary: '#ef4444',
    secondary: '#f87171',
    background: 'rgba(239,68,68,0.10)',
    border: 'rgba(239,68,68,0.35)'
  },
  block: {
    primary: '#6b7280',
    secondary: '#9ca3af',
    background: 'rgba(107,114,128,0.08)',
    border: 'rgba(107,114,128,0.30)'
  }
}

const DEPTH_MODIFIERS = [
  { mult: 1.00, alpha: 1.00 },
  { mult: 0.92, alpha: 0.90 },
  { mult: 0.85, alpha: 0.80 },
  { mult: 0.78, alpha: 0.70 },
  { mult: 0.72, alpha: 0.60 }
]

export class ScopeGlowColorSystem {
  getGlowColor(scope: CodeScope, config: ScopeGlowConfig): GlowColor {
    const base = TYPE_COLORS[scope.type] || TYPE_COLORS.block
    if (config.colorScheme === 'type-based') return base

    const depthIdx = Math.min(scope.depth, DEPTH_MODIFIERS.length - 1)
    const { mult, alpha } = DEPTH_MODIFIERS[depthIdx]

    const adjust = (hex: string): string => this.adjustBrightness(hex, mult)
    const adjustAlpha = (rgba: string): string => this.scaleRgbaAlpha(rgba, alpha)

    // hybrid and depth-based both apply depth modifiers
    return {
      primary: adjust(base.primary),
      secondary: adjust(base.secondary),
      background: adjustAlpha(base.background),
      border: adjustAlpha(base.border)
    }
  }

  private adjustBrightness(hex: string, mult: number): string {
    const { r, g, b } = this.hexToRgb(hex)
    const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)))
    const nr = clamp(r * mult)
    const ng = clamp(g * mult)
    const nb = clamp(b * mult)
    return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`
  }

  private scaleRgbaAlpha(rgba: string, mult: number): string {
    const m = rgba.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([0-9.]+)\)/)
    if (!m) return rgba
    const a = Math.max(0, Math.min(1, parseFloat(m[4]) * mult))
    return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${a})`
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const clean = hex.replace('#', '')
    const bigint = parseInt(clean, 16)
    const r = (bigint >> 16) & 255
    const g = (bigint >> 8) & 255
    const b = bigint & 255
    return { r, g, b }
  }
}


