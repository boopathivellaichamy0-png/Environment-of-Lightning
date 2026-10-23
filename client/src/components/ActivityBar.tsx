import type { FC } from 'react';
import { Files, Search, Play, Terminal, Sparkles, Settings, Wifi, WifiOff } from 'lucide-react';

export type ActivityTab = 'explorer' | 'search' | 'preview' | 'terminal' | 'ai';

interface ActivityBarProps {
  activeTab: ActivityTab;
  onSelectTab: (tab: ActivityTab) => void;
  isConnected: boolean;
}

export const ActivityBar: FC<ActivityBarProps> = ({ activeTab, onSelectTab, isConnected }) => {
  const items = [
    { id: 'explorer' as ActivityTab, icon: Files, title: 'Explorer (Ctrl+Shift+E)' },
    { id: 'search' as ActivityTab, icon: Search, title: 'Search in Workspace (Ctrl+Shift+F)' },
    { id: 'preview' as ActivityTab, icon: Play, title: 'Live Browser Preview (Run Code)' },
    { id: 'terminal' as ActivityTab, icon: Terminal, title: 'PowerShell Terminal (Ctrl+`)' },
    { id: 'ai' as ActivityTab, icon: Sparkles, title: 'Antigravity AI Agent (Ctrl+L)' }
  ];

  return (
    <div
      style={{
        width: '48px',
        height: '100%',
        backgroundColor: '#181818',
        borderRight: '1px solid #2b2b2b',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '4px 0',
        userSelect: 'none',
        flexShrink: 0,
        zIndex: 10
      }}
    >
      {/* Top Icons */}
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'center' }}>
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              title={item.title}
              style={{
                width: '48px',
                height: '48px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                color: isActive ? '#ffffff' : '#858585',
                transition: 'color 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.color = '#cccccc';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.color = '#858585';
              }}
            >
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '8px',
                    bottom: '8px',
                    width: '2px',
                    backgroundColor: item.id === 'ai' ? '#38bdf8' : '#ffffff',
                    borderRadius: '0 2px 2px 0'
                  }}
                />
              )}
              <Icon size={20} strokeWidth={isActive ? 2 : 1.75} color={isActive && item.id === 'ai' ? '#38bdf8' : 'currentColor'} />
            </button>
          );
        })}
      </div>

      {/* Bottom Icons */}
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'center', gap: '4px' }}>
        <div
          title={isConnected ? 'Backend WebSocket Connected' : 'Connecting to Server...'}
          style={{
            width: '48px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {isConnected ? <Wifi size={16} color="#34d399" /> : <WifiOff size={16} color="#f43f5e" />}
        </div>
        <button
          style={{
            width: '48px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            color: '#858585',
            cursor: 'pointer'
          }}
          title="Settings"
        >
          <Settings size={18} />
        </button>
      </div>
    </div>
  );
};
