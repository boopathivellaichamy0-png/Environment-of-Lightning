# ⚡ ENVIRONMENT OF LIGHTNING (EOL)

> **Real-Time Collaborative AI-First IDE powered by Google's Antigravity CLI & Yjs CRDT**

![Environment of Lightning](https://img.shields.io/badge/Antigravity-CLI_2.0-00f0ff?style=for-the-badge&logo=google)
![CRDT](https://img.shields.io/badge/Synchronization-Yjs_CRDT-a855f7?style=for-the-badge)
![React 19](https://img.shields.io/badge/Frontend-React_19_+_Vite-61dafb?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Backend-Node_Express_WS-339933?style=for-the-badge&logo=node.js)

---

## 🌟 Key Highlights

- **Real-Time Multiplayer Collaboration**: Instant peer-to-peer document editing powered by **Yjs CRDT** with automatic conflict resolution, presence cursors, and live activity streams.
- **Google Antigravity CLI Integration**: Seamless bridge to `agy` running in headless stream-json mode (`--input-format stream-json --output-format stream-json`) for autonomous coding, code analysis, unified diff proposals, and multi-step reasoning.
- **Glassmorphic Cyber-IDE Design**: High-performance UI built with dark glass panels, neon lightning accents, Monaco Editor integration, live terminal, and an interactive CLI cockpit.
- **Bidirectional File Sync**: Automatic synchronization between in-memory CRDT buffers and the physical workspace disk (`server/workspaces/<roomId>/project/`) with monotonic `workspaceVersion` tracking.
- **Sandboxed Execution**: Built-in system terminal execution engine for testing and building full-stack projects directly in the room workspace.

---

## 🏗️ Architecture

```
Environment of Lightning (EOL)
├── client/                     # Vite + React 19 + TypeScript + Monaco Editor
│   ├── src/
│   │   ├── components/         # AntigravityCLIPanel, CodeEditor, Terminal, Presence
│   │   ├── styles/             # Modern Glassmorphic Cyberpunk Theme
│   │   └── App.tsx             # Room state & WebSocket dispatcher
│   └── package.json
├── server/                     # Node.js + Express + WebSocket + Yjs Engine
│   ├── src/
│   │   ├── index.ts            # Server entrypoint & WebSocket multiplexer
│   │   ├── YjsRoomManager.ts   # In-memory Y.Doc & Y.Text CRDT synchronization
│   │   ├── WorkspaceManager.ts # Disk workspace manager
│   │   ├── PersistenceScheduler.ts # 1-second auto-save to disk
│   │   ├── Database.ts         # Persistent room, chat, and terminal store
│   │   └── types.ts            # Type definitions
│   └── package.json
└── package.json                # Root orchestrator
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- npm or pnpm
- Google Antigravity CLI (`agy`) installed and authenticated

### Setup & Run

1. **Install Dependencies**:
```bash
npm install
npm --prefix server install
npm --prefix client install
```

2. **Start Backend Server**:
```bash
npm --prefix server run dev
# Server listens on http://localhost:3001
```

3. **Start Client Frontend**:
```bash
npm --prefix client run dev
# Client runs at http://localhost:5173
```

---

## 📜 License
MIT License. Built with ⚡ by the Environment of Lightning Team.
