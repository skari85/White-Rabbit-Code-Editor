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
  fontFamily: 'JetBrains Mono, Fira Code, Monaco, Consolas, monospace',
  minimap: false, // Disable minimap by default to prevent memory issues
  wordWrap: 'on',
  lineNumbers: 'on',
  folding: true,
  renderWhitespace: 'selection'
};

export const getLanguageFromFileName = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'sass',
    'less': 'less',
    'json': 'json',
    'xml': 'xml',
    'md': 'markdown',
    'py': 'python',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'cxx': 'cpp',
    'cc': 'cpp',
    'cs': 'csharp',
    'php': 'php',
    'rb': 'ruby',
    'go': 'go',
    'rs': 'rust',
    'swift': 'swift',
    'kt': 'kotlin',
    'scala': 'scala',
    'sh': 'shell',
    'bash': 'shell',
    'zsh': 'shell',
    'fish': 'shell',
    'ps1': 'powershell',
    'sql': 'sql',
    'yaml': 'yaml',
    'yml': 'yaml',
    'toml': 'toml',
    'ini': 'ini',
    'dockerfile': 'dockerfile',
    'vue': 'html',
    'svelte': 'html'
  };

  return languageMap[extension || ''] || 'plaintext';
};

export const configureMonaco = () => {
  // Configure Monaco Editor themes and languages
  monaco.editor.defineTheme('hex-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6A9955', fontStyle: 'italic' },
      { token: 'keyword', foreground: '569CD6' },
      { token: 'string', foreground: 'CE9178' },
      { token: 'number', foreground: 'B5CEA8' },
      { token: 'type', foreground: '4EC9B0' },
      { token: 'function', foreground: 'DCDCAA' },
      { token: 'variable', foreground: '9CDCFE' },
    ],
    colors: {
      'editor.background': '#0D1117',
      'editor.foreground': '#E6EDF3',
      'editor.lineHighlightBackground': '#161B22',
      'editor.selectionBackground': '#264F78',
      'editor.inactiveSelectionBackground': '#3A3D41',
      'editorCursor.foreground': '#AEAFAD',
      'editorWhitespace.foreground': '#404040',
      'editorIndentGuide.background': '#404040',
      'editorIndentGuide.activeBackground': '#707070',
      'editor.selectionHighlightBackground': '#ADD6FF26'
    }
  });

  monaco.editor.defineTheme('kex-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '008000', fontStyle: 'italic' },
      { token: 'keyword', foreground: '0000FF' },
      { token: 'string', foreground: 'A31515' },
      { token: 'number', foreground: '098658' },
      { token: 'type', foreground: '267F99' },
      { token: 'function', foreground: '795E26' },
      { token: 'variable', foreground: '001080' },
    ],
    colors: {
      'editor.background': '#FFFFFF',
      'editor.foreground': '#000000',
      'editor.lineHighlightBackground': '#F7F7F7',
      'editor.selectionBackground': '#ADD6FF',
      'editor.inactiveSelectionBackground': '#E5EBF1',
      'editorCursor.foreground': '#000000',
      'editorWhitespace.foreground': '#BFBFBF',
      'editorIndentGuide.background': '#D3D3D3',
      'editorIndentGuide.activeBackground': '#939393',
      'editor.selectionHighlightBackground': '#ADD6FF4D'
    }
  });

  // Configure TypeScript compiler options
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
    typeRoots: ['node_modules/@types']
  });

  // Configure JavaScript compiler options
  monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ES2020,
    allowNonTsExtensions: true,
    allowJs: true,
    checkJs: false
  });

  // Add common type definitions
  const reactTypes = `
    declare module 'react' {
      export interface Component<P = {}, S = {}> {}
      export function useState<T>(initialState: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void];
      export function useEffect(effect: () => void | (() => void), deps?: any[]): void;
      export function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
      export function useMemo<T>(factory: () => T, deps: any[]): T;
      export const Fragment: any;
      export default React;
    }
  `;

  monaco.languages.typescript.typescriptDefaults.addExtraLib(
    reactTypes,
    'file:///node_modules/@types/react/index.d.ts'
  );
};

export const getEditorOptions = (config: Partial<MonacoConfig> = {}): monaco.editor.IStandaloneEditorConstructionOptions => {
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
    automaticLayout: true,
    scrollBeyondLastLine: false,
    smoothScrolling: true,
    cursorBlinking: 'smooth',
    cursorSmoothCaretAnimation: 'on',
    renderLineHighlight: 'all',
    selectOnLineNumbers: true,
    roundedSelection: false,
    readOnly: false,
    cursorStyle: 'line',
    mouseWheelZoom: true,
    quickSuggestions: {
      other: true,
      comments: false,
      strings: false
    },
    parameterHints: {
      enabled: true
    },
    autoIndent: 'full',
    formatOnType: true,
    formatOnPaste: true,
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnEnter: 'on',
    tabCompletion: 'on',
    wordBasedSuggestions: 'matchingDocuments'
  };
};
