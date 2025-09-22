export type ScopeType = 'function' | 'class' | 'interface' | 'loop' | 'conditional' | 'block'

export interface CodeScope {
  id: string
  type: ScopeType
  name: string
  startLine: number
  endLine: number
  depth: number
  parentScope?: string
  children: string[]
  language: string
  signature: string
}

export interface ScopeGlowConfig {
  enabled: boolean
  intensity: number // 0..1
  colorScheme: 'depth-based' | 'type-based' | 'hybrid'
  animationSpeed: number // ms
  fadeInDuration: number // ms
  fadeOutDuration: number // ms
}

/**
 * Lightweight scope detection engine.
 * - Parses common scope constructs for JS/TS/Python
 * - Uses brace tracking (JS/TS) and indentation (Python) to find end lines
 */
export class ScopeDetectionEngine {
  private scopes: Map<string, CodeScope> = new Map()

  parseScopes(code: string, language: string): CodeScope[] {
    const lines = code.split('\n')
    const scopes: CodeScope[] = []
    const stack: CodeScope[] = []
    let counter = 0

    const lang = (language || 'javascript').toLowerCase()

    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i]
      const line = raw.trim()
      const depth = stack.length

      const maybe = this.detectScopeAtLine(line, i, lang, depth, stack)
      if (maybe) {
        // Ensure correct parent relation for nested scopes
        while (stack.length > 0 && stack[stack.length - 1].startLine === i) {
          stack.pop()
        }

        if (stack.length > 0) {
          maybe.parentScope = stack[stack.length - 1].id
          stack[stack.length - 1].children.push(maybe.id)
        }

        scopes.push(maybe)
        stack.push(maybe)
        counter++
      }

      // Close blocks on '}' for JS/TS quick heuristic
      if ((lang === 'javascript' || lang === 'typescript') && raw.includes('}')) {
        // Pop while block depth decreases
        while (stack.length > 0) {
          const top = stack[stack.length - 1]
          // Assign end line if not set
          if (top.endLine < i) top.endLine = i
          // Heuristic: if this line looks like the end of current block
          // we will not strictly match braces here (done later by findEndLine)
          break
        }
      }
    }

    // Finalize end lines
    scopes.forEach(scope => {
      scope.endLine = this.findScopeEndLine(lines, scope.startLine, lang)
    })

    this.scopes = new Map(scopes.map(s => [s.id, s]))
    return scopes
  }

  getScopeAtPosition(line: number, _column: number): CodeScope | null {
    // Monaco is 1-based; our storage is 0-based
    const zeroBased = line - 1
    let best: CodeScope | null = null
    for (const scope of this.scopes.values()) {
      if (zeroBased >= scope.startLine && zeroBased <= scope.endLine) {
        if (!best) {
          best = scope
        } else {
          // Prefer the most deeply nested scope
          best = scope.depth >= best.depth ? scope : best
        }
      }
    }
    return best
  }

  private detectScopeAtLine(
    line: string,
    lineIndex: number,
    language: string,
    depth: number,
    stack: CodeScope[]
  ): CodeScope | null {
    const id = `scope-${lineIndex}-${Math.random().toString(36).slice(2, 7)}`

    if (language === 'python') {
      // def foo(...):
      let m = line.match(/^(async\s+)?def\s+(\w+)\s*\(/)
      if (m) return this.makeScope(id, 'function', m[2], lineIndex, depth, language, line)

      // class Foo:
      m = line.match(/^class\s+(\w+)/)
      if (m) return this.makeScope(id, 'class', m[1], lineIndex, depth, language, line)

      // loops
      if (/^(for|while)\s+/.test(line)) {
        return this.makeScope(id, 'loop', '(loop)', lineIndex, depth, language, line)
      }
      // conditionals
      if (/^(if|elif|else)\b/.test(line)) {
        return this.makeScope(id, 'conditional', '(branch)', lineIndex, depth, language, line)
      }
      return null
    }

    // JS/TS
    // function foo(
    let m = line.match(/^(export\s+)?(async\s+)?function\s+(\w+)\s*\(/)
    if (m) return this.makeScope(id, 'function', m[3], lineIndex, depth, language, line)

    // const foo = (..) =>
    m = line.match(/^(export\s+)?(const|let|var)\s+(\w+)\s*=\s*(async\s+)?\(/)
    if (m) return this.makeScope(id, 'function', m[3], lineIndex, depth, language, line)

    // class Foo
    m = line.match(/^(export\s+)?class\s+(\w+)/)
    if (m) return this.makeScope(id, 'class', m[2], lineIndex, depth, language, line)

    // interface Foo
    m = line.match(/^(export\s+)?interface\s+(\w+)/)
    if (m) return this.makeScope(id, 'interface', m[2], lineIndex, depth, language, line)

    // loops
    if (/^(for|while|do)\b/.test(line)) {
      return this.makeScope(id, 'loop', '(loop)', lineIndex, depth, language, line)
    }
    // conditionals
    if (/^(if|else\s+if|switch)\b/.test(line)) {
      return this.makeScope(id, 'conditional', '(branch)', lineIndex, depth, language, line)
    }
    // generic block start
    if (line.endsWith('{')) {
      return this.makeScope(id, 'block', '(block)', lineIndex, depth, language, line)
    }

    return null
  }

  private makeScope(
    id: string,
    type: ScopeType,
    name: string,
    startLine: number,
    depth: number,
    language: string,
    signature: string
  ): CodeScope {
    return {
      id,
      type,
      name,
      startLine,
      endLine: startLine,
      depth,
      parentScope: undefined,
      children: [],
      language,
      signature
    }
  }

  private findScopeEndLine(lines: string[], startLine: number, language: string): number {
    if (language === 'python') {
      const startIndent = this.getIndent(lines[startLine])
      for (let i = startLine + 1; i < lines.length; i++) {
        const l = lines[i]
        if (l.trim() === '') continue
        const indent = this.getIndent(l)
        if (indent <= startIndent) return i - 1
      }
      return lines.length - 1
    }

    // JS/TS: brace tracking
    let depth = 0
    let seenOpen = false
    for (let i = startLine; i < lines.length; i++) {
      const l = lines[i]
      const opens = (l.match(/\{/g) || []).length
      const closes = (l.match(/\}/g) || []).length
      depth += opens
      if (opens > 0) seenOpen = true
      depth -= closes
      if (seenOpen && depth === 0) return i
    }
    return lines.length - 1
  }

  private getIndent(line: string): number {
    const m = line.match(/^\s*/)
    return m ? m[0].length : 0
  }
}


