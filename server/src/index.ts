import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import { Database } from './Database.js';
import { WorkspaceManager } from './WorkspaceManager.js';
import { AntigravityAdapter } from './AntigravityAdapter.js';
import { RoomManager } from './RoomManager.js';
import { PersistenceScheduler } from './PersistenceScheduler.js';
import { exec } from 'child_process';
import { User, ChatMessage, ActivityEvent, TerminalLog } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Core Subsystems
const db = new Database(path.join(__dirname, '../data'));
const workspaceManager = new WorkspaceManager(path.join(__dirname, '../workspaces'));
const antigravityAdapter = new AntigravityAdapter();
const roomManager = new RoomManager(db, workspaceManager, antigravityAdapter);
const persistenceScheduler = new PersistenceScheduler(
  roomManager.getYjsRooms(),
  workspaceManager,
  db
);

// Start 1-second CRDT Auto-persistence
persistenceScheduler.start(1000);

// --- REST Endpoints ---

// Rooms
app.post('/api/rooms', (req, res) => {
  const { name, roomId } = req.body;
  const room = roomManager.getOrCreateRoom(roomId || `DEV-AI-${Math.floor(1000 + Math.random() * 9000)}`);
  res.json({ success: true, room });
});

app.get('/api/rooms', (req, res) => {
  res.json({ success: true, rooms: db.listRooms() });
});

app.get('/api/rooms/:roomId', (req, res) => {
  const room = roomManager.getOrCreateRoom(req.params.roomId);
  const yjsRoom = roomManager.getYjsRoom(room.id);
  const activeUsers = yjsRoom ? yjsRoom.getActiveUsers() : [];
  res.json({
    success: true,
    room: {
      ...room,
      workspaceVersion: yjsRoom ? yjsRoom.getWorkspaceVersion() : room.workspaceVersion,
      activeUsers
    }
  });
});

// Files
app.get('/api/rooms/:roomId/files', (req, res) => {
  const room = roomManager.getOrCreateRoom(req.params.roomId);
  const yjsRoom = roomManager.getYjsRoom(room.id);
  // Ensure contents are up-to-date from Yjs in-memory text
  const files: Record<string, any> = {};
  for (const [p, f] of Object.entries(room.files)) {
    files[p] = {
      ...f,
      content: yjsRoom ? yjsRoom.getFileText(p) : f.content,
      version: yjsRoom ? yjsRoom.getFileVersion(p) : f.version
    };
  }
  res.json({ success: true, files });
});

app.post('/api/rooms/:roomId/files', (req, res) => {
  const { filePath, content, user } = req.body;
  if (!filePath) {
    return res.status(400).json({ error: 'filePath is required' });
  }
  const file = roomManager.createFile(req.params.roomId, filePath, content || '', user);
  res.json({ success: true, file });
});

app.delete('/api/rooms/:roomId/files', (req, res) => {
  const { filePath, user } = req.body;
  const deleted = roomManager.deleteFile(req.params.roomId, filePath, user);
  res.json({ success: deleted });
});

app.put('/api/rooms/:roomId/files/rename', (req, res) => {
  const { oldPath, newPath, user } = req.body;
  const renamed = roomManager.renameFile(req.params.roomId, oldPath, newPath, user);
  res.json({ success: renamed });
});

// Activity
app.get('/api/rooms/:roomId/activity', (req, res) => {
  const activities = db.getActivities(req.params.roomId);
  res.json({ success: true, activities });
});

// Motto
app.get('/api/rooms/:roomId/motto', (req, res) => {
  const mottoEngine = roomManager.getMottoEngine(req.params.roomId);
  res.json({ success: true, motto: mottoEngine?.getMotto() });
});

app.put('/api/rooms/:roomId/motto', (req, res) => {
  const mottoEngine = roomManager.getMottoEngine(req.params.roomId);
  if (mottoEngine) {
    const updated = mottoEngine.setManualMotto(req.body);
    const yjs = roomManager.getYjsRoom(req.params.roomId);
    if (yjs) {
      yjs.broadcast({ type: 'motto:updated', data: updated });
    }
    return res.json({ success: true, motto: updated });
  }
  res.status(404).json({ error: 'Room not found' });
});

// Chat
app.get('/api/rooms/:roomId/chats', (req, res) => {
  const chats = db.getChats(req.params.roomId);
  res.json({ success: true, chats });
});

