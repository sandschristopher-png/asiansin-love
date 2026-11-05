import React from 'react';

const URL_RE = /(https?:\/\/[^\s<>"')\]]+)/g;

/**
 * Announcement body: keeps line breaks (whitespace-pre-line) and turns plain http(s) URLs into
 * links. Text is rendered as React text nodes, never as HTML, so a body can't inject markup.
 */
export function BroadcastBody({ text, className = '' }: { text: string; className?: string }) {
  const parts = text.split(URL_RE);
  return (
    <p className={`whitespace-pre-line break-words ${className}`}>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-[#72519A] underline underline-offset-2 hover:text-[#9474C3] transition-colors">
            {part}
          </a>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </p>
  );
}

export default BroadcastBody;
