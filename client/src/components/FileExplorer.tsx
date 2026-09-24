import { useState } from 'react';
import type { FC } from 'react';
import {
  FileCode,
  FilePlus,
  Trash2,
  Edit2,
  Search,
  Code2,
  FileText,
  Palette,
  FolderOpen
} from 'lucide-react';
import type { ProjectFile, User } from '../types';

interface FileExplorerProps {
  files: Record<string, ProjectFile>;
  activeFile: string | null;
  onSelectFile: (filePath: string) => void;
  onCreateFile: (filePath: string) => void;
  onDeleteFile: (filePath: string) => void;
  onRenameFile: (oldPath: string, newPath: string) => void;
  activeUsers: User[];
  currentUser: User;
}

export const FileExplorer: FC<FileExplorerProps> = ({
  files,
  activeFile,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  onRenameFile,
  activeUsers,
  currentUser
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const fileList = Object.values(files).filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.jsx') || fileName.endsWith('.tsx')) {
      return <Code2 size={14} color="#00f0ff" />;
    }
    if (fileName.endsWith('.js') || fileName.endsWith('.ts')) {
      return <FileCode size={14} color="#fbbf24" />;
    }
    if (fileName.endsWith('.css')) {
      return <Palette size={14} color="#38bdf8" />;
    }
    if (fileName.endsWith('.html')) {
      return <Code2 size={14} color="#fb923c" />;
    }
    if (fileName.endsWith('.md')) {
      return <FileText size={14} color="#c084fc" />;
    }
    return <FileCode size={14} color="#94a3b8" />;
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFileName.trim()) {
      onCreateFile(newFileName.trim());
      setNewFileName('');
      setIsCreating(false);
    }
  };

  const handleRenameSubmit = (oldPath: string, e: React.FormEvent) => {
    e.preventDefault();
    if (renameValue.trim() && renameValue.trim() !== oldPath) {
      onRenameFile(oldPath, renameValue.trim());
    }
    setRenamingPath(null);
    setRenameValue('');
  };

  return (
    <aside className="glass-panel" style={{
      width: '250px',
      height: '100%',
      backgroundColor: 'var(--bg-surface)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      userSelect: 'none',
      flexShrink: 0
    }}>
      {/* Header & Controls */}
      <div style={{
        padding: '0.75rem 1rem',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(0, 0, 0, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <FolderOpen size={14} color="var(--lightning-cyan)" />
          <span style={{
            fontSize: '0.74rem',
            fontWeight: 700,
            letterSpacing: '0.06em',
            fontFamily: 'var(--font-display)',
            color: '#e2e8f0',
            textTransform: 'uppercase'
          }}>
            Files
          </span>
          <span style={{
            fontSize: '0.62rem',
            padding: '1px 5px',
            borderRadius: '9999px',
            background: 'rgba(255, 255, 255, 0.08)',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-mono)'
          }}>
            {Object.keys(files).length}
          </span>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="btn-icon"
          title="Create New File"
          style={{ width: '26px', height: '26px' }}
        >
          <FilePlus size={14} color="var(--lightning-cyan)" />
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ padding: '0.55rem 0.85rem', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          background: 'rgba(0, 0, 0, 0.35)',
          padding: '0.35rem 0.6rem',
          borderRadius: '7px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)'
        }}>
          <Search size={12} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#ffffff',
              fontSize: '0.74rem',
              width: '100%',
              fontFamily: 'var(--font-sans)'
            }}
          />
        </div>
      </div>

      {/* Inline File Creator */}
      {isCreating && (
        <form onSubmit={handleCreateSubmit} style={{ padding: '0.45rem 0.85rem' }}>
          <input
            type="text"
            placeholder="e.g. AuthController.js"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            autoFocus
            onBlur={() => !newFileName && setIsCreating(false)}
            style={{
              width: '100%',
              padding: '0.35rem 0.55rem',
              background: 'rgba(0, 240, 255, 0.08)',
              border: '1px solid var(--lightning-cyan)',
              borderRadius: '6px',
              color: '#ffffff',
              fontSize: '0.75rem',
              outline: 'none',
              fontFamily: 'var(--font-mono)',
              boxShadow: '0 0 10px rgba(0, 240, 255, 0.2)'
            }}
          />
        </form>
      )}

      {/* File List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0.45rem 0.4rem' }}>
        {fileList.map((file) => {
          const isActive = activeFile === file.path;

          // Find collaborators editing this file
          const peersOnFile = activeUsers.filter(u => u.currentFile === file.path && u.id !== currentUser.id);

          return (
            <div
              key={file.path}
              onClick={() => onSelectFile(file.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.4rem 0.65rem',
                margin: '2px 0',
                borderRadius: '6px',
                cursor: 'pointer',
                background: isActive ? 'rgba(0, 240, 255, 0.12)' : 'transparent',
                border: isActive ? '1px solid rgba(0, 240, 255, 0.25)' : '1px solid transparent',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                fontSize: '0.78rem',
                fontFamily: 'var(--font-mono)',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.borderColor = 'transparent';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, overflow: 'hidden' }}>
                {getFileIcon(file.name)}
                {renamingPath === file.path ? (
                  <form onSubmit={(e) => handleRenameSubmit(file.path, e)} style={{ flex: 1 }}>
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      autoFocus
                      onBlur={() => setRenamingPath(null)}
                      style={{
                        width: '100%',
                        padding: '1px 4px',
                        background: 'rgba(0,0,0,0.5)',
                        border: '1px solid var(--lightning-cyan)',
                        color: '#fff',
                        fontSize: '0.75rem',
                        borderRadius: '4px'
                      }}
                    />
                  </form>
                ) : (
                  <span style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? 'var(--lightning-cyan)' : 'inherit'
                  }}>
                    {file.name}
                  </span>
                )}
              </div>

              {/* Badges & Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {/* Peer Editing Indicator */}
                {peersOnFile.map(p => (
                  <div
                    key={p.id}
                    title={`${p.name} editing`}
                    style={{
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: p.color || '#ec4899',
                      boxShadow: `0 0 6px ${p.color || '#ec4899'}`
                    }}
                  />
                ))}

                {/* AI Modified Badge */}
                {file.isAiModified && (
                  <span
                    title="Modified by Antigravity CLI"
                    style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      background: 'rgba(168, 85, 247, 0.2)',
                      color: '#d8b4fe',
                      border: '1px solid rgba(168, 85, 247, 0.4)',
                      padding: '1px 4px',
                      borderRadius: '4px'
                    }}
                  >
                    AI
                  </span>
                )}

                {/* File Version */}
                <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                  v{file.version || 1}
                </span>

                {/* Action buttons on hover */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setRenamingPath(file.path);
                    setRenameValue(file.path);
                  }}
                  title="Rename File"
                  className="btn-icon"
                  style={{ width: '18px', height: '18px' }}
                >
                  <Edit2 size={10} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Delete ${file.name}?`)) {
                      onDeleteFile(file.path);
                    }
                  }}
                  title="Delete File"
                  className="btn-icon"
                  style={{ width: '18px', height: '18px' }}
                >
                  <Trash2 size={10} color="var(--accent-rose)" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div style={{
        padding: '0.65rem 1rem',
        borderTop: '1px solid var(--border-subtle)',
        fontSize: '0.68rem',
        color: 'var(--text-muted)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(0, 0, 0, 0.2)'
      }}>
        <span>{Object.keys(files).length} files</span>
        <span style={{ color: 'var(--accent-emerald)', display: 'flex', alignItems: 'center', gap: '3px' }}>
          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent-emerald)' }} />
          CRDT Active
        </span>
      </div>
    </aside>
  );
};
