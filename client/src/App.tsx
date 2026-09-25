import { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { ActivityBar } from './components/ActivityBar';
import { FileExplorer } from './components/FileExplorer';
import { EditorPane } from './components/EditorPane';
import { AntigravityCLIPanel } from './components/AntigravityCLIPanel';
import { ChatPanel } from './components/ChatPanel';
import { ActivityStream } from './components/ActivityStream';
import { Terminal } from './components/Terminal';
import { DemoModal } from './components/DemoModal';
import type {
  ProjectFile,
  User,
  MottoState,
  AIOperation,
  AIPermissionMode,
  AIStateMachineState,
  ChatMessage,
  ActivityEvent,
  TerminalLog,
  AIMarker
} from './types';

export function App() {
  // Query parameters or default Room ID
  const urlParams = new URLSearchParams(window.location.search);
  const initialRoom = urlParams.get('room') || 'DEV-AI-7824';

  const [roomId, setRoomId] = useState<string>(initialRoom);
  const [currentUser] = useState<User>({
    id: `user_${Math.random().toString(36).substring(2, 7)}`,
    name: 'Divya (You)',
    color: '#00f0ff',
    lastActive: Date.now()
  });

  // Workspace & Collaboration State
  const [files, setFiles] = useState<Record<string, ProjectFile>>({});
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [workspaceVersion, setWorkspaceVersion] = useState<number>(1);
  const [syncStatus, setSyncStatus] = useState<string>('✓ Synced (1s CRDT)');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // AI & Motto State
  const [, setMotto] = useState<MottoState>({
    goal: 'Build a complete user authentication system',
    currentTask: 'Initialize project architecture and team motto',
    components: ['Frontend UI', 'Application Core'],
    missingComponents: ['API Connection'],
    confidence: 0.9,
    reasoning: 'AI initialized.',
    lastUpdated: Date.now()
  });
  const [aiState, setAiState] = useState<AIStateMachineState>('IDLE');
  const [permissionMode, setPermissionMode] = useState<AIPermissionMode>('suggest');
  const [pendingOperation, setPendingOperation] = useState<AIOperation | null>(null);
  const [aiMarkers, setAiMarkers] = useState<AIMarker[]>([]);

  // Panels & Logs
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [terminalLogs, setTerminalLogs] = useState<TerminalLog[]>([
    {
      id: 'init-1',
      timestamp: Date.now(),
      level: 'ai',
      source: 'antigravity-cli',
      message: '⚡ Antigravity CLI Daemon v2.4 initialized. CRDT synchronization active.'
    }
  ]);
  const [terminalOpen, setTerminalOpen] = useState<boolean>(true);
  const [rightPanelOpen, setRightPanelOpen] = useState<boolean>(true);
  const [rightPanelTab, setRightPanelTab] = useState<'cli' | 'chat' | 'activity'>('cli');
  const [demoModalOpen, setDemoModalOpen] = useState<boolean>(false);
  const [isAgentFullView, setIsAgentFullView] = useState<boolean>(false);
  const [activityTab, setActivityTab] = useState<'explorer' | 'search' | 'git' | 'debug' | 'extensions'>('explorer');

  // References
  const wsRef = useRef<WebSocket | null>(null);
  const autoSaveTimersRef = useRef<Record<string, any>>({});

  // Detect Native Electron Environment
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.getSystemInfo().then((info) => {
        setTerminalLogs(prev => [
          ...prev,
          {
            id: `electron-${Date.now()}`,
            timestamp: Date.now(),
            level: 'ai',
            source: 'antigravity-cli',
            message: `⚡ Native Electron Host active on ${info.platform} (${info.arch}). Direct host PowerShell & local file system enabled.`
          }
        ]);
      });
    }
  }, []);

  // Connect to WebSocket Server
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:3001`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('⚡ Connected to EOL WebSocket Server');
      setSyncStatus('✓ Connected');

      // Join Room
      ws.send(JSON.stringify({
        type: 'room:join',
        data: {
          roomId,
          user: currentUser
        }
      }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        handleServerMessage(msg);
      } catch (err) {
        console.error('Error parsing incoming WS message:', err);
      }
    };

    ws.onclose = () => {
      console.warn('⚡ WebSocket connection closed. Reconnecting in 2s...');
      setSyncStatus('Reconnecting...');
    };

    return () => {
      ws.close();
    };
  }, [roomId]);

  const handleServerMessage = (msg: { type: string; data: any }) => {
    switch (msg.type) {
      case 'room:sync': {
        const { room, files: syncedFiles, activeUsers: syncedUsers, chats: syncedChats, activities: syncedActs, terminalLogs: syncedLogs, pendingOperation: syncedOp } = msg.data;
        setFiles(syncedFiles || {});
        setWorkspaceVersion(room.workspaceVersion || 1);
        setActiveUsers(syncedUsers || []);
        if (room.motto) setMotto(room.motto);
        if (room.aiState) setAiState(room.aiState);
        if (room.permissionMode) setPermissionMode(room.permissionMode);
        if (syncedOp) setPendingOperation(syncedOp);
        if (syncedChats) setChats(syncedChats);
        if (syncedActs) setActivities(syncedActs);
        if (syncedLogs) setTerminalLogs(prev => [...syncedLogs, ...prev.slice(syncedLogs.length)]);

        // Open initial tab if available
        const fileKeys = Object.keys(syncedFiles || {});
        if (fileKeys.length > 0 && !activeFile) {
          const defaultTab = fileKeys.includes('Login.jsx') ? 'Login.jsx' : fileKeys[0];
          setOpenTabs([defaultTab]);
          setActiveFile(defaultTab);
        }
        break;
      }

      case 'document:delta': {
        const { filePath, index, deleteCount, insertText, version, workspaceVersion: newWsVer } = msg.data;
        setFiles(prev => {
          const file = prev[filePath];
          if (!file) return prev;
          const currentContent = file.content || '';
          const before = currentContent.slice(0, index);
          const after = currentContent.slice(index + deleteCount);
          const updatedContent = before + insertText + after;

          return {
            ...prev,
            [filePath]: {
              ...file,
              content: updatedContent,
              version: version || file.version + 1
            }
          };
        });

        if (newWsVer) setWorkspaceVersion(newWsVer);
        break;
      }

      case 'cursor:update': {
        const { userId, user } = msg.data;
        setActiveUsers(prev => {
          const idx = prev.findIndex(u => u.id === userId);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = { ...next[idx], ...user };
            return next;
          }
          return [...prev, user];
        });
        break;
      }

      case 'presence:joined': {
        const { user, activeUsers: allUsers, activity } = msg.data;
        if (allUsers) {
          setActiveUsers(allUsers);
        } else if (user) {
          setActiveUsers(prev => prev.some(u => u.id === user.id) ? prev : [...prev, user]);
        }
        if (activity) setActivities(prev => [...prev, activity]);
        break;
      }

      case 'presence:left': {
        const { userId, activeUsers: allUsers, activity } = msg.data;
        if (allUsers) {
          setActiveUsers(allUsers);
        } else if (userId) {
          setActiveUsers(prev => prev.filter(u => u.id !== userId));
        }
        if (activity) setActivities(prev => [...prev, activity]);
        break;
      }

      case 'file:create': {
        const { file, activity } = msg.data;
        setFiles(prev => ({ ...prev, [file.path]: file }));
        setOpenTabs(prev => prev.includes(file.path) ? prev : [...prev, file.path]);
        setActiveFile(file.path);
        if (activity) setActivities(prev => [...prev, activity]);
        break;
      }

      case 'file:delete': {
        const { filePath, activity } = msg.data;
        setFiles(prev => {
          const next = { ...prev };
          delete next[filePath];
          return next;
        });
        setOpenTabs(prev => prev.filter(t => t !== filePath));
        if (activeFile === filePath) {
          setActiveFile(null);
        }
        if (activity) setActivities(prev => [...prev, activity]);
        break;
      }

      case 'file:rename': {
        const { oldPath, newPath, file, activity } = msg.data;
        setFiles(prev => {
          const next = { ...prev };
          delete next[oldPath];
          next[newPath] = file;
          return next;
        });
        setOpenTabs(prev => prev.map(t => t === oldPath ? newPath : t));
        if (activeFile === oldPath) setActiveFile(newPath);
        if (activity) setActivities(prev => [...prev, activity]);
        break;
      }

      case 'chat:message': {
        setChats(prev => [...prev, msg.data]);
        break;
      }

      case 'motto:updated': {
        setMotto(msg.data);
        break;
      }

      case 'ai:status': {
        const { state, permissionMode: mode, pendingOperation: op } = msg.data;
        setAiState(state);
        if (mode) setPermissionMode(mode);
        setPendingOperation(op);
        break;
      }

      case 'ai:conflict': {
        setAiState('CONFLICT');
        break;
      }

      case 'ai:applied': {
        const { markers, workspaceVersion: newVer } = msg.data;
        setAiMarkers(prev => [...prev, ...markers]);
        setWorkspaceVersion(newVer);
        setPendingOperation(null);
        setAiState('COMPLETED');
        setTimeout(() => setAiState('IDLE'), 2000);

        // Fetch fresh file contents from server
        fetch(`/api/rooms/${roomId}/files`)
          .then(res => res.json())
          .then(data => {
            if (data.files) setFiles(data.files);
          });
        break;
      }

      case 'workspace:persisted': {
        const { workspaceVersion: newVer, statusText } = msg.data;
        setWorkspaceVersion(newVer);
        setSyncStatus(statusText || '✓ Synced (1s CRDT)');
        setIsSyncing(false);
        break;
      }

      case 'terminal:log': {
        setTerminalLogs(prev => [...prev, msg.data]);
        break;
      }
    }
  };

  // Switch Room
  const handleSwitchRoom = (newRoom: string) => {
    setRoomId(newRoom);
    window.history.pushState({}, '', `?room=${newRoom}`);
  };

  // Editor Actions
  const handleSelectTab = (path: string) => {
    setActiveFile(path);
  };

  const handleCloseTab = (path: string) => {
    const nextTabs = openTabs.filter(t => t !== path);
    setOpenTabs(nextTabs);
    if (activeFile === path) {
      setActiveFile(nextTabs.length > 0 ? nextTabs[nextTabs.length - 1] : null);
    }
  };

  const handleContentChange = (filePath: string, newContent: string, delta?: { index: number; deleteCount: number; insertText: string }) => {
    setIsSyncing(true);
    setSyncStatus('● Syncing...');

    // Optimistically update local file
    setFiles(prev => ({
      ...prev,
      [filePath]: {
        ...prev[filePath],
        content: newContent,
        version: (prev[filePath]?.version || 1) + 1
      }
    }));

    // Continuous Auto-Save (500ms debounce) to local disk when running in native Electron
    if (window.electronAPI) {
      if (autoSaveTimersRef.current[filePath]) {
        clearTimeout(autoSaveTimersRef.current[filePath]);
      }
      autoSaveTimersRef.current[filePath] = setTimeout(async () => {
        try {
          await window.electronAPI?.writeFile(filePath, newContent);
          setSyncStatus('✓ Auto-Saved to Disk');
          setIsSyncing(false);
        } catch (err) {
          console.error('Auto-save error:', err);
        }
      }, 500);
    }

    // Send immediate CRDT delta over WebSocket (no 1-second delay!)
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && delta) {
      wsRef.current.send(JSON.stringify({
        type: 'document:delta',
        data: {
          filePath,
          index: delta.index,
          deleteCount: delta.deleteCount,
          insertText: delta.insertText,
          userId: currentUser.id
        }
      }));
    }
  };

  // Open Local Workspace Folder
  const handleOpenFolder = async () => {
    if (window.electronAPI) {
      const selectedDir = await window.electronAPI.openDirectory();
      if (!selectedDir) return;

      const dirData = await window.electronAPI.readDirectory(selectedDir);
      if (dirData.success && dirData.entries) {
        const loadedFiles: Record<string, ProjectFile> = {};
        for (const entry of dirData.entries) {
          if (!entry.isDirectory) {
            const fileRes = await window.electronAPI.readFile(entry.path);
            loadedFiles[entry.name] = {
              id: `file_${entry.name}`,
              name: entry.name,
              path: entry.path,
              type: 'file',
              content: fileRes.content || '',
              version: 1,
              lastModifiedAt: Date.now()
            };
          }
        }
        setFiles(loadedFiles);
        const fileNames = Object.keys(loadedFiles);
        if (fileNames.length > 0) {
          setOpenTabs([fileNames[0]]);
          setActiveFile(fileNames[0]);
        }
        setTerminalLogs(prev => [
          ...prev,
          {
            id: `open-${Date.now()}`,
            timestamp: Date.now(),
            level: 'info',
            source: 'system',
            message: `📂 Opened workspace folder: ${selectedDir} (${fileNames.length} file(s) loaded)`
          }
        ]);
      }
    }
  };

  const handleCursorChange = (filePath: string, cursor: { line: number; ch: number }) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'cursor:update',
        data: {
          filePath,
          cursor
        }
      }));
    }
  };

  // File Operations
  const handleCreateFile = async (filePath: string) => {
    await fetch(`/api/rooms/${roomId}/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath, content: '', user: currentUser })
    });
  };

  const handleDeleteFile = async (filePath: string) => {
    await fetch(`/api/rooms/${roomId}/files`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filePath, user: currentUser })
    });
  };

  const handleRenameFile = async (oldPath: string, newPath: string) => {
    await fetch(`/api/rooms/${roomId}/files/rename`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPath, newPath, user: currentUser })
    });
  };

  // AI & Motto Operations
  const handleSetPermissionMode = async (mode: AIPermissionMode) => {
    setPermissionMode(mode);
    await fetch(`/api/rooms/${roomId}/ai/mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode })
    });
  };

  const handleTriggerAI = async (customPrompt?: string) => {
    setAiState('ANALYZING');
    await fetch(`/api/rooms/${roomId}/ai/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: customPrompt })
    });
  };

  const handleApplyAIPatch = async (opId: string) => {
    const res = await fetch(`/api/rooms/${roomId}/ai/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operationId: opId })
    });
    const data = await res.json();
    if (!data.success && data.conflict) {
      setAiState('CONFLICT');
    }
  };

  const handleRejectAIPatch = async (opId: string) => {
    await fetch(`/api/rooms/${roomId}/ai/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operationId: opId })
    });
    setPendingOperation(null);
  };

  const handleReanalyzeAIPatch = async (opId: string) => {
    await fetch(`/api/rooms/${roomId}/ai/reanalyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operationId: opId })
    });
  };

  // Chat
  const handleSendMessage = async (text: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'chat:send',
        data: { text }
      }));
    }
  };

  // CLI Command Direct Execution
  const handleExecuteCLICommand = (command: string) => {
    setTerminalLogs(prev => [
      ...prev,
      {
        id: `cli-${Date.now()}`,
        timestamp: Date.now(),
        level: 'info',
        source: 'user',
        message: `$ ${command}`
      }
    ]);

    handleTriggerAI(command);
  };

  // Simulate Peer Collaborator (Priya)
  const handleSimulatePeer = async () => {
    const peerUser: User = {
      id: 'user_priya_sim',
      name: 'Priya (Collaborator)',
      color: '#ec4899',
      lastActive: Date.now(),
      currentFile: activeFile || 'app.js',
      cursor: { line: 5, ch: 10 }
    };

    setActiveUsers(prev => prev.some(u => u.id === peerUser.id) ? prev : [...prev, peerUser]);

    // Send a sample collaborative keystroke to test CRDT live merging
    if (activeFile) {
      setTimeout(() => {
        handleContentChange(activeFile, (files[activeFile]?.content || '') + '\n// Peer edit from Priya\n', {
          index: (files[activeFile]?.content || '').length,
          deleteCount: 0,
          insertText: '\n// Peer edit from Priya\n'
        });
      }, 500);
    }
  };

  // Run Demo Step
  const handleRunDemoStep = async (step: number) => {
    const res = await fetch(`/api/rooms/${roomId}/demo/step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step })
    });
    const result = await res.json();

    // Re-fetch files to reflect changes
    const fileRes = await fetch(`/api/rooms/${roomId}/files`);
    const fileData = await fileRes.json();
    if (fileData.files) {
      setFiles(fileData.files);
      if (step === 3 && fileData.files['Login.jsx']) {
        setOpenTabs(prev => [...prev.filter(t => t !== 'Login.jsx'), 'Login.jsx']);
        setActiveFile('Login.jsx');
      }
      if (step === 4 && fileData.files['UserModel.js']) {
        setOpenTabs(prev => [...prev.filter(t => t !== 'UserModel.js'), 'UserModel.js']);
        setActiveFile('UserModel.js');
      }
    }

    return result;
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <Navbar
        roomId={roomId}
        onSwitchRoom={handleSwitchRoom}
        workspaceVersion={workspaceVersion}
        syncStatus={syncStatus}
        isSyncing={isSyncing}
        activeUsers={activeUsers}
        currentUser={currentUser}
        aiState={aiState}
        permissionMode={permissionMode}
        onSetPermissionMode={handleSetPermissionMode}
        onTriggerAI={() => handleTriggerAI()}
        onOpenDemo={() => setDemoModalOpen(true)}
        onSimulatePeer={handleSimulatePeer}
        terminalOpen={terminalOpen}
        onToggleTerminal={() => setTerminalOpen(!terminalOpen)}
        onToggleRightPanel={() => setRightPanelOpen(!rightPanelOpen)}
        rightPanelOpen={rightPanelOpen}
        isAgentFullView={isAgentFullView}
        onToggleAgentView={() => setIsAgentFullView(!isAgentFullView)}
      />

      {/* Main View Area (Agent Full View vs Split IDE View) */}
      {isAgentFullView ? (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <AntigravityCLIPanel
            files={files}
            workspaceVersion={workspaceVersion}
            aiState={aiState}
            permissionMode={permissionMode}
            onSetPermissionMode={handleSetPermissionMode}
            onTriggerAI={handleTriggerAI}
            pendingOperation={pendingOperation}
            onApplyPatch={handleApplyAIPatch}
            onRejectPatch={handleRejectAIPatch}
            onReanalyzePatch={handleReanalyzeAIPatch}
            activeFile={activeFile}
            onSelectFile={(filePath) => {
              if (!openTabs.includes(filePath)) {
                setOpenTabs(prev => [...prev, filePath]);
              }
              setActiveFile(filePath);
            }}
            isFullView={true}
            onToggleFullView={() => setIsAgentFullView(false)}
            roomId={roomId}
          />
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Leftmost Activity Bar (48px) */}
          <ActivityBar
            activeTab={activityTab}
            onSelectTab={setActivityTab}
            currentUser={currentUser}
          />

          {/* Left: File Explorer */}
          {activityTab === 'explorer' && (
            <FileExplorer
              files={files}
              activeFile={activeFile}
              onSelectFile={(path) => {
                if (!openTabs.includes(path)) {
                  setOpenTabs(prev => [...prev, path]);
                }
                setActiveFile(path);
              }}
              onCreateFile={handleCreateFile}
              onDeleteFile={handleDeleteFile}
              onRenameFile={handleRenameFile}
              onOpenFolder={handleOpenFolder}
              activeUsers={activeUsers}
              currentUser={currentUser}
            />
          )}

          {/* Center: Monaco Editor & Bottom Terminal */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
            <EditorPane
              files={files}
              openTabs={openTabs}
              activeFile={activeFile}
              onSelectTab={handleSelectTab}
              onCloseTab={handleCloseTab}
              onContentChange={handleContentChange}
              onCursorChange={handleCursorChange}
              activeUsers={activeUsers}
              currentUser={currentUser}
              aiMarkers={aiMarkers}
              workspaceVersion={workspaceVersion}
            />

            {/* Bottom Terminal Drawer */}
            {terminalOpen && (
              <Terminal
                logs={terminalLogs}
                files={files}
                onClear={() => setTerminalLogs([])}
                onClose={() => setTerminalOpen(false)}
                onExecuteCommand={handleExecuteCLICommand}
                roomId={roomId}
              />
            )}
          </div>

          {/* Right: Antigravity CLI Builder, Chat, and Activity Stream */}
          {rightPanelOpen && (
            <aside style={{
              width: '380px',
              height: '100%',
              borderLeft: '1px solid #2b2b2b',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#181818',
              flexShrink: 0
            }}>
              {/* VS Code Dark Modern Tab Bar */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                padding: '4px 8px',
                borderBottom: '1px solid #2b2b2b',
                background: '#181818',
                gap: '4px'
              }}>
                <button
                  onClick={() => setRightPanelTab('cli')}
                  style={{
                    flex: 1.2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    padding: '5px 8px',
                    fontSize: '11px',
                    fontWeight: 500,
                    borderRadius: '4px',
                    border: rightPanelTab === 'cli' ? '1px solid #333333' : '1px solid transparent',
                    cursor: 'pointer',
                    background: rightPanelTab === 'cli' ? '#252526' : 'transparent',
                    color: rightPanelTab === 'cli' ? '#ffffff' : '#858585',
                    transition: 'all 0.12s ease',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <span>⚡ Agent</span>
                </button>
                <button
                  onClick={() => setRightPanelTab('chat')}
                  style={{
                    flex: 0.9,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    padding: '5px 8px',
                    fontSize: '11px',
                    fontWeight: 500,
                    borderRadius: '4px',
                    border: rightPanelTab === 'chat' ? '1px solid #333333' : '1px solid transparent',
                    cursor: 'pointer',
                    background: rightPanelTab === 'chat' ? '#252526' : 'transparent',
                    color: rightPanelTab === 'chat' ? '#ffffff' : '#858585',
                    transition: 'all 0.12s ease'
                  }}
                >
                  <span>💬 Chat</span>
                  {chats.length > 0 && (
                    <span style={{
                      fontSize: '10px',
                      padding: '1px 5px',
                      borderRadius: '10px',
                      background: '#333333',
                      color: '#cccccc'
                    }}>
                      {chats.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setRightPanelTab('activity')}
                  style={{
                    flex: 0.9,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    padding: '5px 8px',
                    fontSize: '11px',
                    fontWeight: 500,
                    borderRadius: '4px',
                    border: rightPanelTab === 'activity' ? '1px solid #333333' : '1px solid transparent',
                    cursor: 'pointer',
                    background: rightPanelTab === 'activity' ? '#252526' : 'transparent',
                    color: rightPanelTab === 'activity' ? '#ffffff' : '#858585',
                    transition: 'all 0.12s ease'
                  }}
                >
                  <span>📊 Activity</span>
                </button>
              </div>

              {/* Tab Content */}
              <div style={{ flex: 1, overflowY: 'auto', padding: rightPanelTab === 'cli' ? '0' : '1rem', display: 'flex', flexDirection: 'column' }}>
                {rightPanelTab === 'cli' && (
                  <AntigravityCLIPanel
                    files={files}
                    workspaceVersion={workspaceVersion}
                    aiState={aiState}
                    permissionMode={permissionMode}
                    onSetPermissionMode={handleSetPermissionMode}
                    onTriggerAI={handleTriggerAI}
                    pendingOperation={pendingOperation}
                    onApplyPatch={handleApplyAIPatch}
                    onRejectPatch={handleRejectAIPatch}
                    onReanalyzePatch={handleReanalyzeAIPatch}
                    activeFile={activeFile}
                    onSelectFile={(filePath) => {
                      if (!openTabs.includes(filePath)) {
                        setOpenTabs(prev => [...prev, filePath]);
                      }
                      setActiveFile(filePath);
                    }}
                    isFullView={false}
                    onToggleFullView={() => setIsAgentFullView(true)}
                    roomId={roomId}
                  />
                )}

                {rightPanelTab === 'chat' && (
                  <ChatPanel
                    chats={chats}
                    onSendMessage={handleSendMessage}
                    currentUser={currentUser}
                  />
                )}

                {rightPanelTab === 'activity' && (
                  <ActivityStream activities={activities} />
                )}
              </div>
            </aside>
          )}
      </div>
      )}

      {/* 10-Step Interactive Demo Walkthrough Modal */}
      <DemoModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        onRunStep={handleRunDemoStep}
      />
    </div>
  );
}

export default App;
