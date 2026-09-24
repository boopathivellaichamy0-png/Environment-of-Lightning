import { useState } from 'react';
import type { FC, FormEvent } from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Send,
  Zap,
  Edit3
} from 'lucide-react';
import type { MottoState, AIStateMachineState, AIPermissionMode } from '../types';

interface MottoCardProps {
  motto: MottoState;
  aiState: AIStateMachineState;
  permissionMode: AIPermissionMode;
  onTriggerAnalysis: (prompt?: string) => void;
  onUpdateMotto: (newGoal: string, newTask: string) => void;
}

export const MottoCard: FC<MottoCardProps> = ({
  motto,
  aiState,
  permissionMode,
  onTriggerAnalysis,
  onUpdateMotto
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [goalInput, setGoalInput] = useState(motto.goal);
  const [taskInput, setTaskInput] = useState(motto.currentTask);
  const [promptInput, setPromptInput] = useState('');

  const handleMottoSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (goalInput.trim()) {
      onUpdateMotto(goalInput.trim(), taskInput.trim());
      setIsEditing(false);
    }
  };

  const handleCustomPromptSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (promptInput.trim()) {
      onTriggerAnalysis(promptInput.trim());
      setPromptInput('');
    }
  };

  // State machine sequence steps
  const steps: AIStateMachineState[] = [
    'IDLE',
    'OBSERVING',
    'ANALYZING',
    'PLANNING',
    'EXECUTING',
    'VALIDATING',
    'APPLYING'
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
      {/* Central Motto Card */}
      <div className="glass-card" style={{
        padding: '1.1rem',
        borderRadius: '12px',
        border: '1px solid rgba(168, 85, 247, 0.3)',
        background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.1) 0%, rgba(14, 20, 36, 0.9) 100%)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.12)'
      }}>
        {/* Motto Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <Sparkles size={16} color="var(--ai-purple)" />
            <span style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: '0.8rem',
              color: '#d8b4fe',
              letterSpacing: '0.05em',
              textTransform: 'uppercase'
            }}>
              Shared Team Motto
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="badge badge-purple" style={{ fontSize: '0.62rem', padding: '2px 6px' }}>
              {permissionMode}
            </span>
            <button
              onClick={() => {
                setGoalInput(motto.goal);
                setTaskInput(motto.currentTask);
                setIsEditing(!isEditing);
              }}
              className="btn-icon"
              style={{ width: '22px', height: '22px' }}
              title="Edit Motto & Goal"
            >
              <Edit3 size={12} />
            </button>
          </div>
        </div>

        {/* Goal Title / Editing */}
        {isEditing ? (
          <form onSubmit={handleMottoSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <input
              type="text"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder="Team Goal..."
              style={{
                padding: '0.45rem 0.6rem',
                borderRadius: '6px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid var(--ai-purple)',
                color: '#ffffff',
                fontSize: '0.8rem',
                outline: 'none',
                fontFamily: 'var(--font-sans)'
              }}
            />
            <input
              type="text"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              placeholder="Immediate Task..."
              style={{
                padding: '0.45rem 0.6rem',
                borderRadius: '6px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid var(--border-subtle)',
                color: '#ffffff',
                fontSize: '0.78rem',
                outline: 'none',
                fontFamily: 'var(--font-sans)'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
              <button type="button" onClick={() => setIsEditing(false)} className="btn-secondary" style={{ fontSize: '0.72rem', padding: '3px 8px' }}>
                Cancel
              </button>
              <button type="submit" className="btn-ai" style={{ fontSize: '0.72rem', padding: '3px 10px' }}>
                Save Motto
              </button>
            </div>
          </form>
        ) : (
          <>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '0.98rem',
              fontWeight: 700,
              color: '#ffffff',
              lineHeight: 1.35,
              marginBottom: '0.5rem'
            }}>
              "{motto.goal}"
            </div>

            <div style={{
              fontSize: '0.78rem',
              color: 'var(--lightning-cyan)',
              marginBottom: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 500
            }}>
              <Zap size={13} />
              <span>Current Task: {motto.currentTask}</span>
            </div>

            {/* Confidence Meter */}
            <div style={{ marginBottom: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                <span>AI Confidence</span>
                <span style={{ color: '#d8b4fe', fontWeight: 600 }}>{Math.round(motto.confidence * 100)}%</span>
              </div>
              <div style={{
                height: '4px',
                borderRadius: '9999px',
                background: 'rgba(255, 255, 255, 0.08)',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${Math.round(motto.confidence * 100)}%`,
                  background: 'linear-gradient(90deg, #a855f7 0%, #00f0ff 100%)',
                  borderRadius: '9999px',
                  boxShadow: '0 0 8px rgba(0, 240, 255, 0.4)'
                }} />
              </div>
            </div>

            <p style={{
              fontSize: '0.72rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.45,
              borderTop: '1px solid var(--border-subtle)',
              paddingTop: '0.65rem'
            }}>
              <strong style={{ color: '#ffffff' }}>AI Reasoning:</strong> {motto.reasoning}
            </p>
          </>
        )}
      </div>

      {/* Components Checklist */}
      <div className="glass-card" style={{ padding: '0.9rem', borderRadius: '10px' }}>
        <div style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '0.6rem'
        }}>
          Architectural Components
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
          {motto.components.map((comp, idx) => (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.76rem',
              color: '#e2e8f0'
            }}>
              <CheckCircle2 size={13} color="var(--accent-emerald)" />
              <span>{comp}</span>
            </div>
          ))}

          {motto.missingComponents.map((missing, idx) => (
            <div key={`missing-${idx}`} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.76rem',
              color: '#fbbf24',
              background: 'rgba(245, 158, 11, 0.08)',
              padding: '3px 8px',
              borderRadius: '6px',
              border: '1px solid rgba(245, 158, 11, 0.22)'
            }}>
              <AlertTriangle size={13} color="var(--accent-amber)" />
              <span>Missing: {missing}</span>
            </div>
          ))}
        </div>
      </div>

      {/* AI State Machine Pipeline Visualizer */}
      <div className="glass-card" style={{ padding: '0.9rem', borderRadius: '10px' }}>
        <div style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '0.6rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <span>AI Pipeline State</span>
          <span style={{ color: 'var(--lightning-cyan)', fontFamily: 'var(--font-mono)' }}>{aiState}</span>
        </div>

        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px'
        }}>
          {steps.map((st) => {
            const isActive = aiState === st;
            return (
              <span
                key={st}
                style={{
                  fontSize: '9px',
                  fontFamily: 'var(--font-mono)',
                  padding: '3px 7px',
                  borderRadius: '4px',
                  background: isActive ? 'linear-gradient(135deg, #a855f7 0%, #6366f1 100%)' : 'rgba(255, 255, 255, 0.04)',
                  color: isActive ? '#ffffff' : 'var(--text-muted)',
                  fontWeight: isActive ? 700 : 500,
                  boxShadow: isActive ? '0 0 10px rgba(168, 85, 247, 0.4)' : 'none',
                  border: isActive ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid var(--border-subtle)',
                  transition: 'all 0.18s ease'
                }}
              >
                {st}
              </span>
            );
          })}
        </div>
      </div>

      {/* Quick Prompt Input to Antigravity CLI */}
      <form onSubmit={handleCustomPromptSubmit} className="glass-card" style={{
        padding: '0.5rem 0.65rem',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        gap: '0.45rem',
        border: '1px solid var(--border-subtle)'
      }}>
        <input
          type="text"
          placeholder="Ask Antigravity to build or inspect..."
          value={promptInput}
          onChange={(e) => setPromptInput(e.target.value)}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#ffffff',
            fontSize: '0.76rem',
            fontFamily: 'var(--font-sans)',
            paddingLeft: '0.2rem'
          }}
        />
        <button
          type="submit"
          className="btn-ai"
          style={{ padding: '0.3rem 0.65rem', fontSize: '0.72rem' }}
          title="Send task to Antigravity CLI"
        >
          <Send size={12} />
        </button>
      </form>
    </div>
  );
};
