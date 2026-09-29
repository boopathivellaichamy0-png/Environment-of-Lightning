import { useState, useRef } from 'react';
import type { FC } from 'react';
import {
  Globe,
  RotateCw,
  ExternalLink,
  Maximize2,
  Minimize2,
  ArrowRight,
  Terminal
} from 'lucide-react';

interface AntigravityIframePanelProps {
  isFullView?: boolean;
  onToggleFullView?: () => void;
  onSwitchToCLI?: () => void;
  roomId?: string;
}

export const AntigravityIframePanel: FC<AntigravityIframePanelProps> = ({
  isFullView = false,
  onToggleFullView,
  onSwitchToCLI
}) => {
  const [url, setUrl] = useState<string>('https://antigravity.google');
  const [inputUrl, setInputUrl] = useState<string>('https://antigravity.google');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [iframeKey, setIframeKey] = useState<number>(1);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const presets = [
    { name: 'Google Antigravity', url: 'https://antigravity.google' },
    { name: 'Local Daemon (3000)', url: 'http://localhost:3000' },
    { name: 'Local IDE (8080)', url: 'http://localhost:8080' },
    { name: 'Local EOL Server (3001)', url: 'http://localhost:3001' }
  ];

  const handleNavigate = (targetUrl?: string) => {
    let finalUrl = targetUrl || inputUrl.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = `https://${finalUrl}`;
    }
    setUrl(finalUrl);
    setInputUrl(finalUrl);
    setIsLoading(true);
    setIframeKey(prev => prev + 1);
  };

  const handleReload = () => {
    setIsLoading(true);
    setIframeKey(prev => prev + 1);
  };

  const handleOpenExternal = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#181818',
      color: '#cccccc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      overflow: 'hidden'
    }}>
      {/* 1. Header with Controls */}
      <div style={{
        height: '35px',
        padding: '0 10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #2b2b2b',
        backgroundColor: '#181818',
        flexShrink: 0
      }}>
        {/* Left: Title & Mode Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Globe size={13} color="#0078d4" />
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#ffffff' }}>
              Antigravity Application
            </span>
          </div>

          <span style={{
            fontSize: '9px',
            padding: '1px 6px',
            borderRadius: '10px',
            backgroundColor: '#252526',
            border: '1px solid #333333',
            color: '#34d399',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#34d399' }} />
            Embedded Iframe
          </span>
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {onSwitchToCLI && (
            <button
              onClick={onSwitchToCLI}
              title="Switch to Native CLI Agent"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: '#252526',
                border: '1px solid #333333',
                color: '#cccccc',
                fontSize: '10px',
                padding: '2px 8px',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#cccccc'}
            >
              <Terminal size={11} color="#00f0ff" />
              <span>CLI Mode</span>
            </button>
          )}

          <button
            onClick={handleReload}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#858585',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '3px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Reload Iframe"
            onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#858585'}
          >
            <RotateCw size={13} className={isLoading ? 'spin' : ''} />
          </button>

          <button
            onClick={handleOpenExternal}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#858585',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '3px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Open in External Browser Window"
            onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#858585'}
          >
            <ExternalLink size={13} />
          </button>

          {onToggleFullView && (
            <button
              onClick={onToggleFullView}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#858585',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '3px',
                display: 'flex',
                alignItems: 'center'
              }}
              title={isFullView ? 'Split IDE View' : 'Maximize Iframe'}
              onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#858585'}
            >
              {isFullView ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
          )}
        </div>
      </div>

      {/* 2. Embedded Address Bar & Preset Chips */}
      <div style={{
        padding: '6px 10px',
        backgroundColor: '#1b1b1b',
        borderBottom: '1px solid #282828',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        flexShrink: 0
      }}>
        {/* URL Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleNavigate();
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#202020',
            border: '1px solid #333333',
            borderRadius: '4px',
            padding: '2px 8px',
            gap: '6px'
          }}>
            <Globe size={12} color="#858585" />
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="Enter Antigravity URL (e.g. http://localhost:3000)..."
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontSize: '11px',
                outline: 'none',
                fontFamily: 'monospace'
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              background: '#252526',
              border: '1px solid #333333',
              color: '#ffffff',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title="Navigate to URL"
          >
            <span>Go</span>
            <ArrowRight size={11} />
          </button>
        </form>

        {/* Quick Presets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflowX: 'auto', paddingBottom: '2px' }}>
          <span style={{ fontSize: '10px', color: '#6e7681', whiteSpace: 'nowrap' }}>Presets:</span>
          {presets.map(p => (
            <button
              key={p.url}
              onClick={() => handleNavigate(p.url)}
              style={{
                background: url === p.url ? '#2c313a' : '#202020',
                border: url === p.url ? '1px solid #0078d4' : '1px solid #2b2b2b',
                color: url === p.url ? '#ffffff' : '#858585',
                fontSize: '10px',
                padding: '1px 6px',
                borderRadius: '3px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.12s ease'
              }}
              onMouseEnter={(e) => {
                if (url !== p.url) e.currentTarget.style.color = '#cccccc';
              }}
              onMouseLeave={(e) => {
                if (url !== p.url) e.currentTarget.style.color = '#858585';
              }}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Iframe Container */}
      <div style={{
        flex: 1,
        position: 'relative',
        backgroundColor: '#141414',
        overflow: 'hidden'
      }}>
        {isLoading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            backgroundColor: '#0078d4',
            animation: 'pulse 1s infinite'
          }} />
        )}

        <iframe
          key={iframeKey}
          ref={iframeRef}
          src={url}
          title="Antigravity Application"
          onLoad={() => setIsLoading(false)}
          onError={() => setIsLoading(false)}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            backgroundColor: '#ffffff'
          }}
          allow="camera; microphone; clipboard-read; clipboard-write; display-capture; fullscreen"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-downloads"
        />

        {/* Informative notice overlay if site blocks cross-origin iframe (X-Frame-Options) */}
        <div style={{
          position: 'absolute',
          bottom: '8px',
          left: '8px',
          right: '8px',
          padding: '6px 10px',
          backgroundColor: 'rgba(24, 24, 24, 0.92)',
          backdropFilter: 'blur(8px)',
          border: '1px solid #333333',
          borderRadius: '6px',
          fontSize: '11px',
          color: '#858585',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#cca700' }}>💡</span>
            <span>
              If this site restricts iframe embedding (X-Frame-Options), use a local URL or open externally.
            </span>
          </div>
          <button
            onClick={handleOpenExternal}
            style={{
              background: '#252526',
              border: '1px solid #333333',
              color: '#ffffff',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              whiteSpace: 'nowrap'
            }}
          >
            <span>Open in Tab</span>
            <ExternalLink size={10} />
          </button>
        </div>
      </div>
    </div>
  );
};
