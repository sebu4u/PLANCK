import { TLStore, TLRecord, StoreSnapshot } from '@tldraw/tldraw';
import { supabase } from '@/lib/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';
import { isEphemeralRecord } from './change-detector';

export interface RealtimeSyncOptions {
  boardId: string;
  store: TLStore;
  onError?: (error: Error) => void;
  onApplyingRemoteUpdate?: (isApplying: boolean) => void;
}

/**
 * Delta update payload for incremental synchronization
 */
export interface DeltaUpdate {
  type: 'delta';
  pageId: string;
  boardId: string;
  timestamp: string;
  added: Record<string, TLRecord>;
  modified: Record<string, TLRecord>;
  deleted: string[];
}

/**
 * Full snapshot update payload (fallback)
 */
export interface FullUpdate {
  type: 'full';
  pageId: string;
  boardId: string;
  timestamp: string;
  snapshot: StoreSnapshot<TLRecord>;
}

export type BroadcastUpdate = DeltaUpdate | FullUpdate;

/**
 * Manages real-time synchronization of board pages using Supabase Realtime
 */
export class RealtimeSync {
  private boardId: string;
  private store: TLStore;
  private onError?: (error: Error) => void;
  private onApplyingRemoteUpdate?: (isApplying: boolean) => void;
  private channel: RealtimeChannel | null = null;
  private currentPageId: string | null = null;
  private isApplyingRemoteUpdate = false;
  private lastAppliedSnapshotHash: string | null = null;
  private pollingInterval: NodeJS.Timeout | null = null;
  private lastPolledAt: Map<string, string> = new Map();
  private isRealtimeHealthy = false;
  private hasReceivedBroadcast: boolean = false;
  private lastBroadcastState: Map<string, string> = new Map(); // id -> JSON for delta computation

  constructor(options: RealtimeSyncOptions) {
    this.boardId = options.boardId;
    this.store = options.store;
    this.onError = options.onError;
    this.onApplyingRemoteUpdate = options.onApplyingRemoteUpdate;
  }

  /**
   * Subscribe to real-time updates for a specific page using Broadcast Channels
   * This doesn't require database replication
   */
  async subscribeToPage(pageId: string): Promise<void> {
    this.currentPageId = pageId;
    this.hasReceivedBroadcast = false;
    this.isRealtimeHealthy = false;

    // Ensure we are listening for broadcasts
    await this.ensureChannelSubscribed();
    // Start polling as a safety net until we confirm realtime traffic
    this.startPolling();
  }

  /**
   * Unsubscribe from real-time updates for a page
   */
  async unsubscribeFromPage(pageId: string): Promise<void> {
    if (this.currentPageId === pageId) {
      this.currentPageId = null;
    }
  }

  /**
   * Start polling for updates as fallback when Realtime is not available
   */
  private startPolling(): void {
    if (this.pollingInterval) {
      return; // Already polling
    }

    console.log(`[RealtimeSync] Starting polling fallback (Realtime not confirmed)`);
    this.isRealtimeHealthy = false;
    
    this.pollingInterval = setInterval(async () => {
      if (this.isRealtimeHealthy && this.hasReceivedBroadcast) {
        // Realtime confirmed healthy, stop polling
        this.stopPolling();
        return;
      }

      try {
        await this.pollForUpdates();
      } catch (error) {
        console.error('[RealtimeSync] Polling error:', error);
      }
    }, 1000); // Poll every second
  }

