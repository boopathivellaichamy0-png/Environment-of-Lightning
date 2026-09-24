import { useState, useRef, useEffect } from 'react';
import type { FC, FormEvent } from 'react';
import {
  Terminal as TerminalIcon,
  Trash2,
  X,
  Play
} from 'lucide-react';
import type { TerminalLog } from '../types';

interface AITerminalProps {
  logs: TerminalLog[];
  onClear: () => void;
  onClose: () => void;
  onExecuteCommand: (command: string) => void;
}

export const AITerminal: FC<AITerminalProps> = ({
  logs,
  onClear,
  onClose,
  onExecuteCommand
}) => {
  const [cmdInput, setCmdInput] = useState('');
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (cmdInput.trim()) {
      onExecuteCommand(cmdInput.trim());
      setCmdInput('');
    }
  };

  const getLogColor = (level: TerminalLog['level']) => {
    switch (level) {
      case 'ai':
        return '#00f0ff';
      case 'success':
        return '#34d399';
      case 'warn':
        return '#fbbf24';
      case 'error':
        return '#f43f5e';
      default:
        return '#cbd5e1';
    }
  };

  return (
    <div style={{
      height: '210px',
      backgroundColor: 'rgba(6, 9, 18, 0.88)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid var(--border-glow)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'var(--font-mono)',
      fontSize: '0.72rem',
      userSelect: 'text',
      boxShadow: '0 -8px 30px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
    }}>
      {/* Terminal Title Bar */}
      <div style={{
        height: '32px',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--lightning-cyan)' }}>
          <TerminalIcon size={14} />
          <span style={{ fontWeight: 700, letterSpacing: '0.05em', fontFamily: 'var(--font-display)', fontSize: '0.75rem' }}>
            ANTIGRAVITY CLI CONSOLE
          </span>
          <span style={{
            fontSize: '0.62rem',
            padding: '1px 5px',
            borderRadius: '4px',
            background: 'rgba(255, 255, 255, 0.06)',
            color: 'var(--text-muted)'
          }}>
            Daemon Active
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={onClear}
            className="btn-icon"
            title="Clear Console"
            style={{ width: '22px', height: '22px' }}
          >
            <Trash2 size={12} />
          </button>
          <button
            onClick={onClose}
            className="btn-icon"
            title="Minimize Console"
            style={{ width: '22px', height: '22px' }}
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Terminal Log Output */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '0.75rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        {logs.map((log) => (
          <div
            key={log.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.65rem',
              lineHeight: 1.45,
              color: getLogColor(log.level)
            }}
          >
            <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem', flexShrink: 0 }}>
              {new Date(log.timestamp).toLocaleTimeString()}
            </span>
            <span style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {log.message}
            </span>
          </div>
        ))}
        <div ref={logEndRef} />
      </div>

      {/* Command Input Prompt */}
      <form onSubmit={handleSubmit} style={{
        height: '34px',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 1rem',
        gap: '0.6rem'
      }}>
        <span style={{ color: 'var(--lightning-cyan)', fontWeight: 700, fontSize: '0.8rem' }}>$</span>
        <input
          type="text"
          placeholder="antigravity --task='inspect architecture'..."
          value={cmdInput}
          onChange={(e) => setCmdInput(e.target.value)}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#ffffff',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.74rem'
          }}
        />
        <button
          type="submit"
          className="btn-ai"
          style={{ padding: '0.22rem 0.65rem', fontSize: '0.7rem' }}
        >
          <Play size={11} /> Run
        </button>
      </form>
    </div>
  );
};
