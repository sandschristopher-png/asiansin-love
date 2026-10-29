'use client';

import React from 'react';

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ animation: 'routeFadeIn 200ms ease-out forwards' }}>
      {children}
      <style jsx global>{`
        @keyframes routeFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}