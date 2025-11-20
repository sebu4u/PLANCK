import { TLRecord } from '@tldraw/tldraw';

/**
 * Utility for detecting and classifying changes in tldraw store
 */

// Record types that are ephemeral (per-user, not shared)
const EPHEMERAL_TYPES = new Set([
  'instance',
  'instance_page_state',
  'instance_presence',
  'camera',
]);

// Record types that represent actual content
const CONTENT_TYPES = new Set([
  'shape',
  'asset',
  'binding',
  'page',
  'document',
]);

export interface ChangeDetectorState {
  lastContentRecords: Map<string, string>; // id -> JSON hash
  lastChangeTime: number;
  pendingContentChanges: boolean;
}

export class ChangeDetector {
  private state: ChangeDetectorState;
  private lastDrawingRecords: Set<string> = new Set(); // Track records being drawn
  private recentlyModifiedShapes: Map<string, number> = new Map(); // shape id -> last modified time
  private ignoreNextChanges: boolean = false; // Flag to ignore changes from remote updates

  constructor() {
    this.state = {
      lastContentRecords: new Map(),
      lastChangeTime: 0,
      pendingContentChanges: false,
    };
  }

  /**
   * Tell the detector to ignore the next batch of changes
   * (because they're from a remote update, not local user actions)
   */
  ignoreNextBatch(): void {
    this.ignoreNextChanges = true;
    console.log('[ChangeDetector] Will ignore next batch of changes (remote update)');
  }

  /**
   * Check if a record is ephemeral (per-user, not synced)
   */
  isEphemeral(record: any): boolean {
    return EPHEMERAL_TYPES.has(record?.typeName);
  }

  /**
   * Check if a record is content (should be synced)
   */
  isContent(record: any): boolean {
    return CONTENT_TYPES.has(record?.typeName);
  }

  /**
   * Filter out ephemeral records from a list
   */
  filterEphemeral(records: TLRecord[]): TLRecord[] {
    return records.filter(r => !this.isEphemeral(r));
  }

  /**
   * Detect if there are meaningful content changes
   * Returns true if there are new/modified/deleted content records
   */
  detectContentChanges(currentRecords: TLRecord[]): {
    hasChanges: boolean;
    added: TLRecord[];
    modified: TLRecord[];
    deleted: string[];
  } {
    const result = {
      hasChanges: false,
      added: [] as TLRecord[],
      modified: [] as TLRecord[],
      deleted: [] as string[],
    };

    // Build current content records map
    const currentContentMap = new Map<string, string>();
    const currentContentRecords = new Map<string, TLRecord>();

    for (const record of currentRecords) {
      if (this.isContent(record)) {
        const hash = this.hashRecord(record);
        currentContentMap.set(record.id, hash);
        currentContentRecords.set(record.id, record);
      }
    }

    // Detect added and modified records
    for (const [id, hash] of currentContentMap.entries()) {
      const lastHash = this.state.lastContentRecords.get(id);
      
      if (!lastHash) {
        // New record
        const record = currentContentRecords.get(id);
        if (record) {
          result.added.push(record);
          result.hasChanges = true;
        }
      } else if (lastHash !== hash) {
        // Modified record
        const record = currentContentRecords.get(id);
        if (record) {
          result.modified.push(record);
          result.hasChanges = true;
        }
      }
    }

    // Detect deleted records
    for (const [id] of this.state.lastContentRecords) {
      if (!currentContentMap.has(id)) {
        result.deleted.push(id);
        result.hasChanges = true;
      }
    }

    // Update state
    if (result.hasChanges) {
      this.state.lastContentRecords = currentContentMap;
      this.state.lastChangeTime = Date.now();
      this.state.pendingContentChanges = true;
    }

    return result;
  }

  /**
   * Create a hash of a record for comparison
   */
  private hashRecord(record: TLRecord): string {
    try {
      // Create a deterministic string representation
      return JSON.stringify(record);
    } catch {
      return record.id + ':' + (record as any).type;
    }
  }

  /**
   * Check if a shape was recently modified (within threshold)
   */
  private wasRecentlyModified(shapeId: string, thresholdMs: number = 200): boolean {
    const lastModified = this.recentlyModifiedShapes.get(shapeId);
    if (!lastModified) return false;
    
    return (Date.now() - lastModified) < thresholdMs;
  }

  /**
   * Track shape modification
   */
  private trackShapeModification(shapeId: string): void {
    this.recentlyModifiedShapes.set(shapeId, Date.now());
  }

  /**
   * Clean up old tracking data
   */
  private cleanupModificationTracking(): void {
    const now = Date.now();
    const threshold = 500; // Clean up entries older than 500ms
    
    for (const [id, timestamp] of this.recentlyModifiedShapes.entries()) {
      if (now - timestamp > threshold) {
        this.recentlyModifiedShapes.delete(id);
      }
    }
  }

  /**
   * Check if there are any shapes that were modified very recently
   * This indicates active drawing/editing
   */
  hasRecentlyModifiedShapes(records: TLRecord[], thresholdMs: number = 200): boolean {
    // If we're ignoring changes (remote update in progress), say no modifications
    // and DON'T track anything
    if (this.ignoreNextChanges) {
      return false; // Don't track remote changes as local modifications
    }

    const now = Date.now();
    this.cleanupModificationTracking();
    
    // Track current shapes and their state
    for (const record of records) {
      if (record.typeName === 'shape') {
        const currentHash = this.hashRecord(record);
        const lastHash = this.state.lastContentRecords.get(record.id);
        
        // If shape changed, track it
        if (lastHash !== currentHash) {
          this.trackShapeModification(record.id);
        }
      }
    }
    
    // Check if any shapes were modified within threshold
    for (const [shapeId, timestamp] of this.recentlyModifiedShapes.entries()) {
      if (now - timestamp < thresholdMs) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if enough time has passed since last content change
   * for stroke completion detection
   */
  hasStrokeCompleted(idleThresholdMs: number = 50): boolean {
    if (!this.state.pendingContentChanges) {
      return false;
    }

    const timeSinceLastChange = Date.now() - this.state.lastChangeTime;
    return timeSinceLastChange >= idleThresholdMs;
  }

  /**
   * Mark pending changes as processed
   */
  markChangesProcessed(): void {
    this.state.pendingContentChanges = false;
  }

  /**
   * Reset state (useful for page changes or after remote updates)
   */
  reset(): void {
    this.state.lastContentRecords.clear();
    this.state.lastChangeTime = 0;
    this.state.pendingContentChanges = false;
    this.lastDrawingRecords.clear();
    this.recentlyModifiedShapes.clear(); // CRITICAL: Clear ALL shape tracking
    this.ignoreNextChanges = false;
  }

  /**
   * Get current state snapshot
   */
  getState(): ChangeDetectorState {
    return { ...this.state };
  }
}

/**
 * Helper function to filter ephemeral records from a record map
 */
export function filterEphemeralFromStore(store: Record<string, TLRecord>): Record<string, TLRecord> {
  const filtered: Record<string, TLRecord> = {};
  
  for (const [id, record] of Object.entries(store)) {
    const typeName = (record as any)?.typeName;
    if (!EPHEMERAL_TYPES.has(typeName)) {
      filtered[id] = record;
    }
  }
  
  return filtered;
}

/**
 * Helper to check if a record is ephemeral
 */
export function isEphemeralRecord(record: any): boolean {
  return EPHEMERAL_TYPES.has(record?.typeName);
}

/**
 * Helper to check if a record is content
 */
export function isContentRecord(record: any): boolean {
  return CONTENT_TYPES.has(record?.typeName);
}

