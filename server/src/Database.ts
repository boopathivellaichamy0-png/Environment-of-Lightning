import fs from 'fs';
import path from 'path';
import { Room, ActivityEvent, ChatMessage, AIOperation, WorkspaceVersion, TerminalLog, User } from './types.js';

interface DatabaseSchema {
  rooms: Record<string, Room>;
  activities: Record<string, ActivityEvent[]>;
  chats: Record<string, ChatMessage[]>;
  aiOperations: Record<string, AIOperation[]>;
  versionHistory: Record<string, WorkspaceVersion[]>;
  terminalLogs: Record<string, TerminalLog[]>;
}

export class Database {
  private dbPath: string;
  private data: DatabaseSchema;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor(storageDir: string = './data') {
    if (!fs.existsSync(storageDir)) {
      fs.mkdirSync(storageDir, { recursive: true });
    }
    this.dbPath = path.join(storageDir, 'db.json');
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(this.dbPath)) {
        const raw = fs.readFileSync(this.dbPath, 'utf8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error loading db.json, initializing fresh store:', e);
    }
    return {
      rooms: {},
      activities: {},
      chats: {},
      aiOperations: {},
      versionHistory: {},
      terminalLogs: {}
    };
  }

  private scheduleSave() {
    if (this.saveTimeout) return;
    this.saveTimeout = setTimeout(() => {
      this.saveTimeout = null;
      try {
        fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2), 'utf8');
      } catch (err) {
        console.error('Error saving db.json:', err);
      }
    }, 500);
  }

  // --- Rooms ---
  getRoom(roomId: string): Room | undefined {
    return this.data.rooms[roomId];
  }

  saveRoom(room: Room): void {
    this.data.rooms[room.id] = room;
    this.scheduleSave();
  }

  listRooms(): Room[] {
    return Object.values(this.data.rooms);
  }

  // --- Activities ---
  addActivity(roomId: string, activity: ActivityEvent): void {
    if (!this.data.activities[roomId]) {
      this.data.activities[roomId] = [];
    }
    this.data.activities[roomId].push(activity);
    // Keep last 200 events
    if (this.data.activities[roomId].length > 200) {
      this.data.activities[roomId] = this.data.activities[roomId].slice(-200);
    }
    this.scheduleSave();
  }

  getActivities(roomId: string, limit = 50): ActivityEvent[] {
    const list = this.data.activities[roomId] || [];
    return list.slice(-limit);
  }

  // --- Chats ---
  addChat(roomId: string, message: ChatMessage): void {
    if (!this.data.chats[roomId]) {
      this.data.chats[roomId] = [];
    }
    this.data.chats[roomId].push(message);
    if (this.data.chats[roomId].length > 300) {
      this.data.chats[roomId] = this.data.chats[roomId].slice(-300);
    }
    this.scheduleSave();
  }

  getChats(roomId: string, limit = 100): ChatMessage[] {
    const list = this.data.chats[roomId] || [];
    return list.slice(-limit);
  }

  // --- AI Operations ---
  saveAIOperation(roomId: string, op: AIOperation): void {
    if (!this.data.aiOperations[roomId]) {
      this.data.aiOperations[roomId] = [];
    }
    const idx = this.data.aiOperations[roomId].findIndex(o => o.id === op.id);
    if (idx >= 0) {
      this.data.aiOperations[roomId][idx] = op;
    } else {
      this.data.aiOperations[roomId].push(op);
    }
    this.scheduleSave();
  }

  getAIOperations(roomId: string): AIOperation[] {
    return this.data.aiOperations[roomId] || [];
  }

  // --- Versions ---
  recordVersion(roomId: string, ver: WorkspaceVersion): void {
    if (!this.data.versionHistory[roomId]) {
      this.data.versionHistory[roomId] = [];
    }
    this.data.versionHistory[roomId].push(ver);
    this.scheduleSave();
  }

  getVersionHistory(roomId: string): WorkspaceVersion[] {
    return this.data.versionHistory[roomId] || [];
  }

  // --- Terminal Logs ---
  addTerminalLog(roomId: string, log: TerminalLog): void {
    if (!this.data.terminalLogs[roomId]) {
      this.data.terminalLogs[roomId] = [];
    }
    this.data.terminalLogs[roomId].push(log);
    if (this.data.terminalLogs[roomId].length > 500) {
      this.data.terminalLogs[roomId] = this.data.terminalLogs[roomId].slice(-500);
    }
    this.scheduleSave();
  }

  getTerminalLogs(roomId: string): TerminalLog[] {
    return this.data.terminalLogs[roomId] || [];
  }
}