app.post('/api/rooms/:roomId/chat', (req, res) => {
  const { userId, userName, userColor, text } = req.body;
  const chat: ChatMessage = {
    id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    roomId: req.params.roomId,
    userId: userId || 'anonymous',
    userName: userName || 'Anonymous',
    userColor: userColor || '#00f0ff',
    text,
    timestamp: Date.now()
  };

  db.addChat(req.params.roomId, chat);
  const yjs = roomManager.getYjsRoom(req.params.roomId);
  if (yjs) {
    yjs.broadcast({ type: 'chat:message', data: chat });
  }

  // Update Motto from chat context
  const room = roomManager.getOrCreateRoom(req.params.roomId);
  const mottoEngine = roomManager.getMottoEngine(req.params.roomId);
  if (mottoEngine && room) {
    const newMotto = mottoEngine.analyzeContext({
      files: room.files,
      recentChats: db.getChats(req.params.roomId, 10),
      recentActivities: db.getActivities(req.params.roomId, 10)
    });
    if (yjs) {
      yjs.broadcast({ type: 'motto:updated', data: newMotto });
    }
  }

  res.json({ success: true, chat });
});

// Terminal
app.get('/api/rooms/:roomId/terminal', (req, res) => {
  const logs = db.getTerminalLogs(req.params.roomId);
  res.json({ success: true, logs });
});

// Execute Real Terminal & System Commands in Room Workspace
app.post('/api/rooms/:roomId/terminal/exec', async (req, res) => {
  const { command } = req.body;
  const roomId = req.params.roomId;
  if (!command || typeof command !== 'string') {
    return res.status(400).json({ error: 'Command string is required' });
  }

  const trimmed = command.trim();
  const workspacePath = workspaceManager.getRoomWorkspacePath(roomId);
  const yjs = roomManager.getYjsRoom(roomId);

  // If command is an Antigravity task invocation
  if (/^(antigravity|agy)\b/i.test(trimmed)) {
    const task = trimmed.replace(/^(antigravity|agy)\s*/i, '');
    const ai = roomManager.getAIOrchestrator(roomId);
    if (ai) {
      const op = await ai.triggerAnalysis(task || undefined);
      return res.json({ success: true, isAI: true, operation: op });
    }
  }

  // Execute system command in workspace directory
  const isWindows = process.platform === 'win32';
  const cmdToRun = isWindows
    ? `powershell.exe -NoProfile -NonInteractive -ExecutionPolicy Bypass -Command "${trimmed.replace(/"/g, '\\"')}"`
    : trimmed;

  exec(cmdToRun, { cwd: workspacePath, timeout: 20000 }, (error, stdout, stderr) => {
    const outputText = stdout || stderr || (error ? error.message : '');

    // Log into terminal stream
    const logItem: TerminalLog = {
      id: `term-${Date.now()}`,
      timestamp: Date.now(),
      level: error ? 'error' : 'info',
      source: 'system',
      message: outputText
    };
    db.addTerminalLog(roomId, logItem);
    if (yjs) {
      yjs.broadcast({ type: 'terminal:log', data: logItem });
    }

    // Rescan workspace files in case command created or modified files on disk
    try {
      const diskFiles = workspaceManager.getAllFiles(roomId);
      const room = db.getRoom(roomId);
      if (room) {
        for (const [relPath, content] of Object.entries(diskFiles)) {
          if (!room.files[relPath]) {
            roomManager.createFile(roomId, relPath, content);
          }
        }
      }
    } catch {}

    res.json({
      success: !error,
      stdout,
      stderr,
      exitCode: error ? (error.code || 1) : 0
    });
  });
});

// AI Orchestrator Controls
app.get('/api/rooms/:roomId/ai/status', (req, res) => {
  const ai = roomManager.getAIOrchestrator(req.params.roomId);
  if (!ai) return res.status(404).json({ error: 'AI Orchestrator not found' });
  res.json({
    success: true,
    state: ai.getState(),
    permissionMode: ai.getPermissionMode(),
    pendingOperation: ai.getPendingOperation()
  });
});

app.post('/api/rooms/:roomId/ai/analyze', async (req, res) => {
  const { prompt } = req.body;
  const ai = roomManager.getAIOrchestrator(req.params.roomId);
  if (!ai) return res.status(404).json({ error: 'AI Orchestrator not found' });

  const op = await ai.triggerAnalysis(prompt);
  res.json({ success: true, operation: op });
});

