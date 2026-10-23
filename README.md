# ⚡ Environment of Lightning (EOL) IDE Platform

A high-performance, full-stack collaborative AI-first IDE platform built from scratch with **React 19**, **Monaco Editor**, **Node.js**, **WebSockets**, and **PowerShell**.

---

## 🌟 Key Features

1. **Multi-Tab Monaco Editor**:
   - The same high-performance editor engine that powers VS Code.
   - Syntax highlighting for JavaScript, TypeScript, HTML, CSS, JSON, Python, and Markdown.
   - Breadcrumb navigation, tab close, and automatic 400ms debounced auto-save.

2. **Real PowerShell Terminal**:
   - Spawns real host PowerShell sessions via Node.js child processes.
   - Bidirectional WebSocket streaming for interactive commands (`dir`, `node`, `git status`, `npm run dev`).
   - Command history navigation with `Up` / `Down` arrow keys.

3. **Live Browser Preview & Code Runner**:
   - Instantly bundles `index.html`, `style.css`, and `app.js` into an interactive live browser preview.
   - Responsive device width toggles: Desktop (100%), Tablet (768px), and Mobile (375px).
   - Hot reloading and external tab pop-out.

4. **Antigravity AI Agent Engine**:
   - Autonomous tool-calling loop equipped with:
     - `view_file`: inspects workspace files
     - `write_file`: generates new files
     - `replace_content`: surgical code edits
     - `run_command`: executes shell scripts
     - `list_files`: views workspace directory structure
   - Displays real-time tool execution cards, AST unified diff proposals, and one-click **Apply** / **Reject** buttons.

5. **VS Code Dark Modern Aesthetic**:
   - Authentic matte dark palette (`#181818`, `#1e1e1e`, `#252526`, `#2b2b2b`, `#333333`, `#0078d4`).
   - 48px Activity Bar with Explorer, Search, Preview, Terminal, and AI toggles.

---

## 🚀 Quick Start

### 1. Install Dependencies
```powershell
npm install
npm --prefix server install
npm --prefix client install
```

### 2. Run Both Server & Client Concurrently
```powershell
npm run dev
```
- **Backend Server**: `http://localhost:3001` (WebSocket on `ws://localhost:3001`)
- **Frontend IDE**: `http://localhost:5173`

---

## 📦 Directory Structure
```
EOL/
├── server/               # Node.js + Express + WebSocket backend
│   └── src/
│       ├── index.ts      # HTTP & WebSocket multiplexer
│       ├── fileSystem.ts # Workspace disk I/O
│       ├── terminal.ts   # PowerShell process executor
│       └── aiAgent.ts    # Antigravity AI Agent engine with tool loop
├── client/               # Vite + React 19 + Monaco Editor frontend
│   └── src/
│       ├── components/   # ActivityBar, FileExplorer, EditorPane, TerminalPane, LivePreviewPane, AIAgentPane
│       ├── hooks/        # useWebSocket hook
│       └── App.tsx       # Main IDE workbench
└── workspace/            # Active project workspace files
```
