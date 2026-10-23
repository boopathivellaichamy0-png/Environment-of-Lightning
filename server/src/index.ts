import express from 'express';
import cors from 'cors';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { FileSystemManager } from './fileSystem.js';
import { TerminalManager } from './terminal.js';
import { AIAgentEngine } from './aiAgent.js';
import { WSMessage } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3001;
const WORKSPACE_DIR = process.env.WORKSPACE_DIR || path.join(__dirname, '../../workspace');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Core Subsystems
const fsManager = new FileSystemManager(WORKSPACE_DIR);
const termManager = new TerminalManager(WORKSPACE_DIR);
const aiAgent = new AIAgentEngine(fsManager, termManager);

// Serve workspace files statically for live preview iframe
app.use('/preview-workspace', express.static(fsManager.getWorkspaceRoot()));

// REST API Endpoints
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    workspace: fsManager.getWorkspaceRoot(),
    cwd: termManager.getCwd(),
    platform: process.platform,
    timestamp: Date.now()
  });
});

app.get('/api/files', (req, res) => {
  try {
    const files = fsManager.listFiles();
    res.json({ success: true, files });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/files/read', (req, res) => {
  const filePath = req.query.path as string;
  if (!filePath) return res.status(400).json({ error: 'path is required' });
  try {
    const content = fsManager.readFile(filePath);
    res.json({ success: true, content });
  } catch (err: any) {
    res.status(404).json({ success: false, error: err.message });
  }
});

app.post('/api/files/write', (req, res) => {
  const { path: filePath, content } = req.body;
  if (!filePath) return res.status(400).json({ error: 'path is required' });
  try {
    fsManager.writeFile(filePath, content ?? '');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Setup HTTP & WebSocket Server
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const broadcast = (msg: WSMessage, sender?: WebSocket) => {
  const data = JSON.stringify(msg);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN && client !== sender) {
      client.send(data);
    }
  }
};

wss.on('connection', (ws) => {
  console.log('⚡ IDE Client Connected via WebSocket');

  // Send initial workspace tree
  ws.send(
    JSON.stringify({
      type: 'init',
      payload: {
        workspaceRoot: fsManager.getWorkspaceRoot(),
        files: fsManager.listFiles()
      }
    })
  );

  ws.on('message', async (raw) => {
    try {
      const msg: WSMessage = JSON.parse(raw.toString('utf-8'));

      switch (msg.type) {
        case 'file:list': {
          const files = fsManager.listFiles();
          ws.send(JSON.stringify({ type: 'file:list', payload: files }));
          break;
        }

        case 'file:read': {
          const content = fsManager.readFile(msg.payload.path);
          ws.send(
            JSON.stringify({
              type: 'file:read',
              payload: { path: msg.payload.path, content }
            })
          );
          break;
        }

        case 'file:write': {
          fsManager.writeFile(msg.payload.path, msg.payload.content);
          broadcast({ type: 'file:list', payload: fsManager.listFiles() }, ws);
          ws.send(JSON.stringify({ type: 'file:list', payload: fsManager.listFiles() }));
          break;
        }

        case 'file:delete': {
          fsManager.deleteFile(msg.payload.path);
          broadcast({ type: 'file:list', payload: fsManager.listFiles() });
          ws.send(JSON.stringify({ type: 'file:list', payload: fsManager.listFiles() }));
          break;
        }

        case 'file:rename': {
          fsManager.renameFile(msg.payload.oldPath, msg.payload.newPath);
          broadcast({ type: 'file:list', payload: fsManager.listFiles() });
          ws.send(JSON.stringify({ type: 'file:list', payload: fsManager.listFiles() }));
          break;
        }

        case 'terminal:exec': {
          const { command } = msg.payload;
          await termManager.executeCommand(command, (log) => {
            ws.send(JSON.stringify({ type: 'terminal:output', payload: log }));
          });
          // Broadcast refreshed file list in case command created or edited files
          const updatedFiles = fsManager.listFiles();
          broadcast({ type: 'file:list', payload: updatedFiles });
          ws.send(JSON.stringify({ type: 'file:list', payload: updatedFiles }));
          break;
        }

        case 'ai:prompt': {
          const { prompt, model } = msg.payload;
          const op = await aiAgent.processPrompt(prompt, model, (toolCall) => {
            ws.send(JSON.stringify({ type: 'ai:step', payload: toolCall }));
          });
          ws.send(JSON.stringify({ type: 'ai:result', payload: op }));
          break;
        }

        case 'ai:apply': {
          const { opId } = msg.payload;
          const result = aiAgent.applyOperation(opId);
          const updatedFiles = fsManager.listFiles();
          broadcast({ type: 'file:list', payload: updatedFiles });
          ws.send(JSON.stringify({ type: 'file:list', payload: updatedFiles }));
          ws.send(JSON.stringify({ type: 'ai:apply', payload: result }));
          break;
        }

        case 'ai:reject': {
          const { opId } = msg.payload;
          aiAgent.rejectOperation(opId);
          ws.send(JSON.stringify({ type: 'ai:reject', payload: { opId, success: true } }));
          break;
        }
      }
    } catch (err: any) {
      console.error('Error handling WS message:', err);
      ws.send(
        JSON.stringify({
          type: 'terminal:output',
          payload: {
            id: `err-${Date.now()}`,
            timestamp: Date.now(),
            type: 'stderr',
            text: `Server Error: ${err.message}\n`
          }
        })
      );
    }
  });

  ws.on('close', () => {
    console.log('IDE Client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`⚡ Environment of Lightning IDE Server running on http://localhost:${PORT}`);
  console.log(`📂 Active Workspace: ${fsManager.getWorkspaceRoot()}`);
});
