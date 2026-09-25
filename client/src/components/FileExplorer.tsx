import { useState } from 'react';
import type { FC } from 'react';
import {
  FileCode,
  FilePlus,
  Trash2,
  Edit2,
  Code2,
  FileText,
  Palette,
  ChevronDown,
  ChevronRight,
  MoreHorizontal
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
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [eolOpen, setEolOpen] = useState(true);
  const [outlineOpen, setOutlineOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);

  const fileList = Object.values(files);

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.jsx') || fileName.endsWith('.tsx')) {
      return <Code2 size={15} color="#4fc1ff" />;
    }
    if (fileName.endsWith('.js') || fileName.endsWith('.ts')) {
      return <FileCode size={15} color="#e5c07b" />;
    }
    if (fileName.endsWith('.css')) {
      return <Palette size={15} color="#42a5f5" />;
    }
    if (fileName.endsWith('.html')) {
      return <Code2 size={15} color="#e06c75" />;
    }
    if (fileName.endsWith('.md')) {
      return <FileText size={15} color="#c678dd" />;
    }
    return <FileCode size={15} color="#969696" />;
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
    <aside style={{
      width: '240px',
      height: '100%',
      backgroundColor: '#181818',
      borderRight: '1px solid #2b2b2b',
      display: 'flex',
      flexDirection: 'column',
      userSelect: 'none',
      flexShrink: 0
    }}>
      {/* 1. Explorer Header Title */}
      <div style={{
        height: '35px',
        padding: '0 12px 0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: '#bbbbbb',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.05em',
        textTransform: 'uppercase'
      }}>
        <span>Explorer</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <button
            onClick={() => setIsCreating(true)}
            title="New File..."
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#969696',
              display: 'flex',
              alignItems: 'center',
              padding: '3px',
              borderRadius: '3px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#969696'}
          >
            <FilePlus size={14} />
          </button>
          <button
            title="More Actions..."
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#969696',
              display: 'flex',
              alignItems: 'center',
              padding: '3px',
              borderRadius: '3px'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#969696'}
          >
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>

      {/* 2. Accordion Section: > EOL */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div
          onClick={() => setEolOpen(!eolOpen)}
          style={{
            height: '22px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '0 8px',
            fontSize: '11px',
            fontWeight: 700,
            color: '#bbbbbb',
            cursor: 'pointer',
            backgroundColor: '#181818'
          }}
        >
          {eolOpen ? <ChevronDown size={14} color="#858585" /> : <ChevronRight size={14} color="#858585" />}
          <span>EOL</span>
        </div>

        {eolOpen && (
          <div style={{ padding: '2px 0' }}>
            {/* Inline File Creator */}
            {isCreating && (
              <form onSubmit={handleCreateSubmit} style={{ padding: '2px 8px 2px 24px' }}>
                <input
                  type="text"
                  placeholder="filename.jsx"
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  autoFocus
                  onBlur={() => !newFileName && setIsCreating(false)}
                  style={{
                    width: '100%',
                    padding: '2px 6px',
                    background: '#1f1f1f',
                    border: '1px solid #0078d4',
                    color: '#ffffff',
                    fontSize: '12px',
                    outline: 'none',
                    fontFamily: 'inherit'
                  }}
                />
              </form>
            )}

            {/* File List Items */}
            {fileList.map((file) => {
              const isActive = activeFile === file.path;
              const peersOnFile = activeUsers.filter(u => u.currentFile === file.path && u.id !== currentUser.id);

              return (
                <div
                  key={file.path}
                  onClick={() => onSelectFile(file.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '4px 8px 4px 22px',
                    cursor: 'pointer',
                    background: isActive ? '#2a2d2e' : 'transparent',
                    color: isActive ? '#ffffff' : '#cccccc',
                    fontSize: '13px',
                    lineHeight: '18px'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = '#222222';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', flex: 1 }}>
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
                            background: '#1f1f1f',
                            border: '1px solid #0078d4',
                            color: '#fff',
                            fontSize: '12px',
                            outline: 'none'
                          }}
                        />
                      </form>
                    ) : (
                      <span style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {file.name}
                      </span>
                    )}
                  </div>

                  {/* Actions & Presence Dots */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {peersOnFile.map(p => (
                      <div
                        key={p.id}
                        title={`${p.name} editing`}
                        style={{
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          backgroundColor: p.color || '#3794ff'
                        }}
                      />
                    ))}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setRenamingPath(file.path);
                        setRenameValue(file.path);
                      }}
                      title="Rename"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#6e7681',
                        cursor: 'pointer',
                        padding: '1px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#cccccc'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#6e7681'}
                    >
                      <Edit2 size={11} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete ${file.name}?`)) {
                          onDeleteFile(file.path);
                        }
                      }}
                      title="Delete"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#6e7681',
                        cursor: 'pointer',
                        padding: '1px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#f14c4c'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#6e7681'}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 3. Accordion Section: > Outline */}
        <div
          onClick={() => setOutlineOpen(!outlineOpen)}
          style={{
            height: '22px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '0 8px',
            fontSize: '11px',
            fontWeight: 700,
            color: '#bbbbbb',
            cursor: 'pointer',
            borderTop: '1px solid #222222',
            marginTop: '4px'
          }}
        >
          {outlineOpen ? <ChevronDown size={14} color="#858585" /> : <ChevronRight size={14} color="#858585" />}
          <span>Outline</span>
        </div>

        {/* 4. Accordion Section: > Timeline */}
        <div
          onClick={() => setTimelineOpen(!timelineOpen)}
          style={{
            height: '22px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '0 8px',
            fontSize: '11px',
            fontWeight: 700,
            color: '#bbbbbb',
            cursor: 'pointer',
            borderTop: '1px solid #222222'
          }}
        >
          {timelineOpen ? <ChevronDown size={14} color="#858585" /> : <ChevronRight size={14} color="#858585" />}
          <span>Timeline</span>
        </div>
      </div>
    </aside>
  );
};
