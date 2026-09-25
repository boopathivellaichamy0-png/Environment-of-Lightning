import type { FC } from 'react';
import {
  Files,
  Search,
  GitBranch,
  Play,
  Grid,
  Settings,
  UserCheck
} from 'lucide-react';

interface ActivityBarProps {
  activeTab: 'explorer' | 'search' | 'git' | 'debug' | 'extensions';
  onSelectTab: (tab: 'explorer' | 'search' | 'git' | 'debug' | 'extensions') => void;
  currentUser?: { name: string; color: string };
}

export const ActivityBar: FC<ActivityBarProps> = ({
  activeTab = 'explorer',
  onSelectTab,
  currentUser
}) => {
  const topItems = [
    { id: 'explorer', icon: Files, title: 'Explorer (Ctrl+Shift+E)' },
    { id: 'search', icon: Search, title: 'Search (Ctrl+Shift+F)' },
    { id: 'git', icon: GitBranch, title: 'Source Control (Ctrl+Shift+G)' },
    { id: 'debug', icon: Play, title: 'Run and Debug (Ctrl+Shift+D)' },
    { id: 'extensions', icon: Grid, title: 'Extensions (Ctrl+Shift+X)' },
  ] as const;

  return (
    <div style={{
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
    }}>
      {/* Top Section Icons */}
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'center' }}>
        {topItems.map((item) => {
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
                color: isActive ? '#ffffff' : '#858585',
                position: 'relative',
                transition: 'color 0.12s ease'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.color = '#cccccc';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.color = '#858585';
              }}
            >
              {/* Active White Left Border Indicator (VS Code signature) */}
              {isActive && (
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '2px',
                  backgroundColor: '#ffffff'
                }} />
              )}
              <Icon size={20} strokeWidth={1.5} />
            </button>
          );
        })}
      </div>

      {/* Bottom Section Icons */}
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', alignItems: 'center' }}>
        <button
          title={`Signed in as ${currentUser?.name || 'Developer'}`}
          style={{
            width: '48px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#858585'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#cccccc'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#858585'}
        >
          <UserCheck size={19} strokeWidth={1.5} />
        </button>

        <button
          title="Manage & Settings"
          style={{
            width: '48px',
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#858585'
          }}
          onMouseEnter={(e) => e.currentTarget.style.color = '#cccccc'}
          onMouseLeave={(e) => e.currentTarget.style.color = '#858585'}
        >
          <Settings size={19} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
};
