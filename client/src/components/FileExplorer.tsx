import { useState } from 'react';
import type { FC, FormEvent } from 'react';
import {
  FileCode,
  FilePlus,
  FolderPlus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Code2,
  FileText,
  Palette
} from 'lucide-react';
import { ProjectFile } from '../types.ts';

interface FileExplorerProps {
  files: ProjectFile[];
  activeFile: string | null;
  onSelectFile: (filePath: string) => void;
  onCreateFile: (filePath: string) => void;
  onDeleteFile: (filePath: string) => void;
  onRenameFile: (oldPath: string, newPath: string) => void;
}

export const FileExplorer: FC<FileExplorerProps> = ({
  files,
  activeFile,
  onSelectFile,
  onCreateFile,
  onDeleteFile,
  onRenameFile
}) => {
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});

  const toggleFolder = (path: string) => {
    setOpenFolders((prev) => ({ ...prev, [path]: !prev[path] }));
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith('.jsx') || fileName.endsWith('.tsx')) return <Code2 size={14} color="#38bdf8" />;
    if (fileName.endsWith('.js') || fileName.endsWith('.ts')) return <FileCode size={14} color="#e5c07b" />;
    if (fileName.endsWith('.html')) return <Code2 size={14} color="#f43f5e" />;
    if (fileName.endsWith('.css')) return <Palette size={14} color="#38bdf8" />;
    if (fileName.endsWith('.json')) return <FileCode size={14} color="#34d399" />;
    return <FileText size={14} color="#94a3b8" />;
  };

  const handleCreateSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (newFileName.trim()) {
      onCreateFile(newFileName.trim());
      setNewFileName('');
      setIsCreatingFile(false);
    }
  };

  const handleRenameSubmit = (oldPath: string, e: FormEvent) => {
    e.preventDefault();
    if (renameValue.trim() && renameValue.trim() !== oldPath) {
      onRenameFile(oldPath, renameValue.trim());
    }
    setRenamingPath(null);
  };

  const renderFileTree = (items: ProjectFile[], depth: number = 0) => {
    return items.map((file) => {
      const isDir = file.type === 'directory';
      const isOpen = openFolders[file.path] ?? true;
      const isActive = activeFile === file.path;

      if (isDir) {
        return (
          <div key={file.path}>
            <div
              onClick={() => toggleFolder(file.path)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: `4px 8px 4px ${12 + depth * 12}px`,
                cursor: 'pointer',
                color: '#cccccc',
                fontSize: '13px'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#222222')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              {isOpen ? <ChevronDown size={14} color="#858585" /> : <ChevronRight size={14} color="#858585" />}
              {isOpen ? <FolderOpen size={14} color="#e5c07b" /> : <Folder size={14} color="#e5c07b" />}
              <span>{file.name}</span>
            </div>
            {isOpen && file.children && renderFileTree(file.children, depth + 1)}
          </div>
        );
      }

      return (
        <div
          key={file.path}
          onClick={() => onSelectFile(file.path)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: `4px 8px 4px ${16 + depth * 12}px`,
            cursor: 'pointer',
            backgroundColor: isActive ? '#2a2d2e' : 'transparent',
            color: isActive ? '#ffffff' : '#cccccc',
            fontSize: '13px',
            borderLeft: isActive ? '2px solid #0078d4' : '2px solid transparent'
          }}
          onMouseEnter={(e) => {
            if (!isActive) e.currentTarget.style.backgroundColor = '#222222';
          }}
          onMouseLeave={(e) => {
            if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
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
              <span
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setRenamingPath(file.path);
                  setRenameValue(file.name);
                }}
                style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {file.name}
              </span>
            )}
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDeleteFile(file.path);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#858585',
              cursor: 'pointer',
              padding: '2px',
              display: 'flex',
              alignItems: 'center',
              opacity: 0.6
            }}
            title="Delete File"
            onMouseEnter={(e) => (e.currentTarget.style.color = '#f43f5e')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#858585')}
          >
            <Trash2 size={12} />
          </button>
        </div>
      );
    });
  };

  return (
    <div
      style={{
        width: '240px',
        height: '100%',
        backgroundColor: '#181818',
        borderRight: '1px solid #2b2b2b',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        userSelect: 'none'
      }}
    >
      {/* Header */}
      <div
        style={{
          height: '35px',
          padding: '0 12px 0 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #2b2b2b'
        }}
      >
        <span style={{ fontSize: '11px', fontWeight: 600, color: '#bbbbbb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Explorer
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          <button
            onClick={() => setIsCreatingFile(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#858585',
              cursor: 'pointer',
              padding: '3px',
              borderRadius: '3px'
            }}
            title="New File..."
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#858585')}
          >
            <FilePlus size={14} />
          </button>
          <button
            onClick={() => setIsCreatingFile(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#858585',
              cursor: 'pointer',
              padding: '3px',
              borderRadius: '3px'
            }}
            title="New Folder..."
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#858585')}
          >
            <FolderPlus size={14} />
          </button>
        </div>
      </div>

      {/* New File Inline Form */}
      {isCreatingFile && (
        <form onSubmit={handleCreateSubmit} style={{ padding: '6px 12px' }}>
          <input
            type="text"
            placeholder="filename.ext"
            value={newFileName}
            onChange={(e) => setNewFileName(e.target.value)}
            autoFocus
            onBlur={() => {
              if (!newFileName.trim()) setIsCreatingFile(false);
            }}
            style={{
              width: '100%',
              padding: '4px 8px',
              backgroundColor: '#1f1f1f',
              border: '1px solid #0078d4',
              color: '#ffffff',
              fontSize: '12px',
              borderRadius: '3px',
              outline: 'none'
            }}
          />
        </form>
      )}

      {/* Tree Content */}
      <div style={{ flex: 1, overflowY: 'auto', paddingTop: '4px' }}>{renderFileTree(files)}</div>
    </div>
  );
};
