import { useState, useRef } from 'react';
import type { FC } from 'react';
import { Play, RotateCw, ExternalLink, Smartphone, Tablet, Monitor } from 'lucide-react';

interface LivePreviewPaneProps {
  fileContents: Record<string, string>;
  onClose?: () => void;
}

export const LivePreviewPane: FC<LivePreviewPaneProps> = ({ fileContents }) => {
  const [deviceWidth, setDeviceWidth] = useState<'100%' | '768px' | '375px'>('100%');
  const [reloadKey, setReloadKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const html = fileContents['index.html'] || '<!DOCTYPE html><html><body><h1>No index.html found</h1></body></html>';
  const css = fileContents['style.css'] || '';
  const js = fileContents['app.js'] || '';

  // Bundle into complete inline HTML
  const bundleSource = () => {
    let bundled = html;
    if (css) {
      bundled = bundled.replace('</head>', `<style>${css}</style></head>`);
    }
    if (js) {
      bundled = bundled.replace('</body>', `<script>${js}</script></body>`);
    }
    return bundled;
  };

  const handleOpenExternal = () => {
    const blob = new Blob([bundleSource()], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#141414',
        borderLeft: '1px solid #2b2b2b',
        overflow: 'hidden'
      }}
    >
      {/* Preview Header & Controls */}
      <div
        style={{
          height: '35px',
          padding: '0 12px',
          backgroundColor: '#181818',
          borderBottom: '1px solid #2b2b2b',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Play size={13} fill="#34d399" color="#34d399" />
          <span style={{ fontSize: '11px', fontWeight: 600, color: '#ffffff' }}>LIVE BROWSER PREVIEW</span>
        </div>

        {/* Device Switcher & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ display: 'flex', backgroundColor: '#202020', borderRadius: '4px', padding: '2px', gap: '2px' }}>
            <button
              onClick={() => setDeviceWidth('375px')}
              title="Mobile (375px)"
              style={{
                background: deviceWidth === '375px' ? '#2a2d2e' : 'transparent',
                border: 'none',
                color: deviceWidth === '375px' ? '#38bdf8' : '#858585',
                padding: '3px 6px',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              <Smartphone size={13} />
            </button>
            <button
              onClick={() => setDeviceWidth('768px')}
              title="Tablet (768px)"
              style={{
                background: deviceWidth === '768px' ? '#2a2d2e' : 'transparent',
                border: 'none',
                color: deviceWidth === '768px' ? '#38bdf8' : '#858585',
                padding: '3px 6px',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              <Tablet size={13} />
            </button>
            <button
              onClick={() => setDeviceWidth('100%')}
              title="Desktop (100%)"
              style={{
                background: deviceWidth === '100%' ? '#2a2d2e' : 'transparent',
                border: 'none',
                color: deviceWidth === '100%' ? '#38bdf8' : '#858585',
                padding: '3px 6px',
                borderRadius: '3px',
                cursor: 'pointer'
              }}
            >
              <Monitor size={13} />
            </button>
          </div>

          <button
            onClick={() => setReloadKey((k) => k + 1)}
            title="Reload Preview"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#858585',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '3px'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#858585')}
          >
            <RotateCw size={13} />
          </button>

          <button
            onClick={handleOpenExternal}
            title="Open in New Tab"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#858585',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '3px'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#858585')}
          >
            <ExternalLink size={13} />
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#0a0a0a',
          overflow: 'auto',
          padding: deviceWidth === '100%' ? '0' : '16px'
        }}
      >
        <div
          style={{
            width: deviceWidth,
            height: '100%',
            backgroundColor: '#ffffff',
            borderRadius: deviceWidth === '100%' ? '0' : '8px',
            overflow: 'hidden',
            boxShadow: deviceWidth === '100%' ? 'none' : '0 10px 30px rgba(0,0,0,0.8)',
            transition: 'width 0.2s ease'
          }}
        >
          <iframe
            key={reloadKey}
            ref={iframeRef}
            srcDoc={bundleSource()}
            title="Live Preview"
            style={{ width: '100%', height: '100%', border: 'none' }}
            sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
          />
        </div>
      </div>
    </div>
  );
};
