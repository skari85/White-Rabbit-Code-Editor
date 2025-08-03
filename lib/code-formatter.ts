// Code formatting service with Prettier-like functionality
// Note: This is a simplified implementation. In production, you'd use actual Prettier/ESLint

export interface FormatOptions {
  tabWidth: number;
  useTabs: boolean;
  semi: boolean;
  singleQuote: boolean;
  trailingComma: 'none' | 'es5' | 'all';
  bracketSpacing: boolean;
  arrowParens: 'avoid' | 'always';
  printWidth: number;
  endOfLine: 'lf' | 'crlf' | 'cr' | 'auto';
}

export interface LintRule {
  id: string;
  name: string;
  description: string;
  severity: 'error' | 'warning' | 'info';
  fixable: boolean;
}

export interface LintIssue {
  rule: string;
  message: string;
  line: number;
  column: number;
  severity: 'error' | 'warning' | 'info';
  fixable: boolean;
  fix?: string;
}

export class CodeFormatter {
  private defaultOptions: FormatOptions = {
    tabWidth: 2,
    useTabs: false,
    semi: true,
    singleQuote: true,
    trailingComma: 'es5',
    bracketSpacing: true,
    arrowParens: 'avoid',
    printWidth: 80,
    endOfLine: 'lf'
  };

  private lintRules: LintRule[] = [
    {
      id: 'no-console',
      name: 'No Console',
      description: 'Disallow console statements',
      severity: 'warning',
      fixable: true
    },
    {
      id: 'no-var',
      name: 'No Var',
      description: 'Require let or const instead of var',
      severity: 'error',
      fixable: true
    },
    {
      id: 'prefer-const',
      name: 'Prefer Const',
      description: 'Require const declarations for variables that are never reassigned',
      severity: 'warning',
      fixable: true
    },
    {
      id: 'no-unused-vars',
      name: 'No Unused Variables',
      description: 'Disallow unused variables',
      severity: 'warning',
      fixable: false
    },
    {
      id: 'semi',
      name: 'Semicolons',
      description: 'Require or disallow semicolons',
      severity: 'error',
      fixable: true
    },
    {
      id: 'quotes',
      name: 'Quotes',
      description: 'Enforce consistent quote style',
      severity: 'warning',
      fixable: true
    },
    {
      id: 'indent',
      name: 'Indentation',
      description: 'Enforce consistent indentation',
      severity: 'error',
      fixable: true
    }
  ];

  formatCode(code: string, language: string, options?: Partial<FormatOptions>): string {
    const opts = { ...this.defaultOptions, ...options };
    
    switch (language) {
      case 'javascript':
      case 'typescript':
        return this.formatJavaScript(code, opts);
      case 'html':
        return this.formatHTML(code, opts);
      case 'css':
        return this.formatCSS(code, opts);
      case 'json':
        return this.formatJSON(code, opts);
      default:
        return code;
    }
  }

  lintCode(code: string, language: string): LintIssue[] {
    switch (language) {
      case 'javascript':
      case 'typescript':
        return this.lintJavaScript(code);
      case 'html':
        return this.lintHTML(code);
      case 'css':
        return this.lintCSS(code);
      default:
        return [];
    }
  }

  fixLintIssues(code: string, language: string, issues: LintIssue[]): string {
    let fixedCode = code;
    const fixableIssues = issues.filter(issue => issue.fixable).reverse(); // Reverse to fix from bottom up

    for (const issue of fixableIssues) {
      fixedCode = this.applyFix(fixedCode, issue);
    }

    return fixedCode;
  }

  private formatJavaScript(code: string, options: FormatOptions): string {
    let formatted = code;
    
    // Basic formatting rules
    formatted = this.normalizeWhitespace(formatted);
    formatted = this.formatIndentation(formatted, options);
    formatted = this.formatSemicolons(formatted, options);
    formatted = this.formatQuotes(formatted, options);
    formatted = this.formatSpacing(formatted, options);
    formatted = this.formatLineBreaks(formatted, options);
    
    return formatted;
  }

