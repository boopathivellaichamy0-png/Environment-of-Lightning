import { v4 as uuidv4 } from 'uuid';
import { Room, ProjectFile, ActivityEvent, ChatMessage, User } from './types.js';
import { Database } from './Database.js';
import { WorkspaceManager } from './WorkspaceManager.js';
import { YjsRoomManager } from './YjsRoomManager.js';
import { MottoEngine } from './MottoEngine.js';
import { AntigravityAdapter } from './AntigravityAdapter.js';
import { AIOrchestrator } from './AIOrchestrator.js';

export class RoomManager {
  private db: Database;
  private workspaceManager: WorkspaceManager;
  private antigravityAdapter: AntigravityAdapter;

  private yjsRooms: Map<string, YjsRoomManager> = new Map();
  private mottoEngines: Map<string, MottoEngine> = new Map();
  private aiOrchestrators: Map<string, AIOrchestrator> = new Map();

  constructor(db: Database, workspaceManager: WorkspaceManager, antigravityAdapter: AntigravityAdapter) {
    this.db = db;
    this.workspaceManager = workspaceManager;
    this.antigravityAdapter = antigravityAdapter;

    // Restore existing rooms from DB
    const existingRooms = this.db.listRooms();
    for (const room of existingRooms) {
      this.initRoomServices(room);
    }
  }

  getYjsRooms(): Map<string, YjsRoomManager> {
    return this.yjsRooms;
  }

  getYjsRoom(roomId: string): YjsRoomManager | undefined {
    return this.yjsRooms.get(roomId);
  }

  getAIOrchestrator(roomId: string): AIOrchestrator | undefined {
    return this.aiOrchestrators.get(roomId);
  }

  getMottoEngine(roomId: string): MottoEngine | undefined {
    return this.mottoEngines.get(roomId);
  }

  createRoom(name?: string, customId?: string): Room {
    const id = customId || `DEV-AI-${Math.floor(1000 + Math.random() * 9000)}`;
    const existing = this.db.getRoom(id);
    if (existing) {
      return existing;
    }

    const defaultFiles = this.workspaceManager.ensureDefaultFiles(id);

    const room: Room = {
      id,
      name: name || `Project ${id}`,
      createdAt: Date.now(),
      workspaceVersion: 1,
      permissionMode: 'suggest',
      aiState: 'IDLE',
      motto: {
        goal: 'Build full-stack modern application with AI collaboration',
        currentTask: 'Initialize architecture and team motto',
        components: ['Frontend UI', 'Application Core', 'Styling'],
        missingComponents: [],
        confidence: 0.85,
        reasoning: 'Workspace created and initialized.',
        lastUpdated: Date.now()
      },
      files: defaultFiles
    };

    this.db.saveRoom(room);
    this.initRoomServices(room);

    this.db.addActivity(id, {
      id: uuidv4(),
      roomId: id,
      userId: 'system',
      userName: 'System',
      action: 'file_create',
      timestamp: Date.now(),
      metadata: { text: `Room ${id} created with initial workspace.` }
    });

    return room;
  }

  getOrCreateRoom(roomId: string): Room {
    const existing = this.db.getRoom(roomId);
    if (existing) {
      if (!this.yjsRooms.has(roomId)) {
        this.initRoomServices(existing);
      }
      return existing;
    }
    return this.createRoom(`Project ${roomId}`, roomId);
  }

  private initRoomServices(room: Room): void {
    const yjsRoom = new YjsRoomManager(room.id, room.files, room.workspaceVersion);
    const mottoEngine = new MottoEngine(room.motto);
    const aiOrchestrator = new AIOrchestrator({
      roomId: room.id,
      yjsRoom,
      workspaceManager: this.workspaceManager,
      mottoEngine,
      antigravityAdapter: this.antigravityAdapter,
      db: this.db,
      initialMode: room.permissionMode
    });

    this.yjsRooms.set(room.id, yjsRoom);
    this.mottoEngines.set(room.id, mottoEngine);
    this.aiOrchestrators.set(room.id, aiOrchestrator);

    // Link Yjs updates to AI observer activity buffer
    yjsRoom.setUpdateCallback((filePath, version) => {
      aiOrchestrator.recordActivity({
        id: uuidv4(),
        roomId: room.id,
        userId: 'editor',
        userName: 'Contributor',
        action: 'file_edit',
        file: filePath,
        timestamp: Date.now(),
        metadata: { version }
      });
    });
  }

