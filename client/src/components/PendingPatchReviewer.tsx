import type { FC } from 'react';
import {
  Sparkles,
  Check,
  X,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { AIOperation } from '../types';

interface PendingPatchReviewerProps {
  operation: AIOperation | null;
  onApply: (opId: string) => void;
  onReject: (opId: string) => void;
  onReanalyze: (opId: string) => void;
}

export const PendingPatchReviewer: FC<PendingPatchReviewerProps> = ({
  operation,
  onApply,
  onReject,
  onReanalyze
}) => {
  if (!operation) return null;

  const isConflict = operation.status === 'conflict';

  const handleApplyWithCelebration = (id: string) => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#00f0ff', '#a855f7', '#34d399']
    });
    onApply(id);
  };

  return (
    <div className="glass-panel-elevated" style={{
      padding: '1rem',
      borderRadius: '12px',
      border: isConflict ? '1px solid var(--accent-amber)' : '1px solid rgba(168, 85, 247, 0.4)',
      background: isConflict
        ? 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(14, 20, 36, 0.95) 100%)'
        : 'linear-gradient(135deg, rgba(168, 85, 247, 0.14) 0%, rgba(14, 20, 36, 0.95) 100%)',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          {isConflict ? (
            <AlertTriangle size={16} color="var(--accent-amber)" />
          ) : (
            <Sparkles size={16} color="var(--ai-purple)" />
          )}
          <span style={{
            fontWeight: 700,
            fontSize: '0.82rem',
            color: isConflict ? 'var(--accent-amber)' : '#d8b4fe',
            fontFamily: 'var(--font-display)',
            letterSpacing: '0.02em'
          }}>
            {isConflict ? '⚠ AI Patch Conflict' : '⚡ Antigravity AI Patch'}
          </span>
        </div>
        <span style={{
          fontSize: '0.65rem',
          color: 'var(--text-muted)',
          fontFamily: 'var(--font-mono)',
          background: 'rgba(255, 255, 255, 0.06)',
          padding: '2px 6px',
          borderRadius: '4px'
        }}>
          Base v{operation.baseVersion}
        </span>
      </div>

      {/* Description / Conflict message */}
      {isConflict ? (
        <div style={{
          fontSize: '0.74rem',
          color: '#fbbf24',
          lineHeight: 1.45,
          background: 'rgba(0, 0, 0, 0.35)',
          padding: '0.5rem 0.75rem',
          borderRadius: '6px',
          border: '1px solid rgba(245, 158, 11, 0.2)'
        }}>
          {operation.conflictDetails?.reason || 'A user has made newer changes to the same section. AI change paused to preserve human work.'}
        </div>
      ) : (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          {operation.reasoning}
        </div>
      )}

      {/* Files Changed List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {operation.patches.map((p, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.74rem',
            fontFamily: 'var(--font-mono)',
            background: 'rgba(0, 0, 0, 0.3)',
            padding: '4px 8px',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.05)'
          }}>
            <span style={{ color: 'var(--lightning-cyan)', fontWeight: 600 }}>{p.file}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.68rem' }}>
              Lines {p.startLine}-{p.endLine}
            </span>
          </div>
        ))}
      </div>

      {/* Quick Diff Preview */}
      {operation.diff && (
        <div style={{
          maxHeight: '130px',
          overflowY: 'auto',
          background: 'rgba(4, 6, 12, 0.95)',
          padding: '0.6rem 0.75rem',
          borderRadius: '6px',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.68rem',
          border: '1px solid var(--border-subtle)',
          lineHeight: 1.4
        }}>
          {operation.diff.split('\n').slice(0, 15).map((line, idx) => {
            const isAdd = line.startsWith('+');
            const isSub = line.startsWith('-');
            return (
              <div
                key={idx}
                style={{
                  color: isAdd ? '#34d399' : isSub ? '#f43f5e' : 'var(--text-muted)',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {line}
              </div>
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.2rem' }}>
        {isConflict ? (
          <>
            <button
              onClick={() => onReject(operation.id)}
              className="btn-secondary"
              style={{ fontSize: '0.72rem', padding: '0.3rem 0.65rem' }}
            >
              Keep User Changes
            </button>
            <button
              onClick={() => onReanalyze(operation.id)}
              className="btn-ai"
              style={{ fontSize: '0.72rem', padding: '0.3rem 0.75rem' }}
            >
              <RefreshCw size={11} /> Re-analyze State
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => onReject(operation.id)}
              className="btn-secondary"
              style={{ fontSize: '0.72rem', padding: '0.3rem 0.65rem' }}
            >
              <X size={11} /> Reject
            </button>
            <button
              onClick={() => handleApplyWithCelebration(operation.id)}
              className="btn-primary"
              style={{ fontSize: '0.72rem', padding: '0.3rem 0.8rem' }}
            >
              <Check size={11} /> Apply CRDT Patch
            </button>
          </>
        )}
      </div>
    </div>
  );
};
