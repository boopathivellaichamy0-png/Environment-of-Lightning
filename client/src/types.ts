export interface ProjectFile {
  name: string;
  path: string;
  type: 'file' | 'directory';
  content?: string;
  size?: number;
  lastModified?: number;
  children?: ProjectFile[];
}

export interface TerminalLog {
  id: string;
  timestamp: number;
  type: 'input' | 'stdout' | 'stderr' | 'system' | 'ai';
  text: string;
}

export interface AIToolCall {
  id: string;
  tool: 'view_file' | 'write_file' | 'replace_content' | 'run_command' | 'list_files';
  args: Record<string, any>;
  result?: string;
  status: 'running' | 'success' | 'failed';
  timestamp: number;
}

export interface AIPatch {
  filePath: string;
  originalContent: string;
  newContent: string;
  diff: string;
}

export interface AIOperation {
  id: string;
  prompt: string;
  model: string;
  thought: string;
  explanation: string;
  toolCalls: AIToolCall[];
  patches: AIPatch[];
  status: 'planning' | 'executing' | 'waiting_approval' | 'applied' | 'rejected' | 'failed';
  createdAt: number;
}
