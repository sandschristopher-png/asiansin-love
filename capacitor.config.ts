import type { CapacitorConfig } from '@capacitor/cli';

/**
 * The Android app is a thin native shell around the live site: it opens https://meetin.asia in a WebView, so every
 * deploy to Vercel is what members see (no web assets are bundled). `webDir` still has to exist for `cap sync`;
 * `npm run cap:sync` creates a tiny placeholder in out/ when it is missing (out/ is not committed).
 */
const config: CapacitorConfig = {
  appId: 'asia.meetin.app',
  appName: 'Meet in Asia',
  webDir: 'out',
  server: {
    url: 'https://meetin.asia',
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#FFFFFF',
  },
  plugins: {
    StatusBar: {
      overlaysWebView: false,
      style: 'LIGHT',
      backgroundColor: '#FFFFFF',
    },
    // Google's public SAMPLE app id, so the app launches before an AdMob account exists. Replace it with Meet in Asia's
    // own AdMob app id (and the same value in AndroidManifest.xml) before a release: never reuse another app's id.
    AdMob: {
      appId: 'ca-app-pub-3940256099942544~3347511713',
    },
  },
};

export default config;
