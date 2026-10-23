import { useEffect, useRef, useState, useCallback } from 'react';
import { ProjectFile, TerminalLog, AIOperation, AIToolCall } from '../types.ts';

interface WebSocketHookState {
  isConnected: boolean;
  files: ProjectFile[];
  terminalLogs: TerminalLog[];
  currentOperation: AIOperation | null;
  activeToolCalls: AIToolCall[];
}

export function useWebSocket(url: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const [state, setState] = useState<WebSocketHookState>({
    isConnected: false,
    files: [],
    terminalLogs: [
      {
        id: 'init-1',
        timestamp: Date.now(),
        type: 'system',
        text: '⚡ Environment of Lightning (EOL) Platform Initialized. Direct WebSocket connection ready.\n'
      }
    ],
    currentOperation: null,
    activeToolCalls: []
  });

  const [openedFileContents, setOpenedFileContents] = useState<Record<string, string>>({});

  useEffect(() => {
    let ws: WebSocket;
    let reconnectTimeout: any;

    const connect = () => {
      try {
        ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
          setState((prev) => ({ ...prev, isConnected: true }));
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            switch (msg.type) {
              case 'init': {
                setState((prev) => ({
                  ...prev,
                  files: msg.payload.files || []
                }));
                break;
              }

              case 'file:list': {
                setState((prev) => ({
                  ...prev,
                  files: msg.payload || []
                }));
                break;
              }

              case 'file:read': {
                const { path: filePath, content } = msg.payload;
                setOpenedFileContents((prev) => ({ ...prev, [filePath]: content }));
                break;
              }

              case 'terminal:output': {
                const logItem: TerminalLog = msg.payload;
                setState((prev) => ({
                  ...prev,
                  terminalLogs: [...prev.terminalLogs, logItem]
                }));
                break;
              }

              case 'ai:step': {
                const toolCall: AIToolCall = msg.payload;
                setState((prev) => ({
                  ...prev,
                  activeToolCalls: [...prev.activeToolCalls, toolCall]
                }));
                break;
              }

              case 'ai:result': {
                const op: AIOperation = msg.payload;
                setState((prev) => ({
                  ...prev,
                  currentOperation: op,
                  activeToolCalls: op.toolCalls || []
                }));
                break;
              }

              case 'ai:apply':
              case 'ai:reject': {
                setState((prev) => ({
                  ...prev,
                  currentOperation: null,
                  activeToolCalls: []
                }));
                break;
              }
            }
          } catch (err) {
            console.error('Error parsing WS message:', err);
          }
        };

        ws.onclose = () => {
          setState((prev) => ({ ...prev, isConnected: false }));
          reconnectTimeout = setTimeout(connect, 2000);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch (err) {
        reconnectTimeout = setTimeout(connect, 2000);
      }
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (wsRef.current) wsRef.current.close();
    };
  }, [url]);

  const send = useCallback((type: string, payload: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  }, []);

  const readFile = useCallback(
    (filePath: string) => {
      send('file:read', { path: filePath });
    },
    [send]
  );

  const writeFile = useCallback(
    (filePath: string, content: string) => {
      setOpenedFileContents((prev) => ({ ...prev, [filePath]: content }));
      send('file:write', { path: filePath, content });
    },
    [send]
  );

  const deleteFile = useCallback(
    (filePath: string) => {
      send('file:delete', { path: filePath });
    },
    [send]
  );

  const renameFile = useCallback(
    (oldPath: string, newPath: string) => {
      send('file:rename', { oldPath, newPath });
    },
    [send]
  );

  const executeCommand = useCallback(
    (command: string) => {
      send('terminal:exec', { command });
    },
    [send]
  );

  const clearTerminal = useCallback(() => {
    setState((prev) => ({ ...prev, terminalLogs: [] }));
  }, []);

  const promptAI = useCallback(
    (prompt: string, model: string = 'Gemini 2.5 Flash') => {
      setState((prev) => ({ ...prev, activeToolCalls: [] }));
      send('ai:prompt', { prompt, model });
    },
    [send]
  );

  const applyAIPatch = useCallback(
    (opId: string) => {
      send('ai:apply', { opId });
    },
    [send]
  );

  const rejectAIPatch = useCallback(
    (opId: string) => {
      send('ai:reject', { opId });
    },
    [send]
  );

  return {
    isConnected: state.isConnected,
    files: state.files,
    terminalLogs: state.terminalLogs,
    currentOperation: state.currentOperation,
    activeToolCalls: state.activeToolCalls,
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
  };
}
