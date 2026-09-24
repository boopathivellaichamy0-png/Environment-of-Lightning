import { User, AIPatchItem } from './types.js';

export interface ConflictCheckResult {
  hasConflict: boolean;
  type?: 'version_stale' | 'line_overlap';
  conflictingUser?: string;
  message: string;
  canAutoRebase: boolean;
  requiresReanalysis: boolean;
}

export class ConflictDetector {
  /**
   * Validate whether an AI patch can be safely applied without clobbering newer human changes.
   */
  static validatePatch(params: {
    patch: AIPatchItem;
    currentWorkspaceVersion: number;
    currentFileVersion: number;
    activeUsers: User[];
  }): ConflictCheckResult {
    const { patch, currentWorkspaceVersion, currentFileVersion, activeUsers } = params;

    // 1. Check Version Stale
    if (patch.baseVersion < currentFileVersion) {
      return {
        hasConflict: true,
        type: 'version_stale',
        message: `AI context is stale (Base v${patch.baseVersion} vs Current v${currentFileVersion}). Workspace has evolved.`,
        canAutoRebase: false,
        requiresReanalysis: true
      };
    }

    // 2. Check Active User Line Overlap
    for (const user of activeUsers) {
      if (user.currentFile === patch.file && user.cursor) {
        const userLine = user.cursor.line;
        // If user is editing within 2 lines of the patch range
        const buffer = 2;
        if (userLine >= patch.startLine - buffer && userLine <= patch.endLine + buffer) {
          return {
            hasConflict: true,
            type: 'line_overlap',
            conflictingUser: user.name,
            message: `User ${user.name} is currently actively editing lines ${userLine} in ${patch.file} (overlaps with AI range ${patch.startLine}-${patch.endLine}).`,
            canAutoRebase: false,
            requiresReanalysis: true
          };
        }
      }
    }

    // No conflict detected
    return {
      hasConflict: false,
      message: 'Patch validated successfully. Compatible with latest workspace state.',
      canAutoRebase: true,
      requiresReanalysis: false
    };
  }

  /**
   * Check if multiple patches conflict with each other
   */
  static checkInternalPatchConflicts(patches: AIPatchItem[]): boolean {
    const fileRanges = new Map<string, Array<{ start: number; end: number }>>();
    for (const p of patches) {
      const ranges = fileRanges.get(p.file) || [];
      for (const r of ranges) {
        if (!(p.endLine < r.start || p.startLine > r.end)) {
          return true; // Overlap detected
        }
      }
      ranges.push({ start: p.startLine, end: p.endLine });
      fileRanges.set(p.file, ranges);
    }
    return false;
  }
}
