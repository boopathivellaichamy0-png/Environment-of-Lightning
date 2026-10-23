import { useState, useRef, useEffect } from 'react';
import type { FC, FormEvent, KeyboardEvent } from 'react';
import { Terminal as TerminalIcon, Trash2, ArrowRight } from 'lucide-react';
import { TerminalLog } from '../types.ts';

interface TerminalPaneProps {
  logs: TerminalLog[];
  onExecute: (command: string) => void;
  onClear: () => void;
  onClose?: () => void;
}

export const TerminalPane: FC<TerminalPaneProps> = ({ logs, onExecute, onClear }) => {
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cmd = inputVal.trim();
    if (!cmd) return;

    if (cmd === 'clear' || cmd === 'cls') {
      onClear();
      setInputVal('');
      return;
    }

    setHistory((prev) => [cmd, ...prev.filter((c) => c !== cmd)]);
    setHistoryIdx(-1);
    onExecute(cmd);
    setInputVal('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIdx + 1 < history.length) {
        const nextIdx = historyIdx + 1;
        setHistoryIdx(nextIdx);
        setInputVal(history[nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx > 0) {
        const nextIdx = historyIdx - 1;
        setHistoryIdx(nextIdx);
        setInputVal(history[nextIdx]);
      } else if (historyIdx === 0) {
        setHistoryIdx(-1);
        setInputVal('');
      }
    }
  };

  return (
    <div
      style={{
        height: '240px',
        backgroundColor: '#181818',
        borderTop: '1px solid #2b2b2b',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Fira Code', 'Consolas', monospace",
        fontSize: '12px',
        overflow: 'hidden',
        flexShrink: 0
      }}
    >
      {/* Terminal Title Bar */}
      <div
        style={{
          height: '28px',
          padding: '0 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#181818',
          borderBottom: '1px solid #252526'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <TerminalIcon size={13} color="#38bdf8" />
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#cccccc' }}>POWERSHELL TERMINAL</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={onClear}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#858585',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Clear Terminal (cls)"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Terminal Output Log Area */}
      <div
        style={{
          flex: 1,
          padding: '8px 12px',
          overflowY: 'auto',
          color: '#cccccc',
          lineHeight: '1.45',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all'
        }}
      >
        {logs.map((log) => {
          let color = '#cccccc';
          if (log.type === 'stderr') color = '#f43f5e';
          if (log.type === 'input') color = '#38bdf8';
          if (log.type === 'system') color = '#e5c07b';
          if (log.type === 'ai') color = '#34d399';

          return (
            <div key={log.id} style={{ color }}>
              {log.text}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Terminal Prompt Input Bar */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '4px 8px',
          backgroundColor: '#1e1e1e',
          borderTop: '1px solid #252526'
        }}
      >
        <span style={{ color: '#38bdf8', marginRight: '6px', fontWeight: 600 }}>PS&gt;</span>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Run commands (e.g. dir, node app.js, git status)..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            color: '#ffffff',
            outline: 'none',
            fontSize: '12px',
            fontFamily: 'inherit'
          }}
        />
        <button
          type="submit"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#858585',
            cursor: 'pointer',
            padding: '2px 4px'
          }}
        >
          <ArrowRight size={13} />
        </button>
      </form>
    </div>
  );
};
