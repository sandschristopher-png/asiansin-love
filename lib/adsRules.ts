/**
 * When an ad may be shown. No imports, so it is unit-tested (scripts/test-native-gates.mjs). All three must hold:
 *   - the Android app (a browser never gets an ad, and never loads the ads plugin),
 *   - a member who is known not to have Plus (while the plan is loading, or for Plus members, nothing is shown),
 *   - an AdMob banner unit id is configured (NEXT_PUBLIC_ADMOB_BANNER_ID): without one there is simply no ad.
 */
export function shouldShowAds(o: { native: boolean; plus: boolean | null; unitId: string | undefined }): boolean {
  return o.native === true && o.plus === false && typeof o.unitId === 'string' && o.unitId.trim().length > 0;
}
