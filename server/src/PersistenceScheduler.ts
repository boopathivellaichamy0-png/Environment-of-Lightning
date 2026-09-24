import { YjsRoomManager } from './YjsRoomManager.js';
import { WorkspaceManager } from './WorkspaceManager.js';
import { Database } from './Database.js';

export class PersistenceScheduler {
  private interval: NodeJS.Timeout | null = null;
  private roomManagers: Map<string, YjsRoomManager>;
  private workspaceManager: WorkspaceManager;
  private db: Database;
  private isPersisting: boolean = false;

  constructor(
    roomManagers: Map<string, YjsRoomManager>,
    workspaceManager: WorkspaceManager,
    db: Database
  ) {
    this.roomManagers = roomManagers;
    this.workspaceManager = workspaceManager;
    this.db = db;
  }

  start(intervalMs: number = 1000): void {
    if (this.interval) return;
    this.interval = setInterval(() => {
      this.tick();
    }, intervalMs);
    console.log(`⚡ PersistenceScheduler started (every ${intervalMs}ms)`);
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  async tick(): Promise<void> {
    if (this.isPersisting) return;
    this.isPersisting = true;

    try {
      for (const [roomId, yjsRoom] of this.roomManagers.entries()) {
        const dirtyFiles = yjsRoom.getDirtyFiles();
        if (dirtyFiles.length === 0) continue;

        const room = this.db.getRoom(roomId);
        if (!room) continue;

        let filesSaved = 0;
        for (const filePath of dirtyFiles) {
          const content = yjsRoom.getFileText(filePath);
          // Persist to isolated disk workspace
          this.workspaceManager.saveFileToDisk(roomId, filePath, content);
          yjsRoom.clearDirtyFile(filePath);

          // Update file record in DB
          const curVer = yjsRoom.getFileVersion(filePath);
          room.files[filePath] = {
            id: filePath,
            name: filePath.split('/').pop() || filePath,
            path: filePath,
            type: 'file',
            content,
            version: curVer,
            lastModifiedAt: Date.now()
          };
          filesSaved++;
        }

        if (filesSaved > 0) {
          const newWorkspaceVersion = yjsRoom.getWorkspaceVersion();
          room.workspaceVersion = newWorkspaceVersion;
          this.db.saveRoom(room);

          this.db.recordVersion(roomId, {
            version: newWorkspaceVersion,
            timestamp: Date.now(),
            fileCount: Object.keys(room.files).length,
            lastAction: `Auto-saved ${filesSaved} file(s)`,
            actor: 'PersistenceScheduler'
          });

          // Broadcast sync status to all room users
          yjsRoom.broadcast({
            type: 'workspace:persisted',
            data: {
              roomId,
              workspaceVersion: newWorkspaceVersion,
              timestamp: Date.now(),
              filesSaved,
              statusText: '✓ Synced (1s CRDT auto-save)'
            }
          });
        }
      }
    } catch (err) {
      console.error('Error during persistence tick:', err);
    } finally {
      this.isPersisting = false;
    }
  }
}
