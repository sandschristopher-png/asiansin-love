/**
 * Spots a first message trying to move the chat off the app. Advisory only: it decides whether to
 * show a reminder under the bubble and never blocks or changes delivery. Whole-word matching, so
 * "big: deal" or "online app" do not count.
 */
const OFF_PLATFORM_KEYWORDS = [
  'whatsapp',
  'telegram',
  'viber',
  'wechat',
  'line id',
  'line app',
  'skype',
  'instagram',
  'ig:',
  'wa.me',
  't.me',
];

const KEYWORD_RE = new RegExp(
  `(?<![a-z0-9])(?:${OFF_PLATFORM_KEYWORDS.map((k) => k.replace(/[.]/g, '\\.').replace(/ /g, '\\s+')).join('|')})(?![a-z0-9])`,
  'i'
);

/** 7+ digits, optionally international and spaced: +63 917 123 4567, (02) 555-1234. */
const PHONE_RE = /(?<!\d)\+?\d(?:[\s().-]{0,2}\d){6,}(?!\d)/;

export function inspectFirstMessageSafety(text: string): {
  isSuspicious: boolean;
  reason?: 'OFF_PLATFORM_KEYWORD' | 'PHONE_NUMBER';
} {
  if (typeof text !== 'string' || !text) return { isSuspicious: false };
  if (KEYWORD_RE.test(text)) return { isSuspicious: true, reason: 'OFF_PLATFORM_KEYWORD' };
  if (PHONE_RE.test(text)) return { isSuspicious: true, reason: 'PHONE_NUMBER' };
  return { isSuspicious: false };
}
