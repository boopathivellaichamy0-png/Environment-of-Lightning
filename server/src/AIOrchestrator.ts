import { v4 as uuidv4 } from 'uuid';
import {
  AIStateMachineState,
  AIPermissionMode,
  AIOperation,
  AIPatchItem,
  TerminalLog,
  ActivityEvent,
  ChatMessage
} from './types.js';
import { YjsRoomManager } from './YjsRoomManager.js';
import { WorkspaceManager } from './WorkspaceManager.js';
import { MottoEngine } from './MottoEngine.js';
import { AntigravityAdapter } from './AntigravityAdapter.js';
import { ConflictDetector } from './ConflictDetector.js';
import { Database } from './Database.js';

export class AIOrchestrator {
  private roomId: string;
  private state: AIStateMachineState = 'IDLE';
  private permissionMode: AIPermissionMode = 'suggest';
  private yjsRoom: YjsRoomManager;
  private workspaceManager: WorkspaceManager;
  private mottoEngine: MottoEngine;
  private antigravityAdapter: AntigravityAdapter;
  private db: Database;

  private pendingOperation: AIOperation | null = null;
  private eventBuffer: ActivityEvent[] = [];
  private debounceTimer: NodeJS.Timeout | null = null;
  private lastAnalysisTime: number = 0;

  constructor(params: {
    roomId: string;
    yjsRoom: YjsRoomManager;
    workspaceManager: WorkspaceManager;
    mottoEngine: MottoEngine;
    antigravityAdapter: AntigravityAdapter;
    db: Database;
    initialMode?: AIPermissionMode;
  }) {
    this.roomId = params.roomId;
    this.yjsRoom = params.yjsRoom;
    this.workspaceManager = params.workspaceManager;
    this.mottoEngine = params.mottoEngine;
    this.antigravityAdapter = params.antigravityAdapter;
    this.db = params.db;
    this.permissionMode = params.initialMode || 'suggest';
  }

  getState(): AIStateMachineState {
    return this.state;
  }

  getPermissionMode(): AIPermissionMode {
    return this.permissionMode;
  }

  setPermissionMode(mode: AIPermissionMode): void {
    this.permissionMode = mode;
    this.broadcastState();
  }

  getPendingOperation(): AIOperation | null {
    return this.pendingOperation;
  }

  private setState(newState: AIStateMachineState) {
    this.state = newState;
    const room = this.db.getRoom(this.roomId);
    if (room) {
      room.aiState = newState;
      this.db.saveRoom(room);
    }
    this.broadcastState();
  }

  private broadcastState() {
    this.yjsRoom.broadcast({
      type: 'ai:status',
      data: {
        roomId: this.roomId,
        state: this.state,
        permissionMode: this.permissionMode,
        pendingOperation: this.pendingOperation
      }
    });
  }

