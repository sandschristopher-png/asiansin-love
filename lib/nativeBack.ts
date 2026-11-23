/**
 * What the Android back button does. No imports, so it is unit-tested (scripts/test-native-gates.mjs).
 *   close_dialog  a sheet or dialog is open: close it first
 *   history_back  on a sub-page with somewhere to go back to
 *   go_discover   on a root tab other than Discover: go home instead of leaving
 *   exit          on Discover, or nowhere to go back to: leave the app
 */
export const ROOT_TABS = ['/discover', '/moments', '/favorites', '/messages', '/profile'] as const;

export type BackAction = 'close_dialog' | 'history_back' | 'go_discover' | 'exit';

export function decideBack(o: { path: string; historyLength: number; dialogOpen: boolean }): BackAction {
  if (o.dialogOpen) return 'close_dialog';
  const here = (o.path || '/').replace(/\/+$/, '') || '/';
  const isRoot = (ROOT_TABS as readonly string[]).includes(here);
  if (!isRoot && o.historyLength > 1) return 'history_back';
  if (isRoot && here !== '/discover') return 'go_discover';
  return 'exit';
}
