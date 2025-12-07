import PartySocket from "partysocket";
import { MathFunction } from './function-persistence';

export interface FunctionPartyKitSyncOptions {
  socket: PartySocket;
  boardId: string;
  pageId: string;
  onFunctionUpdate?: (functions: MathFunction[]) => void;
  onError?: (error: Error) => void;
}

/**
 * Manages real-time synchronization of board functions using PartyKit
 */
export class FunctionPartyKitSync {
  private socket: PartySocket;
  private boardId: string;
  private pageId: string;
  private onFunctionUpdate?: (functions: MathFunction[]) => void;
  private onError?: (error: Error) => void;
  private isSubscribed = false;
  private lastFunctionsHash: string | null = null;
  private messageHandler: ((evt: MessageEvent) => void) | null = null;

  constructor(options: FunctionPartyKitSyncOptions) {
    this.socket = options.socket;
    this.boardId = options.boardId;
    this.pageId = options.pageId;
    this.onFunctionUpdate = options.onFunctionUpdate;
    this.onError = options.onError;
  }

  /**
   * Subscribe to real-time updates for functions
   */
  async subscribe(): Promise<void> {
    if (this.isSubscribed) {
      console.log('[FunctionPartyKitSync] Already subscribed');
      return;
    }

    try {
      console.log(`[FunctionPartyKitSync] Subscribing to function updates for board ${this.boardId}, page ${this.pageId}`);

      // Set up message handler
      this.messageHandler = (evt: MessageEvent) => {
        try {
          const msg = JSON.parse(evt.data);

          // Handle function updates
          if (msg.type === "function-update") {
            const payload = msg.payload;
            if (payload?.pageId === this.pageId && payload?.functions) {
              const functions = payload.functions;
              if (Array.isArray(functions)) {
                // Create hash to avoid duplicate updates
                const hash = JSON.stringify(functions);
                if (this.lastFunctionsHash === hash) {
                  return;
                }
                this.lastFunctionsHash = hash;

                if (this.onFunctionUpdate) {
                  // Ensure we always pass an array, never undefined
                  this.onFunctionUpdate((functions || []) as MathFunction[]);
                }
              }
            }
          }

          // Handle function-init (initial load)
          if (msg.type === "function-init") {
            const payload = msg.payload;
            if (payload?.pageId === this.pageId && payload?.functions) {
              const functions = payload.functions;
              if (Array.isArray(functions)) {
                if (this.onFunctionUpdate) {
                  this.onFunctionUpdate((functions || []) as MathFunction[]);
                }
              }
            }
          }
        } catch (error) {
          console.error('[FunctionPartyKitSync] Error handling message:', error);
        }
      };

      this.socket.addEventListener("message", this.messageHandler);
      this.isSubscribed = true;

      // Request initial functions
      this.requestInitialFunctions();

      console.log('[FunctionPartyKitSync] Successfully subscribed to real-time updates');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('[FunctionPartyKitSync] Failed to subscribe:', err);
      if (this.onError) {
        this.onError(err);
      }
    }
  }

  /**
   * Request initial functions from server
   */
  private requestInitialFunctions(): void {
    try {
      const message = {
        type: "request-functions",
        payload: {
          boardId: this.boardId,
          pageId: this.pageId,
        },
      };
      this.socket.send(JSON.stringify(message));
      console.log('[FunctionPartyKitSync] Requested initial functions');
    } catch (error) {
      console.error('[FunctionPartyKitSync] Error requesting initial functions:', error);
    }
  }

  /**
   * Broadcast function update to other users
   */
  async broadcastUpdate(functions: MathFunction[]): Promise<void> {
    if (!this.isSubscribed || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('[FunctionPartyKitSync] Socket not ready for broadcast');
      return;
    }

    try {
      const payload = {
        type: "function-update",
        payload: {
          boardId: this.boardId,
          pageId: this.pageId,
          functions: functions.filter((f) => f.page_id === this.pageId),
          timestamp: new Date().toISOString(),
        },
      };

      this.socket.send(JSON.stringify(payload));
      console.log('[FunctionPartyKitSync] Broadcast sent');
    } catch (error) {
      console.error('[FunctionPartyKitSync] Error broadcasting update:', error);
    }
  }

  /**
   * Unsubscribe from real-time updates
   */
  async unsubscribe(): Promise<void> {
    if (!this.isSubscribed || !this.messageHandler) {
      return;
    }

    try {
      this.socket.removeEventListener("message", this.messageHandler);
      this.isSubscribed = false;
      this.messageHandler = null;
      console.log('[FunctionPartyKitSync] Unsubscribed from real-time updates');
    } catch (error) {
      console.error('[FunctionPartyKitSync] Error unsubscribing:', error);
    }
  }

  /**
   * Cleanup
   */
  async destroy(): Promise<void> {
    await this.unsubscribe();
  }
}





