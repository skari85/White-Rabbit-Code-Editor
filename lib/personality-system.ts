
export type PersonalityMode = 'hex' | 'kex';

export interface PersonalityConfig {
  id: PersonalityMode;
  name: string;
  description: string;
  systemPrompt: string;
  color: string;
  icon: string;
  style: {
    background: string;
    accent: string;
    textColor: string;
  };
}

export const PERSONALITIES: Record<PersonalityMode, PersonalityConfig> = {
  hex: {
    id: 'hex',
    name: 'HEX',
    description: 'Strict, clean code assistant — never over-explains',
    systemPrompt: `You are HEX, a precise and efficient code assistant. Your personality:

- STRICT: Follow best practices religiously
- CLEAN: Write minimal, elegant code
- CONCISE: Never over-explain, get straight to the point
- PROFESSIONAL: Formal tone, no unnecessary chatter
- FOCUSED: One solution, the right solution

When providing code:
- Minimal comments, only for complex logic
- Follow strict coding standards
- Prefer established patterns over creative solutions
- Be direct and authoritative
- No explanations unless specifically asked

Current context: You're helping build a web project. Provide clean, production-ready code.`,
    color: '#6c2fff',
    icon: '🔮',
    style: {
      background: 'linear-gradient(135deg, #6c2fff 0%, #4c1bff 100%)',
      accent: '#6c2fff',
      textColor: '#ffffff'
    }
  },
  kex: {
    id: 'kex',
    name: 'KEX',
    description: 'Wild refactorer, generates weird/creative suggestions or chaotic optimizations',
    systemPrompt: `You are KEX, a chaotic and creative code assistant. Your personality:

- WILD: Suggest unconventional, creative solutions
- EXPERIMENTAL: Try new patterns, bleeding-edge techniques
- CHAOTIC: Multiple approaches, weird optimizations
- PLAYFUL: Casual tone, use emojis and creative language
- INNOVATIVE: Push boundaries, break conventions

When providing code:
- Suggest multiple creative approaches
- Use experimental features and patterns
- Add fun comments and creative variable names
- Explain the "why" behind weird solutions
- Offer chaotic optimizations and refactoring ideas
- Include alternative implementations

Current context: You're helping build a web project. Go wild with creative solutions! 🚀`,
    color: '#00ffe1',
    icon: '⚡',
    style: {
      background: 'linear-gradient(135deg, #00ffe1 0%, #00d4aa 100%)',
      accent: '#00ffe1',
      textColor: '#000000'
    }
  }
};

export interface CodeSuggestion {
  id: string;
  line: number;
  column: number;
  type: 'optimization' | 'refactor' | 'extract' | 'fix' | 'enhance';
  title: string;
  description: string;
  code?: string;
  replacement?: string;
  personality: PersonalityMode;
}

export class PersonalitySystem {
  private currentPersonality: PersonalityMode = 'hex';
  private suggestions: CodeSuggestion[] = [];

  getCurrentPersonality(): PersonalityMode {
    return this.currentPersonality;
  }

  setPersonality(personality: PersonalityMode): void {
    this.currentPersonality = personality;
  }

  setCurrentPersonality(personality: PersonalityMode): void {
    this.currentPersonality = personality;
  }

  togglePersonality(): PersonalityMode {
    this.currentPersonality = this.currentPersonality === 'hex' ? 'kex' : 'hex';
    return this.currentPersonality;
  }

  getPersonalityConfig(personality?: PersonalityMode): PersonalityConfig {
    return PERSONALITIES[personality || this.currentPersonality];
  }

  generateSystemPrompt(personality?: PersonalityMode): string {
    return this.getPersonalityConfig(personality).systemPrompt;
  }

  // Context-aware suggestions
  generateSuggestions(code: string, fileName: string, cursorPosition: { line: number; column: number }): CodeSuggestion[] {
    const suggestions: CodeSuggestion[] = [];
    const lines = code.split('\n');
    const currentLine = lines[cursorPosition.line] || '';

    // HEX suggestions (clean, strict)
    if (this.currentPersonality === 'hex') {
      // Look for optimization opportunities
      if (currentLine.includes('for (let i = 0')) {
        suggestions.push({
          id: `hex-${Date.now()}-1`,
          line: cursorPosition.line,
          column: cursorPosition.column,
          type: 'optimization',
          title: 'Use forEach or map',
          description: 'Replace traditional for loop with functional approach',
          personality: 'hex'
        });
      }

      // Look for function extraction opportunities
      if (currentLine.length > 80) {
        suggestions.push({
          id: `hex-${Date.now()}-2`,
          line: cursorPosition.line,
          column: cursorPosition.column,
          type: 'extract',
          title: 'Extract to function',
          description: 'Line too long, consider extracting logic',
          personality: 'hex'
        });
      }
    }

    // KEX suggestions (wild, creative)
    if (this.currentPersonality === 'kex') {
      // Look for creative refactoring opportunities
      if (currentLine.includes('useState')) {
        suggestions.push({
          id: `kex-${Date.now()}-1`,
          line: cursorPosition.line,
          column: cursorPosition.column,
          type: 'enhance',
          title: '🚀 Try useReducer instead!',
          description: 'Complex state? Let\'s go WILD with useReducer + immer!',
          personality: 'kex'
        });
      }

      // Look for performance chaos
      if (currentLine.includes('.map(') && currentLine.includes('.filter(')) {
        suggestions.push({
          id: `kex-${Date.now()}-2`,
          line: cursorPosition.line,
          column: cursorPosition.column,
          type: 'optimization',
          title: '⚡ CHAOS OPTIMIZATION',
          description: 'Combine map+filter into reduce for MAXIMUM PERFORMANCE!',
          personality: 'kex'
        });
      }
    }

    this.suggestions = suggestions;
    return suggestions;
  }

  getSuggestions(): CodeSuggestion[] {
    return this.suggestions;
  }

  clearSuggestions(): void {
    this.suggestions = [];
  }
}

export const personalitySystem = new PersonalitySystem();
