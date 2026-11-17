/** The four message reactions. Icons are line art (lucide); labels come from messages/*.json (chat.react.*). */
export const REACTION_KEYS = ['heart', 'thumbs_up', 'laugh', 'fire'] as const;
export type ReactionKey = (typeof REACTION_KEYS)[number];

export const isReactionKey = (v: unknown): v is ReactionKey => typeof v === 'string' && (REACTION_KEYS as readonly string[]).includes(v);

/** message id -> member id -> reaction */
export type ReactionMap = Record<string, Record<string, ReactionKey>>;

export interface ReactionTally {
  reaction: ReactionKey;
  count: number;
  /** The viewer reacted with this one. */
  mine: boolean;
}

/** Pills for one message: counts per reaction in the fixed picker order, empty reactions left out. */
export function tallyReactions(byMember: Record<string, ReactionKey> | undefined, viewerId: string): ReactionTally[] {
  if (!byMember) return [];
  return REACTION_KEYS.flatMap((reaction) => {
    const members = Object.entries(byMember).filter(([, r]) => r === reaction);
    return members.length ? [{ reaction, count: members.length, mine: members.some(([id]) => id === viewerId) }] : [];
  });
}

/** Returns the map with one member's reaction on one message set (or removed with null). Never mutates. */
export function withReaction(map: ReactionMap, messageId: string, userId: string, reaction: ReactionKey | null): ReactionMap {
  const current = { ...(map[messageId] ?? {}) };
  if (reaction) current[userId] = reaction;
  else delete current[userId];
  const next = { ...map };
  if (Object.keys(current).length) next[messageId] = current;
  else delete next[messageId];
  return next;
}
