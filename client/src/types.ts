export type AIPermissionMode = 'observe' | 'suggest' | 'execute';

export type AIStateMachineState =
  | 'IDLE'
  | 'OBSERVING'
  | 'ANALYZING'
  | 'PLANNING'
  | 'WAITING_FOR_PERMISSION'
  | 'EXECUTING'
  | 'VALIDATING'
  | 'APPLYING'
  | 'COMPLETED'
  | 'CONFLICT'
  | 'FAILED';

export interface User {
  id: string;
  name: string;
  color: string;
  avatar?: string;
  currentFile?: string;
  cursor?: {
    line: number;
    ch: number;
  };
  selection?: {
    startLine: number;
    startCol: number;
    endLine: number;
    endCol: number;
  };
  lastActive: number;
}

export interface ProjectFile {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  content?: string;
  version: number;
  lastModifiedBy?: string;
  lastModifiedAt?: number;
  isAiModified?: boolean;
}

export interface ActivityEvent {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  action: 'file_create' | 'file_delete' | 'file_rename' | 'file_edit' | 'chat_message' | 'ai_task' | 'ai_patch' | 'user_join' | 'user_leave' | 'conflict_detected';
  file?: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  userName: string;
  userColor: string;
  text: string;
  timestamp: number;
  isAI?: boolean;
  mottoTriggered?: boolean;
}

export interface MottoState {
  goal: string;
  currentTask: string;
  components: string[];
  missingComponents: string[];
  confidence: number;
  reasoning: string;
  lastUpdated: number;
}

export interface AIPatchItem {
  file: string;
  baseVersion: number;
  startLine: number;
  endLine: number;
  originalText: string;
  newText: string;
  diffSummary?: string;
}

export interface AIToolCall {
  tool: string;
  args: Record<string, any>;
  result?: string;
  timestamp?: number;
}

export interface AIOperation {
  id: string;
  roomId: string;
  baseVersion: number;
  status: 'pending' | 'in_progress' | 'waiting_review' | 'applied' | 'rejected' | 'conflict' | 'failed';
  prompt: string;
  reasoning: string;
  thought?: string;
  explanation?: string;
  toolCalls?: AIToolCall[];
  filesChanged: string[];
  patches: AIPatchItem[];
  diff: string;
  createdAt: number;
  completedAt?: number;
  conflictDetails?: {
    file: string;
    currentVersion: number;
    baseVersion: number;
    reason: string;
  };
}

export interface TerminalLog {
  id: string;
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'ai' | 'success';
  source: 'antigravity-cli' | 'system' | 'crdt' | 'user';
  message: string;
}

export interface RoomData {
  id: string;
  name: string;
  createdAt: number;
  workspaceVersion: number;
  motto: MottoState;
  permissionMode: AIPermissionMode;
  aiState: AIStateMachineState;
  files: Record<string, ProjectFile>;
}

export interface AIMarker {
  file: string;
  startLine: number;
  endLine: number;
}
