/**
 * Safely extract a string query parameter from req.query.
 * Express 5 types query values as string | string[] | undefined.
 */
export const qs = (val: unknown): string | undefined =>
  typeof val === 'string' ? val : undefined;

/**
 * Safely extract a numeric query parameter from req.query.
 */
export const qi = (val: unknown): number | undefined => {
  if (typeof val === 'string') {
    const n = parseInt(val, 10);
    return isNaN(n) ? undefined : n;
  }
  return undefined;
};

/**
 * Safely extract a string route parameter from req.params.
 * Express 5 types param values as string | string[].
 */
export const ps = (val: string | string[]): string =>
  Array.isArray(val) ? val[0] : val;