app.post('/api/rooms/:roomId/ai/apply', async (req, res) => {
  const { operationId } = req.body;
  const ai = roomManager.getAIOrchestrator(req.params.roomId);
  if (!ai) return res.status(404).json({ error: 'AI Orchestrator not found' });

  try {
    const result = await ai.applyOperation(operationId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/rooms/:roomId/ai/reject', (req, res) => {
  const { operationId } = req.body;
  const ai = roomManager.getAIOrchestrator(req.params.roomId);
  if (!ai) return res.status(404).json({ error: 'AI Orchestrator not found' });

  ai.rejectOperation(operationId);
  res.json({ success: true });
});

app.post('/api/rooms/:roomId/ai/mode', (req, res) => {
  const { mode } = req.body;
  const ai = roomManager.getAIOrchestrator(req.params.roomId);
  if (!ai) return res.status(404).json({ error: 'AI Orchestrator not found' });

  ai.setPermissionMode(mode);
  res.json({ success: true, mode });
});

app.post('/api/rooms/:roomId/ai/reanalyze', async (req, res) => {
  const { operationId } = req.body;
  const ai = roomManager.getAIOrchestrator(req.params.roomId);
  if (!ai) return res.status(404).json({ error: 'AI Orchestrator not found' });

  const op = await ai.reanalyzeAfterConflict(operationId);
  res.json({ success: true, operation: op });
});

// Demo Scenario Steps (Section 33)
app.post('/api/rooms/:roomId/demo/step', async (req, res) => {
  const { step } = req.body;
  const result = await roomManager.runDemoStep(req.params.roomId, Number(step) || 1);
  res.json(result);
});

// Serve frontend if built
const clientDist = path.join(__dirname, '../../client/dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  const indexHtml = path.join(clientDist, 'index.html');
  res.sendFile(indexHtml, (err) => {
    if (err) {
      res.send(`<h1>⚡ ENVIRONMENT OF LIGHTNING Server Running</h1><p>Client Vite dev server runs at http://localhost:5173</p>`);
    }
  });
});

// Robust Error Handling Middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ error: 'Invalid JSON payload', message: (err as any).message });
    return;
  }
  console.error('Express Error:', err);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Guard against uncaught crashes
