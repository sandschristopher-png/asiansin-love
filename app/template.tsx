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
            transform: translateY(3px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}