  private formatHTML(code: string, options: FormatOptions): string {
    let formatted = code;
    
    // Basic HTML formatting
    formatted = this.normalizeWhitespace(formatted);
    formatted = this.formatHTMLIndentation(formatted, options);
    formatted = this.formatHTMLAttributes(formatted, options);
    
    return formatted;
  }

  private formatCSS(code: string, options: FormatOptions): string {
    let formatted = code;
    
    // Basic CSS formatting
    formatted = this.normalizeWhitespace(formatted);
    formatted = this.formatCSSIndentation(formatted, options);
    formatted = this.formatCSSProperties(formatted, options);
    
    return formatted;
  }

  private formatJSON(code: string, options: FormatOptions): string {
    try {
      const parsed = JSON.parse(code);
      const indent = options.useTabs ? '\t' : ' '.repeat(options.tabWidth);
      return JSON.stringify(parsed, null, indent);
    } catch (error) {
      return code; // Return original if invalid JSON
    }
  }

  private lintJavaScript(code: string): LintIssue[] {
    const issues: LintIssue[] = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      // Check for console statements
      if (line.includes('console.')) {
        issues.push({
          rule: 'no-console',
          message: 'Unexpected console statement',
          line: lineNumber,
          column: line.indexOf('console.') + 1,
          severity: 'warning',
          fixable: true,
          fix: line.replace(/console\.[^;]+;?\s*/, '')
        });
      }

      // Check for var usage
      const varMatch = line.match(/\bvar\s+/);
      if (varMatch) {
        issues.push({
          rule: 'no-var',
          message: 'Unexpected var, use let or const instead',
          line: lineNumber,
          column: varMatch.index! + 1,
          severity: 'error',
          fixable: true,
          fix: line.replace(/\bvar\b/, 'let')
        });
      }

      // Check for missing semicolons
      const needsSemi = /^[^\/\*]*[^;\s\{\}]\s*$/.test(line.trim()) && 
                       line.trim() && 
                       !line.trim().startsWith('//') &&
                       !line.trim().endsWith('{') &&
                       !line.trim().endsWith('}');
      
      if (needsSemi) {
        issues.push({
          rule: 'semi',
          message: 'Missing semicolon',
          line: lineNumber,
          column: line.length,
          severity: 'error',
          fixable: true,
          fix: line + ';'
        });
      }

      // Check for quote consistency
      const doubleQuotes = (line.match(/"/g) || []).length;
      const singleQuotes = (line.match(/'/g) || []).length;
      
      if (doubleQuotes > 0 && singleQuotes === 0) {
        issues.push({
          rule: 'quotes',
          message: 'Strings must use single quotes',
          line: lineNumber,
          column: line.indexOf('"') + 1,
          severity: 'warning',
          fixable: true,
          fix: line.replace(/"/g, "'")
        });
      }
    });

    return issues;
  }

  private lintHTML(code: string): LintIssue[] {
    const issues: LintIssue[] = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      // Check for missing alt attributes on images
      if (line.includes('<img') && !line.includes('alt=')) {
        issues.push({
          rule: 'img-alt',
          message: 'Missing alt attribute on img element',
          line: lineNumber,
          column: line.indexOf('<img') + 1,
          severity: 'warning',
          fixable: false
        });
      }

      // Check for inline styles
      if (line.includes('style=')) {
        issues.push({
          rule: 'no-inline-styles',
          message: 'Avoid inline styles, use CSS classes instead',
          line: lineNumber,
          column: line.indexOf('style=') + 1,
          severity: 'info',
          fixable: false
        });
      }
    });

    return issues;
  }

  private lintCSS(code: string): LintIssue[] {
    const issues: LintIssue[] = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      const lineNumber = index + 1;
      
      // Check for missing semicolons in CSS
      if (line.includes(':') && !line.includes(';') && !line.includes('{') && !line.includes('}')) {
        issues.push({
          rule: 'css-semi',
          message: 'Missing semicolon in CSS property',
          line: lineNumber,
          column: line.length,
          severity: 'error',
          fixable: true,
          fix: line + ';'
        });
      }
    });