  // --- File System Operations ---
  createFile(roomId: string, filePath: string, content: string = '', user?: User): ProjectFile {
    const room = this.getOrCreateRoom(roomId);
    const yjsRoom = this.yjsRooms.get(roomId)!;

    const file: ProjectFile = {
      id: filePath,
      name: filePath.split('/').pop() || filePath,
      path: filePath,
      type: 'file',
      content,
      version: 1,
      lastModifiedBy: user?.name || 'User',
      lastModifiedAt: Date.now()
    };

    room.files[filePath] = file;
    this.db.saveRoom(room);

    yjsRoom.setFileText(filePath, content, user?.name || 'User');
    this.workspaceManager.saveFileToDisk(roomId, filePath, content);

    const activity: ActivityEvent = {
      id: uuidv4(),
      roomId,
      userId: user?.id || 'system',
      userName: user?.name || 'User',
      action: 'file_create',
      file: filePath,
      timestamp: Date.now()
    };
    this.db.addActivity(roomId, activity);

    yjsRoom.broadcast({
      type: 'file:create',
      data: { file, activity }
    });

    // Notify AI orchestrator
    const ai = this.aiOrchestrators.get(roomId);
    if (ai) ai.recordActivity(activity);

    return file;
  }

  deleteFile(roomId: string, filePath: string, user?: User): boolean {
    const room = this.getOrCreateRoom(roomId);
    const yjsRoom = this.yjsRooms.get(roomId)!;

    if (!room.files[filePath]) return false;

    delete room.files[filePath];
    this.db.saveRoom(room);

    yjsRoom.deleteFile(filePath);
    this.workspaceManager.deleteFileFromDisk(roomId, filePath);

    const activity: ActivityEvent = {
      id: uuidv4(),
      roomId,
      userId: user?.id || 'system',
      userName: user?.name || 'User',
      action: 'file_delete',
      file: filePath,
      timestamp: Date.now()
    };
    this.db.addActivity(roomId, activity);

    yjsRoom.broadcast({
      type: 'file:delete',
      data: { filePath, activity }
    });

    return true;
  }

  renameFile(roomId: string, oldPath: string, newPath: string, user?: User): boolean {
    const room = this.getOrCreateRoom(roomId);
    const yjsRoom = this.yjsRooms.get(roomId)!;

    const file = room.files[oldPath];
    if (!file) return false;

    const currentText = yjsRoom.getFileText(oldPath);
    delete room.files[oldPath];
    yjsRoom.deleteFile(oldPath);

    file.id = newPath;
    file.path = newPath;
    file.name = newPath.split('/').pop() || newPath;
    room.files[newPath] = file;
    this.db.saveRoom(room);

    yjsRoom.setFileText(newPath, currentText, user?.name || 'User');
    this.workspaceManager.renameFileOnDisk(roomId, oldPath, newPath);

    const activity: ActivityEvent = {
      id: uuidv4(),
      roomId,
      userId: user?.id || 'system',
      userName: user?.name || 'User',
      action: 'file_rename',
      file: newPath,
      timestamp: Date.now(),
      metadata: { oldPath, newPath }
    };
    this.db.addActivity(roomId, activity);

    yjsRoom.broadcast({
      type: 'file:rename',
      data: { oldPath, newPath, file, activity }
    });

    return true;
  }

