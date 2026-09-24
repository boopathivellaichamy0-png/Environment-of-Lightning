import { useEffect, useRef, useState } from 'react';
import type { FC } from 'react';
import Editor from '@monaco-editor/react';
import type { OnMount, OnChange } from '@monaco-editor/react';
import { X, Sparkles, Check, FileCode } from 'lucide-react';
import type { ProjectFile, User, AIMarker } from '../types';

interface EditorPaneProps {
  files: Record<string, ProjectFile>;
  openTabs: string[];
  activeFile: string | null;
  onSelectTab: (filePath: string) => void;
  onCloseTab: (filePath: string) => void;
  onContentChange: (filePath: string, newContent: string, delta?: { index: number; deleteCount: number; insertText: string }) => void;
  onCursorChange: (filePath: string, cursor: { line: number; ch: number }) => void;
  activeUsers: User[];
  currentUser: User;
  aiMarkers: AIMarker[];
  workspaceVersion: number;
}

export const EditorPane: FC<EditorPaneProps> = ({
  files,
  openTabs,
  activeFile,
  onSelectTab,
  onCloseTab,
  onContentChange,
  onCursorChange,
  activeUsers,
  currentUser,
  aiMarkers,
  workspaceVersion
}) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const [decorations, setDecorations] = useState<string[]>([]);
  const isRemoteEditRef = useRef<boolean>(false);

  const currentFileObj = activeFile ? files[activeFile] : null;

  // Detect language from file extension
  const getLanguage = (filePath: string | null) => {
    if (!filePath) return 'javascript';
    if (filePath.endsWith('.jsx') || filePath.endsWith('.tsx')) return 'javascript';
    if (filePath.endsWith('.ts')) return 'typescript';
    if (filePath.endsWith('.js')) return 'javascript';
    if (filePath.endsWith('.html')) return 'html';
    if (filePath.endsWith('.css')) return 'css';
    if (filePath.endsWith('.json')) return 'json';
    if (filePath.endsWith('.md')) return 'markdown';
    return 'plaintext';
  };

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Define Custom Electric Dark Theme
    monaco.editor.defineTheme('lightning-theme', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '64748b', fontStyle: 'italic' },
        { token: 'keyword', foreground: '00f0ff', fontStyle: 'bold' },
        { token: 'string', foreground: '34d399' },
        { token: 'number', foreground: 'f59e0b' },
        { token: 'type', foreground: 'a855f7' },
        { token: 'identifier', foreground: 'f8fafc' },
        { token: 'delimiter', foreground: '94a3b8' }
      ],
      colors: {
        'editor.background': '#07090e',
        'editor.foreground': '#f8fafc',
        'editor.lineHighlightBackground': '#11172688',
        'editorCursor.foreground': '#00f0ff',
        'editorLineNumber.foreground': '#334155',
        'editorLineNumber.activeForeground': '#00f0ff',
        'editorGutter.background': '#07090e',
        'editor.selectionBackground': '#00f0ff22',
        'editor.inactiveSelectionBackground': '#00f0ff11'
      }
    });

    monaco.editor.setTheme('lightning-theme');

    // Track Cursor Position
    editor.onDidChangeCursorPosition((e: any) => {
      if (activeFile) {
        onCursorChange(activeFile, { line: e.position.lineNumber, ch: e.position.column });
      }
    });
  };

  // Update AI & Collaborator Decorations
  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || !activeFile) return;

    const newDecorations: any[] = [];

    // 1. AI Changed Lines Highlights (Section 19: Visual Distinction)
    const fileAiMarkers = aiMarkers.filter(m => m.file === activeFile);
    for (const marker of fileAiMarkers) {
      newDecorations.push({
        range: new monacoRef.current.Range(marker.startLine, 1, marker.endLine, 1),
        options: {
          isWholeLine: true,
          className: 'monaco-ai-line-highlight',
          linesDecorationsClassName: 'monaco-ai-gutter-glyph',
          hoverMessage: { value: '⚡ **Modified by Antigravity CLI** via CRDT' }
        }
      });
    }

    // 2. Peer Collaborator Cursors
    const peersOnThisFile = activeUsers.filter(u => u.currentFile === activeFile && u.id !== currentUser.id);
    for (const peer of peersOnThisFile) {
      if (peer.cursor) {
        newDecorations.push({
          range: new monacoRef.current.Range(peer.cursor.line, peer.cursor.ch, peer.cursor.line, peer.cursor.ch + 1),
          options: {
            className: `peer-cursor-${peer.id}`,
            before: {
              content: ` ${peer.name}`,
              inlineClassName: 'remote-cursor-label'
            }
          }
        });
      }
    }

    const appliedIds = editorRef.current.deltaDecorations(decorations, newDecorations);
    setDecorations(appliedIds);
  }, [activeFile, aiMarkers, activeUsers]);

  const handleEditorChange: OnChange = (value, ev) => {
    if (!activeFile || isRemoteEditRef.current) return;
    const newContent = value || '';

    // Calculate delta for fast CRDT streaming
    if (ev && ev.changes && ev.changes.length > 0) {
      const change = ev.changes[0];
      onContentChange(activeFile, newContent, {
        index: change.rangeOffset,
        deleteCount: change.rangeLength,
        insertText: change.text
      });
    } else {
      onContentChange(activeFile, newContent);
    }
  };

  return (
    <main style={{
      flex: 1,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#07090e',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* File Tabs Bar */}
      <div style={{
        height: '38px',
        backgroundColor: 'rgba(8, 12, 22, 0.8)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 4px',
        gap: '2px',
        overflowX: 'auto',
        overflowY: 'hidden'
      }}>
        {openTabs.map((tabPath) => {
          const file = files[tabPath];
          const isActive = activeFile === tabPath;
          const fileName = tabPath.split('/').pop() || tabPath;

          return (
            <div
              key={tabPath}
              onClick={() => onSelectTab(tabPath)}
              style={{
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0 0.85rem',
                borderRadius: '6px 6px 0 0',
                backgroundColor: isActive ? 'rgba(14, 20, 36, 0.95)' : 'transparent',
                border: isActive ? '1px solid rgba(0, 240, 255, 0.25)' : '1px solid transparent',
                borderBottom: 'none',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '0.78rem',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: isActive ? '0 -2px 10px rgba(0, 240, 255, 0.12)' : 'none',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.04)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span style={{ fontWeight: isActive ? 600 : 400 }}>{fileName}</span>
              {file?.isAiModified && (
                <span title="AI Modified" style={{ display: 'inline-flex' }}>
                  <Sparkles size={11} color="var(--ai-purple)" />
                </span>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tabPath);
                }}
                className="btn-icon"
                style={{ width: '16px', height: '16px', marginLeft: '2px', borderRadius: '4px' }}
              >
                <X size={11} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Editor Body */}
      <div style={{ flex: 1, position: 'relative' }}>
        {activeFile && currentFileObj ? (
          <Editor
            height="100%"
            path={activeFile}
            language={getLanguage(activeFile)}
            value={currentFileObj.content || ''}
            onMount={handleEditorMount}
            onChange={handleEditorChange}
            options={{
              fontSize: 13,
              fontFamily: "'JetBrains Mono', monospace",
              fontLigatures: true,
              minimap: { enabled: true, maxColumn: 80 },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on',
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              smoothScrolling: true,
              renderLineHighlight: 'all',
              bracketPairColorization: { enabled: true }
            }}
          />
        ) : (
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            gap: '1rem'
          }}>
            <div className="glass-card" style={{
              padding: '2rem 3rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.85rem',
              border: '1px solid var(--border-glow)'
            }}>
              <FileCode size={42} color="var(--lightning-cyan)" />
              <div style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: '#ffffff', fontWeight: 600 }}>
                Select a file from the explorer to begin collaborating
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Live CRDT multi-user editing with Antigravity AI Orchestration
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <footer style={{
        height: '26px',
        backgroundColor: 'rgba(7, 10, 18, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1rem',
        fontSize: '0.68rem',
        fontFamily: 'var(--font-mono)',
        color: 'var(--text-muted)',
        userSelect: 'none'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: 'var(--lightning-cyan)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
            ⚡ {activeFile || 'No file selected'}
          </span>
          <span>Version: v{currentFileObj?.version || 1}</span>
          <span>WS Base: v{workspaceVersion}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>UTF-8</span>
          <span>{getLanguage(activeFile).toUpperCase()}</span>
          <span style={{ color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Check size={11} /> Auto-persist: 1s
          </span>
        </div>
      </footer>
    </main>
  );
};
