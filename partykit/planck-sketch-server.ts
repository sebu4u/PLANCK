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

  constructor(readonly room: Party.Room) { }

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    console.log(`[PartyKit] Connection established: ${conn.id} in room ${this.room.id}`);

    // Add connection to map
    this.connections.set(conn.id, conn);

    // Initialize user info with connection ID (will be updated when user sends their info)
    this.userInfo.set(conn.id, {
      connectionId: conn.id,
    });

    // Load state from storage
    const allRecords = (await this.room.storage.get<Record<string, any>>("records")) || {};
    const totalRecords = Object.keys(allRecords).length;
    console.log(`[PartyKit] Loading ${totalRecords} records from storage for room ${this.room.id}`);

    // Filter out ephemeral records before sending to new client
    // Each user maintains their own camera position, zoom level, etc.
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
  }

  async onClose(conn: Party.Connection) {
    console.log(`[PartyKit] Connection closed: ${conn.id} in room ${this.room.id}`);

    // Remove connection from map
    this.connections.delete(conn.id);
    this.userInfo.delete(conn.id);

    // Broadcast updated user list to all clients
    this.broadcastPresence();
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

        // Update storage (but skip ephemeral records)
        // Each user's camera position, zoom, and cursor state should NOT be persisted
        const { added, updated, removed } = data.payload;
        
        // Use a transaction-like approach: read, modify, write atomically
        // This ensures we don't lose data from concurrent updates
        try {
          const records = (await this.room.storage.get<Record<string, any>>("records")) || {};
          let hasChanges = false;

          if (added) {
            for (const id in added) {
              const record = added[id];
              // Skip ephemeral records - don't store camera, instance states, etc.
              if (!isEphemeralRecord(record)) {
                records[id] = record;
                hasChanges = true;
              }
            }
          }

          if (updated) {
            for (const id in updated) {
              const record = updated[id];
              // Skip ephemeral records - don't store camera, instance states, etc.
              if (!isEphemeralRecord(record)) {
                records[id] = record;
                hasChanges = true;
              }
            }
          }

          if (removed) {
            for (const id in removed) {
              const record = removed[id];
              // Skip ephemeral records
              if (!isEphemeralRecord(record)) {
                delete records[id];
                hasChanges = true;
              }
            }
          }

          if (hasChanges) {
            // Save back to storage atomically
            // This ensures all records are persisted together
            await this.room.storage.put("records", records);
            console.log(`[PartyKit] Saved ${Object.keys(records).length} records to storage for room ${this.room.id}`);
          }
        } catch (error) {
          console.error(`[PartyKit] Error saving records to storage for room ${this.room.id}:`, error);
          // Don't throw - we've already broadcasted the update, so clients are in sync
          // Storage failure shouldn't break the real-time sync
        }
      }
    } catch (e) {
      console.error("[PartyKit] Error processing message:", e);
    }
  }
}
