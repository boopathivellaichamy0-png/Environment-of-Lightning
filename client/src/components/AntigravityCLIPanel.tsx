import { useState, useRef, useEffect } from 'react';
import type { FC, FormEvent, KeyboardEvent } from 'react';
import {
  ChevronDown,
  Plus,
  ArrowRight,
  Check,
  RefreshCw,
  Maximize2,
  Minimize2,
  FileCode,
  Terminal as TerminalIcon,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  X,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type {
  ProjectFile,
  AIStateMachineState,
  AIPermissionMode,
  AIOperation,
  AIToolCall
} from '../types';

interface AntigravityCLIPanelProps {
  files: Record<string, ProjectFile>;
  workspaceVersion: number;
  aiState: AIStateMachineState;
  permissionMode: AIPermissionMode;
  onSetPermissionMode: (mode: AIPermissionMode) => void;
  onTriggerAI: (prompt?: string) => void;
  pendingOperation: AIOperation | null;
  onApplyPatch: (opId: string) => void;
  onRejectPatch: (opId: string) => void;
  onReanalyzePatch: (opId: string) => void;
  activeFile: string | null;
  onSelectFile?: (filePath: string) => void;
  isFullView?: boolean;
  onToggleFullView?: () => void;
  roomId?: string;
}

interface ChatMessageItem {
  id: string;
  role: 'user' | 'agent';
  text: string;
  timestamp: number;
  model?: string;
  thought?: string;
  toolCalls?: AIToolCall[];
  filesModified?: string[];
  diff?: string;
  operationId?: string;
  applied?: boolean;
}

export const AntigravityCLIPanel: FC<AntigravityCLIPanelProps> = ({
  files,
  workspaceVersion: _workspaceVersion,
  aiState,
  permissionMode: _permissionMode,
  onSetPermissionMode: _onSetPermissionMode,
  onTriggerAI,
  pendingOperation,
  onApplyPatch,
  onRejectPatch,
  onReanalyzePatch,
  activeFile,
  onSelectFile,
  isFullView = false,
  onToggleFullView,
  roomId = 'DEV-AI-7824'
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedModel, setSelectedModel] = useState('Gemini 3.8 Flash Medium');
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [showMentionMenu, setShowMentionMenu] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  // Expanded thoughts and tools states (per message id)
  const [expandedThoughts, setExpandedThoughts] = useState<Record<string, boolean>>({});
  const [expandedTools, setExpandedTools] = useState<Record<string, boolean>>({});
  const [expandedDiffs, setExpandedDiffs] = useState<Record<string, boolean>>({});

  // Conversation history
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const availableModels = [
    { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash Medium', desc: 'Fast, intelligent code synthesis' },
    { id: 'gemini-3.8-pro', name: 'Gemini 3.8 Pro', desc: 'Deep architectural reasoning & AST' },
    { id: 'claude-3.7-sonnet', name: 'Claude 3.7 Sonnet', desc: 'Hybrid reasoning and refactoring' },
    { id: 'local-fast', name: 'Local Fast Engine', desc: 'Embedded Autonomous Antigravity' }
  ];

  const slashActions = [
    { cmd: '/build', label: 'Build Full Architecture', desc: 'Scaffold full-stack frontend & backend' },
    { cmd: '/auth', label: 'Generate Auth Flow', desc: 'Scaffold Login.jsx, UserModel.js, & controller' },
    { cmd: '/ui', label: 'Glassmorphic UI View', desc: 'Generate sleek modern React dashboard' },
    { cmd: '/fix', label: 'Validate & Auto-Fix', desc: 'Resolve syntax & CRDT merge conflicts' },
    { cmd: '/test', label: 'Run CRDT Tests', desc: 'Execute synchronization verification suite' },
    { cmd: '/terminal', label: 'Run System Command', desc: 'Execute command in real workspace directory' }
  ];

  const isExecuting = aiState === 'ANALYZING' || aiState === 'PLANNING' || aiState === 'EXECUTING' || aiState === 'VALIDATING' || aiState === 'APPLYING';

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [prompt]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isExecuting, pendingOperation]);

  // Sync incoming AI operations into conversation
  useEffect(() => {
    if (pendingOperation) {
      setMessages(prev => {
        const exists = prev.some(m => m.operationId === pendingOperation.id);
        if (exists) return prev;

        const defaultThought = pendingOperation.thought || `1. Inspected workspace files at base v${pendingOperation.baseVersion}.
2. Decomposed task: "${pendingOperation.prompt}".
3. Target components: ${pendingOperation.filesChanged.join(', ')}.
4. Drafted modular code adhering to modern standards.
5. Computed AST unified diffs with zero conflicts.`;

        const defaultToolCalls: AIToolCall[] = pendingOperation.toolCalls || [
          {
            tool: 'view_file',
            args: { path: pendingOperation.filesChanged[0] || 'app.js' },
            result: `Analyzed codebase AST context`,
            timestamp: Date.now() - 1000
          },
          {
            tool: 'write_to_file',
            args: { targetFiles: pendingOperation.filesChanged },
            result: `Generated ${pendingOperation.patches.length} patch(es)`,
            timestamp: Date.now() - 300
          }
        ];

        return [
          ...prev,
          {
            id: `agent-op-${pendingOperation.id}`,
            operationId: pendingOperation.id,
            role: 'agent',
            text: pendingOperation.reasoning,
            thought: defaultThought,
            toolCalls: defaultToolCalls,
            filesModified: pendingOperation.filesChanged,
            diff: pendingOperation.diff,
            timestamp: pendingOperation.createdAt,
            model: selectedModel,
            applied: pendingOperation.status === 'applied'
          }
        ];
      });

      // Expand diff and thought by default for new operation
      setExpandedDiffs(prev => ({ ...prev, [`agent-op-${pendingOperation.id}`]: true }));
      setExpandedThoughts(prev => ({ ...prev, [`agent-op-${pendingOperation.id}`]: true }));
    }
  }, [pendingOperation, selectedModel]);

  const handleSubmit = async (e?: FormEvent, overrideText?: string) => {
    if (e) e.preventDefault();
    const cleanPrompt = (overrideText || prompt).trim();
    if (!cleanPrompt || isExecuting) return;

    // Check if prompt is a direct terminal command (/terminal <cmd> or run <cmd>)
    if (cleanPrompt.startsWith('/terminal ')) {
      const termCmd = cleanPrompt.replace('/terminal ', '').trim();
      const userMsgId = `usr-${Date.now()}`;
      setMessages(prev => [
        ...prev,
        {
          id: userMsgId,
          role: 'user',
          text: cleanPrompt,
          timestamp: Date.now(),
          model: selectedModel
        }
      ]);
      setPrompt('');

      try {
        const res = await fetch(`/api/rooms/${roomId}/terminal/exec`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ command: termCmd })
        });
        const data = await res.json();
        const out = data.stdout || data.stderr || (data.success ? 'Command executed successfully.' : 'Error executing command.');
        setMessages(prev => [
          ...prev,
          {
            id: `agent-${Date.now()}`,
            role: 'agent',
            text: `Executed \`${termCmd}\` in workspace directory:`,
            thought: `Executed system runner process via PowerShell.\nExit Code: ${data.exitCode}`,
            toolCalls: [{ tool: 'run_command', args: { command: termCmd }, result: `Exit code ${data.exitCode}` }],
            diff: out,
            timestamp: Date.now(),
            model: selectedModel
          }
        ]);
      } catch {
        // Fallback
      }
      return;
    }

    // Standard AI Prompt
    const userMsgId = `usr-${Date.now()}`;
    setMessages(prev => [
      ...prev,
      {
        id: userMsgId,
        role: 'user',
        text: cleanPrompt,
        timestamp: Date.now(),
        model: selectedModel
      }
    ]);

    // Dispatch to AI Orchestrator
    onTriggerAI(cleanPrompt);
    setPrompt('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === '@') {
      setShowMentionMenu(true);
    } else if (e.key === '/') {
      setShowSlashMenu(true);
    }
  };

  const handleSelectMention = (fileName: string) => {
    setPrompt(prev => `${prev}@${fileName} `);
    setShowMentionMenu(false);
    textareaRef.current?.focus();
  };

  const handleSelectSlash = (actionPrompt: string) => {
    setPrompt(prev => prev.replace(/\/.*$/, '') + actionPrompt);
    setShowSlashMenu(false);
    textareaRef.current?.focus();
  };

  const handleApplyWithCelebration = (opId: string) => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#00f0ff', '#a855f7', '#34d399']
    });
    onApplyPatch(opId);
    setMessages(prev => prev.map(m => m.operationId === opId ? { ...m, applied: true } : m));
  };


  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#181818',
      color: '#cccccc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* 1. Authentic VS Code Agent Header Bar (Image 2) */}
      <div style={{
        height: '35px',
        backgroundColor: '#181818',
        borderBottom: '1px solid #2b2b2b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px 0 16px',
        userSelect: 'none',
        flexShrink: 0
      }}>
        {/* Left: Agent Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#cccccc', letterSpacing: '0.02em' }}>
            Agent
          </span>
        </div>

        {/* Right: Controls (+, History, ..., Close) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={() => setMessages([])}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#858585',
              cursor: 'pointer',
              padding: '3px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '3px'
            }}
            title="New Chat (+)"
            onMouseEnter={(e) => e.currentTarget.style.color = '#cccccc'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#858585'}
          >
            <Plus size={14} />
          </button>

          <button
            onClick={() => {}}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#858585',
              cursor: 'pointer',
              padding: '3px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '3px'
            }}
            title="Chat History"
            onMouseEnter={(e) => e.currentTarget.style.color = '#cccccc'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#858585'}
          >
            <RotateCcw size={13} />
          </button>

          <button
            style={{
              background: 'transparent',
              border: 'none',
              color: '#858585',
              cursor: 'pointer',
              padding: '3px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '3px'
            }}
            title="More Actions..."
            onMouseEnter={(e) => e.currentTarget.style.color = '#cccccc'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#858585'}
          >
            <ChevronRight size={13} style={{ transform: 'rotate(90deg)' }} />
          </button>

          {onToggleFullView && (
            <button
              onClick={onToggleFullView}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#858585',
                cursor: 'pointer',
                padding: '3px',
                display: 'flex',
                alignItems: 'center',
                borderRadius: '3px'
              }}
              title={isFullView ? 'Split IDE View' : 'Maximize'}
              onMouseEnter={(e) => e.currentTarget.style.color = '#cccccc'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#858585'}
            >
              {isFullView ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
          )}
        </div>
      </div>

      {/* 2. EOL Workspace Title & Login Warning (Image 2) */}
      <div style={{ padding: '12px 14px 4px 14px', flexShrink: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', marginBottom: '8px' }}>
          EOL
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          backgroundColor: '#26231a',
          border: '1px solid #3d3725',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#e5c07b',
          marginBottom: '6px'
        }}>
          <span style={{ fontSize: '13px' }}>⚠️</span>
          <span>To use the agent, please login here</span>
        </div>
      </div>

      {/* 2. Main Chat Canvas Stream */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        padding: '1rem',
        gap: '1.25rem',
        maxWidth: isFullView ? '780px' : '100%',
        margin: '0 auto',
        width: '100%'
      }}>
        {/* Welcome State when no messages */}
        {messages.length === 0 && !pendingOperation && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem 1rem',
            textAlign: 'center',
            gap: '0.75rem'
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
              border: '1px solid rgba(0, 240, 255, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 24px rgba(0, 240, 255, 0.25)'
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00f0ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3L4 21h4l4-8 4 8h4L12 3z" fill="#00f0ff" />
              </svg>
            </div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
              Google Antigravity
            </h2>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0, maxWidth: '380px', lineHeight: 1.45 }}>
              Pair-program with autonomous agent intelligence. Directly access the workspace code, inspect files, and execute terminal commands.
            </p>
          </div>
        )}

        {/* Message Stream */}
        {messages.map((m) => {
          const isUser = m.role === 'user';
          const isExpandedThought = expandedThoughts[m.id];
          const isExpandedTool = expandedTools[m.id];
          const isExpandedDiff = expandedDiffs[m.id];

          return (
            <div
              key={m.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem',
                width: '100%'
              }}
            >
              {/* User Bubble */}
              {isUser ? (
                <div style={{
                  alignSelf: 'flex-end',
                  maxWidth: '85%',
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '14px 14px 2px 14px',
                  padding: '0.75rem 1rem',
                  color: '#ffffff',
                  fontSize: '0.8rem',
                  lineHeight: 1.45
                }}>
                  {m.text}
                </div>
              ) : (
                /* Antigravity Agent Response Card */
                <div style={{
                  width: '100%',
                  background: 'rgba(20, 23, 30, 0.85)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '14px',
                  padding: '1rem',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}>
                  {/* Agent Header */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="#00f0ff">
                        <path d="M12 3L4 21h4l4-8 4 8h4L12 3z" />
                      </svg>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f8fafc' }}>
                        Antigravity
                      </span>
                      <span style={{ fontSize: '0.65rem', color: '#64748b' }}>• {m.model || selectedModel}</span>
                    </div>
                    <span style={{ fontSize: '0.65rem', color: '#64748b' }}>
                      {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* 1. Expandable Thinking Accordion */}
                  {m.thought && (
                    <div style={{
                      borderRadius: '8px',
                      background: 'rgba(0, 0, 0, 0.35)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      overflow: 'hidden'
                    }}>
                      <button
                        onClick={() => setExpandedThoughts(prev => ({ ...prev, [m.id]: !prev[m.id] }))}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          background: 'transparent',
                          border: 'none',
                          color: '#94a3b8',
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <Sparkles size={12} color="var(--lightning-cyan)" />
                          <span>Thinking Process</span>
                        </div>
                        {isExpandedThought ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      </button>

                      {isExpandedThought && (
                        <div style={{
                          padding: '8px 12px',
                          fontSize: '0.72rem',
                          color: '#cbd5e1',
                          lineHeight: 1.5,
                          fontFamily: 'Consolas, monospace',
                          whiteSpace: 'pre-wrap',
                          borderTop: '1px solid rgba(255,255,255,0.04)',
                          background: 'rgba(0,0,0,0.2)'
                        }}>
                          {m.thought}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. Executed Tools Accordion */}
                  {m.toolCalls && m.toolCalls.length > 0 && (
                    <div style={{
                      borderRadius: '8px',
                      background: 'rgba(0, 0, 0, 0.35)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      overflow: 'hidden'
                    }}>
                      <button
                        onClick={() => setExpandedTools(prev => ({ ...prev, [m.id]: !prev[m.id] }))}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          background: 'transparent',
                          border: 'none',
                          color: '#94a3b8',
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                          <TerminalIcon size={12} color="#34d399" />
                          <span>Executed Tools ({m.toolCalls.length})</span>
                        </div>
                        {isExpandedTool ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      </button>

                      {isExpandedTool && (
                        <div style={{
                          padding: '8px 12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          borderTop: '1px solid rgba(255,255,255,0.04)',
                          fontSize: '0.68rem',
                          fontFamily: 'Consolas, monospace'
                        }}>
                          {m.toolCalls.map((t, idx) => (
                            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                              <span style={{ color: '#38bdf8' }}>{t.tool}({JSON.stringify(t.args)})</span>
                              <span style={{ color: '#4ade80' }}>✓ {t.result}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. Explanation Body */}
                  <div style={{
                    fontSize: '0.78rem',
                    color: '#e2e8f0',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap'
                  }}>
                    {m.text}
                  </div>

                  {/* 4. Files Modified Badges */}
                  {m.filesModified && m.filesModified.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600 }}>Files Affected:</span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {m.filesModified.map(f => (
                          <button
                            key={f}
                            onClick={() => onSelectFile?.(f)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              background: 'rgba(0, 240, 255, 0.12)',
                              border: '1px solid rgba(0, 240, 255, 0.28)',
                              color: 'var(--lightning-cyan)',
                              fontSize: '0.68rem',
                              fontFamily: 'Consolas, monospace',
                              cursor: 'pointer'
                            }}
                            title="Click to view file in editor"
                          >
                            <FileCode size={12} />
                            <span>{f}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 5. Inline Diff Viewer */}
                  {m.diff && (
                    <div style={{
                      borderRadius: '8px',
                      background: '#090a0f',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      overflow: 'hidden'
                    }}>
                      <button
                        onClick={() => setExpandedDiffs(prev => ({ ...prev, [m.id]: !prev[m.id] }))}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '6px 10px',
                          background: 'rgba(255, 255, 255, 0.03)',
                          border: 'none',
                          color: '#f8fafc',
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                          fontWeight: 600
                        }}
                      >
                        <span>Unified Patch Diff</span>
                        {isExpandedDiff ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                      </button>

                      {isExpandedDiff && (
                        <pre style={{
                          margin: 0,
                          padding: '10px',
                          fontSize: '0.68rem',
                          fontFamily: 'Consolas, monospace',
                          overflowX: 'auto',
                          lineHeight: 1.45,
                          maxHeight: '220px',
                          color: '#e2e8f0'
                        }}>
                          {m.diff.split('\n').map((line, idx) => {
                            let lineBg = 'transparent';
                            let lineCol = '#e2e8f0';
                            if (line.startsWith('+') && !line.startsWith('+++')) {
                              lineBg = 'rgba(52, 211, 153, 0.15)';
                              lineCol = '#4ade80';
                            } else if (line.startsWith('-') && !line.startsWith('---')) {
                              lineBg = 'rgba(244, 63, 94, 0.15)';
                              lineCol = '#f87171';
                            } else if (line.startsWith('@')) {
                              lineCol = '#38bdf8';
                            }
                            return (
                              <div key={idx} style={{ background: lineBg, color: lineCol }}>
                                {line}
                              </div>
                            );
                          })}
                        </pre>
                      )}
                    </div>
                  )}

                  {/* 6. Review / Apply Actions */}
                  {m.operationId && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      {m.applied ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#4ade80', fontSize: '0.72rem', fontWeight: 600 }}>
                          <CheckCircle2 size={13} />
                          <span>Changes successfully applied to workspace</span>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => handleApplyWithCelebration(m.operationId!)}
                            className="btn-primary"
                            style={{
                              padding: '5px 12px',
                              fontSize: '0.72rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Check size={12} />
                            <span>Accept & Apply Patch</span>
                          </button>
                          <button
                            onClick={() => onRejectPatch(m.operationId!)}
                            className="btn-secondary"
                            style={{
                              padding: '5px 10px',
                              fontSize: '0.72rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <X size={12} />
                            <span>Reject</span>
                          </button>
                          <button
                            onClick={() => onReanalyzePatch(m.operationId!)}
                            style={{
                              padding: '5px 8px',
                              background: 'transparent',
                              border: 'none',
                              color: '#94a3b8',
                              fontSize: '0.7rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <RotateCcw size={11} />
                            <span>Re-plan</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Spinner */}
        {isExecuting && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            padding: '0.75rem 1rem',
            borderRadius: '10px',
            background: 'rgba(0, 240, 255, 0.08)',
            border: '1px solid rgba(0, 240, 255, 0.25)',
            fontSize: '0.76rem',
            color: 'var(--lightning-cyan)'
          }}>
            <RefreshCw size={14} className="animate-spin" />
            <span>Antigravity is analyzing AST and synthesizing changes ({aiState.toLowerCase()})...</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* 3. The Authentic Floating Antigravity Prompt Box */}
      <div style={{
        padding: '0 1rem 1rem 1rem',
        maxWidth: isFullView ? '780px' : '100%',
        margin: '0 auto',
        width: '100%',
        flexShrink: 0
      }}>
        {/* Suggestion Pills (Shown before chat or for quick start) */}
        {messages.length === 0 && (
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '6px',
            marginBottom: '0.65rem'
          }}>
            {[
              activeFile ? `Inspect @${activeFile}` : 'Build full user auth & API',
              'Scaffold UserModel.js with validation',
              'Generate glassmorphic dashboard views',
              'Run verification & fix conflicts'
            ].map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSubmit(undefined, s)}
                style={{
                  fontSize: '0.68rem',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(0, 240, 255, 0.12)';
                  e.currentTarget.style.borderColor = 'rgba(0, 240, 255, 0.35)';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.color = '#cbd5e1';
                }}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* The Card (Image 2) */}
        <div style={{
          width: '100%',
          background: '#202020',
          border: '1px solid #333333',
          borderRadius: '10px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
          padding: '10px 12px 8px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          position: 'relative'
        }}>
          {/* Mention @ Popup */}
          {showMentionMenu && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              left: '12px',
              marginBottom: '6px',
              width: '220px',
              background: '#1e1e1e',
              border: '1px solid #333333',
              borderRadius: '6px',
              boxShadow: '0 6px 20px rgba(0,0,0,0.6)',
              zIndex: 100,
              padding: '4px'
            }}>
              <div style={{ padding: '4px 8px', fontSize: '10px', color: '#858585', fontWeight: 600 }}>
                Attach File Context
              </div>
              {Object.keys(files).slice(0, 6).map(f => (
                <button
                  key={f}
                  onClick={() => handleSelectMention(f)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '4px 8px',
                    borderRadius: '3px',
                    background: 'transparent',
                    border: 'none',
                    color: '#cccccc',
                    fontSize: '11px',
                    fontFamily: 'Consolas, monospace',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#2a2d2e'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <FileCode size={12} color="#969696" />
                  <span>{f}</span>
                </button>
              ))}
            </div>
          )}

          {/* Slash / Actions Popup */}
          {showSlashMenu && (
            <div style={{
              position: 'absolute',
              bottom: '100%',
              left: '12px',
              marginBottom: '6px',
              width: '250px',
              background: '#1e1e1e',
              border: '1px solid #333333',
              borderRadius: '6px',
              boxShadow: '0 6px 20px rgba(0,0,0,0.6)',
              zIndex: 100,
              padding: '4px'
            }}>
              <div style={{ padding: '4px 8px', fontSize: '10px', color: '#858585', fontWeight: 600 }}>
                Actions
              </div>
              {slashActions.map(action => (
                <button
                  key={action.cmd}
                  onClick={() => handleSelectSlash(action.cmd)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '5px 8px',
                    borderRadius: '3px',
                    background: 'transparent',
                    border: 'none',
                    color: '#cccccc',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#2a2d2e'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#0078d4', fontWeight: 600, fontSize: '11px' }}>{action.cmd}</span>
                    <span style={{ fontSize: '11px', color: '#ffffff' }}>{action.label}</span>
                  </div>
                  <span style={{ fontSize: '10px', color: '#858585' }}>{action.desc}</span>
                </button>
              ))}
            </div>
          )}

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything, @ to mention, / for actions"
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#ffffff',
              fontSize: '12px',
              resize: 'none',
              lineHeight: 1.45,
              fontFamily: 'inherit',
              padding: 0
            }}
          />

          {/* Bottom Card Controls Row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '2px'
          }}>
            {/* Left Controls: Plus + Model Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setShowAttachMenu(!showAttachMenu)}
                  style={{
                    width: '22px',
                    height: '22px',
                    background: 'transparent',
                    border: 'none',
                    color: '#858585',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    borderRadius: '3px'
                  }}
                  title="Add context (@ file, terminal)"
                  onMouseEnter={(e) => e.currentTarget.style.color = '#cccccc'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#858585'}
                >
                  <Plus size={14} />
                </button>

                {showAttachMenu && (
                  <div style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: 0,
                    marginBottom: '4px',
                    width: '180px',
                    background: '#1e1e1e',
                    border: '1px solid #333333',
                    borderRadius: '4px',
                    boxShadow: '0 6px 20px rgba(0,0,0,0.6)',
                    zIndex: 100,
                    padding: '3px'
                  }}>
                    <button
                      onClick={() => {
                        setShowAttachMenu(false);
                        setShowMentionMenu(true);
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '4px 8px',
                        borderRadius: '3px',
                        background: 'transparent',
                        border: 'none',
                        color: '#cccccc',
                        fontSize: '11px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#2a2d2e'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <FileCode size={12} color="#969696" />
                      <span>Attach File Context</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowAttachMenu(false);
                        setPrompt(prev => prev + '/terminal dir');
                      }}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        padding: '4px 8px',
                        borderRadius: '3px',
                        background: 'transparent',
                        border: 'none',
                        color: '#cccccc',
                        fontSize: '11px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#2a2d2e'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <TerminalIcon size={12} color="#969696" />
                      <span>Execute Terminal</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Model Dropdown (No Model Selected ⌄ in Image 2) */}
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setShowModelMenu(!showModelMenu)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'transparent',
                    border: 'none',
                    color: '#969696',
                    fontSize: '11px',
                    cursor: 'pointer',
                    padding: '2px 4px',
                    borderRadius: '3px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#cccccc'}
                  onMouseLeave={(e) => e.currentTarget.style.color = '#969696'}
                >
                  <span>{selectedModel || 'No Model Selected'}</span>
                  <ChevronDown size={11} color="#858585" />
                </button>

                {showModelMenu && (
                  <div style={{
                    position: 'absolute',
                    bottom: '100%',
                    left: 0,
                    marginBottom: '4px',
                    width: '210px',
                    background: '#1e1e1e',
                    border: '1px solid #333333',
                    borderRadius: '4px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    zIndex: 100,
                    padding: '4px'
                  }}>
                    {availableModels.map(m => (
                      <button
                        key={m.id}
                        onClick={() => {
                          setSelectedModel(m.name);
                          setShowModelMenu(false);
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '5px 8px',
                          borderRadius: '3px',
                          background: selectedModel === m.name ? '#2a2d2e' : 'transparent',
                          border: 'none',
                          color: '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 500 }}>{m.name}</div>
                          <div style={{ fontSize: '10px', color: '#858585' }}>{m.desc}</div>
                        </div>
                        {selectedModel === m.name && <Check size={12} color="#0078d4" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Controls: Send Button (Dark circle with arrow) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!prompt.trim() || isExecuting}
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: prompt.trim() && !isExecuting ? '#383838' : '#282828',
                  border: 'none',
                  color: prompt.trim() && !isExecuting ? '#ffffff' : '#6e7681',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: prompt.trim() && !isExecuting ? 'pointer' : 'default',
                  transition: 'all 0.12s ease'
                }}
                title="Send Prompt (Enter)"
              >
                <ArrowRight size={13} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>

        {/* 4. Footer Disclaimer (Image 2) */}
        <div style={{
          textAlign: 'center',
          fontSize: '11px',
          color: '#6e7681',
          marginTop: '8px',
          userSelect: 'none'
        }}>
          AI may make mistakes. Double-check all generated code.
        </div>
      </div>
    </div>
  );
};
