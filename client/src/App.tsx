import { useState, useEffect } from 'react';
import { ActivityBar, ActivityTab } from './components/ActivityBar.tsx';
import { FileExplorer } from './components/FileExplorer.tsx';
import { EditorPane } from './components/EditorPane.tsx';
import { TerminalPane } from './components/TerminalPane.tsx';
import { LivePreviewPane } from './components/LivePreviewPane.tsx';
import { AIAgentPane } from './components/AIAgentPane.tsx';
import { useWebSocket } from './hooks/useWebSocket.ts';

export function App() {
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsHost = window.location.hostname || 'localhost';
  const wsPort = window.location.port === '5173' ? '3001' : window.location.port || '3001';
  const wsUrl = `${wsProtocol}//${wsHost}:${wsPort}`;

  const {
    isConnected,
    files,
    terminalLogs,
    currentOperation,
    activeToolCalls,
    openedFileContents,
    readFile,
    writeFile,
    deleteFile,
    renameFile,
    executeCommand,
    clearTerminal,
    promptAI,
    applyAIPatch,
    rejectAIPatch
  } = useWebSocket(wsUrl);

  const [activeTab, setActiveTab] = useState<ActivityTab>('explorer');
  const [openTabs, setOpenTabs] = useState<string[]>(['index.html', 'style.css', 'app.js']);
  const [activeFile, setActiveFile] = useState<string | null>('index.html');
  const [showTerminal, setShowTerminal] = useState<boolean>(true);
  const [showPreviewSplit, setShowPreviewSplit] = useState<boolean>(false);
  const [showAIPanel, setShowAIPanel] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Read contents for initial open tabs
  useEffect(() => {
    openTabs.forEach((tab) => {
      if (!openedFileContents[tab]) {
        readFile(tab);
      }
    });
  }, [openTabs, readFile, openedFileContents]);

  const handleSelectFile = (path: string) => {
    if (!openTabs.includes(path)) {
      setOpenTabs((prev) => [...prev, path]);
    }
    setActiveFile(path);
    if (!openedFileContents[path]) {
      readFile(path);
    }
  };

  const handleCloseTab = (path: string) => {
    const nextTabs = openTabs.filter((t) => t !== path);
    setOpenTabs(nextTabs);
    if (activeFile === path) {
      setActiveFile(nextTabs.length > 0 ? nextTabs[nextTabs.length - 1] : null);
    }
  };

  const handleContentChange = (path: string, newContent: string) => {
    setIsSaving(true);
    writeFile(path, newContent);
    setTimeout(() => setIsSaving(false), 500);
  };

  const handleCreateFile = (path: string) => {
    writeFile(path, '');
    handleSelectFile(path);
  };

  const handleDeleteFile = (path: string) => {
    deleteFile(path);
    handleCloseTab(path);
  };

  const handleRenameFile = (oldPath: string, newPath: string) => {
    renameFile(oldPath, newPath);
    setOpenTabs((prev) => prev.map((t) => (t === oldPath ? newPath : t)));
    if (activeFile === oldPath) setActiveFile(newPath);
  };

  const handleTabSelect = (tab: ActivityTab) => {
    if (tab === 'terminal') {
      setShowTerminal((prev) => !prev);
    } else if (tab === 'preview') {
      setShowPreviewSplit((prev) => !prev);
    } else if (tab === 'ai') {
      setShowAIPanel((prev) => !prev);
    } else {
      setActiveTab(tab);
    }
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#181818' }}>
      {/* 1. Top Titlebar */}
      <div
        style={{
          height: '35px',
          backgroundColor: '#181818',
          borderBottom: '1px solid #2b2b2b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.04em' }}>
            ⚡ EOL IDE
          </span>
          <span style={{ fontSize: '11px', color: '#858585' }}>Environment of Lightning</span>
        </div>

        <div style={{ fontSize: '11px', color: '#858585', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>{activeFile ? `workspace > ${activeFile}` : 'No file selected'}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setShowPreviewSplit((p) => !p)}
            style={{
              background: showPreviewSplit ? '#0284c7' : '#252526',
              border: '1px solid #333333',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 500,
              padding: '3px 8px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {showPreviewSplit ? 'Hide Preview' : 'Live Preview'}
          </button>
          <button
            onClick={() => setShowAIPanel((p) => !p)}
            style={{
              background: showAIPanel ? '#0284c7' : '#252526',
              border: '1px solid #333333',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 500,
              padding: '3px 8px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {showAIPanel ? 'Hide AI' : 'Antigravity AI'}
          </button>
        </div>
      </div>

      {/* 2. Main Workbench Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Leftmost Activity Bar */}
        <ActivityBar activeTab={activeTab} onSelectTab={handleTabSelect} isConnected={isConnected} />

        {/* File Explorer (collapsible based on activeTab) */}
        {activeTab === 'explorer' && (
          <FileExplorer
            files={files}
            activeFile={activeFile}
            onSelectFile={handleSelectFile}
            onCreateFile={handleCreateFile}
            onDeleteFile={handleDeleteFile}
            onRenameFile={handleRenameFile}
          />
        )}

        {/* Center: Monaco Editor & Bottom Terminal */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            <EditorPane
              openTabs={openTabs}
              activeFile={activeFile}
              fileContents={openedFileContents}
              onSelectTab={setActiveFile}
              onCloseTab={handleCloseTab}
              onContentChange={handleContentChange}
              onRunPreview={() => setShowPreviewSplit(true)}
              isSaving={isSaving}
            />

            {/* Split Live Browser Preview */}
            {showPreviewSplit && <LivePreviewPane fileContents={openedFileContents} />}
          </div>

          {/* Bottom Terminal Drawer */}
          {showTerminal && (
            <TerminalPane logs={terminalLogs} onExecute={executeCommand} onClear={clearTerminal} onClose={() => setShowTerminal(false)} />
          )}
        </div>

        {/* Right: Antigravity AI Agent Sidebar */}
        {showAIPanel && (
          <AIAgentPane
            currentOperation={currentOperation}
            activeToolCalls={activeToolCalls}
            onPrompt={promptAI}
            onApply={applyAIPatch}
            onReject={rejectAIPatch}
          />
        )}
      </div>

      {/* 3. Bottom Status Bar */}
      <div
        style={{
          height: '22px',
          backgroundColor: '#0078d4',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 10px',
          fontSize: '11px',
          userSelect: 'none',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>⚡ EOL v2.0</span>
          <span>{isConnected ? '● Connected' : '○ Connecting...'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span>UTF-8</span>
          <span>{activeFile ? activeFile.split('.').pop()?.toUpperCase() : 'Plain Text'}</span>
          <span>Spaces: 2</span>
        </div>
      </div>
    </div>
  );
}

export default App;
