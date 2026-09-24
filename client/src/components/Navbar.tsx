import { useState } from 'react';
import type { FC } from 'react';
import {
  Zap,
  Users,
  Copy,
  Check,
  Sparkles,
  Eye,
  Play,
  Terminal as TerminalIcon,
  Layers,
  ArrowRightLeft
} from 'lucide-react';
import type { User, AIPermissionMode, AIStateMachineState } from '../types';

interface NavbarProps {
  roomId: string;
  onSwitchRoom: (newRoomId: string) => void;
  workspaceVersion: number;
  syncStatus: string;
  isSyncing: boolean;
  activeUsers: User[];
  currentUser: User;
  aiState: AIStateMachineState;
  permissionMode: AIPermissionMode;
  onSetPermissionMode: (mode: AIPermissionMode) => void;
  onTriggerAI: () => void;
  onOpenDemo: () => void;
  onSimulatePeer: () => void;
  terminalOpen: boolean;
  onToggleTerminal: () => void;
  onToggleRightPanel: () => void;
  rightPanelOpen: boolean;
  isAgentFullView?: boolean;
  onToggleAgentView?: () => void;
}

export const Navbar: FC<NavbarProps> = ({
  roomId,
  onSwitchRoom,
  workspaceVersion,
  syncStatus,
  isSyncing,
  activeUsers,
  currentUser,
  aiState,
  permissionMode,
  onSetPermissionMode,
  onTriggerAI,
  onOpenDemo,
  onSimulatePeer,
  terminalOpen,
  onToggleTerminal,
  onToggleRightPanel,
  rightPanelOpen,
  isAgentFullView = false,
  onToggleAgentView
}) => {
  const [copied, setCopied] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [inputRoomId, setInputRoomId] = useState('');

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputRoomId.trim()) {
      onSwitchRoom(inputRoomId.trim().toUpperCase());
      setShowRoomModal(false);
      setInputRoomId('');
    }
  };

  // Color mapping and label for AI state badge
  const getAIStateBadge = () => {
    switch (aiState) {
      case 'IDLE':
        return { color: 'badge-purple', text: 'Idle', icon: '🤖' };
      case 'OBSERVING':
        return { color: 'badge-cyan', text: 'Observing', icon: '👁️' };
      case 'ANALYZING':
        return { color: 'badge-cyan', text: 'Analyzing...', icon: '🧠' };
      case 'PLANNING':
        return { color: 'badge-purple', text: 'Planning Patches', icon: '📐' };
      case 'WAITING_FOR_PERMISSION':
        return { color: 'badge-amber', text: 'Review Pending', icon: '⏳' };
      case 'EXECUTING':
        return { color: 'badge-cyan', text: 'Executing CLI...', icon: '⚡' };
      case 'VALIDATING':
        return { color: 'badge-cyan', text: 'Validating v' + workspaceVersion, icon: '🛡️' };
      case 'APPLYING':
        return { color: 'badge-purple', text: 'Applying CRDT', icon: '✨' };
      case 'COMPLETED':
        return { color: 'badge-emerald', text: 'Patches Applied', icon: '✓' };
      case 'CONFLICT':
        return { color: 'badge-amber', text: 'Conflict Paused', icon: '⚠️' };
      default:
        return { color: 'badge-purple', text: aiState, icon: '🤖' };
    }
  };

  const aiBadge = getAIStateBadge();

  return (
    <header className="glass-panel" style={{
      height: '60px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 1.25rem',
      position: 'relative',
      zIndex: 50,
      flexShrink: 0,
      gap: '1rem',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
    }}>
      {/* 1. Left Group: Brand, Room & Sync */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexShrink: 0 }}>
        {/* Brand Icon + Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '9px',
            background: 'linear-gradient(135deg, rgba(0, 240, 255, 0.18) 0%, rgba(168, 85, 247, 0.28) 100%)',
            border: '1px solid rgba(0, 240, 255, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 14px var(--lightning-cyan-glow), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
            flexShrink: 0
          }}>
            <Zap size={18} color="var(--lightning-cyan)" className="animate-lightning" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', whiteSpace: 'nowrap' }}>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '0.88rem',
              letterSpacing: '0.04em',
              background: 'linear-gradient(90deg, #ffffff 0%, #00f0ff 65%, #c084fc 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1.2
            }}>
              ENVIRONMENT OF LIGHTNING
            </div>
            <div style={{
              fontSize: '0.62rem',
              color: 'var(--text-muted)',
              letterSpacing: '0.08em',
              fontWeight: 600,
              lineHeight: 1.2
            }}>
              AI-ORCHESTRATED REAL-TIME IDE
            </div>
          </div>
        </div>

        <div className="glass-divider" />

        {/* Room Pill */}
        <div className="glass-pill" style={{ padding: '0.22rem 0.55rem', gap: '0.45rem' }}>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em' }}>
            ROOM
          </span>
          <span style={{
            fontSize: '0.78rem',
            fontFamily: 'var(--font-mono)',
            fontWeight: 700,
            color: 'var(--lightning-cyan)',
            letterSpacing: '0.02em'
          }}>
            {roomId}
          </span>
          <button
            onClick={copyRoomId}
            title={copied ? 'Copied!' : 'Copy Room ID'}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: copied ? 'var(--accent-emerald)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              padding: '2px',
              borderRadius: '4px',
              transition: 'color 0.15s ease'
            }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
          </button>
          <button
            onClick={() => setShowRoomModal(true)}
            title="Switch or Join Room"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'var(--text-secondary)',
              fontSize: '0.65rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '2px 6px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
              transition: 'all 0.15s ease'
            }}
          >
            <ArrowRightLeft size={10} />
            <span>Switch</span>
          </button>
        </div>

        {/* Sync Status Capsule */}
        <div className="glass-pill" style={{ padding: '0.22rem 0.55rem', gap: '0.4rem' }} title="CRDT Real-Time Sync & 1s Persistence">
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: isSyncing ? 'var(--accent-amber)' : 'var(--lightning-cyan)',
            boxShadow: isSyncing ? '0 0 8px var(--accent-amber)' : '0 0 8px var(--lightning-cyan)',
            flexShrink: 0
          }} className={isSyncing ? 'animate-spin' : 'animate-pulse-glow'} />
          <span style={{ fontSize: '0.7rem', color: isSyncing ? '#fde68a' : '#e2e8f0', fontWeight: 500 }}>
            {syncStatus.replace('✓ ', '')}
          </span>
          <span style={{
            fontSize: '0.65rem',
            fontFamily: 'var(--font-mono)',
            padding: '1px 5px',
            borderRadius: '4px',
            background: 'rgba(255, 255, 255, 0.06)',
            color: 'var(--text-secondary)',
            border: '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            v{workspaceVersion}
          </span>
        </div>
      </div>

      {/* 2. Middle Group: AI Agent Status & Mode Segmented Switch */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
        {/* Antigravity AI Status Capsule */}
        <div className={`badge ${aiBadge.color}`} style={{ padding: '4px 10px', fontSize: '0.72rem', gap: '6px' }}>
          <span>{aiBadge.icon}</span>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600 }}>Antigravity:</span>
          <span style={{ fontWeight: 700 }}>{aiBadge.text}</span>
        </div>

        {/* Segmented Mode Selector */}
        <div className="glass-segmented">
          <button
            onClick={() => onSetPermissionMode('observe')}
            title="Observe: AI reads context without editing code"
            style={{
              padding: '4px 10px',
              fontSize: '0.72rem',
              borderRadius: '6px',
              border: 'none',
              cursor: 'pointer',
              background: permissionMode === 'observe' ? 'rgba(255,255,255,0.12)' : 'transparent',
              color: permissionMode === 'observe' ? '#ffffff' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: permissionMode === 'observe' ? 600 : 500,
              boxShadow: permissionMode === 'observe' ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
              transition: 'all 0.18s ease'
            }}
          >
            <Eye size={12} />
            <span>Observe</span>
          </button>
          <button
            onClick={() => onSetPermissionMode('suggest')}
            title="Suggest: AI proposes patches for manual review (Recommended)"
            style={{
              padding: '4px 10px',
              fontSize: '0.72rem',
              borderRadius: '6px',
              border: permissionMode === 'suggest' ? '1px solid rgba(168,85,247,0.35)' : '1px solid transparent',
              cursor: 'pointer',
              background: permissionMode === 'suggest' ? 'rgba(168,85,247,0.22)' : 'transparent',
              color: permissionMode === 'suggest' ? '#d8b4fe' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: permissionMode === 'suggest' ? 600 : 500,
              boxShadow: permissionMode === 'suggest' ? '0 0 10px rgba(168,85,247,0.25)' : 'none',
              transition: 'all 0.18s ease'
            }}
          >
            <Sparkles size={12} />
            <span>Suggest</span>
          </button>
          <button
            onClick={() => onSetPermissionMode('execute')}
            title="Execute: AI autonomously applies patches via CRDT"
            style={{
              padding: '4px 10px',
              fontSize: '0.72rem',
              borderRadius: '6px',
              border: permissionMode === 'execute' ? '1px solid rgba(0,240,255,0.35)' : '1px solid transparent',
              cursor: 'pointer',
              background: permissionMode === 'execute' ? 'rgba(0,240,255,0.18)' : 'transparent',
              color: permissionMode === 'execute' ? 'var(--lightning-cyan)' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: permissionMode === 'execute' ? 600 : 500,
              boxShadow: permissionMode === 'execute' ? '0 0 10px rgba(0,240,255,0.25)' : 'none',
              transition: 'all 0.18s ease'
            }}
          >
            <Zap size={12} />
            <span>Execute</span>
          </button>
        </div>
      </div>

      {/* 3. Right Group: Collaborators, Actions & Panel Toggles */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}>
        {/* Collaborative Presence Avatars */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 4px' }} title={`${activeUsers.length} user(s) collaborating in room`}>
          {activeUsers.slice(0, 4).map((user, idx) => (
            <div
              key={user.id}
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: user.color || '#00f0ff',
                color: '#000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.7rem',
                border: user.id === currentUser.id ? '2px solid #ffffff' : '2px solid rgba(11, 15, 24, 0.9)',
                marginLeft: idx === 0 ? '0' : '-7px',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                position: 'relative',
                zIndex: 10 - idx,
                transition: 'transform 0.15s ease'
              }}
              title={user.id === currentUser.id ? `${user.name} (You)` : user.name}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
          ))}
          {activeUsers.length > 4 && (
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.15)',
              color: '#fff',
              fontSize: '0.65rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: '-6px',
              border: '2px solid rgba(11, 15, 24, 0.9)',
              backdropFilter: 'blur(4px)'
            }}>
              +{activeUsers.length - 4}
            </div>
          )}
        </div>

        {/* Simulate Peer Button */}
        <button
          onClick={onSimulatePeer}
          className="btn-secondary"
          title="Simulate second collaborator (Priya) for live CRDT co-editing"
          style={{ padding: '0.35rem 0.65rem', fontSize: '0.74rem' }}
        >
          <Users size={13} color="var(--accent-pink)" />
          <span>+Peer</span>
        </button>

        {/* AI Assist Button */}
        <button
          onClick={onTriggerAI}
          className="btn-ai"
          title="Trigger Antigravity AI Code Inspection & Generation"
        >
          <Sparkles size={13} />
          <span>AI Assist</span>
        </button>

        {/* Demo Tour Button */}
        <button
          onClick={onOpenDemo}
          className="btn-primary"
          title="Open interactive 10-step collaborative demo walkthrough"
        >
          <Play size={13} />
          <span>Demo Tour</span>
        </button>

        {/* Antigravity Model View Toggle (Matches Screenshot: [ A Open IDE ]) */}
        {onToggleAgentView && (
          <button
            onClick={onToggleAgentView}
            className="btn-secondary"
            title={isAgentFullView ? "Switch back to IDE Code Editor" : "Open Antigravity Full Agent View"}
            style={{
              padding: '0.35rem 0.7rem',
              fontSize: '0.74rem',
              gap: '6px',
              background: isAgentFullView ? 'rgba(0, 240, 255, 0.16)' : 'rgba(255, 255, 255, 0.05)',
              borderColor: isAgentFullView ? 'var(--lightning-cyan)' : 'var(--border-subtle)',
              color: '#ffffff'
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#00f0ff">
              <path d="M12 3L4 21h4l4-8 4 8h4L12 3z" />
            </svg>
            <span style={{ fontWeight: 600 }}>{isAgentFullView ? "Open IDE" : "Antigravity"}</span>
          </button>
        )}

        <div className="glass-divider" />

        {/* Terminal Toggle Button */}
        <button
          onClick={onToggleTerminal}
          className="btn-icon"
          title="Toggle Terminal Console"
          style={{
            background: terminalOpen ? 'rgba(0,240,255,0.14)' : 'rgba(255,255,255,0.03)',
            color: terminalOpen ? 'var(--lightning-cyan)' : 'var(--text-secondary)',
            borderColor: terminalOpen ? 'rgba(0,240,255,0.3)' : 'transparent'
          }}
        >
          <TerminalIcon size={15} />
        </button>

        {/* Right Sidebar Toggle Button */}
        <button
          onClick={onToggleRightPanel}
          className="btn-icon"
          title="Toggle AI Motto, Chat & Activity Drawer"
          style={{
            background: rightPanelOpen ? 'rgba(168,85,247,0.14)' : 'rgba(255,255,255,0.03)',
            color: rightPanelOpen ? 'var(--ai-purple)' : 'var(--text-secondary)',
            borderColor: rightPanelOpen ? 'rgba(168,85,247,0.3)' : 'transparent'
          }}
        >
          <Layers size={15} />
        </button>
      </div>

      {/* Switch Room Modal */}
      {showRoomModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(4, 7, 15, 0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="glass-panel-elevated" style={{
            width: '400px',
            padding: '1.75rem',
            borderRadius: '14px',
            border: '1px solid rgba(0, 240, 255, 0.25)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 20px rgba(0, 240, 255, 0.15)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(0, 240, 255, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(0, 240, 255, 0.3)'
              }}>
                <Zap size={18} color="var(--lightning-cyan)" />
              </div>
              <h3 style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                fontSize: '1.05rem',
                color: '#ffffff',
                letterSpacing: '0.02em'
              }}>
                Join or Switch Room
              </h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
              Enter a project room ID (e.g. <strong style={{ color: 'var(--lightning-cyan)' }}>DEV-AI-7824</strong>) to synchronize real-time code, AI state, and active collaborators.
            </p>
            <form onSubmit={handleRoomSubmit}>
              <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
                <input
                  type="text"
                  placeholder="DEV-AI-XXXX"
                  value={inputRoomId}
                  onChange={(e) => setInputRoomId(e.target.value)}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    background: 'rgba(0, 0, 0, 0.45)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.4)'
                  }}
                  onFocus={(e) => e.target.style.borderColor = 'var(--lightning-cyan)'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)'}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem' }}>
                <button
                  type="button"
                  onClick={() => setShowRoomModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Enter Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
