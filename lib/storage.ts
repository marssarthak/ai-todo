// lib/storage.ts

// Helper to serialize data, converting Dates to ISO strings
function serializeData(data: any): string {
  return JSON.stringify(data, (key, value) => {
    if (value instanceof Date) {
      return value.toISOString(); // Store dates as ISO strings
    }
    return value;
  });
}

// Helper to deserialize data, converting ISO strings back to Dates
function deserializeData<T>(jsonString: string | null): T | null {
  if (!jsonString) return null;
  try {
    return JSON.parse(jsonString, (key, value) => {
      // Check if value looks like an ISO date string
      if (
        typeof value === "string" &&
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)
      ) {
        return new Date(value);
      }
      return value;
    }) as T;
  } catch (error) {
    console.error("Error parsing data from localStorage:", error);
    return null;
  }
}

// Generic function to save data to localStorage
export function saveData<T>(key: string, data: T): boolean {
  if (typeof window === "undefined" || !window.localStorage) {
    console.warn("localStorage is not available. Data not saved.");
    return false;
  }
  try {
    const serializedData = serializeData(data);
    localStorage.setItem(key, serializedData);
    return true;
  } catch (error) {
    console.error(`Error saving data to localStorage (key: ${key}):`, error);
    return false;
  }
}

// Generic function to load data from localStorage
export function loadData<T>(key: string): T | null {
  if (typeof window === "undefined" || !window.localStorage) {
    console.warn("localStorage is not available. Cannot load data.");
    return null;
  }
  try {
    const serializedData = localStorage.getItem(key);
    return deserializeData<T>(serializedData);
  } catch (error) {
    console.error(`Error loading data from localStorage (key: ${key}):`, error);
    return null;
  }
}

// Function to clear data from localStorage
export function clearData(key: string): boolean {
  if (typeof window === "undefined" || !window.localStorage) {
    console.warn("localStorage is not available. Cannot clear data.");
    return false;
  }
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(
      `Error clearing data from localStorage (key: ${key}):`,
      error
    );
    return false;
  }
}
