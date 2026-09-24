import { useState, useRef, useEffect } from 'react';
import type { FC, FormEvent } from 'react';
import { Send, Sparkles } from 'lucide-react';
import type { ChatMessage, User } from '../types';

interface ChatPanelProps {
  chats: ChatMessage[];
  onSendMessage: (text: string) => void;
  currentUser: User;
}

export const ChatPanel: FC<ChatPanelProps> = ({
  chats,
  onSendMessage,
  currentUser
}) => {
  const [text, setText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSendMessage(text.trim());
      setText('');
    }
  };

  const quickPrompts = [
    'Connect the login page to the user database.',
    'Add input validation logic to UserModel.js',
    'AI, inspect the architecture for missing APIs.'
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      justifyContent: 'space-between',
      gap: '0.75rem'
    }}>
      {/* Messages Stream */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.65rem',
        paddingRight: '0.3rem'
      }}>
        {chats.length === 0 ? (
          <div style={{
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            textAlign: 'center',
            fontSize: '0.75rem',
            padding: '1rem'
          }}>
            <p>No messages yet.</p>
            <p style={{ fontSize: '0.7rem', marginTop: '4px' }}>Send a prompt to collaborate or trigger AI suggestions.</p>
          </div>
        ) : (
          chats.map((c) => {
            const isMe = c.userId === currentUser.id;
            return (
              <div
                key={c.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '88%'
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.65rem',
                  marginBottom: '3px',
                  color: 'var(--text-muted)',
                  alignSelf: isMe ? 'flex-end' : 'flex-start'
                }}>
                  <span style={{
                    color: c.userColor || 'var(--lightning-cyan)',
                    fontWeight: 600
                  }}>
                    {c.userName}
                  </span>
                  <span>{new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div style={{
                  padding: '0.55rem 0.85rem',
                  borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  fontSize: '0.78rem',
                  lineHeight: 1.45,
                  background: isMe
                    ? 'linear-gradient(135deg, rgba(0, 240, 255, 0.16) 0%, rgba(2, 132, 199, 0.22) 100%)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: isMe ? '1px solid rgba(0, 240, 255, 0.3)' : '1px solid var(--border-subtle)',
                  color: '#ffffff',
                  boxShadow: isMe ? '0 2px 12px rgba(0, 240, 255, 0.15)' : '0 2px 8px rgba(0,0,0,0.2)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)'
                }}>
                  {c.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Motto Context Chips */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Sparkles size={11} color="var(--lightning-cyan)" /> Suggested Prompts:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => onSendMessage(p)}
              style={{
                fontSize: '0.68rem',
                padding: '3px 8px',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                e.currentTarget.style.color = '#fff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              "{p.substring(0, 36)}..."
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        marginTop: '0.2rem'
      }}>
        <div style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(0, 0, 0, 0.35)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          padding: '0.45rem 0.75rem',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)'
        }}>
          <input
            type="text"
            placeholder="Type message to room..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#ffffff',
              fontSize: '0.78rem',
              fontFamily: 'var(--font-sans)'
            }}
          />
        </div>
        <button type="submit" className="btn-primary" style={{ padding: '0.45rem 0.8rem' }}>
          <Send size={13} />
        </button>
      </form>
    </div>
  );
};