    return issues;
  }

  private applyFix(code: string, issue: LintIssue): string {
    if (!issue.fix) return code;
    
    const lines = code.split('\n');
    if (issue.line <= lines.length) {
      lines[issue.line - 1] = issue.fix;
    }
    
    return lines.join('\n');
  }

  private normalizeWhitespace(code: string): string {
    return code.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  }

  private formatIndentation(code: string, options: FormatOptions): string {
    const lines = code.split('\n');
    const indent = options.useTabs ? '\t' : ' '.repeat(options.tabWidth);
    let indentLevel = 0;
    
    return lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      
      // Decrease indent for closing braces
      if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith(')')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }
      
      const formatted = indent.repeat(indentLevel) + trimmed;
      
      // Increase indent for opening braces
      if (trimmed.endsWith('{') || trimmed.endsWith('[') || trimmed.endsWith('(')) {
        indentLevel++;
      }
      
      return formatted;
    }).join('\n');
  }

  private formatSemicolons(code: string, options: FormatOptions): string {
    if (!options.semi) return code;
    
    // Add semicolons where missing (simplified)
    return code.replace(/([^;\s\{\}])\s*\n/g, '$1;\n');
  }

  private formatQuotes(code: string, options: FormatOptions): string {
    const quote = options.singleQuote ? "'" : '"';
    const otherQuote = options.singleQuote ? '"' : "'";
    
    // Simple quote replacement (would need more sophisticated parsing in production)
    return code.replace(new RegExp(otherQuote, 'g'), quote);
  }

  private formatSpacing(code: string, options: FormatOptions): string {
    let formatted = code;
    
    if (options.bracketSpacing) {
      formatted = formatted.replace(/\{([^\s])/g, '{ $1');
      formatted = formatted.replace(/([^\s])\}/g, '$1 }');
    }
    
    return formatted;
  }

  private formatLineBreaks(code: string, options: FormatOptions): string {
    // Ensure proper line breaks (simplified)
    return code.replace(/;\s*([a-zA-Z])/g, ';\n$1');
  }

  private formatHTMLIndentation(code: string, options: FormatOptions): string {
    // Simplified HTML indentation
    const indent = options.useTabs ? '\t' : ' '.repeat(options.tabWidth);
    let indentLevel = 0;
    
    return code.split('\n').map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      
      if (trimmed.startsWith('</')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }
      
      const formatted = indent.repeat(indentLevel) + trimmed;
      
      if (trimmed.startsWith('<') && !trimmed.startsWith('</') && !trimmed.endsWith('/>')) {
        indentLevel++;
      }
      
      return formatted;
    }).join('\n');
  }

  private formatHTMLAttributes(code: string, options: FormatOptions): string {
    // Format HTML attributes (simplified)
    return code.replace(/\s+=/g, '=').replace(/=\s+/g, '=');
  }

  private formatCSSIndentation(code: string, options: FormatOptions): string {
    const indent = options.useTabs ? '\t' : ' '.repeat(options.tabWidth);
    let indentLevel = 0;
    
    return code.split('\n').map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      
      if (trimmed === '}') {
        indentLevel = Math.max(0, indentLevel - 1);
      }
      
      const formatted = indent.repeat(indentLevel) + trimmed;
      
      if (trimmed.endsWith('{')) {
        indentLevel++;
      }
      
      return formatted;
    }).join('\n');
  }

  private formatCSSProperties(code: string, options: FormatOptions): string {
    // Format CSS properties (simplified)
    return code.replace(/:\s*/g, ': ').replace(/;\s*/g, '; ');
  }
}
