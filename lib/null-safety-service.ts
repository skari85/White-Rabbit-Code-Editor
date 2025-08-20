export interface NullSafetyIssue {
  id: string;
  type: 'property-chain' | 'method-call' | 'array-access';
  severity: 'high' | 'medium' | 'low';
  message: string;
  description: string;
  line: number;
  column: number;
  endColumn: number;
  code: string;
  suggestedFix: string;
  file: string;
}

export interface NullSafetyRefactoring {
  id: string;
  type: 'add-optional-chaining';
  title: string;
  description: string;
  changes: NullSafetyChange[];
  safe: boolean;
  reversible: boolean;
}

export interface NullSafetyChange {
  file: string;
  line: number;
  column: number;
  endColumn: number;
  oldText: string;
  newText: string;
}

export class NullSafetyService {
  private static readonly PROPERTY_CHAIN_REGEX = /(\w+(?:\.\w+){2,})/g;
  private static readonly METHOD_CALL_REGEX = /(\w+(?:\.\w+)*\.[a-zA-Z_$][\w$]*\s*\()/g;
  private static readonly ARRAY_ACCESS_REGEX = /(\w+(?:\.\w+)*\[[^\]]+\])/g;

  /**
   * Detects potential null-safety issues in code
   */
  static detectIssues(code: string, file: string): NullSafetyIssue[] {
    const issues: NullSafetyIssue[] = [];
    const lines = code.split('\n');

    lines.forEach((line, lineIndex) => {
      const lineNumber = lineIndex + 1;
      
      // Detect property chains (e.g., a.b.c)
      this.detectPropertyChains(line, lineNumber, file, issues);
      
      // Detect method calls (e.g., a.b.c.method())
      this.detectMethodCalls(line, lineNumber, file, issues);
      
      // Detect array access (e.g., a.b.c[0])
      this.detectArrayAccess(line, lineNumber, file, issues);
    });

    return issues;
  }

  /**
   * Detects property chains that could benefit from optional chaining
   */
  private static detectPropertyChains(
    line: string, 
    lineNumber: number, 
    file: string, 
    issues: NullSafetyIssue[]
  ): void {
    const matches = line.matchAll(this.PROPERTY_CHAIN_REGEX);
    
    for (const match of matches) {
      const fullMatch = match[0];
      const startColumn = match.index! + 1;
      const endColumn = startColumn + fullMatch.length;
      
      // Skip if already has optional chaining
      if (fullMatch.includes('?.')) continue;
      
      // Skip if it's a function call or assignment
      if (fullMatch.includes('(') || fullMatch.includes('=')) continue;
      
      // Skip if it's a string literal or comment
      if (this.isInStringOrComment(line, startColumn - 1)) continue;

      const suggestedFix = fullMatch.replace(/\./g, '?.');
      
      issues.push({
        id: `${file}-${lineNumber}-${startColumn}-property-chain`,
        type: 'property-chain',
        severity: 'high',
        message: `Property chain "${fullMatch}" could cause runtime error`,
        description: `Accessing nested properties without null checks can cause "Cannot read properties of undefined" errors. Consider using optional chaining (?.) for safer access.`,
        line: lineNumber,
        column: startColumn,
        endColumn,
        code: fullMatch,
        suggestedFix,
        file
      });
    }
  }

  /**
   * Detects method calls that could benefit from optional chaining
   */
  private static detectMethodCalls(
    line: string, 
    lineNumber: number, 
    file: string, 
    issues: NullSafetyIssue[]
  ): void {
    const matches = line.matchAll(this.METHOD_CALL_REGEX);
    
    for (const match of matches) {
      const fullMatch = match[0];
      const startColumn = match.index! + 1;
      const endColumn = startColumn + fullMatch.length;
      
      // Skip if already has optional chaining
      if (fullMatch.includes('?.')) continue;
      
      // Skip if it's a string literal or comment
      if (this.isInStringOrComment(line, startColumn - 1)) continue;

      const suggestedFix = fullMatch.replace(/\./g, '?.');
      
      issues.push({
        id: `${file}-${lineNumber}-${startColumn}-method-call`,
        type: 'method-call',
        severity: 'high',
        message: `Method call "${fullMatch}" could cause runtime error`,
        description: `Calling methods on potentially null/undefined objects can cause runtime errors. Use optional chaining (?.) to safely call methods.`,
        line: lineNumber,
        column: startColumn,
        endColumn,
        code: fullMatch,
        suggestedFix,
        file
      });
    }
  }

