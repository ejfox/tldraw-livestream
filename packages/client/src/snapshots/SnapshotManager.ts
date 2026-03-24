import type { Editor } from 'tldraw';
import type { SnapshotMeta } from '../types';

/**
 * Client-side snapshot manager.
 *
 * Captures and restores tldraw editor snapshots for rollback functionality.
 * The server maintains authoritative snapshots; this is for client-side
 * quick saves and local undo-by-user tracking.
 */
export class SnapshotManager {
  private snapshots: Map<string, { meta: SnapshotMeta; data: unknown }> = new Map();
  private maxSnapshots: number;

  constructor(maxSnapshots = 20) {
    this.maxSnapshots = maxSnapshots;
  }

  /** Capture current editor state */
  capture(editor: Editor, triggeredBy: string): SnapshotMeta {
    const data = editor.getSnapshot();
    const allShapes = editor.getCurrentPageShapes();

    const meta: SnapshotMeta = {
      id: `snap-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      userCount: 0, // server fills this in
      shapeCount: allShapes.length,
      triggeredBy,
    };

    this.snapshots.set(meta.id, { meta, data });

    // Evict oldest if over limit
    if (this.snapshots.size > this.maxSnapshots) {
      const oldest = this.snapshots.keys().next().value;
      if (oldest) this.snapshots.delete(oldest);
    }

    return meta;
  }

  /** Restore editor to a snapshot */
  restore(editor: Editor, snapshotId: string): boolean {
    const snap = this.snapshots.get(snapshotId);
    if (!snap) return false;

    editor.loadSnapshot(snap.data as Parameters<Editor['loadSnapshot']>[0]);
    return true;
  }

  /** List available snapshots */
  list(): SnapshotMeta[] {
    return Array.from(this.snapshots.values()).map((s) => s.meta);
  }

  /** Clear all snapshots */
  clear(): void {
    this.snapshots.clear();
  }
}
