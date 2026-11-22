'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { supabase } from '@/lib/supabase/client';
import { tpScriptAllowed } from '@/lib/travelpayouts';

/** True once the vendor loader has been added to this document. Module state: it lives exactly as long as the page. */
let loaded = false;

/**
 * Travelpayouts Drive AI, on public pages only (the rule is lib/travelpayouts.ts).
 *
 * The loader is the snippet from the Travelpayouts dashboard, unchanged: it creates an async
 * <script data-cmp-ab="2"> for tpembars.com and appends it to <head>. afterInteractive runs it after the page has
 * hydrated, so it can never hold up the first paint or the app itself. The attributes on the wrapper are the snippet's own.
 *
 * Navigating inside the app does not reload the page, and a third-party script cannot be unloaded. So when a visitor
 * moves from a public page to anywhere else (login, signup, the signed-in app) the page is reloaded once: the next
 * screen starts without the script and it never sees a member's chat or profile address.
 */
export function TravelpayoutsDrive() {
  const pathname = usePathname();
  // Only the Travel Hub depends on who is looking (signed out: allowed; signed in: it lists members). Unknown counts as
  // signed in, so the script never starts before the session is read.
  const [signedIn, setSignedIn] = useState(true);
  useEffect(() => {
    if (pathname?.replace(/\/+$/, '') !== '/travel') return;
    let cancelled = false;
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled) setSignedIn(Boolean(session));
    });
    return () => {
      cancelled = true;
    };
  }, [pathname]);
  const allowed = tpScriptAllowed(pathname, signedIn);

  useEffect(() => {
    if (allowed) {
      loaded = true;
      return;
    }
    if (loaded) window.location.reload();
  }, [allowed]);

  if (!allowed) return null;

  return (
    <Script
      id="travelpayouts-drive"
      strategy="afterInteractive"
      data-noptimize="1"
      data-cfasync="false"
      data-wpfc-render="false"
      data-no-defer="1"
      data-cmp-ab="2"
      {...{ nowprocket: '', 'seraph-accel-crit': '1' }}
      dangerouslySetInnerHTML={{
        __html: `(function () {
      var script = document.createElement("script");
      script.async = 1;
      script.setAttribute("data-cmp-ab","2");
      script.src = 'https://tpembars.com/NjA0MjM2.js?t=604236';
      document.head.appendChild(script);
  })();`,
      }}
    />
  );
}

export default TravelpayoutsDrive;
