import { supabase } from '@/lib/supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';
import { MathFunction } from './function-persistence';

export interface FunctionRealtimeSyncOptions {
  boardId: string;
  pageId: string;
  onFunctionUpdate?: (functions: MathFunction[]) => void;
  onError?: (error: Error) => void;
}

/**
 * Manages real-time synchronization of board functions using Supabase Realtime
 */
export class FunctionRealtimeSync {
  private boardId: string;
  private pageId: string;
  private onFunctionUpdate?: (functions: MathFunction[]) => void;
  private onError?: (error: Error) => void;
  private channel: RealtimeChannel | null = null;
  private isSubscribed = false;
  private lastFunctionsHash: string | null = null;

  constructor(options: FunctionRealtimeSyncOptions) {
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
      console.log('[FunctionRealtimeSync] Already subscribed');
      return;
    }

    try {
      const channelName = `functions-${this.boardId}-${this.pageId}`;
      console.log(`[FunctionRealtimeSync] Subscribing to channel: ${channelName}`);

      this.channel = supabase
        .channel(channelName, {
          config: {
            broadcast: {
              self: true,
              ack: true,
            },
          },
        })
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'sketch_board_functions',
            filter: `board_id=eq.${this.boardId}`,
          },
          async (payload) => {
            console.log('[FunctionRealtimeSync] Received postgres change:', payload);
            await this.handleDatabaseChange(payload);
          }
        )
        .on('broadcast', { event: 'function-update' }, (payload) => {
          console.log('[FunctionRealtimeSync] Received broadcast:', payload);
          this.handleBroadcast(payload);
        })
        .subscribe((status) => {
          console.log(`[FunctionRealtimeSync] Channel subscription status: ${status}`);
          if (status === 'SUBSCRIBED') {
            this.isSubscribed = true;
            console.log('[FunctionRealtimeSync] Successfully subscribed to real-time updates');
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            this.isSubscribed = false;
            console.warn(`[FunctionRealtimeSync] Channel error: ${status}`);
          }
        });

      console.log('[FunctionRealtimeSync] Subscription initiated');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error('[FunctionRealtimeSync] Failed to subscribe:', err);
      if (this.onError) {
        this.onError(err);
      }
    }
  }

  /**
   * Handle database changes from Supabase Realtime
   */
  private async handleDatabaseChange(payload: any): Promise<void> {
    try {
      // Only process changes for the current page
      if (payload.new?.page_id !== this.pageId && payload.old?.page_id !== this.pageId) {
        return;
      }

      // Reload all functions for this page
      await this.reloadFunctions();
    } catch (error) {
      console.error('[FunctionRealtimeSync] Error handling database change:', error);
    }
  }

  /**
   * Handle broadcast messages
   */
  private handleBroadcast(payload: any): void {
    try {
      if (payload.payload?.pageId !== this.pageId) {
        return;
      }

      const functions = payload.payload?.functions;
      if (functions && Array.isArray(functions)) {
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
    } catch (error) {
      console.error('[FunctionRealtimeSync] Error handling broadcast:', error);
    }
  }

  /**
   * Broadcast function update to other users
   */
  async broadcastUpdate(functions: MathFunction[]): Promise<void> {
    if (!this.channel || !this.isSubscribed) {
      console.warn('[FunctionRealtimeSync] Channel not ready for broadcast');
      return;
    }

    try {
      const payload = {
        pageId: this.pageId,
        functions: functions.filter((f) => f.page_id === this.pageId),
        timestamp: new Date().toISOString(),
        boardId: this.boardId,
      };

      const result = await this.channel.send({
        type: 'broadcast',
        event: 'function-update',
        payload,
      });

      console.log('[FunctionRealtimeSync] Broadcast sent:', result);
    } catch (error) {
      console.error('[FunctionRealtimeSync] Error broadcasting update:', error);
    }
  }

  /**
   * Reload functions from database
   */
  private async reloadFunctions(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('sketch_board_functions')
        .select('*')
        .eq('board_id', this.boardId)
        .eq('page_id', this.pageId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[FunctionRealtimeSync] Failed to reload functions:', error);
        return;
      }

      if (this.onFunctionUpdate) {
        // Ensure we always pass an array, never null or undefined
        this.onFunctionUpdate((data || []) as MathFunction[]);
      }
    } catch (error) {
      console.error('[FunctionRealtimeSync] Error reloading functions:', error);
    }
  }

  /**
   * Unsubscribe from real-time updates
   */
  async unsubscribe(): Promise<void> {
    if (!this.channel) {
      return;
    }

    try {
      await supabase.removeChannel(this.channel);
      this.isSubscribed = false;
      this.channel = null;
      console.log('[FunctionRealtimeSync] Unsubscribed from real-time updates');
    } catch (error) {
      console.error('[FunctionRealtimeSync] Error unsubscribing:', error);
    }
  }

  /**
   * Cleanup
   */
  async destroy(): Promise<void> {
    await this.unsubscribe();
  }
}

