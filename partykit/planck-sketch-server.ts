import type * as Party from "partykit/server";

// Record types that are ephemeral (per-user, NOT shared between users)
// These include camera position, zoom, cursor state, etc.
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
        this.records = (await this.room.storage.get<Record<string, any>>("records")) || {};
        console.log(`[PartyKit] Loaded ${Object.keys(this.records).length} records from storage`);
      }

      const allRecords = this.records!;
      const totalRecords = Object.keys(allRecords).length;

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

  async onClose(conn: Party.Connection) {
    console.log(`[PartyKit] Connection closed: ${conn.id} in room ${this.room.id}`);

    // Flush storage on disconnect to ensure persistence
    if (this.records && Object.keys(this.records).length > 0) {
      try {
        await this.room.storage.put("records", this.records);
        console.log(`[PartyKit] Flushed ${Object.keys(this.records).length} records on disconnect`);
      } catch (e) {
        console.error(`[PartyKit] Error flushing on disconnect:`, e);
      }
    }

    // Remove connection from map
    this.connections.delete(conn.id);
    this.userInfo.delete(conn.id);

    // Broadcast updated user list to all clients
    this.broadcastPresence();
  }

  // Edge-safe periodic persistence via alarm
  async onStart() {
    // Set up periodic alarm for persistence backup (edge workers may suspend)
    try {
      await this.room.storage.setAlarm(Date.now() + 60000); // 1 minute
      console.log(`[PartyKit] Initialized persistence alarm for room ${this.room.id}`);
    } catch (e) {
      console.warn(`[PartyKit] Failed to set alarm:`, e);
    }
  }

  async onAlarm() {
    // Periodic persistence backup - runs even if no active connections
    if (this.records && Object.keys(this.records).length > 0) {
      try {
        await this.room.storage.put("records", this.records);
        console.log(`[PartyKit] Alarm: persisted ${Object.keys(this.records).length} records`);
      } catch (e) {
        console.error(`[PartyKit] Alarm persistence failed:`, e);
      }
    }
    // Reschedule alarm
    try {
      await this.room.storage.setAlarm(Date.now() + 60000);
    } catch (e) {
      console.warn(`[PartyKit] Failed to reschedule alarm:`, e);
    }
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
    // console.log(`[PartyKit] Message from ${sender.id}: ${message.slice(0, 50)}...`);

    try {
      const data = JSON.parse(message);

      // Handle user info updates (when user connects with account info)
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
        // Broadcast updated user list to all clients
        this.broadcastPresence();
        return;
      }

      // Handle full snapshot sync (more reliable than incremental updates)
      if (data.type === "snapshot") {
        const snapshotRecords = data.payload;
        if (!snapshotRecords || typeof snapshotRecords !== 'object') {
          console.warn(`[PartyKit] Invalid snapshot payload from ${sender.id}`);
          return;
        }

        // Ensure records are loaded
        if (!this.records) {
          this.records = (await this.room.storage.get<Record<string, any>>("records")) || {};
        }

        let mergedCount = 0;
        for (const [id, record] of Object.entries(snapshotRecords)) {
          if (!isEphemeralRecord(record)) {
            this.records[id] = record;
            mergedCount++;
          }
        }

        // Persist immediately for snapshots (they're often sent before disconnect)
        await this.room.storage.put("records", this.records);
        console.log(`[PartyKit] Snapshot sync: merged ${mergedCount} records, total ${Object.keys(this.records).length}`);

        // Broadcast snapshot update to other clients
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
        // Send presence update to all clients (including the requester)
        this.broadcastPresence();
        return;
      }

      // Handle function-related messages
      if (data.type === "request-functions") {
        const { boardId, pageId } = data.payload || {};
        if (!pageId) return;

        try {
          // Load functions from storage
          const functionsKey = `functions-${pageId}`;
          const functions = (await this.room.storage.get<Array<any>>(functionsKey)) || [];

          // Send initial functions to requester
          sender.send(JSON.stringify({
            type: "function-init",
            payload: {
              boardId,
              pageId,
              functions,
            },
          }));
          console.log(`[PartyKit] Sent ${functions.length} functions to ${sender.id} for page ${pageId}`);
        } catch (error) {
          console.error(`[PartyKit] Error loading functions for page ${pageId}:`, error);
        }
        return;
      }

      if (data.type === "function-update") {
        const { boardId, pageId, functions } = data.payload || {};
        if (!pageId || !functions) return;

        try {
          // Store functions in PartyKit storage
          const functionsKey = `functions-${pageId}`;
          await this.room.storage.put(functionsKey, functions);
          console.log(`[PartyKit] Saved ${functions.length} functions for page ${pageId}`);

          // Broadcast update to all other clients (exclude sender)
          this.room.broadcast(message, [sender.id]);
        } catch (error) {
          console.error(`[PartyKit] Error saving functions for page ${pageId}:`, error);
        }
        return;
      }

      // Handle updates from clients
      if (data.type === "update") {
        // Broadcast to all other clients (exclude sender)
        this.room.broadcast(message, [sender.id]);

        // Updates records in memory and persist
        const { added, updated, removed } = data.payload;

        // Ensure records are loaded
        if (!this.records) {
          this.records = (await this.room.storage.get<Record<string, any>>("records")) || {};
        }

        let hasChanges = false;
        const records = this.records!;

        if (added) {
          for (const id in added) {
            const record = added[id];
            if (!isEphemeralRecord(record)) {
              records[id] = record;
              hasChanges = true;
            }
          }
        }

        if (updated) {
          for (const id in updated) {
            const record = updated[id];
            if (!isEphemeralRecord(record)) {
              records[id] = record;
              hasChanges = true;
            }
          }
        }

        if (removed) {
          for (const id in removed) {
            const record = removed[id];
            if (!isEphemeralRecord(record)) {
              delete records[id];
              hasChanges = true;
            }
          }
        }

        if (hasChanges) {
          // Save back to storage
          // Since we are single-threaded per room, this is safe from race conditions within this room
          // (assuming no await expressions between reading 'records' and updating it, which we handled by using in-memory reference)
          await this.room.storage.put("records", records);
          // console.log(`[PartyKit] Serialized ${Object.keys(records).length} records to storage`);
        }
      }
    } catch (e) {
      console.error("[PartyKit] Error processing message:", e);
    }
  }
}
