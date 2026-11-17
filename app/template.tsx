import React from 'react';

/**
 * Wraps every page and re-mounts on each navigation. It used to fade the whole page in from 0% opacity, which
 * showed as a white flash every time a bottom tab was tapped. The settle is now 94% -> 100% over 120 ms (see
 * .ail-route-in in globals.css): the new page is there at once, with no dip, no transform (a transform here
 * would turn it into the containing block for fixed-position children) and none at all for reduced motion.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="ail-route-in">{children}</div>;
}
