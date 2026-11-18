import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * False during server rendering and the hydration pass, true on every client render after that. The React-approved
 * way to hold back browser-only output (portals, anything reading `window`) without an effect that sets state.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
