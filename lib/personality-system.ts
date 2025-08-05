
export type PersonalityMode = 'rabbit' | 'assistant';

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
