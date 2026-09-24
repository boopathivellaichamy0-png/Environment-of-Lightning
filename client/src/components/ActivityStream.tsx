import type { FC } from 'react';
import {
  FilePlus,
  Trash2,
  Edit2,
  MessageSquare,
  Sparkles,
  UserCheck,
  AlertTriangle,
  Clock
} from 'lucide-react';
import type { ActivityEvent } from '../types';

interface ActivityStreamProps {
  activities: ActivityEvent[];
}

export const ActivityStream: FC<ActivityStreamProps> = ({ activities }) => {
  const getActionIcon = (action: ActivityEvent['action']) => {
    switch (action) {
      case 'file_create':
        return <FilePlus size={13} color="var(--accent-emerald)" />;
      case 'file_delete':
        return <Trash2 size={13} color="var(--accent-rose)" />;
      case 'file_rename':
        return <Edit2 size={13} color="var(--accent-amber)" />;
      case 'file_edit':
        return <Edit2 size={13} color="var(--lightning-cyan)" />;
      case 'chat_message':
        return <MessageSquare size={13} color="#38bdf8" />;
      case 'ai_task':
      case 'ai_patch':
        return <Sparkles size={13} color="var(--ai-purple)" />;
      case 'user_join':
        return <UserCheck size={13} color="#ec4899" />;
      case 'conflict_detected':
        return <AlertTriangle size={13} color="var(--accent-amber)" />;
      default:
        return <Clock size={13} color="var(--text-muted)" />;
    }
  };

  const getActionText = (act: ActivityEvent) => {
    switch (act.action) {
      case 'file_create':
        return `created ${act.file}`;
      case 'file_delete':
        return `deleted ${act.file}`;
      case 'file_rename':
        return `renamed ${act.metadata?.oldPath} to ${act.file}`;
      case 'file_edit':
        return `modified ${act.file}`;
      case 'chat_message':
        return `sent a chat message`;
      case 'ai_task':
        return `Antigravity initiated analysis`;
      case 'ai_patch':
        return `Antigravity generated patch`;
      case 'user_join':
        return `joined the collaborative room`;
      case 'conflict_detected':
        return `conflict detected and safely paused`;
      default:
        return act.action;
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '0.55rem',
      height: '100%',
      overflowY: 'auto'
    }}>
      {activities.length === 0 ? (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem' }}>
          No activities recorded yet.
        </div>
      ) : (
        activities.slice().reverse().map((act) => (
          <div
            key={act.id}
            className="glass-card"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.6rem',
              padding: '0.55rem 0.75rem',
              borderRadius: '8px',
              fontSize: '0.74rem',
              lineHeight: 1.4
            }}
          >
            <div style={{ marginTop: '2px', flexShrink: 0 }}>{getActionIcon(act.action)}</div>
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 600, color: '#ffffff' }}>{act.userName} </span>
              <span style={{ color: 'var(--text-secondary)' }}>{getActionText(act)}</span>
              <div style={{ fontSize: '0.64rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                {new Date(act.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
