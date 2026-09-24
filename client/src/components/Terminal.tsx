import { useState, useRef, useEffect } from 'react';
import type { FC, KeyboardEvent } from 'react';
import {
  Terminal as TerminalIcon,
  Trash2,
  X,
  Plus,
  ChevronDown,
  Split,
  ChevronUp,
  Minimize2,
  CheckCircle2
} from 'lucide-react';
import type { TerminalLog, ProjectFile } from '../types';

interface TerminalProps {
  logs: TerminalLog[];
  files: Record<string, ProjectFile>;
  onClear: () => void;
  onClose: () => void;
  onExecuteCommand: (command: string) => void;
  roomId: string;
}

type PanelTab = 'PROBLEMS' | 'OUTPUT' | 'DEBUG CONSOLE' | 'TERMINAL' | 'PORTS';
type ShellType = 'pwsh' | 'bash' | 'node';

interface ShellSession {
  id: string;
  name: string;
  type: ShellType;
}

interface ShellLine {
  id: string;
  type: 'prompt' | 'output' | 'error' | 'success' | 'system';
  text: string;
  timestamp: number;
}

export const Terminal: FC<TerminalProps> = ({
  logs,
  onClear,
  onClose,
  onExecuteCommand,
  roomId
}) => {
  // VS Code Panel Tabs
  const [activePanelTab, setActivePanelTab] = useState<PanelTab>('TERMINAL');

  // Shell Sessions (Default: 1: pwsh)
  const [sessions, setSessions] = useState<ShellSession[]>([
    { id: 'session-1', name: '1: pwsh', type: 'pwsh' }
  ]);
  const [activeSessionId, setActiveSessionId] = useState<string>('session-1');
  const [showShellDropdown, setShowShellDropdown] = useState<boolean>(false);
  const [isMaximized, setIsMaximized] = useState<boolean>(false);

  // Command History & Input
  const [cmdInput, setCmdInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);

  // Terminal Lines per session or global
  const [lines, setLines] = useState<ShellLine[]>([
    {
      id: 'banner-1',
      type: 'system',
      text: 'Windows PowerShell\nCopyright (C) Microsoft Corporation. All rights reserved.\n\nInstall the latest PowerShell for new features and improvements! https://aka.ms/PSWindows\n',
      timestamp: Date.now() - 4000
    }
  ]);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const terminalBodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new lines
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [lines, cmdInput]);

  // Focus input when terminal becomes visible or tab switches
  useEffect(() => {
    if (activePanelTab === 'TERMINAL') {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [activePanelTab, activeSessionId]);

  // Sync incoming system and AI logs into terminal
  useEffect(() => {
    if (logs && logs.length > 0) {
      const last = logs[logs.length - 1];
      setLines(prev => {
        if (prev.some(l => l.id === last.id)) return prev;
        return [
          ...prev,
          {
            id: last.id,
            type: last.level === 'error' ? 'error' : last.level === 'ai' ? 'system' : 'output',
            text: `[${new Date(last.timestamp).toLocaleTimeString()}] ${last.message}`,
            timestamp: last.timestamp
          }
        ];
      });
    }
  }, [logs]);

  const getPromptString = () => {
    if (activeSession.type === 'pwsh') {
      return 'PS C:\\Users\\Admin\\Documents\\New folder\\EOL> ';
    } else if (activeSession.type === 'bash') {
      return 'developer@eol:~/workspace$ ';
    }
    return '> ';
  };

  const handleClear = () => {
    setLines([]);
    onClear();
  };

  const handleCommand = async (rawCmd: string) => {
    const trimmed = rawCmd.trim();
    const promptStr = getPromptString();

    // Append the typed prompt line to the terminal screen
    const promptLine: ShellLine = {
      id: `prompt-${Date.now()}`,
      type: 'prompt',
      text: `${promptStr}${rawCmd}`,
      timestamp: Date.now()
    };

    if (!trimmed) {
      setLines(prev => [...prev, promptLine]);
      return;
    }

    // Add to command history
    setHistory(prev => [trimmed, ...prev.filter(c => c !== trimmed)]);
    setHistoryIdx(-1);

    const parts = trimmed.split(' ');
    const cmd = parts[0].toLowerCase();

    // Local clear command
    if (cmd === 'clear' || cmd === 'cls') {
      setLines([]);
      onClear();
      return;
    }

    // Help command
    if (cmd === 'help') {
      setLines(prev => [
        ...prev,
        promptLine,
        {
          id: `out-${Date.now()}-1`,
          type: 'output',
          text: `Available Terminal Commands:
  Get-ChildItem, ls, dir      List files in workspace
  Get-Location, pwd           Display current working directory
  Get-Content, cat <file>     Display contents of a file
  npm run dev                 Start Vite development server
  npm run build               Compile TypeScript and bundle production assets
  npm test                    Run CRDT synchronization tests
  git status                  Check Git repository status
  git log                     Display commit log
  node <file>                 Execute script using Node.js
  cls, clear                  Clear the terminal screen
  antigravity, agy <task>     Invoke Antigravity AI Code Synthesis`,
          timestamp: Date.now()
        }
      ]);
      return;
    }

    // If antigravity CLI command
    if (/^(antigravity|agy)\b/i.test(trimmed)) {
      setLines(prev => [
        ...prev,
        promptLine,
        {
          id: `out-${Date.now()}`,
          type: 'success',
          text: `⚡ Antigravity Agent: Analyzing code and dispatching synthesis task...`,
          timestamp: Date.now()
        }
      ]);
      onExecuteCommand(trimmed);
      return;
    }

    // Append prompt line immediately
    setLines(prev => [...prev, promptLine]);

    // Execute on real system via backend API
    try {
      const res = await fetch(`/api/rooms/${roomId}/terminal/exec`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: trimmed })
      });
      const data = await res.json();

      if (data.isAI) {
        onExecuteCommand(trimmed);
        return;
      }

      const outputText = data.stdout || data.stderr || (data.success ? 'Command completed successfully.' : '');
      if (outputText && outputText.trim()) {
        setLines(prev => [
          ...prev,
          {
            id: `out-${Date.now()}`,
            type: data.success ? 'output' : 'error',
            text: outputText.trimEnd(),
            timestamp: Date.now()
          }
        ]);
      }
    } catch {
      // Local fallback for offline simulation
      setLines(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          type: 'error',
          text: `${cmd} : Unable to reach system runner. Verify server connection on port 3001.`,
          timestamp: Date.now()
        }
      ]);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommand(cmdInput);
      setCmdInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0 && historyIdx < history.length - 1) {
        const nextIdx = historyIdx + 1;
        setHistoryIdx(nextIdx);
        setCmdInput(history[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx > 0) {
        const nextIdx = historyIdx - 1;
        setHistoryIdx(nextIdx);
        setCmdInput(history[nextIdx]);
      } else if (historyIdx === 0) {
        setHistoryIdx(-1);
        setCmdInput('');
      }
    }
  };

  const handleAddShell = (type: ShellType) => {
    const count = sessions.filter(s => s.type === type).length + 1;
    const newId = `session-${Date.now()}`;
    const newName = `${sessions.length + 1}: ${type}${count > 1 ? ` (${count})` : ''}`;
    setSessions(prev => [...prev, { id: newId, name: newName, type }]);
    setActiveSessionId(newId);
    setShowShellDropdown(false);

    // Initial greeting for new session
    if (type === 'pwsh') {
      setLines(prev => [
        ...prev,
        {
          id: `banner-${Date.now()}`,
          type: 'system',
          text: `Windows PowerShell\nCopyright (C) Microsoft Corporation. All rights reserved.\n`,
          timestamp: Date.now()
        }
      ]);
    } else if (type === 'bash') {
      setLines(prev => [
        ...prev,
        {
          id: `banner-${Date.now()}`,
          type: 'system',
          text: `Git Bash (MINGW64 /workspace)\nConnected to room ${roomId}\n`,
          timestamp: Date.now()
        }
      ]);
    } else {
      setLines(prev => [
        ...prev,
        {
          id: `banner-${Date.now()}`,
          type: 'system',
          text: `Welcome to Node.js v20.12.2.\nType ".help" for more information.\n`,
          timestamp: Date.now()
        }
      ]);
    }
  };

  return (
    <div style={{
      height: isMaximized ? '420px' : '230px',
      backgroundColor: '#181818',
      borderTop: '1px solid #2b2b2b',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Consolas, "Cascadia Code", "Courier New", monospace',
      fontSize: '12px',
      userSelect: 'text',
      position: 'relative',
      zIndex: 20,
      transition: 'height 0.15s ease'
    }}>
      {/* 1. Authentic VS Code Bottom Panel Tabs Header */}
      <div style={{
        height: '35px',
        backgroundColor: '#181818',
        borderBottom: '1px solid #282828',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 0.5rem',
        userSelect: 'none',
        flexShrink: 0
      }}>
        {/* Left: VS Code Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0' }}>
          {(['PROBLEMS', 'OUTPUT', 'DEBUG CONSOLE', 'TERMINAL', 'PORTS'] as PanelTab[]).map(tab => {
            const isActive = activePanelTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActivePanelTab(tab)}
                style={{
                  height: '35px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '0 10px',
                  fontSize: '11px',
                  fontWeight: isActive ? 600 : 400,
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                  letterSpacing: '0.02em',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: isActive ? '1px solid #ffffff' : '1px solid transparent',
                  color: isActive ? '#ffffff' : '#969696',
                  cursor: 'pointer',
                  transition: 'color 0.1s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = '#cccccc';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = '#969696';
                }}
              >
                <span>{tab}</span>
                {tab === 'PROBLEMS' && (
                  <span style={{
                    fontSize: '10px',
                    padding: '0 5px',
                    borderRadius: '10px',
                    background: '#2b2b2b',
                    color: '#969696'
                  }}>
                    0
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Right: VS Code Terminal Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
          {/* Shell Dropdown (e.g. 1: pwsh ⌄) */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowShellDropdown(!showShellDropdown)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '2px 7px',
                borderRadius: '3px',
                background: showShellDropdown ? '#2b2b2b' : 'transparent',
                border: '1px solid transparent',
                color: '#cccccc',
                fontSize: '11px',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#2a2d2e'}
              onMouseLeave={(e) => {
                if (!showShellDropdown) e.currentTarget.style.background = 'transparent';
              }}
            >
              <TerminalIcon size={12} color="#00f0ff" />
              <span>{activeSession.name}</span>
              <ChevronDown size={11} color="#969696" />
            </button>

            {/* Dropdown Menu for Shell Selection */}
            {showShellDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                width: '180px',
                background: '#1f1f1f',
                border: '1px solid #3c3c3c',
                borderRadius: '4px',
                boxShadow: '0 6px 18px rgba(0, 0, 0, 0.6)',
                zIndex: 100,
                padding: '4px 0'
              }}>
                <div style={{
                  padding: '4px 10px',
                  fontSize: '10px',
                  color: '#6e7681',
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}>
                  Active Sessions
                </div>
                {sessions.map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setActiveSessionId(s.id);
                      setShowShellDropdown(false);
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '5px 10px',
                      background: activeSessionId === s.id ? '#04395e' : 'transparent',
                      color: activeSessionId === s.id ? '#ffffff' : '#cccccc',
                      border: 'none',
                      fontSize: '11px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <TerminalIcon size={11} />
                    <span>{s.name}</span>
                  </button>
                ))}

                <div style={{ height: '1px', background: '#333333', margin: '4px 0' }} />
                <div style={{
                  padding: '4px 10px',
                  fontSize: '10px',
                  color: '#6e7681',
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}>
                  New Terminal
                </div>
                <button
                  onClick={() => handleAddShell('pwsh')}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '5px 10px',
                    background: 'transparent',
                    color: '#cccccc',
                    border: 'none',
                    fontSize: '11px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#2a2d2e'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Plus size={11} />
                  <span>PowerShell (pwsh)</span>
                </button>
                <button
                  onClick={() => handleAddShell('bash')}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '5px 10px',
                    background: 'transparent',
                    color: '#cccccc',
                    border: 'none',
                    fontSize: '11px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#2a2d2e'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Plus size={11} />
                  <span>Git Bash (bash)</span>
                </button>
                <button
                  onClick={() => handleAddShell('node')}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '5px 10px',
                    background: 'transparent',
                    color: '#cccccc',
                    border: 'none',
                    fontSize: '11px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#2a2d2e'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <Plus size={11} />
                  <span>Node.js REPL</span>
                </button>
              </div>
            )}
          </div>

          {/* New Terminal (+) */}
          <button
            onClick={() => handleAddShell(activeSession.type)}
            title="New Terminal (Ctrl+Shift+`)"
            style={{
              padding: '3px 4px',
              borderRadius: '3px',
              background: 'transparent',
              border: 'none',
              color: '#cccccc',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#2a2d2e'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <Plus size={13} />
          </button>

          {/* Split Terminal (\) */}
          <button
            onClick={() => handleAddShell(activeSession.type === 'pwsh' ? 'bash' : 'pwsh')}
            title="Split Terminal (Ctrl+Shift+5)"
            style={{
              padding: '3px 4px',
              borderRadius: '3px',
              background: 'transparent',
              border: 'none',
              color: '#cccccc',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#2a2d2e'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <Split size={13} />
          </button>

          {/* Kill / Clear Terminal (Trash) */}
          <button
            onClick={handleClear}
            title="Kill Terminal / Clear"
            style={{
              padding: '3px 4px',
              borderRadius: '3px',
              background: 'transparent',
              border: 'none',
              color: '#cccccc',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#2a2d2e'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <Trash2 size={13} />
          </button>

          {/* Maximize / Restore Toggle */}
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            title={isMaximized ? 'Restore Panel Size' : 'Maximize Panel Size'}
            style={{
              padding: '3px 4px',
              borderRadius: '3px',
              background: 'transparent',
              border: 'none',
              color: '#cccccc',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#2a2d2e'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            {isMaximized ? <Minimize2 size={13} /> : <ChevronUp size={13} />}
          </button>

          {/* Close Panel (X) */}
          <button
            onClick={onClose}
            title="Close Panel"
            style={{
              padding: '3px 4px',
              borderRadius: '3px',
              background: 'transparent',
              border: 'none',
              color: '#cccccc',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#2a2d2e'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* 2. Panel Content Area */}
      {activePanelTab === 'TERMINAL' && (
        <div
          ref={terminalBodyRef}
          onClick={() => inputRef.current?.focus()}
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '8px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
            cursor: 'text',
            lineHeight: 1.45
          }}
        >
          {/* Output Stream History */}
          {lines.map((l) => {
            let color = '#cccccc';
            if (l.type === 'prompt') color = '#e2e8f0';
            if (l.type === 'error') color = '#f87171';
            if (l.type === 'success') color = '#4ade80';
            if (l.type === 'system') color = '#cccccc';

            return (
              <div
                key={l.id}
                style={{
                  color,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                  fontWeight: l.type === 'prompt' ? 600 : 400
                }}
              >
                {l.text}
              </div>
            );
          })}

          {/* Authentic Inline Prompt (No separate form bar, no big button!) */}
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            width: '100%',
            marginTop: '2px'
          }}>
            <span style={{
              color: activeSession.type === 'pwsh' ? '#ffffff' : '#4ade80',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              marginRight: '2px',
              userSelect: 'none'
            }}>
              {getPromptString()}
            </span>
            <input
              ref={inputRef}
              type="text"
              value={cmdInput}
              onChange={(e) => setCmdInput(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              spellCheck={false}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#ffffff',
                fontFamily: 'Consolas, "Cascadia Code", "Courier New", monospace',
                fontSize: '12px',
                padding: 0,
                margin: 0,
                caretColor: '#ffffff'
              }}
            />
          </div>
          <div ref={terminalEndRef} />
        </div>
      )}

      {/* PROBLEMS TAB */}
      {activePanelTab === 'PROBLEMS' && (
        <div style={{
          flex: 1,
          padding: '16px',
          color: '#8b949e',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          fontSize: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4ade80' }}>
            <CheckCircle2 size={14} />
            <span>No problems have been detected in the workspace.</span>
          </div>
          <span style={{ fontSize: '11px', color: '#6e7681' }}>TypeScript Language Server: 0 diagnostics</span>
        </div>
      )}

      {/* OUTPUT TAB */}
      {activePanelTab === 'OUTPUT' && (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px 14px',
          color: '#cccccc',
          fontSize: '11.5px',
          lineHeight: 1.5
        }}>
          <div>[TypeScript Language Server] Server started, watching workspace.</div>
          <div>[CRDT Sync Engine] Connected to room {roomId} via WebSockets.</div>
          <div>[Antigravity Adapter] Language model hooks ready (Gemini 3.8 Flash).</div>
          <div>[Vite 8.3.0] Ready in 142ms. Serving modules dynamically.</div>
        </div>
      )}

      {/* DEBUG CONSOLE TAB */}
      {activePanelTab === 'DEBUG CONSOLE' && (
        <div style={{
          flex: 1,
          padding: '12px',
          color: '#8b949e',
          fontSize: '11.5px',
          fontFamily: 'Consolas, monospace'
        }}>
          <div>Debug console initialized.</div>
          <div style={{ color: '#6e7681', marginTop: '6px' }}>Evaluate JavaScript expressions or set breakpoints in the editor pane.</div>
        </div>
      )}

      {/* PORTS TAB */}
      {activePanelTab === 'PORTS' && (
        <div style={{
          flex: 1,
          padding: '12px',
          color: '#cccccc',
          fontSize: '11.5px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ color: '#8b949e', borderBottom: '1px solid #2b2b2b', fontSize: '11px' }}>
                <th style={{ padding: '6px 8px' }}>Port</th>
                <th style={{ padding: '6px 8px' }}>Local Address</th>
                <th style={{ padding: '6px 8px' }}>Running Process</th>
                <th style={{ padding: '6px 8px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #222222' }}>
                <td style={{ padding: '6px 8px', color: '#38bdf8' }}>5173</td>
                <td style={{ padding: '6px 8px' }}>http://localhost:5173</td>
                <td style={{ padding: '6px 8px' }}>Vite Dev Server</td>
                <td style={{ padding: '6px 8px', color: '#4ade80' }}>Forwarded</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 8px', color: '#38bdf8' }}>3001</td>
                <td style={{ padding: '6px 8px' }}>ws://localhost:3001</td>
                <td style={{ padding: '6px 8px' }}>CRDT / WebSocket Server</td>
                <td style={{ padding: '6px 8px', color: '#4ade80' }}>Forwarded</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
