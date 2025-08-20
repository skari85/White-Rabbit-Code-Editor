import { FocusFieldService, FocusFieldContext } from './focus-field-service';

export interface MonacoFocusFieldExtension {
  dispose(): void;
  createFocusField(line: number, column: number): FocusFieldContext | null;
  clearFocusField(): void;
  getCurrentFocusField(): FocusFieldContext | null;
  setFocusIntensity(intensity: 'subtle' | 'medium' | 'strong'): void;
}

export class MonacoFocusFieldExtensionImpl implements MonacoFocusFieldExtension {
  private editor: any;
  private code: string;
  private file: string;
  private currentFocusField: FocusFieldContext | null = null;
  private focusIntensity: 'subtle' | 'medium' | 'strong' = 'medium';
  private decorations: string[] = [];
  private isDisposed = false;

  constructor(editor: any, code: string, file: string) {
    this.editor = editor;
    this.code = code;
    this.file = file;
    this.setupEditorListeners();
  }

  /**
   * Sets up editor event listeners
   */
  private setupEditorListeners(): void {
    if (!this.editor) return;

    // Listen for cursor position changes
    this.editor.onDidChangeCursorPosition((e: any) => {
      if (this.currentFocusField) {
        this.updateFocusFieldFromPosition(e.position.lineNumber, e.position.column);
      }
    });

    // Listen for content changes
    this.editor.onDidChangeModelContent(() => {
      if (this.currentFocusField) {
        this.refreshFocusField();
      }
    });
  }

  /**
   * Creates a focus field at the specified position
   */
  createFocusField(line: number, column: number): FocusFieldContext | null {
    if (this.isDisposed) return null;

    const context = FocusFieldService.createFocusField(this.code, this.file, line, column);
    if (context) {
      this.currentFocusField = context;
      this.applyFocusFieldVisuals();
      return context;
    }

    return null;
  }

  /**
   * Clears the current focus field
   */
  clearFocusField(): void {
    if (this.isDisposed) return;

    this.currentFocusField = null;
    this.clearFocusFieldVisuals();
  }

  /**
   * Gets the current focus field context
   */
  getCurrentFocusField(): FocusFieldContext | null {
    return this.currentFocusField;
  }

  /**
   * Sets the focus intensity
   */
  setFocusIntensity(intensity: 'subtle' | 'medium' | 'strong'): void {
    this.focusIntensity = intensity;
    if (this.currentFocusField) {
      this.applyFocusFieldVisuals();
    }
  }

  /**
   * Updates the focus field from a new position
   */
  private updateFocusFieldFromPosition(line: number, column: number): void {
    if (!this.currentFocusField) return;

    const newContext = FocusFieldService.createFocusField(this.code, this.file, line, column);
    if (newContext && newContext.target.name === this.currentFocusField.target.name) {
      this.currentFocusField = newContext;
      this.applyFocusFieldVisuals();
    }
  }

  /**
   * Refreshes the focus field after content changes
   */
  private refreshFocusField(): void {
    if (!this.currentFocusField) return;

    const newContext = FocusFieldService.createFocusField(
      this.code,
      this.file,
      this.currentFocusField.target.line,
      this.currentFocusField.target.column
    );

    if (newContext) {
      this.currentFocusField = newContext;
      this.applyFocusFieldVisuals();
    }
  }