  /**
   * Stop polling
   */
  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log(`[RealtimeSync] Stopped polling (Realtime confirmed healthy)`);
    }
  }

  /**
   * Poll for updates from database
   */
  private async pollForUpdates(): Promise<void> {
    if (!this.currentPageId) {
      return;
    }

    try {
      // Get latest update timestamp for current page
      const { data, error } = await supabase
        .from('sketch_board_pages')
        .select('page_id, snapshot, updated_at')
        .eq('board_id', this.boardId)
        .order('updated_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('[RealtimeSync] Polling query error:', error);
        return;
      }

      if (!data || data.length === 0) {
        return;
      }

      // Process each page update
      for (const pageData of data) {
        const pageId = pageData.page_id;
        const lastUpdated = this.lastPolledAt.get(pageId);
        
        // Only process if this is a new update
        if (!lastUpdated || pageData.updated_at > lastUpdated) {
          if (pageData.snapshot) {
            console.log(`[RealtimeSync] Polling found update for page ${pageId}`);
            this.handleRemoteUpdate(pageId, pageData.snapshot as StoreSnapshot<TLRecord>);
            this.lastPolledAt.set(pageId, pageData.updated_at);
          }
        }
      }
    } catch (error) {
      console.error('[RealtimeSync] Polling error:', error);
    }
  }

  /**
   * Ensure we have an active broadcast channel for this board
   */
  private async ensureChannelSubscribed(): Promise<void> {
    if (this.channel && (this.channel.state === 'joined' || this.channel.state === 'joining')) {
      return;
    }

    if (this.channel && this.channel.state !== 'closed') {
      try {
        await supabase.removeChannel(this.channel);
      } catch (removeError) {
        console.warn('[RealtimeSync] Failed to remove existing channel before re-subscribing:', removeError);
      }
      this.channel = null;
    }

    const channelName = `board-${this.boardId}`;
    console.log(`[RealtimeSync] Ensuring subscription to broadcast channel ${channelName}`);

    const channel = supabase.channel(channelName, {
      config: {
        broadcast: {
          self: true,
          ack: false,
        },
      },
    });

    channel.on('broadcast', { event: 'snapshot-update' }, (payload) => {
      console.log(`[RealtimeSync] Received broadcast update:`, payload);

      const broadcastData = payload.payload || payload;

      console.log(`[RealtimeSync] Broadcast data:`, {
        type: broadcastData?.type,
        pageId: broadcastData?.pageId,
        hasSnapshot: !!broadcastData?.snapshot,
        hasAdded: !!broadcastData?.added,
        hasModified: !!broadcastData?.modified,
        hasDeleted: !!broadcastData?.deleted,
        timestamp: broadcastData?.timestamp,
        boardId: broadcastData?.boardId,
      });

      if (!broadcastData?.pageId || broadcastData.boardId !== this.boardId) {
        console.warn(`[RealtimeSync] Ignoring broadcast - wrong board or missing pageId`);
        return;
      }

      this.hasReceivedBroadcast = true;
      this.isRealtimeHealthy = true;
      this.stopPolling();

      // Handle both delta and full updates
      if (broadcastData.type === 'delta') {
        console.log(`[RealtimeSync] Processing delta update for page ${broadcastData.pageId}`);
        this.handleDeltaUpdate(broadcastData as DeltaUpdate);
      } else if (broadcastData.snapshot) {
        console.log(`[RealtimeSync] Processing full snapshot update for page ${broadcastData.pageId}`);
        this.handleRemoteUpdate(broadcastData.pageId, broadcastData.snapshot);
      } else {
        console.warn(`[RealtimeSync] Invalid broadcast payload:`, broadcastData);
      }
    });

    try {
      await channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[RealtimeSync] Successfully subscribed to broadcast channel: ${channelName}`);
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`[RealtimeSync] Broadcast channel error: ${status}`);
          this.isRealtimeHealthy = false;
          this.hasReceivedBroadcast = false;
          this.startPolling();
          if (this.onError) {
            this.onError(new Error(`Broadcast channel error: ${status}`));
          }
        } else if (status === 'TIMED_OUT') {
          console.warn(`[RealtimeSync] Broadcast subscription timed out - falling back to polling`);
          this.isRealtimeHealthy = false;
          this.hasReceivedBroadcast = false;
          this.startPolling();
        } else if (status === 'CLOSED') {
          console.warn(`[RealtimeSync] Broadcast subscription closed - falling back to polling`);
          this.isRealtimeHealthy = false;
          this.hasReceivedBroadcast = false;
          this.startPolling();
        } else {
          console.log(`[RealtimeSync] Broadcast subscription status: ${status}`);
        }
      });
      this.channel = channel;
    } catch (subscribeError) {
      console.error('[RealtimeSync] Failed to subscribe to broadcast channel:', subscribeError);
      this.channel = null;
      this.isRealtimeHealthy = false;
      this.hasReceivedBroadcast = false;
      this.startPolling();
      if (this.onError) {
        const err =
          subscribeError instanceof Error ? subscribeError : new Error(String(subscribeError));
        this.onError(err);
      }
    }
  }

  /**
   * Handle delta update from another user
   */
  private handleDeltaUpdate(update: DeltaUpdate): void {
    if (this.isApplyingRemoteUpdate) {
      console.log(`[RealtimeSync] Skipping delta - already applying update`);
      return; // Prevent loops
    }

    try {
      const { pageId, added, modified, deleted } = update;

      console.log(`[RealtimeSync] ⬇ Receiving delta from remote:`, {
        addedCount: Object.keys(added).length,
        modifiedCount: Object.keys(modified).length,
        deletedCount: deleted.length,
      });

      // Set flag BEFORE notifying persistence
      this.isApplyingRemoteUpdate = true;

      // Notify persistence to pause broadcasts
      if (this.onApplyingRemoteUpdate) {
        this.onApplyingRemoteUpdate(true);
      }

      // Small delay to ensure persistence flag is set
      setTimeout(() => {
        try {
          // Prepare records to update
          const recordsToUpdate: TLRecord[] = [];

          // Process added records
          for (const record of Object.values(added)) {
            if (!isEphemeralRecord(record)) {
              recordsToUpdate.push(record);
            }
          }

          // Process modified records
          for (const record of Object.values(modified)) {
            if (!isEphemeralRecord(record)) {
              recordsToUpdate.push(record);
            }
          }

          // Apply changes in a transaction
          this.store.mergeRemoteChanges(() => {
            if (recordsToUpdate.length > 0) {
              this.store.put(recordsToUpdate);
            }

            if (deleted.length > 0) {
              this.store.remove(deleted);
            }
          });

          console.log(`[RealtimeSync] ✓ Applied remote delta successfully`);
        } catch (error: any) {
          const err = error instanceof Error ? error : new Error(String(error));
          if (this.onError) {
            this.onError(err);
          }
          console.error('[RealtimeSync] Error applying delta update:', err);
        } finally {
          // Wait a bit before resuming broadcasts to avoid immediate re-broadcast
          setTimeout(() => {
            this.isApplyingRemoteUpdate = false;

            if (this.onApplyingRemoteUpdate) {
              this.onApplyingRemoteUpdate(false);
            }
          }, 100); // 100ms cooldown after applying remote changes
        }
      }, 10); // 10ms to ensure flag propagation
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (this.onError) {
        this.onError(err);
      }
      console.error('[RealtimeSync] Error in handleDeltaUpdate:', err);
      
      // Ensure we reset the flag even on error
      this.isApplyingRemoteUpdate = false;
      if (this.onApplyingRemoteUpdate) {
        this.onApplyingRemoteUpdate(false);
      }
    }
  }

  /**
   * Handle remote update from another user
   */
  private handleRemoteUpdate(pageId: string, remoteSnapshot: StoreSnapshot<TLRecord>): void {
    if (this.isApplyingRemoteUpdate) {
      return; // Prevent loops
    }

    try {
      // Check if remote snapshot is valid
      if (!remoteSnapshot.store || typeof remoteSnapshot.store !== 'object') {
        console.warn('[RealtimeSync] Invalid remote snapshot structure');
        return;
      }

      // Create a hash based on record IDs and their content to detect changes
      // This is more efficient than comparing entire snapshots
      const recordHashes = Object.entries(remoteSnapshot.store)
        .map(([id, record]) => `${id}:${JSON.stringify(record)}`)
        .sort()
        .join('|');
      const remoteHash = recordHashes;
      
      if (this.lastAppliedSnapshotHash === remoteHash) {
        console.log('[RealtimeSync] Skipping duplicate update (same content)');
        return; // Already applied this snapshot
      }

      this.isApplyingRemoteUpdate = true;
      
      // Notify that we're applying a remote update (to prevent save loops)
      if (this.onApplyingRemoteUpdate) {
        this.onApplyingRemoteUpdate(true);
      }

      // Build map of current records for comparison using store.allRecords()
      const currentRecords = new Map<string, TLRecord>();
      try {
        const all = this.store.allRecords();
        all.forEach((record: TLRecord) => {
          if (record && (record as any).id) {
            currentRecords.set((record as any).id, record);
          }
        });
      } catch (e) {
        console.warn('[RealtimeSync] Failed to read current records from store:', e);
      }
      
      // Only sync the page referenced by this update; avoid affecting other pages
      // Also skip ephemeral (per-user) records
      const recordsToUpdate: TLRecord[] = [];
      const isEphemeral = (rec: any) => {
        const t = rec?.typeName;
        return t === 'instance' || t === 'instance_page_state' || t === 'instance_presence' || t === 'camera';
      };
      
      // Process all records from remote snapshot
      Object.values(remoteSnapshot.store).forEach((record: any) => {
        if (!record || typeof record !== 'object' || !record.id) {
          return;
        }

        if (isEphemeral(record)) return;

        // Always consider the 'document' record to propagate new pages list, etc.
        if (record.typeName === 'document') {
          const currentDoc = currentRecords.get(record.id);
          let docChanged = false;
          if (!currentDoc) {
            docChanged = true;
          } else {
            try {
              docChanged = JSON.stringify(currentDoc) !== JSON.stringify(record);
            } catch {
              docChanged = true;
            }
          }
          if (docChanged) {
            recordsToUpdate.push(record as TLRecord);
          }
          return; // continue to next record
        }

        // Belongs to page?
        const belongsToPage =
          (record.typeName === 'page' && record.id === pageId) ||
          record.parentId === pageId ||
          record.pageId === pageId;
        if (!belongsToPage) return;

        // Check if this record is different from current or doesn't exist
        const currentRecord = currentRecords.get(record.id);
        let recordChanged = false;
        
        if (!currentRecord) {
          // New record
          recordChanged = true;
        } else {
          // Compare records - use deep comparison
          try {
            const currentStr = JSON.stringify(currentRecord);
            const remoteStr = JSON.stringify(record);
            recordChanged = currentStr !== remoteStr;
          } catch (e) {
            // If comparison fails, assume changed
            console.warn(`[RealtimeSync] Failed to compare record ${record.id}, assuming changed`);
            recordChanged = true;
          }
        }
        
        if (recordChanged) {
          recordsToUpdate.push(record as TLRecord);
        }
      });

      // Deletions: local records that belong to this page but are not present in remote snapshot
      const remoteIdsForPage = new Set<string>();
      Object.values(remoteSnapshot.store).forEach((record: any) => {
        if (!record || typeof record !== 'object' || !record.id) return;
        if (isEphemeral(record)) return;
        const belongsToPage =
          (record.typeName === 'page' && record.id === pageId) ||
          record.parentId === pageId ||
          record.pageId === pageId;
        if (belongsToPage) remoteIdsForPage.add(record.id);
      });

      const localIdsForPage = new Set<string>();
      currentRecords.forEach((rec, id) => {
        if (isEphemeral(rec)) return;
        const belongsToPage =
          (rec as any).typeName === 'page' && id === pageId ||
          (rec as any).parentId === pageId ||
          (rec as any).pageId === pageId;
        if (belongsToPage) localIdsForPage.add(id);
      });

      const idsToDelete: string[] = [];
      localIdsForPage.forEach((id) => {
        if (!remoteIdsForPage.has(id)) {
          // Don't delete the page record itself here
          const rec = currentRecords.get(id) as any;
          if (rec && rec.typeName !== 'page') {
            idsToDelete.push(id);
          }
        }
      });

      // Apply all changed records
      // Tldraw's store.put() will handle merging correctly using CRDT semantics
      if (recordsToUpdate.length > 0 || idsToDelete.length > 0) {
        console.log(
          `[RealtimeSync] Applying remote changes for page ${pageId}`,
          {
            toUpdate: recordsToUpdate.length,
            toDelete: idsToDelete.length,
          }
        );
      }

      this.store.mergeRemoteChanges(() => {
        if (recordsToUpdate.length > 0) {
          console.log(
            `[RealtimeSync] Applying ${recordsToUpdate.length} remote records (from page ${pageId} update)`
          );
          console.log(
            `[RealtimeSync] Record types:`,
            [...new Set(recordsToUpdate.map(r => (r as any).typeName))]
          );
          console.log(
            `[RealtimeSync] Record IDs (first 10):`,
            recordsToUpdate.slice(0, 10).map(r => r.id)
          );
          try {
            this.store.put(recordsToUpdate);
          } catch (putError) {
            console.error(`[RealtimeSync] Error calling store.put():`, putError);
            throw putError;
          }
        } else {
          console.log(`[RealtimeSync] No records to update (all up to date)`);
        }

        if (idsToDelete.length > 0) {
          try {
            console.log(
              `[RealtimeSync] Removing ${idsToDelete.length} records deleted on remote for page ${pageId}`
            );
            this.store.remove(idsToDelete);
          } catch (removeError) {
            console.error('[RealtimeSync] Error removing records:', removeError);
          }
        }
      });

      const afterUpdate = this.store.allRecords();
      console.log(`[RealtimeSync] Store now has ${afterUpdate.length} records after update`);
      this.lastAppliedSnapshotHash = remoteHash;
      console.log(`[RealtimeSync] Successfully applied remote update`);
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (this.onError) {
        this.onError(err);
      }
      console.error('[RealtimeSync] Error applying remote update:', err);
    } finally {
      this.isApplyingRemoteUpdate = false;
      
      // Notify that we're done applying remote update
      if (this.onApplyingRemoteUpdate) {
        this.onApplyingRemoteUpdate(false);
      }
    }
  }

  /**
   * Check if currently applying a remote update
   */
  isApplyingUpdate(): boolean {
    return this.isApplyingRemoteUpdate;
  }

  /**
   * Get current page ID
   */
  getCurrentPage(): string | null {
    return this.currentPageId;
  }

  /**
   * Compute delta between last broadcast state and current records
   */
  computeDelta(currentRecords: TLRecord[], pageId: string): DeltaUpdate | null {
    const added: Record<string, TLRecord> = {};
    const modified: Record<string, TLRecord> = {};
    const deleted: string[] = [];

    // Build current state map (content records only, for this page)
    const currentMap = new Map<string, string>();
    const currentRecordMap = new Map<string, TLRecord>();

    for (const record of currentRecords) {
      if (isEphemeralRecord(record)) continue;

      // Only include records for current page or global records
      const belongsToPage =
        (record as any).typeName === 'page' && record.id === pageId ||
        (record as any).parentId === pageId ||
        (record as any).pageId === pageId ||
        (record as any).typeName === 'document';

      if (belongsToPage) {
        const recordJson = JSON.stringify(record);
        currentMap.set(record.id, recordJson);
        currentRecordMap.set(record.id, record);
      }
    }

    // Detect added and modified
    for (const [id, json] of currentMap.entries()) {
      const lastJson = this.lastBroadcastState.get(id);
      const record = currentRecordMap.get(id);

      if (!record) continue;

      if (!lastJson) {
        // New record
        added[id] = record;
      } else if (lastJson !== json) {
        // Modified record
        modified[id] = record;
      }
    }

    // Detect deleted
    for (const [id] of this.lastBroadcastState) {
      if (!currentMap.has(id)) {
        deleted.push(id);
      }
    }

    // Update broadcast state
    this.lastBroadcastState = currentMap;

    // Return delta only if there are changes
    if (Object.keys(added).length === 0 && Object.keys(modified).length === 0 && deleted.length === 0) {
      return null;
    }

    return {
      type: 'delta',
      pageId,
      boardId: this.boardId,
      timestamp: new Date().toISOString(),
      added,
      modified,
      deleted,
    };
  }

  /**
   * Reset broadcast state (useful for page changes or initial load)
   */
  resetBroadcastState(): void {
    this.lastBroadcastState.clear();
  }

  /**
   * Cleanup all subscriptions
   */
  async destroy(): Promise<void> {
    this.stopPolling();

    if (this.channel) {
      try {
        await supabase.removeChannel(this.channel);
      } catch (error) {
        console.warn('[RealtimeSync] Error removing broadcast channel during destroy:', error);
      }
    }
    this.channel = null;
    this.currentPageId = null;
    this.lastPolledAt.clear();
    this.isRealtimeHealthy = false;
    this.hasReceivedBroadcast = false;
    this.lastBroadcastState.clear();
  }
}

