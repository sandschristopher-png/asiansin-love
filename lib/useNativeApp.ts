'use client';

import { useSyncExternalStore } from 'react';
import { isNativeApp } from '@/lib/nativeApp';

const subscribeNever = () => () => {};

/** True inside the Android app. The server and the first browser render say false, so the website never flashes an app-only state. */
export function useIsNativeApp(): boolean {
  return useSyncExternalStore(subscribeNever, isNativeApp, () => false);
}