process.on('uncaughtException', (err) => {
  console.error('⚡ Server Uncaught Exception:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('⚡ Server Unhandled Rejection at:', promise, 'reason:', reason);
});

// --- HTTP and WebSocket Server ---
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket) => {
  let joinedRoomId: string | null = null;
  let currentUser: User | null = null;

  ws.on('message', async (messageData: string) => {
    try {
      const msg = JSON.parse(messageData.toString());

      switch (msg.type) {
        case 'room:join': {
          const { roomId, user } = msg.data;
          joinedRoomId = roomId;
          currentUser = {
            id: user.id || `user_${Math.random().toString(36).substring(2, 7)}`,
            name: user.name || 'Developer',
            color: user.color || '#00f0ff',
            lastActive: Date.now()
          };

          const room = roomManager.getOrCreateRoom(roomId);
          const yjsRoom = roomManager.getYjsRoom(roomId)!;
          const ai = roomManager.getAIOrchestrator(roomId)!;
          const mottoEngine = roomManager.getMottoEngine(roomId)!;

          yjsRoom.addConnection(ws, currentUser);

          // Prepare full project contents from Yjs
          const filesWithContent: Record<string, any> = {};
          for (const [p, f] of Object.entries(room.files)) {
            filesWithContent[p] = {
              ...f,
              content: yjsRoom.getFileText(p),
              version: yjsRoom.getFileVersion(p)
            };
          }

          // Send complete room sync back to joining client
          ws.send(JSON.stringify({
            type: 'room:sync',
            data: {
              room: {
                ...room,
                workspaceVersion: yjsRoom.getWorkspaceVersion(),
                aiState: ai.getState(),
                permissionMode: ai.getPermissionMode(),
                motto: mottoEngine.getMotto()
              },
              files: filesWithContent,
              activeUsers: yjsRoom.getActiveUsers(),
              chats: db.getChats(roomId, 50),
              activities: db.getActivities(roomId, 50),
              terminalLogs: db.getTerminalLogs(roomId),
              pendingOperation: ai.getPendingOperation()
            }
          }));

          // Notify others of joined user
          const joinActivity: ActivityEvent = {
            id: `act-${Date.now()}`,
            roomId,
            userId: currentUser.id,
            userName: currentUser.name,
            action: 'user_join',
            timestamp: Date.now()
          };
          db.addActivity(roomId, joinActivity);

          yjsRoom.broadcast({
            type: 'presence:joined',
            data: {
              user: currentUser,
              activeUsers: yjsRoom.getActiveUsers(),
              activity: joinActivity
            }
          }, ws);

          break;
        }

        case 'document:delta': {
          if (!joinedRoomId) return;
          const { filePath, index, deleteCount, insertText, userId } = msg.data;
          const yjsRoom = roomManager.getYjsRoom(joinedRoomId);
          if (yjsRoom) {
            yjsRoom.applyTextDelta(filePath, index, deleteCount, insertText, userId);

            // Broadcast delta immediately to all other users (Real-time CRDT, no 1s wait!)
            yjsRoom.broadcast({
              type: 'document:delta',
              data: {
                filePath,
                index,
                deleteCount,
                insertText,
                userId,
                version: yjsRoom.getFileVersion(filePath),
                workspaceVersion: yjsRoom.getWorkspaceVersion()
              }
            }, ws);
          }
          break;
        }

        case 'cursor:update': {
          if (!joinedRoomId || !currentUser) return;
          const yjsRoom = roomManager.getYjsRoom(joinedRoomId);
          if (yjsRoom) {
            const updated = yjsRoom.updateUser(ws, {
              currentFile: msg.data.filePath,
              cursor: msg.data.cursor,
              selection: msg.data.selection
            });

            // Broadcast cursor presence to peers
            yjsRoom.broadcast({
              type: 'cursor:update',
              data: {
                userId: currentUser.id,
                user: updated
              }
            }, ws);
          }
          break;
        }

        case 'chat:send': {
          if (!joinedRoomId || !currentUser) return;
          const chat: ChatMessage = {
            id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            roomId: joinedRoomId,
            userId: currentUser.id,
            userName: currentUser.name,
            userColor: currentUser.color,
            text: msg.data.text,
            timestamp: Date.now()
          };
          db.addChat(joinedRoomId, chat);

          const yjsRoom = roomManager.getYjsRoom(joinedRoomId);
          if (yjsRoom) {
            yjsRoom.broadcast({ type: 'chat:message', data: chat });

            // Analyze Motto from chat
            const room = roomManager.getOrCreateRoom(joinedRoomId);
            const mottoEngine = roomManager.getMottoEngine(joinedRoomId);
            if (mottoEngine && room) {
              const newMotto = mottoEngine.analyzeContext({
                files: room.files,
                recentChats: db.getChats(joinedRoomId, 10),
                recentActivities: db.getActivities(joinedRoomId, 10)
              });
              yjsRoom.broadcast({ type: 'motto:updated', data: newMotto });
            }
          }
          break;
        }

        case 'ai:trigger': {
          if (!joinedRoomId) return;
          const ai = roomManager.getAIOrchestrator(joinedRoomId);
          if (ai) {
            await ai.triggerAnalysis(msg.data?.prompt);
          }
          break;
        }

        case 'ai:permission_mode': {
          if (!joinedRoomId) return;
          const ai = roomManager.getAIOrchestrator(joinedRoomId);
          if (ai) {
            ai.setPermissionMode(msg.data.mode);
          }
          break;
        }
      }
    } catch (e) {
      console.error('WebSocket message handling error:', e);
    }
  });

  ws.on('close', () => {
    if (joinedRoomId) {
      const yjsRoom = roomManager.getYjsRoom(joinedRoomId);
      if (yjsRoom) {
        const leavingUser = yjsRoom.removeConnection(ws);
        if (leavingUser) {
          const leaveActivity: ActivityEvent = {
            id: `act-${Date.now()}`,
            roomId: joinedRoomId,
            userId: leavingUser.id,
            userName: leavingUser.name,
            action: 'user_leave',
            timestamp: Date.now()
          };
          db.addActivity(joinedRoomId, leaveActivity);

          yjsRoom.broadcast({
            type: 'presence:left',
            data: {
              userId: leavingUser.id,
              activeUsers: yjsRoom.getActiveUsers(),
              activity: leaveActivity
            }
          });
        }
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n⚡ ======================================================== ⚡`);
  console.log(`⚡  ENVIRONMENT OF LIGHTNING - Real-Time Collaborative IDE  ⚡`);
  console.log(`⚡  Server listening on http://localhost:${PORT}             ⚡`);
  console.log(`⚡  WebSocket server active                                  ⚡`);
  console.log(`⚡  Auto-save: Active every 1 second                         ⚡`);
  console.log(`⚡  AI Engine: Antigravity CLI Orchestrator Active          ⚡`);
  console.log(`⚡ ======================================================== ⚡\n`);
});
