import * as Y from 'yjs';
import { WebSocket } from 'ws';
import { User, ProjectFile } from './types.js';

export interface RoomConnection {
  ws: WebSocket;
  user: User;
}

export class YjsRoomManager {
  private roomId: string;
  private ydoc: Y.Doc;
  private connections: Map<WebSocket, User> = new Map();
  private dirtyFiles: Set<string> = new Set();
  private fileVersions: Map<string, number> = new Map();
  private workspaceVersion: number = 1;
  private onDocUpdateCallback?: (file: string, version: number) => void;

  constructor(roomId: string, initialFiles: Record<string, ProjectFile>, initialVersion: number = 1) {
    this.roomId = roomId;
    this.ydoc = new Y.Doc();
    this.workspaceVersion = initialVersion;

    // Initialize Y.Text for each file
    for (const [path, file] of Object.entries(initialFiles)) {
      const ytext = this.ydoc.getText(path);
      if (file.content && ytext.length === 0) {
        ytext.insert(0, file.content);
      }
      this.fileVersions.set(path, file.version || 1);
    }

    // Listen to updates in Y.Doc
    this.ydoc.on('update', (update: Uint8Array, origin: any) => {
      // If update came from a client or AI, mark dirty
      if (origin && typeof origin === 'object' && origin.file) {
        this.dirtyFiles.add(origin.file);
        const curVer = (this.fileVersions.get(origin.file) || 1) + 1;
        this.fileVersions.set(origin.file, curVer);
        this.workspaceVersion++;

        if (this.onDocUpdateCallback) {
          this.onDocUpdateCallback(origin.file, curVer);
        }
      }
    });
  }

  setUpdateCallback(cb: (file: string, version: number) => void) {
    this.onDocUpdateCallback = cb;
  }

  getDoc(): Y.Doc {
    return this.ydoc;
  }

  getWorkspaceVersion(): number {
    return this.workspaceVersion;
  }

  getFileVersion(file: string): number {
    return this.fileVersions.get(file) || 1;
  }

  bumpWorkspaceVersion(): number {
    this.workspaceVersion++;
    return this.workspaceVersion;
  }

  getFileText(filePath: string): string {
    return this.ydoc.getText(filePath).toString();
  }

  setFileText(filePath: string, content: string, actor: string = 'system'): void {
    const ytext = this.ydoc.getText(filePath);
    this.ydoc.transact(() => {
      const current = ytext.toString();
      if (current !== content) {
        ytext.delete(0, ytext.length);
        ytext.insert(0, content);
      }
    }, { file: filePath, actor });

    this.dirtyFiles.add(filePath);
  }

  applyTextDelta(filePath: string, index: number, deleteCount: number, insertText: string, actor: string = 'user'): void {
    const ytext = this.ydoc.getText(filePath);
    this.ydoc.transact(() => {
      if (deleteCount > 0) {
        ytext.delete(index, deleteCount);
      }
      if (insertText && insertText.length > 0) {
        ytext.insert(index, insertText);
      }
    }, { file: filePath, actor });

    this.dirtyFiles.add(filePath);
  }

  // AI Patch Application through CRDT (preserving human edits)
  applyPatchCRDT(filePath: string, startLine: number, endLine: number, newText: string): { success: boolean; newContent: string } {
    const ytext = this.ydoc.getText(filePath);
    const content = ytext.toString();
    const lines = content.split('\n');

    // Calculate character offsets for startLine and endLine (1-indexed)
    let charStart = 0;
    for (let i = 0; i < startLine - 1 && i < lines.length; i++) {
      charStart += lines[i].length + 1; // +1 for '\n'
    }

    let charEnd = charStart;
    for (let i = startLine - 1; i < endLine && i < lines.length; i++) {
      charEnd += lines[i].length + (i < lines.length - 1 ? 1 : 0);
    }

    const deleteLength = Math.max(0, charEnd - charStart);

    this.ydoc.transact(() => {
      if (deleteLength > 0 && charStart < ytext.length) {
        ytext.delete(charStart, Math.min(deleteLength, ytext.length - charStart));
      }
      if (newText.length > 0) {
        ytext.insert(charStart, newText);
      }
    }, { file: filePath, actor: 'AI_ANTIGRAVITY' });

    this.dirtyFiles.add(filePath);
    return { success: true, newContent: ytext.toString() };
  }

  deleteFile(filePath: string): void {
    const ytext = this.ydoc.getText(filePath);
    ytext.delete(0, ytext.length);
    this.fileVersions.delete(filePath);
    this.dirtyFiles.add(filePath);
  }

  getDirtyFiles(): string[] {
    return Array.from(this.dirtyFiles);
  }

  clearDirtyFile(filePath: string): void {
    this.dirtyFiles.delete(filePath);
  }

  // --- Client Presence & Connections ---
  addConnection(ws: WebSocket, user: User): void {
    this.connections.set(ws, user);
  }

  removeConnection(ws: WebSocket): User | undefined {
    const user = this.connections.get(ws);
    this.connections.delete(ws);
    return user;
  }

  getUser(ws: WebSocket): User | undefined {
    return this.connections.get(ws);
  }

  updateUser(ws: WebSocket, updates: Partial<User>): User | undefined {
    const user = this.connections.get(ws);
    if (user) {
      Object.assign(user, updates, { lastActive: Date.now() });
      return user;
    }
    return undefined;
  }

  getActiveUsers(): User[] {
    return Array.from(this.connections.values());
  }

  broadcast(message: any, excludeWs?: WebSocket): void {
    const data = JSON.stringify(message);
    for (const [ws, _] of this.connections.entries()) {
      if (ws !== excludeWs && ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(data);
        } catch (e) {
          console.error('Failed to send WS message to peer:', e);
        }
      }
    }
  }

  encodeStateAsBase64(): string {
    const state = Y.encodeStateAsUpdate(this.ydoc);
    return Buffer.from(state).toString('base64');
  }

  applyEncodedUpdate(base64Update: string, origin: any = null): void {
    const update = Buffer.from(base64Update, 'base64');
    Y.applyUpdate(this.ydoc, update, origin);
  }
}