  /**
   * Applies visual focus field effects to the editor
   */
  private applyFocusFieldVisuals(): void {
    if (!this.editor || !this.currentFocusField) return;

    const decorations: any[] = [];
    const lines = this.code.split('\n');

    // Create decorations for each line
    lines.forEach((line, lineIndex) => {
      const lineNumber = lineIndex + 1;
      const isRelated = this.currentFocusField!.relatedLines.has(lineNumber);
      const isInFocusRange = lineNumber >= this.currentFocusField!.focusRange.startLine && 
                            lineNumber <= this.currentFocusField!.focusRange.endLine;

      if (isRelated) {
        // Highlight related lines
        decorations.push({
          range: {
            startLineNumber: lineNumber,
            startColumn: 1,
            endLineNumber: lineNumber,
            endColumn: line.length + 1
          },
          options: {
            isWholeLine: true,
            className: this.getRelatedLineClassName(isRelated, isInFocusRange),
            hoverMessage: {
              value: this.getHoverMessage(lineNumber, isRelated, isInFocusRange)
            }
          }
        });
      } else if (isInFocusRange) {
        // Dim lines in focus range but not directly related
        decorations.push({
          range: {
            startLineNumber: lineNumber,
            startColumn: 1,
            endLineNumber: lineNumber,
            endColumn: line.length + 1
          },
          options: {
            isWholeLine: true,
            className: this.getFocusRangeClassName(),
            hoverMessage: {
              value: `Line ${lineNumber}: In focus range but not directly related to ${this.currentFocusField!.target.name}`
            }
          }
        });
      } else {
        // Dim unrelated lines
        decorations.push({
          range: {
            startLineNumber: lineNumber,
            startColumn: 1,
            endLineNumber: lineNumber,
            endColumn: line.length + 1
          },
          options: {
            isWholeLine: true,
            className: this.getUnrelatedLineClassName(),
            hoverMessage: {
              value: `Line ${lineNumber}: Not related to current focus field`
            }
          }
        });
      }
    });

    // Apply decorations
    this.decorations = this.editor.deltaDecorations(this.decorations, decorations);
  }

  /**
   * Gets CSS class name for related lines
   */
  private getRelatedLineClassName(isRelated: boolean, isInFocusRange: boolean): string {
    if (isRelated) {
      return 'focus-field-related-line';
    } else if (isInFocusRange) {
      return 'focus-field-focus-range-line';
    } else {
      return 'focus-field-unrelated-line';
    }
  }

  /**
   * Gets CSS class name for focus range lines
   */
  private getFocusRangeClassName(): string {
    return 'focus-field-focus-range-line';
  }

  /**
   * Gets CSS class name for unrelated lines
   */
  private getUnrelatedLineClassName(): string {
    return 'focus-field-unrelated-line';
  }

  /**
   * Gets hover message for a line
   */
  private getHoverMessage(lineNumber: number, isRelated: boolean, isInFocusRange: boolean): string {
    if (isRelated) {
      return `Line ${lineNumber}: Directly related to ${this.currentFocusField!.target.name}`;
    } else if (isInFocusRange) {
      return `Line ${lineNumber}: In focus range for ${this.currentFocusField!.target.name}`;
    } else {
      return `Line ${lineNumber}: Not related to current focus field`;
    }
  }

  /**
   * Clears all focus field visual effects
   */
  private clearFocusFieldVisuals(): void {
    if (!this.editor) return;

    this.decorations = this.editor.deltaDecorations(this.decorations, []);
  }

  /**
   * Updates the code content
   */
  updateCode(newCode: string): void {
    this.code = newCode;
    if (this.currentFocusField) {
      this.refreshFocusField();
    }
  }

  /**
   * Disposes the extension
   */
  dispose(): void {
    if (this.isDisposed) return;

    this.isDisposed = true;
    this.clearFocusFieldVisuals();
    this.currentFocusField = null;
  }
}

/**
 * Creates a Monaco editor extension for focus field functionality
 */
export function createMonacoFocusFieldExtension(
  editor: any,
  code: string,
  file: string
): MonacoFocusFieldExtension {
  return new MonacoFocusFieldExtensionImpl(editor, code, file);
}

/**
 * CSS classes for focus field visual effects
 */
export const FOCUS_FIELD_CSS = `
  .focus-field-related-line {
    background-color: rgba(59, 130, 246, 0.1) !important;
    border-left: 3px solid #3b82f6 !important;
  }

  .focus-field-focus-range-line {
    background-color: rgba(34, 197, 94, 0.05) !important;
    border-left: 1px solid #22c55e !important;
  }

  .focus-field-unrelated-line {
    opacity: 0.3;
    filter: grayscale(0.5);
  }

  .focus-field-unrelated-line.focus-intensity-subtle {
    opacity: 0.8;
  }

  .focus-field-unrelated-line.focus-intensity-medium {
    opacity: 0.5;
  }

  .focus-field-unrelated-line.focus-intensity-strong {
    opacity: 0.2;
  }

  .focus-field-target-highlight {
    background-color: rgba(245, 158, 11, 0.3) !important;
    border: 2px solid #f59e0b !important;
    border-radius: 4px;
  }

  .focus-field-relation-marker {
    background-color: rgba(59, 130, 246, 0.2);
    border-left: 2px solid #3b82f6;
  }
`;
