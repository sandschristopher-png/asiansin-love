import React from 'react';

/** Width of the app column on every screen. Sheets, toasts and the nav use the same 480px cap. */
export const APP_SHELL_MAX = 'max-w-[480px]';

/**
 * The one app frame, shared by every route (LayoutShell chooses which variant a route needs).
 * Phones (< 768px): the column fills the screen. Wider screens: the same column, centred, with a
 * hairline border and a soft shadow over the slate backdrop (the <body> background). Components
 * are never forked into mobile and desktop versions: they all render inside this column.
 *
 *   scroll  the frame itself is the scroll container (public landing page, whose sticky header
 *           sticks within it); otherwise the frame is a clipped flex column and a child scrolls.
 */
export function AppShell({ children, scroll = false }: { children: React.ReactNode; scroll?: boolean }) {
  return (
    <div
      className={`relative mx-auto h-[100dvh] w-full ${APP_SHELL_MAX} bg-white md:border-x md:border-slate-200/60 md:shadow-[0_0_50px_-12px_rgba(0,0,0,0.06)] ${
        scroll ? 'overflow-y-auto overflow-x-hidden overscroll-y-contain' : 'min-h-[100dvh] flex flex-col overflow-hidden'
      }`}
    >
      {children}
    </div>
  );
}

export default AppShell;
