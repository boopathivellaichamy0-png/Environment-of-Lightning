import fs from 'fs';
import path from 'path';
import { ProjectFile } from './types.js';

export class WorkspaceManager {
  private baseDir: string;

  constructor(baseDir: string = './workspaces') {
    this.baseDir = path.resolve(baseDir);
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  getRoomWorkspacePath(roomId: string): string {
    // Sanitize roomId to prevent directory traversal
    const safeRoomId = roomId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const roomPath = path.join(this.baseDir, safeRoomId, 'project');
    if (!fs.existsSync(roomPath)) {
      fs.mkdirSync(roomPath, { recursive: true });
    }
    return roomPath;
  }

  private resolveSafePath(roomId: string, relativePath: string): string {
    const root = this.getRoomWorkspacePath(roomId);
    const resolved = path.resolve(root, relativePath);
    if (!resolved.startsWith(root)) {
      throw new Error(`Path traversal attempt blocked: ${relativePath}`);
    }
    return resolved;
  }

  ensureDefaultFiles(roomId: string): Record<string, ProjectFile> {
    const defaultFiles: Record<string, string> = {
      'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>⚡ Environment of Lightning Project</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div id="app">
    <h1>Welcome to Environment of Lightning</h1>
    <p>Real-time collaborative workspace powered by Antigravity CLI.</p>
  </div>
  <script type="module" src="app.js"></script>
</body>
</html>`,
      'app.js': `// ⚡ Environment of Lightning - Application Core
console.log("⚡ Environment of Lightning initialized");

export function initApp() {
  const app = document.getElementById("app");
  if (app) {
    console.log("App container ready");
  }
}

initApp();
`,
      'style.css': `/* ⚡ Environment of Lightning - Dynamic Styles */
body {
  margin: 0;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background: #090d16;
  color: #f1f5f9;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

#app {
  padding: 2rem;
  border-radius: 12px;
  background: rgba(30, 41, 59, 0.7);
  box-shadow: 0 8px 32px rgba(0, 240, 255, 0.15);
  border: 1px solid rgba(0, 240, 255, 0.2);
  text-align: center;
}
`,
      'README.md': `# ⚡ ENVIRONMENT OF LIGHTNING
AI-Driven Real-Time Collaborative IDE
Core AI: Antigravity CLI
Synchronization: Yjs / CRDT
Auto-save: Every 1 second
`
    };

    const projectFiles: Record<string, ProjectFile> = {};
    for (const [filePath, content] of Object.entries(defaultFiles)) {
      const diskPath = this.resolveSafePath(roomId, filePath);
      const parentDir = path.dirname(diskPath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      if (!fs.existsSync(diskPath)) {
        fs.writeFileSync(diskPath, content, 'utf8');
      }
      const existing = fs.readFileSync(diskPath, 'utf8');
      projectFiles[filePath] = {
        id: filePath,
        name: path.basename(filePath),
        path: filePath,
        type: 'file',
        content: existing,
        version: 1,
        lastModifiedAt: Date.now()
      };
    }

    return projectFiles;
  }

  saveFileToDisk(roomId: string, relativePath: string, content: string): void {
    const fullPath = this.resolveSafePath(roomId, relativePath);
    const parentDir = path.dirname(fullPath);
    if (!fs.existsSync(parentDir)) {
      fs.mkdirSync(parentDir, { recursive: true });
    }
    fs.writeFileSync(fullPath, content, 'utf8');
  }

  readFileFromDisk(roomId: string, relativePath: string): string | null {
    try {
      const fullPath = this.resolveSafePath(roomId, relativePath);
      if (fs.existsSync(fullPath)) {
        return fs.readFileSync(fullPath, 'utf8');
      }
    } catch (e) {
      console.error(`Error reading ${relativePath} from disk:`, e);
    }
    return null;
  }

  deleteFileFromDisk(roomId: string, relativePath: string): boolean {
    try {
      const fullPath = this.resolveSafePath(roomId, relativePath);
      if (fs.existsSync(fullPath)) {
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          fs.rmSync(fullPath, { recursive: true, force: true });
        } else {
          fs.unlinkSync(fullPath);
        }
        return true;
      }
    } catch (e) {
      console.error(`Error deleting ${relativePath}:`, e);
    }
    return false;
  }

  renameFileOnDisk(roomId: string, oldPath: string, newPath: string): boolean {
    try {
      const fullOld = this.resolveSafePath(roomId, oldPath);
      const fullNew = this.resolveSafePath(roomId, newPath);
      const newParent = path.dirname(fullNew);
      if (!fs.existsSync(newParent)) {
        fs.mkdirSync(newParent, { recursive: true });
      }
      fs.renameSync(fullOld, fullNew);
      return true;
    } catch (e) {
      console.error(`Error renaming ${oldPath} to ${newPath}:`, e);
      return false;
    }
  }

  getAllFiles(roomId: string): Record<string, string> {
    const root = this.getRoomWorkspacePath(roomId);
    const result: Record<string, string> = {};

    const scan = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        const rel = path.relative(root, full).replace(/\\/g, '/');
        if (entry.isDirectory()) {
          scan(full);
        } else if (entry.isFile()) {
          try {
            result[rel] = fs.readFileSync(full, 'utf8');
          } catch (e) {
            // ignore binary/read error
          }
        }
      }
    };

    scan(root);
    return result;
  }
}