  /**
   * Detects array access that could benefit from optional chaining
   */
  private static detectArrayAccess(
    line: string, 
    lineNumber: number, 
    file: string, 
    issues: NullSafetyIssue[]
  ): void {
    const matches = line.matchAll(this.ARRAY_ACCESS_REGEX);
    
    for (const match of matches) {
      const fullMatch = match[0];
      const startColumn = match.index! + 1;
      const endColumn = startColumn + fullMatch.length;
      
      // Skip if already has optional chaining
      if (fullMatch.includes('?.')) continue;
      
      // Skip if it's a string literal or comment
      if (this.isInStringOrComment(line, startColumn - 1)) continue;

      const suggestedFix = fullMatch.replace(/\./g, '?.');
      
      issues.push({
        id: `${file}-${lineNumber}-${startColumn}-array-access`,
        type: 'array-access',
        severity: 'medium',
        message: `Array access "${fullMatch}" could cause runtime error`,
        description: `Accessing array elements on potentially null/undefined objects can cause runtime errors. Use optional chaining (?.) for safer access.`,
        line: lineNumber,
        column: startColumn,
        endColumn,
        code: fullMatch,
        suggestedFix,
        file
      });
    }
  }

  /**
   * Checks if a position is inside a string literal or comment
   */
  private static isInStringOrComment(line: string, column: number): boolean {
    const beforePosition = line.substring(0, column);
    
    // Simple heuristic: check for unescaped quotes
    const singleQuotes = (beforePosition.match(/'/g) || []).length;
    const doubleQuotes = (beforePosition.match(/"/g) || []).length;
    const backticks = (beforePosition.match(/`/g) || []).length;
    
    // If we have an odd number of quotes, we're inside a string
    if (singleQuotes % 2 === 1 || doubleQuotes % 2 === 1 || backticks % 2 === 1) {
      return true;
    }
    
    // Check for line comments
    if (beforePosition.includes('//')) {
      return true;
    }
    
    return false;
  }

  /**
   * Creates a refactoring operation to add optional chaining
   */
  static createRefactoring(issue: NullSafetyIssue): NullSafetyRefactoring {
    return {
      id: `null-safety-${issue.id}`,
      type: 'add-optional-chaining',
      title: 'Add Optional Chaining',
      description: `Replace "${issue.code}" with "${issue.suggestedFix}" to prevent runtime errors`,
      changes: [{
        file: issue.file,
        line: issue.line,
        column: issue.column,
        endColumn: issue.endColumn,
        oldText: issue.code,
        newText: issue.suggestedFix
      }],
      safe: true,
      reversible: true
    };
  }

  /**
   * Applies the null-safety refactoring to the code
   */
  static applyRefactoring(code: string, refactoring: NullSafetyRefactoring): string {
    const lines = code.split('\n');
    
    for (const change of refactoring.changes) {
      const lineIndex = change.line - 1;
      if (lineIndex >= 0 && lineIndex < lines.length) {
        const line = lines[lineIndex];
        const before = line.substring(0, change.column - 1);
        const after = line.substring(change.endColumn - 1);
        lines[lineIndex] = before + change.newText + after;
      }
    }
    
    return lines.join('\n');
  }

  /**
   * Reverts the null-safety refactoring
   */
  static revertRefactoring(code: string, refactoring: NullSafetyRefactoring): string {
    const lines = code.split('\n');
    
    for (const change of refactoring.changes) {
      const lineIndex = change.line - 1;
      if (lineIndex >= 0 && lineIndex < lines.length) {
        const line = lines[lineIndex];
        const before = line.substring(0, change.column - 1);
        const after = line.substring(change.endColumn - 1);
        lines[lineIndex] = before + change.oldText + after;
      }
    }
    
    return lines.join('\n');
  }

  /**
   * Gets a summary of null-safety issues in the codebase
   */
  static getSummary(issues: NullSafetyIssue[]): {
    total: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
  } {
    const bySeverity: Record<string, number> = { high: 0, medium: 0, low: 0 };
    const byType: Record<string, number> = { 'property-chain': 0, 'method-call': 0, 'array-access': 0 };
    
    issues.forEach(issue => {
      bySeverity[issue.severity]++;
      byType[issue.type]++;
    });
    
    return {
      total: issues.length,
      bySeverity,
      byType
    };
  }
}
