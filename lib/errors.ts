/** Message of anything that was thrown (Error, string, or an object with a `message`), never undefined. */
export function errMsg(e: unknown, fallback = ''): string {
  if (e instanceof Error) return e.message || fallback;
  if (typeof e === 'string') return e || fallback;
  if (e && typeof e === 'object' && 'message' in e && typeof (e as { message: unknown }).message === 'string') {
    return (e as { message: string }).message || fallback;
  }
  return fallback;
}

/** A named field of a thrown value (for example Postgres `code` or an HTTP `status`), or undefined. */
export function errField<T = unknown>(e: unknown, key: string): T | undefined {
  if (e && typeof e === 'object' && key in e) return (e as Record<string, T>)[key];
  return undefined;
}
