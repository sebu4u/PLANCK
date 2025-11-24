import type * as Party from "partykit/server";

export default class SketchServer implements Party.Server {
  connections: Map<string, Party.Connection> = new Map();

  constructor(readonly room: Party.Room) {}

  async onConnect(conn: Party.Connection, ctx: Party.ConnectionContext) {
    console.log(`[PartyKit] Connection established: ${conn.id} in room ${this.room.id}`);

    // Add connection to map
    this.connections.set(conn.id, conn);

    // Load state from storage
    const records = (await this.room.storage.get<Record<string, any>>("records")) || {};

    // Send initial state to client
    conn.send(JSON.stringify({ type: "init", payload: records }));

    // Broadcast updated user list to all clients
    this.broadcastPresence();
  }

  async onClose(conn: Party.Connection) {
    console.log(`[PartyKit] Connection closed: ${conn.id} in room ${this.room.id}`);
    
    // Remove connection from map
    this.connections.delete(conn.id);

    // Broadcast updated user list to all clients
    this.broadcastPresence();
  }

  private broadcastPresence() {
    const userIds = Array.from(this.connections.keys());
    const presenceMessage = JSON.stringify({
      type: "presence",
      users: userIds,
    });
    this.room.broadcast(presenceMessage);
  }

  async onMessage(message: string, sender: Party.Connection) {
    // console.log(`[PartyKit] Message from ${sender.id}: ${message.slice(0, 50)}...`);
    
    try {
      const data = JSON.parse(message);

      // Handle updates from clients
      if (data.type === "update") {
        // Broadcast to all other clients (exclude sender)
        this.room.broadcast(message, [sender.id]);

        // Update storage
        const { added, updated, removed } = data.payload;
        const records = (await this.room.storage.get<Record<string, any>>("records")) || {};
        let hasChanges = false;

        if (added) {
          for (const id in added) {
            records[id] = added[id];
            hasChanges = true;
          }
        }

        if (updated) {
          for (const id in updated) {
            records[id] = updated[id];
            hasChanges = true;
          }
        }

        if (removed) {
          for (const id in removed) {
            delete records[id];
            hasChanges = true;
          }
        }

        if (hasChanges) {
          // Save back to storage
          // Optimization: In a real app, you might want to debounce this or use a more granular storage
          await this.room.storage.put("records", records);
        }
      }
    } catch (e) {
      console.error("[PartyKit] Error processing message:", e);
    }
  }
}
