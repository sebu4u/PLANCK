import type * as Party from "partykit/server";

// Record types that are ephemeral (per-user, NOT shared between users)
const EPHEMERAL_TYPES = new Set([
  'instance',
  'instance_page_state',
  'instance_presence',
  'camera',
]);

// Check if a record is ephemeral (should not be stored or synced)
const isEphemeralRecord = (record: any): boolean => {
  return EPHEMERAL_TYPES.has(record?.typeName);
};

interface UserInfo {
  connectionId: string;
  userId?: string;
  name?: string;
  nickname?: string;
  userIcon?: string;
  email?: string;
}

export default class SketchServer implements Party.Server {
  connections: Map<string, Party.Connection> = new Map();
  userInfo: Map<string, UserInfo> = new Map(); // connectionId -> UserInfo
  records: Record<string, any> | null = null; // In-memory cache of records

  constructor(readonly room: Party.Room) { }

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    try {
      console.log(`[PartyKit] Connection established: ${conn.id} in room ${this.room.id}`);

      // Add connection to map
      this.connections.set(conn.id, conn);

      // Initialize user info with connection ID (will be updated when user sends their info)
      this.userInfo.set(conn.id, {
        connectionId: conn.id,
      });

      // Load state from storage if not in memory
      if (!this.records) {
        await this.loadFromStorage();
      }

      const allRecords = this.records!;
      
      // Filter out ephemeral records before sending to new client
      const filteredRecords: Record<string, any> = {};
      for (const [id, record] of Object.entries(allRecords)) {
        if (!isEphemeralRecord(record)) {
          filteredRecords[id] = record;
        }
      }

      const filteredCount = Object.keys(filteredRecords).length;
      console.log(`[PartyKit] Sending ${filteredCount} non-ephemeral records to client ${conn.id} in room ${this.room.id}`);

      // Send initial state to client (without ephemeral records)
      conn.send(JSON.stringify({ type: "init", payload: filteredRecords }));

      // Broadcast updated user list to all clients
      this.broadcastPresence();
    } catch (error) {
      console.error(`[PartyKit] Error in onConnect for ${conn.id}:`, error);
    }
  }

  // Helper to load records from storage with migration support
  async loadFromStorage() {
    this.records = {};
    
    try {
      // 1. Try to load simplified format (individual keys)
      const stored = await this.room.storage.list<any>();
      
      // Check for legacy "records" blob
      if (stored.has("records")) {
        console.log(`[PartyKit] Migrating legacy monolithic storage for room ${this.room.id}`);
        const legacyRecords = stored.get("records");
        
        // Copy to in-memory
        if (legacyRecords && typeof legacyRecords === 'object') {
          Object.assign(this.records, legacyRecords);
        }

        // Write as individual keys
        if (Object.keys(this.records).length > 0) {
          await this.room.storage.put(this.records);
        }
        // Delete legacy key
        await this.room.storage.delete("records");
        console.log(`[PartyKit] Migration complete. ${Object.keys(this.records).length} records migrated.`);
      } else {
        // Normal load
        for (const [key, value] of stored) {
           // Skip non-record keys if any (like functions-*)
           if (!key.startsWith('functions-')) {
             this.records[key] = value;
           }
        }
      }
      
      console.log(`[PartyKit] Loaded ${Object.keys(this.records).length} records from storage`);
    } catch (e) {
      console.error(`[PartyKit] Failed to load from storage:`, e);
      // Fallback
      this.records = {};
    }
  }

  async onClose(conn: Party.Connection) {
    console.log(`[PartyKit] Connection closed: ${conn.id} in room ${this.room.id}`);

    // Remove connection from map
    this.connections.delete(conn.id);
    this.userInfo.delete(conn.id);

    // Broadcast updated user list to all clients
    this.broadcastPresence();
  }

  // Edge-safe periodic persistence via alarm
  async onStart() {
    // We now save incrementally, but can keep alarm for cleanup or specialized tasks if needed.
    // Assuming implicit persistence is strong enough with storage.put on updates.
    // We'll keep a basic alarm just in case we add batched saves later.
  }

  private broadcastPresence() {
    // Build array of user info for all connected users
    const users: UserInfo[] = Array.from(this.userInfo.values());
    console.log(`[PartyKit] Broadcasting presence: ${users.length} users in room ${this.room.id}`);
    const presenceMessage = JSON.stringify({
      type: "presence",
      users: users,
    });
    this.room.broadcast(presenceMessage);
  }

  async onMessage(message: string, sender: Party.Connection) {
    try {
      const data = JSON.parse(message);

      // Handle user info updates
      if (data.type === "user-info") {
        const userInfo: UserInfo = {
          connectionId: sender.id,
          userId: data.userId,
          name: data.name,
          nickname: data.nickname,
          userIcon: data.userIcon,
          email: data.email,
        };
        this.userInfo.set(sender.id, userInfo);
        this.broadcastPresence();
        return;
      }

      // Handle full snapshot sync
      if (data.type === "snapshot") {
        const snapshotRecords = data.payload;
        if (!snapshotRecords || typeof snapshotRecords !== 'object') {
          return;
        }

        if (!this.records) await this.loadFromStorage();

        // Update in-memory
        for (const [id, record] of Object.entries(snapshotRecords)) {
          if (!isEphemeralRecord(record)) {
            this.records![id] = record;
          }
        }

        // Persist all records individually
        // Warning: snapshot might be large, but put(entries) handles batching better than put(key, giant_value)
        await this.room.storage.put(snapshotRecords);
        console.log(`[PartyKit] Snapshot sync: stored ${Object.keys(snapshotRecords).length} records`);

        // Broadcast snapshot update
        const syncMessage = JSON.stringify({
          type: "update",
          payload: {
            added: snapshotRecords,
            updated: {},
            removed: {}
          }
        });
        this.room.broadcast(syncMessage, [sender.id]);
        return;
      }

      // Handle explicit presence requests
      if (data.type === "request-presence") {
        this.broadcastPresence();
        return;
      }

      // Handle function-related messages
      if (data.type === "request-functions") {
         const { boardId, pageId } = data.payload || {};
         if (!pageId) return;
         try {
           const functionsKey = `functions-${pageId}`;
           const functions = (await this.room.storage.get<Array<any>>(functionsKey)) || [];
           sender.send(JSON.stringify({
             type: "function-init",
             payload: { boardId, pageId, functions },
           }));
         } catch (error) {
           console.error(`[PartyKit] Error loading functions for page ${pageId}:`, error);
         }
         return;
      }

      if (data.type === "function-update") {
        const { boardId, pageId, functions } = data.payload || {};
        if (!pageId || !functions) return;
        try {
          const functionsKey = `functions-${pageId}`;
          await this.room.storage.put(functionsKey, functions);
          // Broadcast
          this.room.broadcast(message, [sender.id]);
        } catch (error) {
          console.error(`[PartyKit] Error saving functions for page ${pageId}:`, error);
        }
        return;
      }

      // Handle updates from clients (Incremental)
      if (data.type === "update") {
        // Broadcast immediately to reduce latency
        this.room.broadcast(message, [sender.id]);

        if (!this.records) await this.loadFromStorage();
        const records = this.records!;

        const { added, updated, removed } = data.payload;
        
        // Prepare storage operations
        const putEntries: Record<string, any> = {};
        const deleteKeys: string[] = [];
        let hasChanges = false;

        if (added) {
          for (const id in added) {
            const record = added[id];
            if (!isEphemeralRecord(record)) {
              records[id] = record;
              putEntries[id] = record;
              hasChanges = true;
            }
          }
        }

        if (updated) {
          for (const id in updated) {
            const record = updated[id];
            if (!isEphemeralRecord(record)) {
              records[id] = record;
              putEntries[id] = record;
              hasChanges = true;
            }
          }
        }

        if (removed) {
          for (const id in removed) {
            if (records[id] && !isEphemeralRecord(records[id])) {
              delete records[id];
              deleteKeys.push(id);
              hasChanges = true;
            }
          }
        }

        // Apply persistence incrementally
        if (hasChanges) {
          if (Object.keys(putEntries).length > 0) {
            await this.room.storage.put(putEntries);
          }
          if (deleteKeys.length > 0) {
            await this.room.storage.delete(deleteKeys);
          }
        }
      }
    } catch (e) {
      console.error("[PartyKit] Error processing message:", e);
    }
  }
}
