import { TLStore, TLRecord, StoreSnapshot, createTLStore, defaultShapeUtils } from '@tldraw/tldraw';
import { supabase } from '@/lib/supabaseClient';

const DEFAULT_SERIALIZED_SCHEMA = (() => {
  try {
    const store = createTLStore({ shapeUtils: defaultShapeUtils });
    return store.schema.serialize();
  } catch (error) {
    console.warn('[Persistence] Failed to create default schema snapshot:', error);
    return {} as any;
  }
})();

export interface SupabasePersistenceOptions {
  boardId: string;
  onError?: (error: Error) => void;
  debounceMs?: number;
}

export class SupabasePersistence {
  private boardId: string;
  private onError?: (error: Error) => void;
  private debounceMs: number;
  private saveTimeout: Map<string, NodeJS.Timeout> = new Map();
  private currentPageId: string | null = null;
  private store: TLStore | null = null; // Reference to tldraw store for fresh state

  constructor(options: SupabasePersistenceOptions) {
    this.boardId = options.boardId;
    this.onError = options.onError;
    this.debounceMs = options.debounceMs || 500;
  }

  /**
   * Set store reference for getting fresh state
   */
  setStore(store: TLStore): void {
    this.store = store;
  }

  /**
   * Load all pages for a board from Supabase and merge into single snapshot
   */
  async loadPages(): Promise<StoreSnapshot<TLRecord> | null> {
    try {
      console.log(`[Persistence] Loading pages for board ${this.boardId}`);
      const { data, error } = await supabase
        .from('sketch_board_pages')
        .select('page_id, snapshot')
        .eq('board_id', this.boardId);

      if (error) {
        console.error(`[Persistence] Failed to load pages:`, error);
        throw new Error(`Failed to load pages: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.log(`[Persistence] No pages found for board ${this.boardId}`);
        return null;
      }

      console.log(`[Persistence] Found ${data.length} page(s) for board ${this.boardId}`);

      // Merge all page snapshots into one
      // tldraw stores all records in a flat structure, not organized by page
      const mergedSnapshot: StoreSnapshot<TLRecord> = {
        store: {},
        schema: DEFAULT_SERIALIZED_SCHEMA,
      };

      for (const page of data) {
        try {
          if (page.snapshot && typeof page.snapshot === 'object') {
            const snapshot = page.snapshot as StoreSnapshot<TLRecord>;
            console.log(`[Persistence] Processing page ${page.page_id}, snapshot type:`, typeof snapshot, 'has store:', !!snapshot.store);
            
            // Merge all records from this page snapshot
            if (snapshot.store && typeof snapshot.store === 'object') {
              const recordCount = Object.keys(snapshot.store).length;
              console.log(`[Persistence] Page ${page.page_id} has ${recordCount} records`);
              Object.assign(mergedSnapshot.store, snapshot.store);
            } else {
              console.warn(`[Persistence] Page ${page.page_id} snapshot has no store or invalid store`);
            }
            
            // Use schema from first valid snapshot
            if (
              mergedSnapshot.schema === DEFAULT_SERIALIZED_SCHEMA ||
              !mergedSnapshot.schema ||
              Object.keys(mergedSnapshot.schema as Record<string, any>).length === 0
            ) {
              mergedSnapshot.schema =
                snapshot.schema && Object.keys(snapshot.schema as Record<string, any>).length > 0
                  ? snapshot.schema
                  : DEFAULT_SERIALIZED_SCHEMA;
            }
          } else {
            console.warn(`[Persistence] Page ${page.page_id} has invalid snapshot:`, typeof page.snapshot);
          }
        } catch (e) {
          console.warn(`[Persistence] Failed to parse snapshot for page ${page.page_id}:`, e);
        }
      }

      const totalRecords = Object.keys(mergedSnapshot.store).length;
      console.log(`[Persistence] Merged snapshot has ${totalRecords} total records`);
      
      return mergedSnapshot;
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (this.onError) {
        this.onError(err);
      }
      console.error('Error loading pages:', err);
      return null;
    }
  }


  /**
   * Save a page snapshot to database (debounced, background operation)
   */
  async persistToDb(pageId: string, snapshot: StoreSnapshot<TLRecord>): Promise<void> {
    // Clear existing timeout for this page
    const existingTimeout = this.saveTimeout.get(pageId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout with debounce for DB persistence
    const timeout = setTimeout(async () => {
      await this._savePageImmediate(pageId, snapshot);
      this.saveTimeout.delete(pageId);
    }, 1000); // Debounce for DB persistence (1 second)

    this.saveTimeout.set(pageId, timeout);
  }

  /**
   * Save page immediately (without debounce)
   */
  private async _savePageImmediate(
    pageId: string,
    snapshot: StoreSnapshot<TLRecord>
  ): Promise<void> {
    try {
      // Filter out ephemeral (per-user) records before saving/broadcasting
      const filteredStore: Record<string, TLRecord> = {};
      const isEphemeral = (rec: any) => {
        const t = rec?.typeName;
        return t === 'instance' || t === 'instance_page_state' || t === 'instance_presence' || t === 'camera';
      };
      if (snapshot.store && typeof snapshot.store === 'object') {
        for (const [id, rec] of Object.entries(snapshot.store as Record<string, TLRecord>)) {
          if (!isEphemeral(rec)) filteredStore[id] = rec as TLRecord;
        }
      }

      const recordCount = snapshot.store ? Object.keys(snapshot.store).length : 0;
      console.log(`[Persistence] Saving page ${pageId} for board ${this.boardId} with ${recordCount} records`);
      
      // Verify snapshot structure before saving
      if (!snapshot.store || typeof snapshot.store !== 'object') {
        console.error(`[Persistence] Invalid snapshot structure - no store:`, snapshot);
        throw new Error('Invalid snapshot structure - missing store');
      }
      
      // Ensure snapshot has the correct structure (using filtered store)
      const snapshotToSave = {
        store: filteredStore,
        schema:
          snapshot.schema && Object.keys(snapshot.schema as Record<string, any>).length > 0
            ? snapshot.schema
            : DEFAULT_SERIALIZED_SCHEMA,
      };
      
      console.log(`[Persistence] Snapshot structure:`, {
        hasStore: !!snapshotToSave.store,
        storeType: typeof snapshotToSave.store,
        recordCount: Object.keys(snapshotToSave.store).length,
        hasSchema: !!snapshotToSave.schema,
        recordTypes: Object.values(snapshotToSave.store).slice(0, 5).map((r: any) => r?.typeName).filter(Boolean)
      });
      
      // Save the page snapshot
      const { error: pageError, data: pageData } = await supabase
        .from('sketch_board_pages')
        .upsert(
          {
            board_id: this.boardId,
            page_id: pageId,
            snapshot: snapshotToSave as any,
          },
          {
            onConflict: 'board_id,page_id',
          }
        )
        .select();

      if (pageError) {
        console.error(`[Persistence] Failed to save page:`, pageError);
        throw new Error(`Failed to save page: ${pageError.message}`);
      }

      console.log(`[Persistence] Successfully saved page ${pageId} to database`, {
        savedRecordCount: pageData?.[0]?.snapshot?.store ? Object.keys(pageData[0].snapshot.store).length : 0
      });

      // Update board's updated_at timestamp
      const { error: boardError } = await supabase
        .from('sketch_boards')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', this.boardId);

      if (boardError) {
        // Log but don't fail - page save succeeded
        console.warn('[Persistence] Failed to update board timestamp:', boardError);
      } else {
        console.log(`[Persistence] Updated board ${this.boardId} timestamp`);
      }
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error(`[Persistence] Error saving page ${pageId} for board ${this.boardId}:`, err);
      if (this.onError) {
        this.onError(err);
      }
    }
  }

  /**
   * Flush all pending saves
   */
  async flush(): Promise<void> {
    const promises: Promise<void>[] = [];
    for (const [pageId, timeout] of this.saveTimeout.entries()) {
      clearTimeout(timeout);
      // Get the latest snapshot from the store if available
      // For now, we'll just clear the timeout
      // The actual save will happen on next change
    }
    this.saveTimeout.clear();
    await Promise.all(promises);
  }

  /**
   * Force save all pages immediately (for beforeunload)
   * Requires store to get current snapshots
   */
  async forceSaveAll(store: TLStore): Promise<void> {
    // Clear all timeouts
    for (const [pageId, timeout] of this.saveTimeout.entries()) {
      clearTimeout(timeout);
    }
    this.saveTimeout.clear();

    try {
      // Get all records from store and build snapshot manually
      // This works even if getSnapshot() is not available
      const allRecords = store.allRecords();
      const snapshotStore: Record<string, TLRecord> = {};
      
      // Build snapshot store from all records
      for (const record of allRecords) {
        snapshotStore[record.id] = record;
      }

      // Create snapshot object
      const snapshot: StoreSnapshot<TLRecord> = {
        store: snapshotStore,
        schema: store.schema.serialize(), // Schema is optional for saving
      };

      // Get all pages from store and save them
      const pages = allRecords.filter(r => r.typeName === 'page');
      
      const savePromises = pages.map(async (page) => {
        const pageId = page.id as string;
        await this._savePageImmediate(pageId, snapshot);
      });

      await Promise.all(savePromises);
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (this.onError) {
        this.onError(err);
      }
      console.error('Error in forceSaveAll:', err);
    }
  }

  /**
   * Set current page being edited
   */
  setCurrentPage(pageId: string | null) {
    this.currentPageId = pageId;
  }

  /**
   * Get current page ID
   */
  getCurrentPage(): string | null {
    return this.currentPageId;
  }

  /**
   * Cleanup
   */
  async destroy() {
    for (const timeout of this.saveTimeout.values()) {
      clearTimeout(timeout);
    }
    this.saveTimeout.clear();
  }
}

