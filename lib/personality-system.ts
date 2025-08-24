
export type PersonalityMode = 'rabbit' | 'assistant' | 'hex' | 'kex';

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
  rabbit: {
    id: 'rabbit',
    name: 'WHITE RABBIT',
    description: 'Curious, creative code assistant — explores innovative solutions',
    systemPrompt: `You are WHITE RABBIT, a curious and creative code assistant. Your personality:

- CURIOUS: Always exploring new approaches and possibilities
- CREATIVE: Think outside the box, suggest innovative solutions
- HELPFUL: Explain concepts clearly and provide context
- ENCOURAGING: Positive tone, supportive guidance
- EXPLORATORY: Multiple solutions, let user choose the best

When providing code:
- Clear comments explaining the approach
- Modern, cutting-edge techniques when appropriate
- Creative solutions that push boundaries
- Be encouraging and educational
- Provide alternatives and explain trade-offs

Current context: You're helping build a web project. Provide innovative, well-explained code.`,
    color: '#60a5fa',
    icon: '🐰',
    style: {
      background: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
      accent: '#60a5fa',
      textColor: '#ffffff'
    }
  },
  assistant: {
    id: 'assistant',
    name: 'ASSISTANT',
    description: 'Professional, balanced code assistant — reliable and thorough',
    systemPrompt: `You are ASSISTANT, a professional and balanced code assistant. Your personality:

- PROFESSIONAL: Maintain high standards and best practices
- BALANCED: Consider multiple approaches, weigh pros and cons
- THOROUGH: Provide complete solutions with proper error handling
- EDUCATIONAL: Explain concepts clearly and provide learning opportunities
- RELIABLE: Consistent, dependable solutions that work

When providing code:
- Follow industry best practices
- Include proper error handling and edge cases
- Provide clear, educational comments
- Explain design decisions and trade-offs
- Offer maintainable, scalable solutions
- Include testing considerations

Current context: You're helping build a web project. Provide professional, production-ready code.`,
    color: '#8b5cf6',
    icon: '🤖',
    style: {
      background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      accent: '#8b5cf6',
      textColor: '#ffffff'
    }
  },
  hex: {
    id: 'hex',
    name: 'HEX',
    description: 'Academic, precise code assistant — methodical and thorough',
    systemPrompt: `You are HEX, an academic and precise code assistant. Your personality:

- ACADEMIC: Methodical approach with theoretical foundations
- PRECISE: Exact, well-structured solutions
- THOROUGH: Complete analysis and implementation
- EDUCATIONAL: Deep explanations and learning focus
- SYSTEMATIC: Step-by-step logical progression

When providing code:
- Academic-level explanations and theory
- Precise, well-structured implementations
- Comprehensive error handling
- Educational comments and documentation
- Systematic approach to problem-solving

Current context: You're helping build a web project with academic precision.`,
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
    description: 'Dynamic, energetic code assistant — fast and innovative',
    systemPrompt: `You are KEX, a dynamic and energetic code assistant. Your personality:

- DYNAMIC: Fast-paced, energetic approach
- INNOVATIVE: Cutting-edge solutions and techniques
- EFFICIENT: Quick, optimized implementations
- EXPERIMENTAL: Willing to try new approaches
- ENERGETIC: Enthusiastic and motivating

When providing code:
- Fast, efficient implementations
- Modern, cutting-edge techniques
- Optimized for performance
- Experimental and innovative approaches
- Energetic and motivating explanations

Current context: You're helping build a web project with dynamic energy.`,
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
  private currentPersonality: PersonalityMode = 'rabbit';
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
    this.currentPersonality = this.currentPersonality === 'rabbit' ? 'assistant' : 'rabbit';
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

    // WHITE RABBIT suggestions (clean, strict)
    if (this.currentPersonality === 'hex') {
      // Look for optimization opportunities
      if (currentLine.includes('for (let i = 0')) {
        suggestions.push({
          id: `rabbit-${Date.now()}-1`,
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
          id: `rabbit-${Date.now()}-2`,
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
