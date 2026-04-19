/**
 * Ensures only one cloud sync runs at a time (SQLite + outbound fetch).
 * Used by the internal hook (Electron timer) and manual "Sync now".
 */

let locked = false;

export function tryAcquireCloudSyncLock(): boolean {
  if (locked) return false;
  locked = true;
  return true;
}

export function releaseCloudSyncLock(): void {
  locked = false;
}
