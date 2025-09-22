export type SpiritType = 'rename' | 'refactor' | 'delete' | 'move'

export interface SpiritPosition {
  line: number
  column: number
  endLine: number
  endColumn: number
}

export interface CodeSpirit {
  id: string
  type: SpiritType
  originalContent: string
  originalPosition: SpiritPosition
  newContent?: string
  newPosition?: SpiritPosition
  timestamp: number
  fadeStartTime: number
  fadeDuration: number
  spiritDuration: number
  intensity: number
  isHovered: boolean
}

export interface DetectedChange {
  type: SpiritType
  content: string
  position: SpiritPosition
  newContent?: string
  newPosition?: SpiritPosition
}

/**
 * Lightweight change tracker that produces "spirits" for deleted/changed lines.
 * Heuristic: line-level diff with sliding window; rename/move collapse to refactor.
 */
export class CodeSpiritTracker {
  private lastContentByModel: Map<string, string> = new Map()

  getChanges(modelId: string, previous: string, current: string): DetectedChange[] {
    this.lastContentByModel.set(modelId, current)
    const oldLines = previous.split('\n')
    const newLines = current.split('\n')
    const changes: DetectedChange[] = []

    // Map line -> first index for quick lookup
    const newLineToIndex = new Map<string, number>()
    newLines.forEach((l, i) => { if (!newLineToIndex.has(l)) newLineToIndex.set(l, i) })

    // Detect deletions and refactors
    for (let i = 0; i < oldLines.length; i++) {
      const line = oldLines[i]
      if (!line.trim()) continue
      const foundAt = newLineToIndex.get(line)
      if (foundAt === undefined) {
        // line deleted or changed; try to find similar line to classify as refactor
        const neighbor = newLines[Math.min(i, newLines.length - 1)] || ''
        const similarity = this.lineSimilarity(line, neighbor)
        const type: SpiritType = similarity > 0.6 ? 'refactor' : 'delete'
        changes.push({
          type,
          content: line,
          position: { line: i + 1, column: 1, endLine: i + 1, endColumn: line.length + 1 },
          newContent: type === 'refactor' ? neighbor : undefined,
          newPosition: type === 'refactor' ? { line: Math.min(i + 1, newLines.length), column: 1, endLine: Math.min(i + 1, newLines.length), endColumn: neighbor.length + 1 } : undefined
        })
      }
    }

    return changes
  }

  createSpirit(change: DetectedChange): CodeSpirit {
    const now = Date.now()
    const baseFade = this.getFadeDuration(change.type)
    return {
      id: `spirit-${now}-${Math.random().toString(36).slice(2, 7)}`,
      type: change.type,
      originalContent: change.content,
      originalPosition: change.position,
      newContent: change.newContent,
      newPosition: change.newPosition,
      timestamp: now,
      fadeStartTime: now + this.getFadeDelay(change.type),
      fadeDuration: baseFade,
      spiritDuration: baseFade + 4000,
      intensity: 1,
      isHovered: false
    }
  }

  private lineSimilarity(a: string, b: string): number {
    if (!a || !b) return 0
    const len = Math.max(a.length, b.length)
    if (len === 0) return 1
    let same = 0
    const min = Math.min(a.length, b.length)
    for (let i = 0; i < min; i++) {
      if (a[i] === b[i]) same++
    }
    return same / len
  }

  private getFadeDelay(type: SpiritType): number {
    switch (type) {
      case 'rename': return 2000
      case 'refactor': return 3000
      case 'move': return 2500
      case 'delete':
      default: return 1500
    }
  }

  private getFadeDuration(type: SpiritType): number {
    switch (type) {
      case 'rename': return 5000
      case 'refactor': return 8000
      case 'move': return 6000
      case 'delete':
      default: return 3000
    }
  }
}


