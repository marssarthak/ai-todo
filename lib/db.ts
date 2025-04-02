/**
 * This is a mock database client for development purposes.
 * In a real application, this would be replaced with a real database client.
 */

// Simple in-memory data store
const store: Record<string, any> = {};

export const db = {
  /**
   * Get a value from the store
   */
  get: async <T>(key: string): Promise<T | null> => {
    return (store[key] as T) || null;
  },

  /**
   * Set a value in the store
   */
  set: async <T>(key: string, value: T): Promise<void> => {
    store[key] = value;
  },

  /**
   * Delete a value from the store
   */
  delete: async (key: string): Promise<void> => {
    delete store[key];
  },

  /**
   * List all keys in the store that match a prefix
   */
  list: async (prefix: string): Promise<string[]> => {
    return Object.keys(store).filter((key) => key.startsWith(prefix));
  },
};
