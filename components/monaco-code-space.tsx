import { FileContent } from "@/hooks/use-code-builder";
import Editor from "@monaco-editor/react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { v4 as uuid } from "uuid";

/**
 * Monaco Code Space
 * - Starts 100% empty for the first doc (no surprise starter code)
 * - Stable height (no weird slow growth); auto-resizes with container
 * - Multiple tabs; duplicate any tab to reuse as a new view/code doc
 * - Quick language switcher per tab
 * - Safe defaults (no minimap, no scrolling beyond last line)
 * - Integrated with White Rabbit file system
 *
 * Usage: <MonacoCodeSpace files={files} onFileUpdate={updateFileContent} />
 *
 * Notes:
 * - Container uses fixed viewport height to avoid "starts small and then slowly grows" UX.
 * - You can style the wrapper to your layout needs. The editor itself will auto-layout.
 * - Supports both project files and scratch pads
 */

const LANGS = [
  "javascript",
  "typescript",
  "json",
  "css",
  "html",
  "markdown",
  "python",
  "sql",
];

interface MonacoDoc {
  id: string;
  name: string;
  language: string;
  value: string;
  isProjectFile?: boolean;
  filePath?: string;
}

interface MonacoCodeSpaceProps {
  files?: FileContent[];
  selectedFile?: string | null;
  onFileUpdate?: (filename: string, content: string) => void;
  onFileSelect?: (filename: string) => void;
  onFileCreate?: (filename: string, content: string, language: string) => void;
  theme?: "vs-dark" | "vs-light" | "hex-dark" | "hex-light";
  height?: string;
  className?: string;
}

function makeDoc(partial: Partial<MonacoDoc> = {}): MonacoDoc {
  return {
    id: uuid(),
    name: partial.name ?? "Untitled",
    language: partial.language ?? "javascript",
    value: partial.value ?? "", // absolutely empty by default
    isProjectFile: partial.isProjectFile ?? false,
    filePath: partial.filePath,
  };
}

function getLanguageFromFileName(fileName: string): string {
  const ext = fileName.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js': case 'jsx': return 'javascript';
    case 'ts': case 'tsx': return 'typescript';
    case 'html': return 'html';
    case 'css': return 'css';
    case 'json': return 'json';
    case 'md': return 'markdown';
    case 'py': return 'python';
    case 'sql': return 'sql';
    default: return 'javascript';
  }
}

