/**
 * Parse a JSON string array safely, returning an empty array if parsing fails
 */
export function parseJsonArray(jsonStr: string | undefined | null): string[] {
  if (!jsonStr) return [];
  try {
    const parsed = JSON.parse(jsonStr);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    // console.error('Error parsing JSON array:', e);
    return [];
  }
}

/**
 * Stringify an array safely, returning "[]" if stringification fails
 */
export function stringifyArray(arr: string[]): string {
  try {
    return JSON.stringify(arr);
  } catch (e) {
    console.error('Error stringifying array:', e);
    return '[]';
  }
}

/**
 * Parse a JSON object safely, returning an empty object if parsing fails
 */
export function parseJsonObject<T>(jsonStr: string | undefined | null, defaultValue: T): T {
  if (!jsonStr) return defaultValue;
  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error('Error parsing JSON object:', e);
    return defaultValue;
  }
}

/**
 * Stringify an object safely, returning "{}" if stringification fails
 */
export function stringifyObject<T>(obj: T): string {
  try {
    return JSON.stringify(obj);
  } catch (e) {
    console.error('Error stringifying object:', e);
    return '{}';
  }
}
