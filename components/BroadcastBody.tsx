import React from 'react';

const URL_RE = /(https?:\/\/[^\s<>"')\]]+)/g;
// **bold**, __bold__ or *bold* (single words or phrases, no line breaks inside).
const EMPHASIS_RE = /(\*\*[^*\n]+\*\*|__[^_\n]+__|\*[^*\s][^*\n]*\*)/g;
const BULLET_RE = /^\s*(?:[-*•])\s+/;

/** URLs become links; everything else stays a React text node (a body can never inject markup). */
function withLinks(text: string, keyBase: string): React.ReactNode[] {
  return text.split(URL_RE).map((part, i) =>
    i % 2 === 1 ? (
      <a key={`${keyBase}-a${i}`} href={part} target="_blank" rel="noopener noreferrer" className="text-[#8574B7] underline underline-offset-2 hover:text-[#534377] transition-colors">
        {part}
      </a>
    ) : (
      <React.Fragment key={`${keyBase}-t${i}`}>{part}</React.Fragment>
    )
  );
}

/** Markdown-style emphasis is rendered as <strong>, so members never see raw asterisks. */
function inline(text: string, keyBase: string): React.ReactNode[] {
  return text.split(EMPHASIS_RE).flatMap((part, i): React.ReactNode[] => {
    if (i % 2 === 1) {
      const inner = part.replace(/^(\*\*|__|\*)/, '').replace(/(\*\*|__|\*)$/, '');
      return [<strong key={`${keyBase}-s${i}`} className="font-semibold">{withLinks(inner, `${keyBase}-s${i}`)}</strong>];
    }
    return withLinks(part, `${keyBase}-p${i}`);
  });
}

/**
 * Announcement body: blank lines start new paragraphs, single line breaks are kept, "- " / "* "
 * lines become a bulleted list, **bold** / *bold* render as bold, and plain http(s) URLs become
 * links. Rendered as React nodes, never as HTML.
 */
export function BroadcastBody({ text, className = '' }: { text: string; className?: string }) {
  const blocks = String(text || '')
    .replace(/\r\n/g, '\n')
    .split(/\n\s*\n/)
    .map((b) => b.replace(/^\n+|\n+$/g, ''))
    .filter((b) => b.trim());

  return (
    <div className={`break-words space-y-2 ${className}`}>
      {blocks.map((block, bi) => {
        const lines = block.split('\n');
        if (lines.every((l) => BULLET_RE.test(l))) {
          return (
            <ul key={bi} className="list-disc pl-5 space-y-0.5">
              {lines.map((l, li) => (
                <li key={li}>{inline(l.replace(BULLET_RE, ''), `${bi}-${li}`)}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={bi}>
            {lines.map((l, li) => (
              <React.Fragment key={li}>
                {li > 0 && <br />}
                {inline(l, `${bi}-${li}`)}
              </React.Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

export default BroadcastBody;
