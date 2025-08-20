export interface FocusFieldTarget {
  id: string;
  type: 'variable' | 'function' | 'class' | 'import' | 'property' | 'method';
  name: string;
  line: number;
  column: number;
  endColumn: number;
  file: string;
}

export interface FocusFieldRelation {
  id: string;
  type: 'definition' | 'usage' | 'modification' | 'reference' | 'import' | 'export';
  targetId: string;
  line: number;
  column: number;
  endColumn: number;
  description: string;
  severity: 'primary' | 'secondary' | 'tertiary';
}

export interface FocusFieldContext {
  target: FocusFieldTarget;
  relations: FocusFieldRelation[];
  relatedLines: Set<number>;
  focusRange: {
    startLine: number;
    endLine: number;
  };
}

export class FocusFieldService {
  private static readonly VARIABLE_REGEX = /\b(const|let|var)\s+([a-zA-Z_$][\w$]*)\b/g;
  private static readonly FUNCTION_REGEX = /\b(function\s+([a-zA-Z_$][\w$]*)|([a-zA-Z_$][\w$]*)\s*[:=]\s*function\b)/g;
  private static readonly CLASS_REGEX = /\bclass\s+([a-zA-Z_$][\w$]*)\b/g;
  private static readonly METHOD_REGEX = /([a-zA-Z_$][\w$]*)\s*\([^)]*\)\s*\{/g;
  private static readonly PROPERTY_REGEX = /([a-zA-Z_$][\w$]*)\s*[:=]\s*[^;,\n]+/g;
  private static readonly IMPORT_REGEX = /\bimport\s+(?:\{[^}]*\}|\*\s+as\s+)?([a-zA-Z_$][\w$]*)\b/g;
  private static readonly EXPORT_REGEX = /\bexport\s+(?:default\s+)?(?:const|let|var|function|class)?\s*([a-zA-Z_$][\w$]*)\b/g;

  /**
   * Creates a focus field context for a selected code element
   */
  static createFocusField(
    code: string,
    file: string,
    selectedLine: number,
    selectedColumn: number
  ): FocusFieldContext | null {
    const target = this.findTargetAtPosition(code, file, selectedLine, selectedColumn);
    if (!target) return null;

    const relations = this.findRelations(code, file, target);
    const relatedLines = this.getRelatedLines(relations);
    const focusRange = this.calculateFocusRange(relatedLines, code.split('\n').length);

    return {
      target,
      relations,
      relatedLines,
      focusRange
    };
  }

  /**
   * Finds the code element at the specified position
   */
  private static findTargetAtPosition(
    code: string,
    file: string,
    line: number,
    column: number
  ): FocusFieldTarget | null {
    const lines = code.split('\n');
    const currentLine = lines[line - 1];
    if (!currentLine) return null;

    // Check for variable declarations
    const variableMatch = this.findVariableAtPosition(currentLine, column);
    if (variableMatch) {
      return {
        id: `${file}-${line}-${column}-variable`,
        type: 'variable',
        name: variableMatch.name,
        line,
        column: variableMatch.startColumn,
        endColumn: variableMatch.endColumn,
        file
      };
    }

    // Check for function declarations
    const functionMatch = this.findFunctionAtPosition(currentLine, column);
    if (functionMatch) {
      return {
        id: `${file}-${line}-${column}-function`,
        type: 'function',
        name: functionMatch.name,
        line,
        column: functionMatch.startColumn,
        endColumn: functionMatch.endColumn,
        file
      };
    }

    // Check for class declarations
    const classMatch = this.findClassAtPosition(currentLine, column);
    if (classMatch) {
      return {
        id: `${file}-${line}-${column}-class`,
        type: 'class',
        name: classMatch.name,
        line,
        column: classMatch.startColumn,
        endColumn: classMatch.endColumn,
        file
      };
    }

    // Check for method calls
    const methodMatch = this.findMethodAtPosition(currentLine, column);
    if (methodMatch) {
      return {
        id: `${file}-${line}-${column}-method`,
        type: 'method',
        name: methodMatch.name,
        line,
        column: methodMatch.startColumn,
        endColumn: methodMatch.endColumn,
        file
      };
    }

    // Check for property access
    const propertyMatch = this.findPropertyAtPosition(currentLine, column);
    if (propertyMatch) {
      return {
        id: `${file}-${line}-${column}-property`,
        type: 'property',
        name: propertyMatch.name,
        line,
        column: propertyMatch.startColumn,
        endColumn: propertyMatch.endColumn,
        file
      };
    }

    return null;
  }

  /**
   * Finds variable declarations at a position
   */
  private static findVariableAtPosition(
    line: string,
    column: number
  ): { name: string; startColumn: number; endColumn: number } | null {
    const matches = Array.from(line.matchAll(this.VARIABLE_REGEX));
    
    for (const match of matches) {
      const startColumn = match.index! + 1;
      const endColumn = startColumn + match[0].length;
      
      if (column >= startColumn && column <= endColumn) {
        return {
          name: match[2] || match[1],
          startColumn,
          endColumn
        };
      }
    }
    
    return null;
  }

  /**
   * Finds function declarations at a position
   */
  private static findFunctionAtPosition(
    line: string,
    column: number
  ): { name: string; startColumn: number; endColumn: number } | null {
    const matches = Array.from(line.matchAll(this.FUNCTION_REGEX));
    
    for (const match of matches) {
      const startColumn = match.index! + 1;
      const endColumn = startColumn + match[0].length;
      
      if (column >= startColumn && column <= endColumn) {
        const name = match[2] || match[3] || match[4];
        if (name) {
          return {
            name,
            startColumn,
            endColumn
          };
        }
      }
    }
    
    return null;
  }

  /**
   * Finds class declarations at a position
   */
  private static findClassAtPosition(
    line: string,
    column: number
  ): { name: string; startColumn: number; endColumn: number } | null {
    const matches = Array.from(line.matchAll(this.CLASS_REGEX));
    
    for (const match of matches) {
      const startColumn = match.index! + 1;
      const endColumn = startColumn + match[0].length;
      
      if (column >= startColumn && column <= endColumn) {
        return {
          name: match[1],
          startColumn,
          endColumn
        };
      }
    }
    
    return null;
  }

  /**
   * Finds method calls at a position
   */
  private static findMethodAtPosition(
    line: string,
    column: number
  ): { name: string; startColumn: number; endColumn: number } | null {
    const matches = Array.from(line.matchAll(this.METHOD_REGEX));
    
    for (const match of matches) {
      const startColumn = match.index! + 1;
      const endColumn = startColumn + match[0].length;
      
      if (column >= startColumn && column <= endColumn) {
        return {
          name: match[1],
          startColumn,
          endColumn
        };
      }
    }
    
    return null;
  }

  /**
   * Finds property access at a position
   */
  private static findPropertyAtPosition(
    line: string,
    column: number
  ): { name: string; startColumn: number; endColumn: number } | null {
    const matches = Array.from(line.matchAll(this.PROPERTY_REGEX));
    
    for (const match of matches) {
      const startColumn = match.index! + 1;
      const endColumn = startColumn + match[0].length;
      
      if (column >= startColumn && column <= endColumn) {
        return {
          name: match[1],
          startColumn,
          endColumn
        };
      }
    }
    
    return null;
  }

  /**
   * Finds all relations for a target
   */
  private static findRelations(
    code: string,
    file: string,
    target: FocusFieldTarget
  ): FocusFieldRelation[] {
    const relations: FocusFieldRelation[] = [];
    const lines = code.split('\n');
    
    lines.forEach((line, lineIndex) => {
      const lineNumber = lineIndex + 1;
      
      // Find definitions
      if (lineNumber === target.line) {
        relations.push({
          id: `${target.id}-definition`,
          type: 'definition',
          targetId: target.id,
          line: lineNumber,
          column: target.column,
          endColumn: target.endColumn,
          description: `Definition of ${target.name}`,
          severity: 'primary'
        });
      }
      
      // Find usages
      const usageMatches = this.findUsages(line, target.name);
      usageMatches.forEach(match => {
        relations.push({
          id: `${target.id}-usage-${lineNumber}-${match.startColumn}`,
          type: 'usage',
          targetId: target.id,
          line: lineNumber,
          column: match.startColumn,
          endColumn: match.endColumn,
          description: `Usage of ${target.name}`,
          severity: 'secondary'
        });
      });
      
      // Find modifications
      const modificationMatches = this.findModifications(line, target.name);
      modificationMatches.forEach(match => {
        relations.push({
          id: `${target.id}-modification-${lineNumber}-${match.startColumn}`,
          type: 'modification',
          targetId: target.id,
          line: lineNumber,
          column: match.startColumn,
          endColumn: match.endColumn,
          description: `Modification of ${target.name}`,
          severity: 'primary'
        });
      });
      
      // Find imports/exports
      const importMatches = this.findImports(line, target.name);
      importMatches.forEach(match => {
        relations.push({
          id: `${target.id}-import-${lineNumber}-${match.startColumn}`,
          type: 'import',
          targetId: target.id,
          line: lineNumber,
          column: match.startColumn,
          endColumn: match.endColumn,
          description: `Import of ${target.name}`,
          severity: 'tertiary'
        });
      });
      
      const exportMatches = this.findExports(line, target.name);
      exportMatches.forEach(match => {
        relations.push({
          id: `${target.id}-export-${lineNumber}-${match.startColumn}`,
          type: 'export',
          targetId: target.id,
          line: lineNumber,
          column: match.startColumn,
          endColumn: match.endColumn,
          description: `Export of ${target.name}`,
          severity: 'tertiary'
        });
      });
    });
    
    return relations;
  }

  /**
   * Finds usages of a target in a line
   */
  private static findUsages(
    line: string,
    targetName: string
  ): Array<{ startColumn: number; endColumn: number }> {
    const matches: Array<{ startColumn: number; endColumn: number }> = [];
    const regex = new RegExp(`\\b${targetName}\\b`, 'g');
    
    let match;
    while ((match = regex.exec(line)) !== null) {
      matches.push({
        startColumn: match.index! + 1,
        endColumn: match.index! + match[0].length
      });
    }
    
    return matches;
  }

  /**
   * Finds modifications of a target in a line
   */
  private static findModifications(
    line: string,
    targetName: string
  ): Array<{ startColumn: number; endColumn: number }> {
    const matches: Array<{ startColumn: number; endColumn: number }> = [];
    const regex = new RegExp(`\\b${targetName}\\s*[=+\\-*/%&|^~]?=`, 'g');
    
    let match;
    while ((match = regex.exec(line)) !== null) {
      matches.push({
        startColumn: match.index! + 1,
        endColumn: match.index! + match[0].length
      });
    }
    
    return matches;
  }

  /**
   * Finds imports of a target in a line
   */
  private static findImports(
    line: string,
    targetName: string
  ): Array<{ startColumn: number; endColumn: number }> {
    const matches: Array<{ startColumn: number; endColumn: number }> = [];
    const regex = new RegExp(`import.*\\b${targetName}\\b`, 'g');
    
    let match;
    while ((match = regex.exec(line)) !== null) {
      matches.push({
        startColumn: match.index! + 1,
        endColumn: match.index! + match[0].length
      });
    }
    
    return matches;
  }

  /**
   * Finds exports of a target in a line
   */
  private static findExports(
    line: string,
    targetName: string
  ): Array<{ startColumn: number; endColumn: number }> {
    const matches: Array<{ startColumn: number; endColumn: number }> = [];
    const regex = new RegExp(`export.*\\b${targetName}\\b`, 'g');
    
    let match;
    while ((match = regex.exec(line)) !== null) {
      matches.push({
        startColumn: match.index! + 1,
        endColumn: match.index! + match[0].length
      });
    }
    
    return matches;
  }

  /**
   * Gets all related line numbers
   */
  private static getRelatedLines(relations: FocusFieldRelation[]): Set<number> {
    const lines = new Set<number>();
    relations.forEach(relation => {
      lines.add(relation.line);
    });
    return lines;
  }

  /**
   * Calculates the focus range for optimal viewing
   */
  private static calculateFocusRange(
    relatedLines: Set<number>,
    totalLines: number
  ): { startLine: number; endLine: number } {
    if (relatedLines.size === 0) {
      return { startLine: 1, endLine: totalLines };
    }
    
    const sortedLines = Array.from(relatedLines).sort((a, b) => a - b);
    const minLine = Math.max(1, sortedLines[0] - 2);
    const maxLine = Math.min(totalLines, sortedLines[sortedLines.length - 1] + 2);
    
    return {
      startLine: minLine,
      endLine: maxLine
    };
  }

  /**
   * Gets a summary of the focus field
   */
  static getFocusFieldSummary(context: FocusFieldContext): {
    targetName: string;
    targetType: string;
    totalRelations: number;
    byType: Record<string, number>;
    focusRangeSize: number;
  } {
    const byType: Record<string, number> = {};
    context.relations.forEach(relation => {
      byType[relation.type] = (byType[relation.type] || 0) + 1;
    });
    
    return {
      targetName: context.target.name,
      targetType: context.target.type,
      totalRelations: context.relations.length,
      byType,
      focusRangeSize: context.focusRange.endLine - context.focusRange.startLine + 1
    };
  }
}
