import { useEffect, useRef } from 'react';
import type { FC } from 'react';
import Editor from '@monaco-editor/react';
import { X, Code2, Play } from 'lucide-react';

interface EditorPaneProps {
  openTabs: string[];
  activeFile: string | null;
  fileContents: Record<string, string>;
  onSelectTab: (path: string) => void;
  onCloseTab: (path: string) => void;
  onContentChange: (path: string, newContent: string) => void;
  onRunPreview?: () => void;
  isSaving?: boolean;
}

export const EditorPane: FC<EditorPaneProps> = ({
  openTabs,
  activeFile,
  fileContents,
  onSelectTab,
  onCloseTab,
  onContentChange,
  onRunPreview,
  isSaving
}) => {
  const saveTimeoutRef = useRef<any>(null);

  const getLanguage = (fileName: string | null) => {
    if (!fileName) return 'javascript';
    if (fileName.endsWith('.html')) return 'html';
    if (fileName.endsWith('.css')) return 'css';
    if (fileName.endsWith('.js')) return 'javascript';
    if (fileName.endsWith('.jsx')) return 'javascript';
    if (fileName.endsWith('.ts')) return 'typescript';
    if (fileName.endsWith('.tsx')) return 'typescript';
    if (fileName.endsWith('.json')) return 'json';
    if (fileName.endsWith('.md')) return 'markdown';
    if (fileName.endsWith('.py')) return 'python';
    return 'plaintext';
  };

  const handleEditorChange = (value: string | undefined) => {
    if (!activeFile || value === undefined) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    // Debounce save 400ms
    saveTimeoutRef.current = setTimeout(() => {
      onContentChange(activeFile, value);
    }, 400);
  };

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const currentContent = activeFile ? fileContents[activeFile] ?? '' : '';

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#1e1e1e',
        overflow: 'hidden',
        minWidth: 0
      }}
    >
      {/* 1. Tab Bar */}
      <div
        style={{
          height: '35px',
          backgroundColor: '#181818',
          display: 'flex',
          alignItems: 'center',
          overflowX: 'auto',
          borderBottom: '1px solid #2b2b2b',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', flex: 1, height: '100%', overflowX: 'auto' }}>
          {openTabs.map((tab) => {
            const isActive = activeFile === tab;
            const fileName = tab.split('/').pop() || tab;

            return (
              <div
                key={tab}
                onClick={() => onSelectTab(tab)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0 12px',
                  height: '100%',
                  backgroundColor: isActive ? '#1e1e1e' : '#181818',
                  color: isActive ? '#ffffff' : '#858585',
                  borderRight: '1px solid #2b2b2b',
                  borderTop: isActive ? '2px solid #0078d4' : '2px solid transparent',
                  cursor: 'pointer',
                  fontSize: '12px',
                  whiteSpace: 'nowrap'
                }}
              >
                <span>{fileName}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(tab);
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#858585',
                    cursor: 'pointer',
                    padding: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    borderRadius: '2px'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#858585')}
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Tab Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingRight: '12px' }}>
          {isSaving && (
            <span style={{ fontSize: '11px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#38bdf8' }} />
              Saving...
            </span>
          )}
          {onRunPreview && (
            <button
              onClick={onRunPreview}
              title="Run Live Code in Browser"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: '#0284c7',
                border: 'none',
                color: '#ffffff',
                fontSize: '11px',
                fontWeight: 600,
                padding: '3px 8px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              <Play size={11} fill="currentColor" />
              <span>Run</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Breadcrumbs Bar */}
      {activeFile && (
        <div
          style={{
            height: '24px',
            backgroundColor: '#1e1e1e',
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            fontSize: '11px',
            color: '#858585',
            borderBottom: '1px solid #282828',
            flexShrink: 0
          }}
        >
          <span>workspace</span>
          <span style={{ margin: '0 4px' }}>&gt;</span>
          <span style={{ color: '#cccccc' }}>{activeFile}</span>
        </div>
      )}

      {/* 3. Editor View */}
      <div style={{ flex: 1, position: 'relative' }}>
        {activeFile ? (
          <Editor
            height="100%"
            language={getLanguage(activeFile)}
            theme="vs-dark"
            value={currentContent}
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: true },
              fontSize: 13,
              fontFamily: "'Fira Code', 'Consolas', 'Courier New', monospace",
              tabSize: 2,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              wordWrap: 'on',
              lineNumbers: 'on',
              renderWhitespace: 'selection'
            }}
          />
        ) : (
          <div
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#858585',
              gap: '12px'
            }}
          >
            <Code2 size={40} color="#333333" />
            <div style={{ fontSize: '13px' }}>Select a file from the explorer to begin editing</div>
          </div>
        )}
      </div>
    </div>
  );
};
