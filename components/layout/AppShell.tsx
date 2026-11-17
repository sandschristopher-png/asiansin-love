import React from 'react';

/** Width of the app column on every screen. Sheets, toasts and the nav use the same 480px cap. */
export const APP_SHELL_MAX = 'max-w-[480px]';

/**
 * The one app frame, shared by every route (LayoutShell chooses which variant a route needs).
 * Phones (< 768px): the column fills the screen. Wider screens: the same column, centred, with a
 * hairline border and a soft shadow over the slate backdrop (the <body> background). Components
 * are never forked into mobile and desktop versions: they all render inside this column.
 *
 *   flow    the frame grows with its content and the browser window scrolls (public landing page: no
 *           inner scrollbar; its sticky header sticks to the window). globals.css un-clips <body>
 *           for it. Otherwise the frame is a clipped flex column and a child scrolls.
 */
export function AppShell({ children, flow = false }: { children: React.ReactNode; flow?: boolean }) {
  return (
    <div
      data-window-scroll={flow ? '' : undefined}
      className={`relative mx-auto w-full ${APP_SHELL_MAX} bg-white md:border-x md:border-slate-200/60 md:shadow-[0_0_50px_-12px_rgba(0,0,0,0.06)] ${
        flow ? 'min-h-[100dvh]' : 'h-[100dvh] min-h-[100dvh] flex flex-col overflow-hidden'
      }`}
    >
      {children}
    </div>
  );
}

export default AppShell;
