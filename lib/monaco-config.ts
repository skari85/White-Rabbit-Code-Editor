// Monaco configuration types and utilities
// Import only types to avoid SSR issues
type Monaco = typeof import('monaco-editor');

export interface MonacoConfig {
  theme: 'vs-dark' | 'vs-light' | 'hc-black';
  fontSize: number;
  fontFamily: string;
  minimap: boolean;
  wordWrap: 'on' | 'off' | 'wordWrapColumn' | 'bounded';
  lineNumbers: 'on' | 'off' | 'relative' | 'interval';
  folding: boolean;
  renderWhitespace: 'none' | 'boundary' | 'selection' | 'trailing' | 'all';
}

export const defaultMonacoConfig: MonacoConfig = {
  theme: 'vs-dark',
  fontSize: 14,
  fontFamily: '"Fira Code", "JetBrains Mono", "Monaco", "Menlo", "Ubuntu Mono", monospace',
  minimap: true, // Enable minimap for better navigation
  wordWrap: 'on',
  lineNumbers: 'on',
  folding: true,
  renderWhitespace: 'selection',
};

// Configuration functions that only work on client side
export const configureMonacoThemes = async (monaco: Monaco) => {
  if (typeof window === 'undefined') return;
  
  // HEX Dark Theme
  monaco.editor.defineTheme('hex-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6A9955' },
      { token: 'keyword', foreground: '569CD6' },
      { token: 'string', foreground: 'CE9178' },
      { token: 'number', foreground: 'B5CEA8' },
      { token: 'regexp', foreground: 'D16969' },
      { token: 'type', foreground: '4EC9B0' },
      { token: 'class', foreground: '4EC9B0' },
      { token: 'function', foreground: 'DCDCAA' },
      { token: 'variable', foreground: '9CDCFE' },
      { token: 'constant', foreground: '4FC1FF' },
    ],
    colors: {
      'editor.background': '#0d1117',
      'editor.foreground': '#e6edf3',
      'editorLineNumber.foreground': '#6e7681',
      'editorLineNumber.activeForeground': '#e6edf3',
      'editor.selectionBackground': '#264f78',
      'editor.inactiveSelectionBackground': '#264f7840',
      'editorCursor.foreground': '#10b981',
      'editor.lineHighlightBackground': '#21262d40',
      'editorIndentGuide.background': '#21262d',
      'editorIndentGuide.activeBackground': '#30363d',
    },
  });

  // KEX Light Theme  
  monaco.editor.defineTheme('kex-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '008000' },
      { token: 'keyword', foreground: '0000FF' },
      { token: 'string', foreground: 'A31515' },
      { token: 'number', foreground: '098658' },
      { token: 'regexp', foreground: 'D16969' },
      { token: 'type', foreground: '267F99' },
      { token: 'class', foreground: '267F99' },
      { token: 'function', foreground: '795E26' },
      { token: 'variable', foreground: '001080' },
      { token: 'constant', foreground: '0070C1' },
    ],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#000000',
      'editorLineNumber.foreground': '#237893',
      'editorLineNumber.activeForeground': '#0B216F',
      'editor.selectionBackground': '#ADD6FF80',
      'editor.inactiveSelectionBackground': '#E5EBF180',
      'editorCursor.foreground': '#ff6b6b',
      'editor.lineHighlightBackground': '#F5F5F5',
      'editorIndentGuide.background': '#D3D3D3',
      'editorIndentGuide.activeBackground': '#939393',
    },
  });
};

export const configureMonacoLanguages = async (monaco: Monaco) => {
  if (typeof window === 'undefined') return;
  
  // TypeScript configuration
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ES2020,
    allowNonTsExtensions: true,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    module: monaco.languages.typescript.ModuleKind.CommonJS,
    noEmit: true,
    esModuleInterop: true,
    jsx: monaco.languages.typescript.JsxEmit.React,
    reactNamespace: 'React',
    allowJs: true,
    typeRoots: ['node_modules/@types'],
  });

  // JavaScript configuration
  monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ES2020,
    allowNonTsExtensions: true,
  });
};

// Language detection utility
export const getLanguageFromFileName = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'js': return 'javascript';
    case 'jsx': return 'javascript';
    case 'ts': return 'typescript';
    case 'tsx': return 'typescript';
    case 'html': return 'html';
    case 'css': return 'css';
    case 'scss': case 'sass': return 'scss';
    case 'less': return 'less';
    case 'json': return 'json';
    case 'md': return 'markdown';
    case 'py': return 'python';
    case 'java': return 'java';
    case 'cpp': case 'cc': case 'cxx': return 'cpp';
    case 'c': return 'c';
    case 'cs': return 'csharp';
    case 'php': return 'php';
    case 'rb': return 'ruby';
    case 'go': return 'go';
    case 'rs': return 'rust';
    case 'kt': return 'kotlin';
    case 'swift': return 'swift';
    case 'sh': case 'bash': return 'shell';
    case 'sql': return 'sql';
    case 'xml': return 'xml';
    case 'yaml': case 'yml': return 'yaml';
    case 'toml': return 'toml';
    case 'ini': return 'ini';
    case 'dockerfile': return 'dockerfile';
    default: return 'plaintext';
  }
};

export const getEditorOptions = (config: Partial<MonacoConfig> = {}): any => {
  const finalConfig = { ...defaultMonacoConfig, ...config };
  
  return {
    theme: finalConfig.theme,
    fontSize: finalConfig.fontSize,
    fontFamily: finalConfig.fontFamily,
    minimap: { enabled: finalConfig.minimap },
    wordWrap: finalConfig.wordWrap,
    lineNumbers: finalConfig.lineNumbers,
    folding: finalConfig.folding,
    renderWhitespace: finalConfig.renderWhitespace,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: 2,
    insertSpaces: true,
    contextmenu: true,
    mouseWheelZoom: true,
    cursorBlinking: 'blink',
    cursorSmoothCaretAnimation: 'on',
    bracketPairColorization: { enabled: true },
    guides: {
      bracketPairs: true,
      indentation: true,
    },
    suggest: {
      showKeywords: true,
      showSnippets: true,
    },
    quickSuggestions: {
      other: true,
      comments: true,
      strings: true,
    },
  };
};
