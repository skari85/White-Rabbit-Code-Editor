export interface PromptOptimization {
  original: string;
  optimized: string;
  improvements: string[];
  confidence: number;
}

export class PromptOptimizer {
  private static readonly OPTIMIZATION_RULES = [
    {
      name: 'Add Context',
      pattern: /^(?!.*context|background|scenario)(.{1,50})$/i,
      improvement: 'Add context about your project or specific requirements',
      transform: (text: string) => `Context: I'm working on a web development project. ${text}`
    },
    {
      name: 'Be Specific',
      pattern: /\b(help|fix|make|create|build)\b(?!\s+\w+\s+\w+)/i,
      improvement: 'Be more specific about what you want to achieve',
      transform: (text: string) => text.replace(
        /\b(help|fix|make|create|build)\b/gi,
        (match) => `${match} specifically`
      )
    },
    {
      name: 'Add Programming Language',
      pattern: /(?:code|function|script|program)(?!.*\b(?:javascript|typescript|python|react|html|css|js|ts)\b)/i,
      improvement: 'Specify the programming language or framework',
      transform: (text: string) => `${text} (using JavaScript/TypeScript)`
    },
    {
      name: 'Request Examples',
      pattern: /^(?!.*example|sample|demo)(.+)$/i,
      improvement: 'Ask for examples to better understand the solution',
      transform: (text: string) => `${text}. Please provide examples.`
    },
    {
      name: 'Add Error Details',
      pattern: /\b(?:error|bug|issue|problem|broken|not working)\b(?!.*error message|stack trace|console)/i,
      improvement: 'Include error messages or specific symptoms',
      transform: (text: string) => `${text}. Please include any error messages or console output.`
    },
    {
      name: 'Structure Request',
      pattern: /^(?!.*step|steps|how to)(.{30,})$/i,
      improvement: 'Ask for step-by-step instructions',
      transform: (text: string) => `Please provide step-by-step instructions for: ${text}`
    }
  ];

  static optimizePrompt(originalPrompt: string): PromptOptimization {
    if (!originalPrompt.trim()) {
      return {
        original: originalPrompt,
        optimized: originalPrompt,
        improvements: ['Please enter a prompt to optimize'],
        confidence: 0
      };
    }

    let optimizedPrompt = originalPrompt.trim();
    const improvements: string[] = [];
    let confidence = 0.5; // Base confidence

    // Apply optimization rules
    for (const rule of this.OPTIMIZATION_RULES) {
      if (rule.pattern.test(originalPrompt)) {
        optimizedPrompt = rule.transform(optimizedPrompt);
        improvements.push(rule.improvement);
        confidence += 0.1;
      }
    }

    // Additional optimizations
    optimizedPrompt = this.addStructure(optimizedPrompt);
    optimizedPrompt = this.improveClarity(optimizedPrompt);
    
    // Cap confidence at 1.0
    confidence = Math.min(confidence, 1.0);

    return {
      original: originalPrompt,
      optimized: optimizedPrompt,
      improvements,
      confidence
    };
  }

  private static addStructure(prompt: string): string {
    // Add structure if prompt is long and unstructured
    if (prompt.length > 100 && !prompt.includes('\n') && !prompt.includes('1.') && !prompt.includes('-')) {
      const sentences = prompt.split(/[.!?]+/).filter(s => s.trim().length > 0);
      if (sentences.length > 2) {
        return sentences.map((sentence, index) => `${index + 1}. ${sentence.trim()}`).join('\n');
      }
    }
    return prompt;
  }

  private static improveClarity(prompt: string): string {
    // Replace vague terms with more specific ones
    const clarifications = {
      'thing': 'component',
      'stuff': 'elements',
      'make it work': 'implement the functionality',
      'fix this': 'resolve the issue',
      'better': 'more efficient/user-friendly',
      'good': 'optimal/best practice'
    };

    let improved = prompt;
    for (const [vague, specific] of Object.entries(clarifications)) {
      const regex = new RegExp(`\\b${vague}\\b`, 'gi');
      improved = improved.replace(regex, specific);
    }

    return improved;
  }

  static generatePromptSuggestions(context: 'coding' | 'debugging' | 'design' | 'general' = 'general'): string[] {
    const suggestions = {
      coding: [
        "Create a React component that...",
        "Write a function that takes... and returns...",
        "Implement a feature that allows users to...",
        "Build a responsive layout with...",
        "Add error handling for..."
      ],
      debugging: [
        "I'm getting this error: [paste error message]. How do I fix it?",
        "My code isn't working as expected. Here's what I'm trying to do: ...",
        "The console shows: [error]. What's causing this?",
        "This function should... but instead it...",
        "I'm having trouble with... Here's my current code: ..."
      ],
      design: [
        "Design a user interface for...",
        "Create a color scheme that...",
        "Suggest layout improvements for...",
        "Make this design more accessible by...",
        "Optimize the user experience for..."
      ],
      general: [
        "Explain how to... step by step",
        "What's the best practice for...",
        "Compare different approaches to...",
        "Help me understand... with examples",
        "Suggest improvements for..."
      ]
    };

    return suggestions[context] || suggestions.general;
  }
}

export const promptTemplates = {
  codeRequest: "Create a {language} {type} that {functionality}. Please include:\n1. Complete code implementation\n2. Usage examples\n3. Error handling\n4. Comments explaining key parts",
  
  debugging: "I'm experiencing {issue} in my {language} code. Here's the relevant code:\n\n```{language}\n{code}\n```\n\nError message: {error}\n\nExpected behavior: {expected}\nActual behavior: {actual}",
  
  optimization: "Please review and optimize this {language} code for {criteria}:\n\n```{language}\n{code}\n```\n\nSpecific areas to focus on:\n1. {area1}\n2. {area2}\n3. {area3}",
  
  explanation: "Please explain {concept} in {language} with:\n1. Clear definition\n2. Practical examples\n3. Common use cases\n4. Best practices\n5. Potential pitfalls to avoid"
};
