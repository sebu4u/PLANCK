import { supabase } from '@/lib/supabaseClient';

export interface MathFunction {
  id: string;
  board_id: string;
  page_id: string;
  function_id: string;
  equation: string;
  color: string;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
}

export interface FunctionPersistenceOptions {
  boardId: string;
  onError?: (error: Error) => void;
  debounceMs?: number;
}

export class FunctionPersistence {
  private boardId: string;
  private onError?: (error: Error) => void;
  private debounceMs: number;
  private saveTimeout: Map<string, NodeJS.Timeout> = new Map();
  private isUUID: boolean;

  constructor(options: FunctionPersistenceOptions) {
    this.boardId = options.boardId;
    this.onError = options.onError;
    this.debounceMs = options.debounceMs || 300;
    // Check if boardId is a valid UUID
    this.isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(this.boardId);
  }

  /**
   * Load all functions for a board page
   */
  async loadFunctions(pageId: string): Promise<MathFunction[]> {
    // If not UUID (e.g. PartyKit room ID), return empty or implement local storage
    if (!this.isUUID) {
      console.log(`[FunctionPersistence] Board ID ${this.boardId} is not a UUID, skipping Supabase load`);
      return [];
    }

    try {
      console.log(`[FunctionPersistence] Loading functions for board ${this.boardId}, page ${pageId}`);
      const { data, error } = await supabase
        .from('sketch_board_functions')
        .select('*')
        .eq('board_id', this.boardId)
        .eq('page_id', pageId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error(`[FunctionPersistence] Failed to load functions:`, error);
        throw new Error(`Failed to load functions: ${error.message}`);
      }

      if (!data || data.length === 0) {
        console.log(`[FunctionPersistence] No functions found for board ${this.boardId}, page ${pageId}`);
        return [];
      }

      console.log(`[FunctionPersistence] Found ${data.length} function(s) for board ${this.boardId}, page ${pageId}`);
      return data as MathFunction[];
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (this.onError) {
        this.onError(err);
      }
      console.error('Error loading functions:', err);
      return [];
    }
  }

  /**
   * Save a function (debounced)
   */
  async saveFunction(pageId: string, functionData: Omit<MathFunction, 'id' | 'created_at' | 'updated_at'>): Promise<void> {
    const key = `${pageId}-${functionData.function_id}`;
    
    // Clear existing timeout for this function
    const existingTimeout = this.saveTimeout.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Set new timeout
    const timeout = setTimeout(async () => {
      await this._saveFunctionImmediate(pageId, functionData);
      this.saveTimeout.delete(key);
    }, this.debounceMs);

    this.saveTimeout.set(key, timeout);
  }

  /**
   * Save function immediately (without debounce)
   */
  private async _saveFunctionImmediate(
    pageId: string,
    functionData: Omit<MathFunction, 'id' | 'created_at' | 'updated_at'>
  ): Promise<void> {
    // If not UUID, skip saving to Supabase to avoid "invalid input syntax for type uuid" error
    if (!this.isUUID) {
      console.log(`[FunctionPersistence] Board ID ${this.boardId} is not a UUID, skipping Supabase save`);
      return;
    }

    try {
      console.log(`[FunctionPersistence] Saving function ${functionData.function_id} for board ${this.boardId}, page ${pageId}`);
      
      const { error, data } = await supabase
        .from('sketch_board_functions')
        .upsert(
          {
            board_id: this.boardId,
            page_id: pageId,
            function_id: functionData.function_id,
            equation: functionData.equation,
            color: functionData.color,
            is_visible: functionData.is_visible,
          },
          {
            onConflict: 'board_id,page_id,function_id',
          }
        )
        .select();

      if (error) {
        console.error(`[FunctionPersistence] Failed to save function:`, error);
        throw new Error(`Failed to save function: ${error.message}`);
      }

      console.log(`[FunctionPersistence] Successfully saved function ${functionData.function_id}`);

      // Update board's updated_at timestamp
      const { error: boardError } = await supabase
        .from('sketch_boards')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', this.boardId);

      if (boardError) {
        // Log but don't fail - function save succeeded
        console.warn('[FunctionPersistence] Failed to update board timestamp:', boardError);
      }
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error(`[FunctionPersistence] Error saving function:`, err);
      if (this.onError) {
        this.onError(err);
      }
    }
  }

  /**
   * Delete a function
   */
  async deleteFunction(pageId: string, functionId: string): Promise<void> {
    // If not UUID, skip Supabase delete
    if (!this.isUUID) {
      console.log(`[FunctionPersistence] Board ID ${this.boardId} is not a UUID, skipping Supabase delete`);
      return;
    }

    try {
      console.log(`[FunctionPersistence] Deleting function ${functionId} for board ${this.boardId}, page ${pageId}`);
      
      const { error } = await supabase
        .from('sketch_board_functions')
        .delete()
        .eq('board_id', this.boardId)
        .eq('page_id', pageId)
        .eq('function_id', functionId);

      if (error) {
        console.error(`[FunctionPersistence] Failed to delete function:`, error);
        throw new Error(`Failed to delete function: ${error.message}`);
      }

      console.log(`[FunctionPersistence] Successfully deleted function ${functionId}`);

      // Update board's updated_at timestamp
      const { error: boardError } = await supabase
        .from('sketch_boards')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', this.boardId);

      if (boardError) {
        console.warn('[FunctionPersistence] Failed to update board timestamp:', boardError);
      }
    } catch (error: any) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error(`[FunctionPersistence] Error deleting function:`, err);
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
    for (const [key, timeout] of this.saveTimeout.entries()) {
      clearTimeout(timeout);
    }
    this.saveTimeout.clear();
    await Promise.all(promises);
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
