import fs from 'fs';
import path from 'path';
import { ProjectFile } from './types.js';

export class FileSystemManager {
  private workspaceRoot: string;

  constructor(workspaceDir: string) {
    this.workspaceRoot = path.resolve(workspaceDir);
    this.ensureWorkspace();
  }

  public getWorkspaceRoot(): string {
    return this.workspaceRoot;
  }

  private ensureWorkspace(): void {
    if (!fs.existsSync(this.workspaceRoot)) {
      fs.mkdirSync(this.workspaceRoot, { recursive: true });
    }

    // Populate with starter code if workspace is empty
    const files = fs.readdirSync(this.workspaceRoot);
    if (files.length === 0) {
      this.initStarterFiles();
    }
  }

  private initStarterFiles(): void {
    const starterIndex = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Environment of Lightning - Live App</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div class="card">
    <div class="badge">⚡ LIVE PREVIEW</div>
    <h1>Environment of Lightning</h1>
    <p>A full-stack collaborative AI-first IDE platform.</p>
    <div class="counter-box">
      <button id="btn-count">Clicked: 0 times</button>
    </div>
  </div>
  <script src="app.js"></script>
</body>
</html>
`;

    const starterCss = `body {
  margin: 0;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: #0f172a;
  color: #f8fafc;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 16px;
  padding: 2.5rem;
  max-width: 440px;
  text-align: center;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
}

.badge {
  display: inline-block;
  font-size: 0.75rem;
  font-weight: 700;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.15);
  border: 1px solid rgba(56, 189, 248, 0.3);
  padding: 4px 10px;
  border-radius: 9999px;
  margin-bottom: 1rem;
}

h1 {
  margin: 0 0 0.5rem 0;
  font-size: 1.6rem;
  background: linear-gradient(135deg, #38bdf8 0%, #818cf8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

p {
  color: #94a3b8;
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 1.5rem;
}

button {
  background: #0284c7;
  color: #ffffff;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

button:hover {
  background: #0369a1;
  transform: translateY(-1px);
}
`;

    const starterJs = `// Environment of Lightning Live Script
console.log('⚡ EOL Application Initialized!');

let count = 0;
const btn = document.getElementById('btn-count');

if (btn) {
  btn.addEventListener('click', () => {
    count++;
    btn.textContent = \`Clicked: \${count} time\${count === 1 ? '' : 's'}\`;
    console.log('Button clicked:', count);
  });
}
`;

    const starterReadme = `# ⚡ Environment of Lightning (EOL) Workspace

Welcome to your fresh, full-stack IDE workspace!

## Included Features
1. **Multi-Tab Monaco Editor**: Edit with full syntax highlighting, auto-formatting, and auto-save.
2. **Live Browser Preview**: Switch to the **Preview tab** or split view to run your HTML/CSS/JS live.
3. **PowerShell Terminal**: Execute real system commands (\`dir\`, \`npm\`, \`git\`, \`python\`).
4. **Antigravity AI Agent**: Ask the agent to scaffold components, write tests, or refactor code.
`;

    fs.writeFileSync(path.join(this.workspaceRoot, 'index.html'), starterIndex, 'utf-8');
    fs.writeFileSync(path.join(this.workspaceRoot, 'style.css'), starterCss, 'utf-8');
    fs.writeFileSync(path.join(this.workspaceRoot, 'app.js'), starterJs, 'utf-8');
    fs.writeFileSync(path.join(this.workspaceRoot, 'README.md'), starterReadme, 'utf-8');
  }

  private resolveSafePath(relPath: string): string {
    const cleanRel = relPath.replace(/^[\/\\]+/, '');
    const fullPath = path.resolve(this.workspaceRoot, cleanRel);
    if (!fullPath.startsWith(this.workspaceRoot)) {
      throw new Error('Access denied: path is outside workspace root');
    }
    return fullPath;
  }

  public listFiles(subDir: string = ''): ProjectFile[] {
    const targetDir = this.resolveSafePath(subDir);
    if (!fs.existsSync(targetDir)) return [];

    const dirents = fs.readdirSync(targetDir, { withFileTypes: true });
    const result: ProjectFile[] = [];

    for (const d of dirents) {
      if (d.name === '.git' || d.name === 'node_modules' || d.name === 'dist') continue;
      const relPath = path.relative(this.workspaceRoot, path.join(targetDir, d.name)).replace(/\\/g, '/');

      if (d.isDirectory()) {
        result.push({
          name: d.name,
          path: relPath,
          type: 'directory',
          children: this.listFiles(relPath)
        });
      } else {
        const stats = fs.statSync(path.join(targetDir, d.name));
        result.push({
          name: d.name,
          path: relPath,
          type: 'file',
          size: stats.size,
          lastModified: stats.mtimeMs
        });
      }
    }

    return result.sort((a, b) => {
      if (a.type === 'directory' && b.type !== 'directory') return -1;
      if (a.type !== 'directory' && b.type === 'directory') return 1;
      return a.name.localeCompare(b.name);
    });
  }

  public readFile(relPath: string): string {
    const fullPath = this.resolveSafePath(relPath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${relPath}`);
    }
    return fs.readFileSync(fullPath, 'utf-8');
  }

  public writeFile(relPath: string, content: string): void {
    const fullPath = this.resolveSafePath(relPath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(fullPath, content, 'utf-8');
  }

  public deleteFile(relPath: string): void {
    const fullPath = this.resolveSafePath(relPath);
    if (fs.existsSync(fullPath)) {
      const stats = fs.statSync(fullPath);
      if (stats.isDirectory()) {
        fs.rmSync(fullPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(fullPath);
      }
    }
  }

  public renameFile(oldRelPath: string, newRelPath: string): void {
    const oldFull = this.resolveSafePath(oldRelPath);
    const newFull = this.resolveSafePath(newRelPath);
    if (!fs.existsSync(oldFull)) {
      throw new Error(`Source file not found: ${oldRelPath}`);
    }
    const dir = path.dirname(newFull);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.renameSync(oldFull, newFull);
  }

  public getAllFilesMap(): Record<string, string> {
    const map: Record<string, string> = {};
    const walk = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name === '.git' || entry.name === 'node_modules' || entry.name === 'dist') continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(full);
        } else {
          const rel = path.relative(this.workspaceRoot, full).replace(/\\/g, '/');
          try {
            map[rel] = fs.readFileSync(full, 'utf-8');
          } catch {}
        }
      }
    };
    walk(this.workspaceRoot);
    return map;
  }
}