  // --- Step-by-Step Demo Scenario Runner (Section 33) ---
  async runDemoStep(roomId: string, stepNumber: number): Promise<{ success: boolean; step: number; title: string; message: string; data?: any }> {
    const room = this.getOrCreateRoom(roomId);
    const yjsRoom = this.yjsRooms.get(roomId)!;
    const ai = this.aiOrchestrators.get(roomId)!;
    const mottoEngine = this.mottoEngines.get(roomId)!;

    switch (stepNumber) {
      case 1: {
        return {
          success: true,
          step: 1,
          title: 'Room Created',
          message: `Room ${room.id} is active and ready for collaborative development.`
        };
      }
      case 2: {
        // Simulate User B joining
        const userB: User = {
          id: 'user_b_sim',
          name: 'Priya',
          color: '#ec4899',
          lastActive: Date.now(),
          currentFile: 'app.js'
        };
        const activity: ActivityEvent = {
          id: uuidv4(),
          roomId,
          userId: userB.id,
          userName: userB.name,
          action: 'user_join',
          timestamp: Date.now()
        };
        this.db.addActivity(roomId, activity);
        yjsRoom.broadcast({
          type: 'presence:joined',
          data: {
            user: userB,
            activeUsers: [...yjsRoom.getActiveUsers(), userB],
            activity
          }
        });
        return {
          success: true,
          step: 2,
          title: 'User B Joined',
          message: 'Priya (User B) joined the room with a unique cursor color and presence.'
        };
      }
      case 3: {
        // User A creates Login.jsx
        const loginContent = `import React, { useState } from 'react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="login-card">
      <h2>⚡ Sign In</h2>
      <form>
        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
        />
        <button type="submit">Log In</button>
      </form>
    </div>
  );
}
`;
        const file = this.createFile(roomId, 'Login.jsx', loginContent, {
          id: 'user_a',
          name: 'Divya',
          color: '#00f0ff',
          lastActive: Date.now()
        });
        return {
          success: true,
          step: 3,
          title: 'Login.jsx Created',
          message: 'Divya created Login.jsx. Synchronized across all users instantly via CRDT.',
          data: file
        };
      }
      case 4: {
        // User B creates UserModel.js
        const userModelContent = `// UserModel.js - Database Data Model
export class UserModel {
  constructor(db) {
    this.db = db;
  }

  async findByEmail(email) {
    return this.db.users.findOne({ email });
  }

  async verifyPassword(email, candidatePassword) {
    const user = await this.findByEmail(email);
    if (!user) return false;
    return user.passwordHash === candidatePassword;
  }
}
`;
        const file = this.createFile(roomId, 'UserModel.js', userModelContent, {
          id: 'user_b_sim',
          name: 'Priya',
          color: '#ec4899',
          lastActive: Date.now()
        });
        return {
          success: true,
          step: 4,
          title: 'UserModel.js Created',
          message: 'Priya created UserModel.js. Visible in all peer editors in real time.',
          data: file
        };
      }
      case 5: {
        // Simultaneous editing test
        yjsRoom.applyTextDelta('Login.jsx', 0, 0, '// Updated by Divya (User A)\n', 'Divya');
        yjsRoom.applyTextDelta('UserModel.js', 0, 0, '// Verified by Priya (User B)\n', 'Priya');
        return {
          success: true,
          step: 5,
          title: 'Concurrent Editing Tested',
          message: 'Both files edited simultaneously. CRDT merged concurrent changes without conflict or data loss.'
        };
      }
      case 6: {
        // User A sends Chat Message
        const chat: ChatMessage = {
          id: uuidv4(),
          roomId,
          userId: 'user_a',
          userName: 'Divya',
          userColor: '#00f0ff',
          text: 'We need to connect the login page to the database.',
          timestamp: Date.now()
        };
        this.db.addChat(roomId, chat);
        yjsRoom.broadcast({ type: 'chat:message', data: chat });

        // Update Motto
        const updatedMotto = mottoEngine.analyzeContext({
          files: room.files,
          recentChats: this.db.getChats(roomId, 10),
          recentActivities: this.db.getActivities(roomId, 10)
        });
        yjsRoom.broadcast({ type: 'motto:updated', data: updatedMotto });

        return {
          success: true,
          step: 6,
          title: 'Chat Message Sent',
          message: 'Divya: "We need to connect the login page to the database."',
          data: chat
        };
      }
      case 7: {
        // AI updates Motto
        const motto = mottoEngine.getMotto();
        return {
          success: true,
          step: 7,
          title: 'Motto Synthesized by AI',
          message: `Shared Motto: "${motto.goal}" | Task: "${motto.currentTask}"`,
          data: motto
        };
      }
      case 8: {
        // AI observes files and missing bridge
        const motto = mottoEngine.getMotto();
        return {
          success: true,
          step: 8,
          title: 'AI Architectural Observation',
          message: `AI detected components [${motto.components.join(', ')}] and missing link: [${motto.missingComponents.join(', ')}]`,
          data: motto.missingComponents
        };
      }
      case 9: {
        // Antigravity triggered to analyze workspace
        const op = await ai.triggerAnalysis();
        return {
          success: true,
          step: 9,
          title: 'Antigravity Workspace Analysis',
          message: `Antigravity analyzed base version v${yjsRoom.getWorkspaceVersion()} and generated targeted patches.`,
          data: op
        };
      }
      case 10: {
        // Validate and apply patch through CRDT
        const op = ai.getPendingOperation();
        if (op) {
          const res = await ai.applyOperation(op.id);
          return {
            success: res.success,
            step: 10,
            title: 'AI Patch Validated & Applied',
            message: 'Antigravity checked version compatibility, verified no cursor conflicts, and applied patch via CRDT!',
            data: res
          };
        } else {
          return {
            success: true,
            step: 10,
            title: 'Complete',
            message: 'All files are up to date and synchronized.'
          };
        }
      }
      default:
        return { success: false, step: stepNumber, title: 'Invalid Step', message: 'Unknown step number' };
    }
  }
}
