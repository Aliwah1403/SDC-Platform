/**
 * Converts a snake_case string to camelCase.
 * e.g. "pain_level" → "painLevel"
 */
function snakeToCamel(str) {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

/**
 * Converts a camelCase string to snake_case.
 * e.g. "painLevel" → "pain_level"
 */
function camelToSnake(str) {
  return str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

/**
 * Recursively converts all object keys from snake_case to camelCase.
 * Arrays of primitives (text[], uuid[]) are left as-is.
 * Arrays of objects are recursively mapped.
 */
export function toCamelCase(obj) {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) =>
      typeof item === 'object' && item !== null ? toCamelCase(item) : item
    );
  }
  if (typeof obj !== 'object') return obj;

  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [
      snakeToCamel(key),
      typeof value === 'object' && value !== null && !Array.isArray(value)
        ? toCamelCase(value)
        : Array.isArray(value) && value.length > 0 && typeof value[0] === 'object'
          ? value.map(toCamelCase)
          : value,
    ])
  );
}

/**
 * Converts all object keys from camelCase to snake_case (one level deep).
 * Does not recurse — use at the mutation boundary before sending to Supabase.
 */
export function toSnakeCase(obj) {
  if (obj === null || obj === undefined) return obj;
  return Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [camelToSnake(key), value])
  );
}