  private logTerminal(level: TerminalLog['level'], message: string) {
    const log: TerminalLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      level,
      source: 'antigravity-cli',
      message
    };
    this.db.addTerminalLog(this.roomId, log);
    this.yjsRoom.broadcast({
      type: 'terminal:log',
      data: log
    });
  }

  /**
   * Section 12: Ingest activity events and debounce before triggering observer
   */
  recordActivity(event: ActivityEvent): void {
    this.eventBuffer.push(event);
    if (this.debounceTimer) clearTimeout(this.debounceTimer);

    // Debounce 2.5 seconds to avoid spamming users while typing
    this.debounceTimer = setTimeout(() => {
      this.processActivityBuffer();
    }, 2500);
  }

  private async processActivityBuffer() {
    if (this.state !== 'IDLE' && this.state !== 'OBSERVING') return;

    const now = Date.now();
    if (now - this.lastAnalysisTime < 5000) return; // Rate limit 5s

    this.setState('OBSERVING');
    this.lastAnalysisTime = now;

    // Check Motto
    const room = this.db.getRoom(this.roomId);
    if (!room) return;

    const chats = this.db.getChats(this.roomId, 10);
    const motto = this.mottoEngine.analyzeContext({
      files: room.files,
      recentChats: chats,
      recentActivities: this.eventBuffer
    });

    // Clear processed buffer
    this.eventBuffer = [];

    // Broadcast updated motto
    this.yjsRoom.broadcast({
      type: 'motto:updated',
      data: motto
    });

    // If permission is observe only, return to idle
    if (this.permissionMode === 'observe') {
      setTimeout(() => this.setState('IDLE'), 1000);
      return;
    }

    // Check if task needs AI action
    if (motto.missingComponents.length > 0) {
      this.logTerminal('info', `AI Observer: Detected missing components [${motto.missingComponents.join(', ')}]. Evaluating intervention...`);
    }

    setTimeout(() => this.setState('IDLE'), 800);
  }

  /**
   * Trigger Antigravity Analysis & Patch Pipeline
   */
  async triggerAnalysis(customPrompt?: string): Promise<AIOperation | null> {
    if (this.state === 'EXECUTING' || this.state === 'APPLYING') {
      this.logTerminal('warn', 'AI is currently busy with an active operation.');
      return null;
    }

    this.setState('ANALYZING');
    const motto = this.mottoEngine.getMotto();
    const currentBaseVersion = this.yjsRoom.getWorkspaceVersion();
    const workspacePath = this.workspaceManager.getRoomWorkspacePath(this.roomId);

    // Read all latest in-memory texts from Yjs Doc
    const room = this.db.getRoom(this.roomId);
    const files: Record<string, string> = {};
    if (room) {
      for (const filePath of Object.keys(room.files)) {
        files[filePath] = this.yjsRoom.getFileText(filePath);
      }
    }

    this.logTerminal('ai', `Starting Antigravity code analysis on base workspace v${currentBaseVersion}...`);

    this.setState('PLANNING');

    const result = await this.antigravityAdapter.runTask({
      roomId: this.roomId,
      workspacePath,
      goal: motto.goal,
      currentTask: customPrompt || motto.currentTask,
      baseVersion: currentBaseVersion,
      files,
      onLog: (log) => {
        this.db.addTerminalLog(this.roomId, log);
        this.yjsRoom.broadcast({ type: 'terminal:log', data: log });
      }
    });

    if (!result.success || result.patches.length === 0) {
      this.setState('IDLE');
      this.logTerminal('info', 'Antigravity: Workspace is up to date, no patches required.');
      return null;
    }

    const op: AIOperation = {
      id: `op-${uuidv4().substring(0, 8)}`,
      roomId: this.roomId,
      baseVersion: currentBaseVersion,
      status: this.permissionMode === 'execute' ? 'in_progress' : 'waiting_review',
      prompt: customPrompt || motto.currentTask,
      reasoning: result.explanation || `Antigravity planned changes for "${motto.goal}" targeting ${result.filesChanged.join(', ')}`,
      thought: result.thought,
      explanation: result.explanation,
      toolCalls: result.toolCalls,
      filesChanged: result.filesChanged,
      patches: result.patches,
      diff: result.diffText,
      createdAt: Date.now()
    };

    this.pendingOperation = op;
    this.db.saveAIOperation(this.roomId, op);

    if (this.permissionMode === 'execute') {
      // Autonomous mode: directly validate and apply
      await this.applyOperation(op.id);
    } else {
      // Suggestion mode: wait for user approval
      this.setState('WAITING_FOR_PERMISSION');
      this.logTerminal('info', `AI generated ${op.patches.length} patch(es). Awaiting user review/permission [Mode: ${this.permissionMode}].`);
      this.broadcastState();
    }

    return op;
  }

  /**
   * Apply Operation with Version Validation and Conflict Detection
   */
  async applyOperation(operationId: string): Promise<{ success: boolean; conflict?: any }> {
    const op = this.pendingOperation?.id === operationId
      ? this.pendingOperation
      : this.db.getAIOperations(this.roomId).find(o => o.id === operationId);

    if (!op) {
      throw new Error(`Operation ${operationId} not found`);
    }

    this.setState('VALIDATING');
    this.logTerminal('ai', `Validating AI operation ${op.id} against latest workspace state...`);

    const currentWorkspaceVersion = this.yjsRoom.getWorkspaceVersion();
    const activeUsers = this.yjsRoom.getActiveUsers();

    // Check each patch against latest workspace and active cursors
    for (const patch of op.patches) {
      const fileVersion = this.yjsRoom.getFileVersion(patch.file);
      const conflict = ConflictDetector.validatePatch({
        patch,
        currentWorkspaceVersion,
        currentFileVersion: fileVersion,
        activeUsers
      });

      if (conflict.hasConflict) {
        this.setState('CONFLICT');
        op.status = 'conflict';
        op.conflictDetails = {
          file: patch.file,
          currentVersion: fileVersion,
          baseVersion: patch.baseVersion,
          reason: conflict.message
        };
        this.db.saveAIOperation(this.roomId, op);

        this.logTerminal('error', `⚡ CONFLICT DETECTED: ${conflict.message}`);
        this.logTerminal('warn', `Pausing AI changes to preserve human edits.`);

        this.yjsRoom.broadcast({
          type: 'ai:conflict',
          data: {
            operationId: op.id,
            conflict
          }
        });

        this.broadcastState();
        return { success: false, conflict };
      }
    }

    // No conflict, proceed to apply through CRDT
    this.setState('APPLYING');
    this.logTerminal('ai', `Applying ${op.patches.length} patch(es) through CRDT layer...`);

    const appliedMarkers: Array<{ file: string; startLine: number; endLine: number }> = [];

    for (const patch of op.patches) {
      // If file doesn't exist yet, create it in YjsDoc
      const room = this.db.getRoom(this.roomId);
      if (room && !room.files[patch.file]) {
        room.files[patch.file] = {
          id: patch.file,
          name: patch.file.split('/').pop() || patch.file,
          path: patch.file,
          type: 'file',
          content: '',
          version: 1,
          isAiModified: true,
          lastModifiedAt: Date.now()
        };
        this.db.saveRoom(room);
        this.yjsRoom.setFileText(patch.file, patch.newText, 'AI_ANTIGRAVITY');
      } else {
        // Apply patch through Yjs CRDT
        this.yjsRoom.applyPatchCRDT(patch.file, patch.startLine, patch.endLine, patch.newText);
      }

      appliedMarkers.push({
        file: patch.file,
        startLine: patch.startLine,
        endLine: patch.startLine + patch.newText.split('\n').length
      });
    }

    op.status = 'applied';
    op.completedAt = Date.now();
    this.db.saveAIOperation(this.roomId, op);
    this.pendingOperation = null;

    const newVersion = this.yjsRoom.bumpWorkspaceVersion();
    this.logTerminal('success', `✓ AI patches applied successfully. Workspace advanced to v${newVersion}.`);

    // Broadcast AI changes to all users with visual distinction markers
    this.yjsRoom.broadcast({
      type: 'ai:applied',
      data: {
        operationId: op.id,
        filesChanged: op.filesChanged,
        markers: appliedMarkers,
        workspaceVersion: newVersion
      }
    });

    this.setState('COMPLETED');
    setTimeout(() => {
      if (this.state === 'COMPLETED') {
        this.setState('IDLE');
      }
    }, 2500);

    return { success: true };
  }

  rejectOperation(operationId: string): void {
    if (this.pendingOperation && this.pendingOperation.id === operationId) {
      this.pendingOperation.status = 'rejected';
      this.db.saveAIOperation(this.roomId, this.pendingOperation);
      this.pendingOperation = null;
      this.logTerminal('info', `AI Operation ${operationId} was rejected by user.`);
      this.setState('IDLE');
    }
  }

  /**
   * Re-analyze after conflict with fresh context
   */
  async reanalyzeAfterConflict(operationId: string): Promise<AIOperation | null> {
    this.logTerminal('info', `⚡ Re-analyzing with latest synchronized workspace state...`);
    this.pendingOperation = null;
    return this.triggerAnalysis();
  }
}
