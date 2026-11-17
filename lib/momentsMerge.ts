/**
 * Applies a freshly fetched feed page on top of the changes the member made while it was loading.
 *
 * The Moments page paints cached cards at once and refreshes in the background. A like or delete made
 * in that window reaches the server after the refresh query ran, so the refresh answers with the old
 * count; without this the heart would flip back (the "1 goes back to 0" bug). Every edit is stamped when
 * it happens; an edit stamped at or after the refresh began wins over the fetched row.
 */
import type { MomentItem } from '@/lib/moments';

export interface MomentEdit {
  at: number;
  like?: { liked: boolean; count: number };
  removed?: boolean;
}

export function mergeRefresh(fetched: MomentItem[], edits: ReadonlyMap<string, MomentEdit>, startedAt: number): MomentItem[] {
  const out: MomentItem[] = [];
  for (const item of fetched) {
    const edit = edits.get(item.id);
    const recent = Boolean(edit && edit.at >= startedAt);
    if (recent && edit!.removed) continue;
    out.push(recent && edit!.like ? { ...item, likedByMe: edit!.like.liked, likesCount: edit!.like.count } : item);
  }
  return out;
}