export default function MonacoCodeSpace({
  files = [],
  selectedFile,
  onFileUpdate,
  onFileSelect,
  onFileCreate,
  theme = "vs-dark",
  height = "78vh",
  className = ""
}: MonacoCodeSpaceProps) {
  // Convert project files to docs
  const projectDocs = useMemo(() => {
    return files.map(file => makeDoc({
      name: file.name,
      language: getLanguageFromFileName(file.name),
      value: file.content,
      isProjectFile: true,
      filePath: file.name
    }));
  }, [files]);

  // Initialize with project files or empty scratch pad
  const initialDocs = useMemo(() => {
    if (projectDocs.length > 0) {
      return projectDocs;
    }
    return [makeDoc({ name: "Scratch 1" })];
  }, [projectDocs]);

  const [docs, setDocs] = useState<MonacoDoc[]>(initialDocs);
  const [activeId, setActiveId] = useState(() => {
    if (selectedFile && projectDocs.length > 0) {
      const selectedDoc = projectDocs.find(doc => doc.filePath === selectedFile);
      return selectedDoc?.id || initialDocs[0].id;
    }
    return initialDocs[0].id;
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<any>(null);
  const [editorHeight, setEditorHeight] = useState<number>(500); // Start with a reasonable default height

  // Sync with external file changes
  useEffect(() => {
    if (projectDocs.length > 0) {
      setDocs(prevDocs => {
        const scratchDocs = prevDocs.filter(doc => !doc.isProjectFile);
        return [...projectDocs, ...scratchDocs];
      });
    }
  }, [projectDocs]);

  // Sync active tab with selected file
  useEffect(() => {
    if (selectedFile) {
      const targetDoc = docs.find(doc => doc.filePath === selectedFile);
      if (targetDoc && targetDoc.id !== activeId) {
        setActiveId(targetDoc.id);
      }
    }
  }, [selectedFile, docs, activeId]);

  // Calculate editor height immediately to prevent layout shifts
  useLayoutEffect(() => {
    const calculateEditorHeight = () => {
      if (containerRef.current) {
        const containerHeight = containerRef.current.clientHeight;
        const tabsHeight = 60; // Approximate height of tabs bar
        const calculatedHeight = Math.max(containerHeight - tabsHeight, 500);
        setEditorHeight(calculatedHeight);
      } else {
        // If container not ready, use a reasonable default based on height prop
        const defaultHeight = typeof height === 'string' && height.includes('vh')
          ? Math.floor(window.innerHeight * (parseInt(height) / 100)) - 60
          : 500;
        setEditorHeight(Math.max(defaultHeight, 500));
      }
    };

    // Calculate immediately
    calculateEditorHeight();

    // Also calculate on next tick to ensure DOM is ready
    const timer = setTimeout(calculateEditorHeight, 0);

    // Recalculate on window resize
    const handleResize = () => {
      calculateEditorHeight();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [height]);

  // Force editor layout when height changes
  useEffect(() => {
    if (editorRef.current && editorHeight > 0) {
      // Small delay to ensure DOM is updated
      const timer = setTimeout(() => {
        editorRef.current?.layout();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [editorHeight, activeId]);

  const activeIndex = docs.findIndex((d) => d.id === activeId);
  const active = docs[activeIndex];

  const addEmpty = useCallback(() => {
    const scratchCount = docs.filter(d => !d.isProjectFile).length;
    const d = makeDoc({ name: `Scratch ${scratchCount + 1}` });
    setDocs((prev) => [...prev, d]);
    setActiveId(d.id);
  }, [docs]);

  const duplicateActive = useCallback(() => {
    if (!active) return;
    const d = makeDoc({
      name: `${active.name} (copy)`,
      language: active.language,
      value: active.value,
      isProjectFile: false, // Duplicates are always scratch files
    });
    setDocs((prev) => {
      const next = [...prev];
      next.splice(activeIndex + 1, 0, d);
      return next;
    });
    setActiveId(d.id);
  }, [active, activeIndex]);

  const deleteActive = useCallback(() => {
    if (!active) return;

    // Can't delete project files, only scratch files
    if (active.isProjectFile) {
      alert("Cannot delete project files from here. Use the file explorer.");
      return;
    }

    if (docs.length === 1) {
      // Reset the last tab to empty rather than removing it entirely
      const newDoc = makeDoc({ name: "Scratch 1" });
      setDocs([newDoc]);
      setActiveId(newDoc.id);
      return;
    }

    const next = docs.filter((d) => d.id !== active.id);
    setDocs(next);
    setActiveId(next[Math.max(0, activeIndex - 1)].id);
  }, [active, docs, activeIndex]);

  const renameActive = useCallback(() => {
    if (!active) return;

    // Can't rename project files
    if (active.isProjectFile) {
      alert("Cannot rename project files from here. Use the file explorer.");
      return;
    }

    const name = prompt("Rename tab:", active.name);
    if (name == null) return;
    setDocs((prev) => prev.map((d) => (d.id === active.id ? { ...d, name } : d)));
  }, [active]);

  const clearActive = useCallback(() => {
    if (!active) return;
    setDocs((prev) => prev.map((d) => (d.id === active.id ? { ...d, value: "" } : d)));

    // If it's a project file, update the external state
    if (active.isProjectFile && active.filePath && onFileUpdate) {
      onFileUpdate(active.filePath, "");
    }
  }, [active, onFileUpdate]);

  const setLang = useCallback((id: string, language: string) => {
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, language } : d)));
  }, []);

  const setValue = useCallback((id: string, value: string) => {
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, value } : d)));

    // If it's a project file, update the external state
    const doc = docs.find(d => d.id === id);
    if (doc?.isProjectFile && doc.filePath && onFileUpdate) {
      onFileUpdate(doc.filePath, value);
    }
  }, [docs, onFileUpdate]);

  const saveAsProjectFile = useCallback(() => {
    if (!active || active.isProjectFile) return;

    const filename = prompt("Save as project file:", `${active.name}.${active.language === 'javascript' ? 'js' : active.language}`);
    if (!filename) return;

    if (onFileCreate) {
      onFileCreate(filename, active.value, active.language);
    }
  }, [active, onFileCreate]);

  const handleTabClick = useCallback((doc: MonacoDoc) => {
    setActiveId(doc.id);
    if (doc.isProjectFile && doc.filePath && onFileSelect) {
      onFileSelect(doc.filePath);
    }

    // Force editor layout after tab switch to ensure proper rendering
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.layout();
      }
    }, 0);
  }, [onFileSelect]);

  const handleEditorDidMount = useCallback((editor: any) => {
    editorRef.current = editor;
    // Force immediate layout with explicit dimensions
    editor.layout({ width: editor.getLayoutInfo().width, height: editorHeight });

    // Force another layout after a brief delay to ensure proper rendering
    setTimeout(() => {
      editor.layout({ width: editor.getLayoutInfo().width, height: editorHeight });
    }, 100);
  }, [editorHeight]);

  return (
    <div
      className={`w-full flex flex-col bg-neutral-50 border rounded-2xl shadow-sm overflow-hidden ${className}`}
      style={{
        height: height || '600px', // Ensure we always have a height
        minHeight: '600px',
        maxHeight: '100vh'
      }}
      ref={containerRef}
    >
      {/* Tabs */}
      <div className="flex items-center gap-2 p-2 border-b bg-white rounded-t-2xl flex-shrink-0" style={{ height: '60px' }}>
        <div className="flex flex-wrap gap-2 flex-1 min-w-0">
          {docs.map((d) => (
            <button
              key={d.id}
              onClick={() => handleTabClick(d)}
              className={`px-3 py-1 rounded-xl border text-sm transition flex items-center gap-2 min-w-0 ${
                d.id === activeId ? "bg-black text-white" : "hover:bg-neutral-100"
              }`}
              title={d.isProjectFile ? `Project: ${d.name}` : `Scratch: ${d.name}`}
            >
              {d.isProjectFile && <span className="text-xs">📁</span>}
              <span className="truncate">{d.name}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <select
            className="px-2 py-1 border rounded-xl text-sm bg-white"
            value={active?.language || "javascript"}
            onChange={(e) => setLang(active.id, e.target.value)}
          >
            {LANGS.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <button
            onClick={addEmpty}
            className="px-3 py-1 rounded-xl border text-sm hover:bg-neutral-100"
            title="New empty tab"
          >
            + New
          </button>
          <button
            onClick={duplicateActive}
            className="px-3 py-1 rounded-xl border text-sm hover:bg-neutral-100"
            title="Duplicate this tab"
          >
            ⧉ Duplicate
          </button>
          {!active?.isProjectFile && (
            <button
              onClick={saveAsProjectFile}
              className="px-3 py-1 rounded-xl border text-sm hover:bg-blue-50 text-blue-600"
              title="Save as project file"
            >
              💾 Save
            </button>
          )}
          <button
            onClick={clearActive}
            className="px-3 py-1 rounded-xl border text-sm hover:bg-neutral-100"
            title="Clear code in this tab"
          >
            ◻︎ Clear
          </button>
          <button
            onClick={renameActive}
            className="px-3 py-1 rounded-xl border text-sm hover:bg-neutral-100"
            title="Rename tab"
            disabled={active?.isProjectFile}
          >
            ✎ Rename
          </button>
          <button
            onClick={deleteActive}
            className="px-3 py-1 rounded-xl border text-sm hover:bg-red-50 text-red-600"
            title="Close tab"
            disabled={active?.isProjectFile}
          >
            ✕ Close
          </button>
        </div>
      </div>

      {/* Editor */}
      <div
        className="flex-1 min-h-0 relative"
        style={{
          height: `${editorHeight}px`,
          minHeight: '500px'
        }}
      >
        {active && (
          <Editor
            height={editorHeight}
            width="100%"
            defaultLanguage={active.language}
            language={active.language}
            value={active.value}
            onChange={(val) => setValue(active.id, val ?? "")}
            onMount={handleEditorDidMount}
            options={{
              automaticLayout: false, // Disable automatic layout to prevent gradual expansion
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              tabSize: 2,
              fontSize: 14,
              smoothScrolling: false, // Disable smooth scrolling to prevent layout shifts
              padding: { top: 16 },
              renderWhitespace: "selection",
              wordWrap: "on",
              lineNumbers: "on",
              folding: true,
              matchBrackets: "always",
              autoIndent: "full",
              fixedOverflowWidgets: true, // Prevent overflow widgets from affecting layout
              overviewRulerLanes: 0, // Disable overview ruler to save space
              hideCursorInOverviewRuler: true,
              scrollbar: {
                useShadows: false,
                verticalHasArrows: false,
                horizontalHasArrows: false,
                vertical: 'visible',
                horizontal: 'visible',
                verticalScrollbarSize: 14,
                horizontalScrollbarSize: 14
              }
            }}
            theme={theme}
            loading={
              <div
                className="flex items-center justify-center w-full bg-gray-900"
                style={{ height: `${editorHeight}px` }}
              >
                <div className="text-center">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm text-gray-400">Loading Editor...</p>
                </div>
              </div>
            }
          />
        )}
      </div>
    </div>
  );
}
