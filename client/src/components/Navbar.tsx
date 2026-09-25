import { useState } from 'react';
import type { FC } from 'react';
import {
  Zap,
  Users,
  Copy,
  Check,
  Eye,
  Terminal as TerminalIcon,
  Layers,
  ArrowRightLeft,
  SlidersHorizontal,
  Bot
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
  onOpenDemo,
  onSimulatePeer,
  terminalOpen,
  onToggleTerminal,
  onToggleRightPanel,
  rightPanelOpen
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

  const getAIStateBadge = () => {
    switch (aiState) {
      case 'IDLE':
        return { text: 'Idle', color: '#969696' };
      case 'OBSERVING':
        return { text: 'Observing', color: '#0078d4' };
      case 'ANALYZING':
        return { text: 'Analyzing...', color: '#0078d4' };
      case 'PLANNING':
        return { text: 'Planning', color: '#cca700' };
      case 'WAITING_FOR_PERMISSION':
        return { text: 'Review Pending', color: '#cca700' };
      case 'EXECUTING':
        return { text: 'Executing...', color: '#0078d4' };
      case 'VALIDATING':
        return { text: 'Validating', color: '#0078d4' };
      case 'APPLYING':
        return { text: 'Applying CRDT', color: '#89d185' };
      case 'COMPLETED':
        return { text: 'Patches Applied', color: '#89d185' };
      case 'CONFLICT':
        return { text: 'Conflict', color: '#f14c4c' };
      default:
        return { text: 'Active', color: '#969696' };
    }
  };

  const aiBadge = getAIStateBadge();

  return (
    <header style={{
      height: '42px',
      width: '100%',
      backgroundColor: '#181818',
      borderBottom: '1px solid #2b2b2b',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 12px',
      userSelect: 'none',
      position: 'relative',
      zIndex: 20
    }}>
      {/* 1. Left Group: Brand, Room & Sync */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {/* Brand Icon + Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '26px',
            height: '26px',
            borderRadius: '4px',
            background: '#252526',
            border: '1px solid #333333',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0078d4',
            flexShrink: 0
          }}>
            <Zap size={15} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
            <span style={{
              fontWeight: 600,
              fontSize: '12px',
              color: '#cccccc',
              letterSpacing: '0.02em'
            }}>
              ENVIRONMENT OF LIGHTNING
            </span>
          </div>
        </div>

        <div className="glass-divider" />

        {/* Room Pill */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: '#252526',
          border: '1px solid #333333',
          borderRadius: '4px',
          padding: '2px 8px'
        }}>
          <span style={{ fontSize: '11px', color: '#858585', fontWeight: 500 }}>
            ROOM
          </span>
          <span style={{
            fontSize: '11px',
            fontFamily: 'Consolas, monospace',
            fontWeight: 600,
            color: '#cccccc'
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
              color: copied ? '#89d185' : '#858585',
              display: 'flex',
              alignItems: 'center',
              padding: '1px'
            }}
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
          </button>
          <button
            onClick={() => setShowRoomModal(true)}
            title="Switch or Join Room"
            style={{
              background: '#2a2d2e',
              border: '1px solid #383838',
              color: '#cccccc',
              fontSize: '10px',
              cursor: 'pointer',
              padding: '1px 5px',
              borderRadius: '3px',
              display: 'flex',
              alignItems: 'center',
              gap: '3px'
            }}
          >
            <ArrowRightLeft size={9} />
            <span>Switch</span>
          </button>
        </div>

        {/* Sync Status Capsule */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: '#252526',
          border: '1px solid #333333',
          borderRadius: '4px',
          padding: '2px 8px'
        }}>
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: isSyncing ? '#cca700' : '#89d185'
          }} />
          <span style={{ fontSize: '11px', color: '#cccccc' }}>
            {syncStatus.replace('✓ ', '')}
          </span>
          <span style={{
            fontSize: '10px',
            fontFamily: 'Consolas, monospace',
            color: '#858585'
          }}>
            v{workspaceVersion}
          </span>
        </div>
      </div>

      {/* 2. Middle Group: AI Agent Status & Mode Segmented Switch */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {/* Antigravity AI Status Capsule */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: '#252526',
          border: '1px solid #333333',
          borderRadius: '4px',
          padding: '2px 8px',
          fontSize: '11px'
        }}>
          <Bot size={13} color={aiBadge.color} />
          <span style={{ color: '#858585' }}>Antigravity:</span>
          <span style={{ color: aiBadge.color, fontWeight: 600 }}>{aiBadge.text}</span>
        </div>

        {/* Segmented Mode Selector (Image 2 style) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: '#202020',
          border: '1px solid #2b2b2b',
          borderRadius: '4px',
          padding: '2px',
          gap: '2px'
        }}>
          <button
            onClick={() => onSetPermissionMode('observe')}
            title="Observe: AI reads context without editing code"
            style={{
              padding: '2px 8px',
              fontSize: '11px',
              borderRadius: '3px',
              border: 'none',
              cursor: 'pointer',
              background: permissionMode === 'observe' ? '#0078d4' : 'transparent',
              color: permissionMode === 'observe' ? '#ffffff' : '#858585',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 500
            }}
          >
            <Eye size={11} />
            <span>Observe</span>
          </button>
          <button
            onClick={() => onSetPermissionMode('suggest')}
            title="Suggest: AI proposes patches for review"
            style={{
              padding: '2px 8px',
              fontSize: '11px',
              borderRadius: '3px',
              border: 'none',
              cursor: 'pointer',
              background: permissionMode === 'suggest' ? '#0078d4' : 'transparent',
              color: permissionMode === 'suggest' ? '#ffffff' : '#858585',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 500
            }}
          >
            <SlidersHorizontal size={11} />
            <span>Suggest</span>
          </button>
          <button
            onClick={() => onSetPermissionMode('execute')}
            title="Execute: AI edits files directly"
            style={{
              padding: '2px 8px',
              fontSize: '11px',
              borderRadius: '3px',
              border: 'none',
              cursor: 'pointer',
              background: permissionMode === 'execute' ? '#0078d4' : 'transparent',
              color: permissionMode === 'execute' ? '#ffffff' : '#858585',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontWeight: 500
            }}
          >
            <Zap size={11} />
            <span>Execute</span>
          </button>
        </div>
      </div>

      {/* 3. Right Group: Collaborators, Actions & Panel Toggles */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        {/* Collaborative Presence Avatars */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 4px' }} title={`${activeUsers.length} user(s) collaborating in room`}>
          {activeUsers.slice(0, 4).map((user, idx) => (
            <div
              key={user.id}
              style={{
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: user.color || '#0078d4',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: '10px',
                border: '1px solid #181818',
                marginLeft: idx === 0 ? '0' : '-6px',
                cursor: 'pointer',
                zIndex: 10 - idx
              }}
              title={user.id === currentUser.id ? `${user.name} (You)` : user.name}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
          ))}
        </div>

        {/* Simulate Peer Button */}
        <button
          onClick={onSimulatePeer}
          title="Simulate Peer Collaborator"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 8px',
            fontSize: '11px',
            background: '#252526',
            border: '1px solid #333333',
            color: '#cccccc',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#2a2d2e'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#252526'}
        >
          <Users size={12} />
          <span>+Peer</span>
        </button>

        {/* Demo Walkthrough Button */}
        <button
          onClick={onOpenDemo}
          title="10-Step Scenario Walkthrough"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '3px 8px',
            fontSize: '11px',
            background: '#252526',
            border: '1px solid #333333',
            color: '#cccccc',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#2a2d2e'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#252526'}
        >
          <Layers size={12} />
          <span>Demo</span>
        </button>

        <div className="glass-divider" />

        {/* Terminal Toggle */}
        <button
          onClick={onToggleTerminal}
          title="Toggle Terminal Panel (Ctrl+`)"
          style={{
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            background: terminalOpen ? '#2a2d2e' : 'transparent',
            border: '1px solid transparent',
            color: terminalOpen ? '#ffffff' : '#858585',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
          onMouseLeave={(e) => {
            if (!terminalOpen) e.currentTarget.style.color = '#858585';
          }}
        >
          <TerminalIcon size={14} />
        </button>

        {/* Right AI Panel Toggle */}
        <button
          onClick={onToggleRightPanel}
          title="Toggle Agent Panel"
          style={{
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            background: rightPanelOpen ? '#2a2d2e' : 'transparent',
            border: '1px solid transparent',
            color: rightPanelOpen ? '#ffffff' : '#858585',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
          onMouseLeave={(e) => {
            if (!rightPanelOpen) e.currentTarget.style.color = '#858585';
          }}
        >
          <Bot size={15} />
        </button>
      </div>

      {/* Switch Room Modal */}
      {showRoomModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            width: '340px',
            padding: '1.25rem',
            background: '#1e1e1e',
            border: '1px solid #333333',
            borderRadius: '6px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.6)'
          }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff', marginBottom: '8px' }}>
              Switch Workspace Room
            </h3>
            <p style={{ fontSize: '11px', color: '#969696', marginBottom: '12px' }}>
              Enter room code (e.g. DEV-AI-7824):
            </p>
            <form onSubmit={handleRoomSubmit}>
              <input
                type="text"
                placeholder="DEV-AI-7824"
                value={inputRoomId}
                onChange={(e) => setInputRoomId(e.target.value)}
                autoFocus
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  background: '#252526',
                  border: '1px solid #3c3c3c',
                  borderRadius: '4px',
                  color: '#ffffff',
                  fontSize: '12px',
                  outline: 'none',
                  marginBottom: '12px'
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setShowRoomModal(false)}
                  style={{
                    padding: '4px 10px',
                    fontSize: '11px',
                    background: 'transparent',
                    border: '1px solid #333333',
                    color: '#969696',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '4px 12px',
                    fontSize: '11px',
                    background: '#0078d4',
                    border: 'none',
                    color: '#ffffff',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 500
                  }}
                >
                  Join
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
