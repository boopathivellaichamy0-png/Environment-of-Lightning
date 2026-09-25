import { useEffect, useRef, useState } from 'react';
import type { FC } from 'react';
import Editor from '@monaco-editor/react';
import type { OnMount, OnChange } from '@monaco-editor/react';
import {
  X,
  Sparkles,
  Split,
  Play,
  MoreHorizontal,
  ChevronRight,
  Code2,
  FileCode,
  FileText,
  Palette
} from 'lucide-react';
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
  aiMarkers
}) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const [decorations, setDecorations] = useState<string[]>([]);
  const isRemoteEditRef = useRef<boolean>(false);

  const currentFileObj = activeFile ? files[activeFile] : null;

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

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.jsx') || fileName.endsWith('.tsx')) {
      return <Code2 size={13} color="#4fc1ff" />;
    }
    if (fileName.endsWith('.js') || fileName.endsWith('.ts')) {
      return <FileCode size={13} color="#e5c07b" />;
    }
    if (fileName.endsWith('.css')) {
      return <Palette size={13} color="#42a5f5" />;
    }
    if (fileName.endsWith('.html')) {
      return <Code2 size={13} color="#e06c75" />;
    }
    if (fileName.endsWith('.md')) {
      return <FileText size={13} color="#c678dd" />;
    }
    return <FileCode size={13} color="#969696" />;
  };

  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Define authentic VS Code Dark Modern Theme
    monaco.editor.defineTheme('vscode-dark-modern', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6a9955', fontStyle: 'italic' },
        { token: 'keyword', foreground: '569cd6' },
        { token: 'string', foreground: 'ce9178' },
        { token: 'number', foreground: 'b5cea8' },
        { token: 'type', foreground: '4ec9b0' },
        { token: 'identifier', foreground: '9cdcfe' },
        { token: 'delimiter', foreground: 'd4d4d4' }
      ],
      colors: {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#d4d4d4',
        'editor.lineHighlightBackground': '#282828',
        'editorCursor.foreground': '#aeafad',
        'editorLineNumber.foreground': '#858585',
        'editorLineNumber.activeForeground': '#c6c6c6',
        'editorGutter.background': '#1e1e1e',
        'editor.selectionBackground': '#264f78',
        'editor.inactiveSelectionBackground': '#3a3d41'
      }
    });

    monaco.editor.setTheme('vscode-dark-modern');

    editor.onDidChangeCursorPosition((e: any) => {
      if (activeFile) {
        onCursorChange(activeFile, { line: e.position.lineNumber, ch: e.position.column });
      }
    });
  };

  useEffect(() => {
    if (!editorRef.current || !monacoRef.current || !activeFile) return;

    const newDecorations: any[] = [];
    aiMarkers.filter(m => m.file === activeFile).forEach(marker => {
      const lineNum = marker.line ?? marker.startLine ?? 1;
      newDecorations.push({
        range: new monacoRef.current.Range(lineNum, 1, lineNum, 1),
        options: {
          isWholeLine: true,
          className: 'monaco-ai-line-highlight',
          glyphMarginClassName: 'monaco-ai-gutter-glyph',
          hoverMessage: { value: `**Antigravity CLI**: ${marker.message || 'Modified by Antigravity'}` }
        }
      });
    });

    setDecorations(editorRef.current.deltaDecorations(decorations, newDecorations));
  }, [aiMarkers, activeFile]);

  useEffect(() => {
    if (!editorRef.current || !activeFile || !currentFileObj) return;
    const currentVal = editorRef.current.getValue();
    if (currentVal !== currentFileObj.content) {
      isRemoteEditRef.current = true;
      const position = editorRef.current.getPosition();
      editorRef.current.setValue(currentFileObj.content || '');
      if (position) editorRef.current.setPosition(position);
      isRemoteEditRef.current = false;
    }
  }, [currentFileObj?.content, activeFile]);

  const handleEditorChange: OnChange = (val) => {
    if (isRemoteEditRef.current || !activeFile) return;
    onContentChange(activeFile, val || '');
  };

  return (
    <main style={{
      flex: 1,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#1e1e1e',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 1. File Tabs Bar */}
      <div style={{
        height: '35px',
        backgroundColor: '#181818',
        borderBottom: '1px solid #2b2b2b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0',
        overflowX: 'auto',
        overflowY: 'hidden',
        userSelect: 'none'
      }}>
        {/* Tab Items */}
        <div style={{ display: 'flex', alignItems: 'center', height: '100%', overflowX: 'auto' }}>
          {openTabs.map((tabPath) => {
            const file = files[tabPath];
            const isActive = activeFile === tabPath;
            const fileName = tabPath.split('/').pop() || tabPath;

            return (
              <div
                key={tabPath}
                onClick={() => onSelectTab(tabPath)}
                style={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0 12px',
                  backgroundColor: isActive ? '#1e1e1e' : '#181818',
                  borderRight: '1px solid #2b2b2b',
                  borderTop: isActive ? '1px solid #0078d4' : '1px solid transparent',
                  color: isActive ? '#ffffff' : '#969696',
                  fontSize: '12px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'background 0.1s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = '#1f1f1f';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.backgroundColor = '#181818';
                }}
              >
                {getFileIcon(fileName)}
                <span>{fileName}</span>
                {file?.isAiModified && (
                  <span title="AI Modified" style={{ display: 'inline-flex' }}>
                    <Sparkles size={11} color="#0078d4" />
                  </span>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tabPath);
                  }}
                  title="Close (Ctrl+W)"
                  style={{
                    width: '16px',
                    height: '16px',
                    marginLeft: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#858585',
                    borderRadius: '3px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#333333';
                    e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = '#858585';
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Tab Right Controls (Image 2) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', paddingRight: '8px' }}>
          <button
            title="Split Editor Right"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#858585',
              padding: '4px',
              borderRadius: '3px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#cccccc'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#858585'}
          >
            <Split size={14} />
          </button>
          <button
            title="Run Code"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#858585',
              padding: '4px',
              borderRadius: '3px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#cccccc'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#858585'}
          >
            <Play size={13} />
          </button>
          <button
            title="More Actions"
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#858585',
              padding: '4px',
              borderRadius: '3px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#cccccc'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#858585'}
          >
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>

      {/* 2. Breadcrumbs Bar (Image 2) */}
      {activeFile && (
        <div style={{
          height: '24px',
          backgroundColor: '#1e1e1e',
          borderBottom: '1px solid #282828',
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          gap: '4px',
          fontSize: '11px',
          color: '#8c8c8c',
          userSelect: 'none'
        }}>
          <span>client</span>
          <ChevronRight size={12} color="#6e7681" />
          <span style={{ color: '#cccccc' }}>{activeFile}</span>
        </div>
      )}

      {/* 3. Editor Body or Empty State */}
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
              fontFamily: "'Consolas', 'Courier New', monospace",
              fontLigatures: true,
              minimap: { enabled: true, maxColumn: 80 },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on',
              lineNumbers: 'on',
              renderLineHighlight: 'line',
              cursorBlinking: 'smooth',
              smoothScrolling: true,
              theme: 'vscode-dark-modern'
            }}
          />
        ) : (
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6e7681',
            gap: '12px',
            backgroundColor: '#1e1e1e',
            userSelect: 'none'
          }}>
            <Code2 size={42} strokeWidth={1} color="#333333" />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '13px', fontWeight: 500, color: '#969696', marginBottom: '4px' }}>
                Select a file from the explorer to begin editing
              </div>
              <div style={{ fontSize: '11px', color: '#6e7681' }}>
                Multiplayer real-time CRDT collaboration active
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};
