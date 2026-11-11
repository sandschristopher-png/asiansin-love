'use client';

import React, { useEffect, useState } from 'react';
import { Megaphone, Pin, PinOff, Send, Trash2 } from 'lucide-react';
import { BroadcastBody } from '@/components/BroadcastBody';
import { AdminButton, BottomSheet, EmptyState, Loading, Notice, PageTitle, adminFetch } from '@/components/admin/ui';
import { BROADCAST_BODY_MAX, BROADCAST_TAGS, BROADCAST_TITLE_MAX, type Broadcast, type BroadcastTag } from '@/lib/broadcasts';

const errorMessage = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong.');

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

/** /admin/announcements: compose + broadcast to every member, then manage past broadcasts. */
export function AnnouncementsManager() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tag, setTag] = useState<BroadcastTag>('Update');
  const [pinned, setPinned] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [sending, setSending] = useState(false);
  const [items, setItems] = useState<Broadcast[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [flash, setFlash] = useState('');

  // Bumping `version` re-fetches the list (after a broadcast, pin or delete).
  const [version, setVersion] = useState(0);
  const load = () => setVersion((v) => v + 1);

  useEffect(() => {
    let alive = true;
    adminFetch<{ announcements: Broadcast[] }>('/api/admin/announcements')
      .then((r) => alive && setItems(r.announcements))
      .catch((e: unknown) => {
        if (!alive) return;
        setError(errorMessage(e));
        setItems([]);
      });
    return () => {
      alive = false;
    };
  }, [version]);

  const canSend = title.trim().length > 0 && body.trim().length > 0;

  const broadcast = async () => {
    setSending(true);
    setError('');
    setFlash('');
    try {
      await adminFetch('/api/admin/announcements', { action: 'create', title: title.trim(), body: body.trim(), tag, isPinned: pinned });
      setFlash('Announcement broadcast to all members.');
      setTitle('');
      setBody('');
      setTag('Update');
      setPinned(false);
      setConfirming(false);
      load();
    } catch (e: unknown) {
      setError(errorMessage(e));
      setConfirming(false);
    } finally {
      setSending(false);
    }
  };

  const act = async (id: string, payload: Record<string, unknown>, msg: string) => {
    setBusyId(id);
    setError('');
    setFlash('');
    try {
      await adminFetch('/api/admin/announcements', { id, ...payload });
      setFlash(msg);
      load();
    } catch (e: unknown) {
      setError(errorMessage(e));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <PageTitle title="Announcements" subtitle="Broadcast news to every member's Announcements feed." />

      {flash && <Notice kind="success">{flash}</Notice>}
      {error && <Notice kind="error">{error}</Notice>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (canSend) setConfirming(true);
        }}
        className="mb-6 p-4 rounded-2xl border border-[#D0CDE1] bg-white shadow-2xs space-y-3"
      >
        <div>
          <label htmlFor="ann-title" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            Title
          </label>
          <input
            id="ann-title"
            value={title}
            maxLength={BROADCAST_TITLE_MAX}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Voice intros are here"
            className="w-full h-11 px-3 border border-[#D0CDE1] focus:border-[#8574B7] rounded-xl text-[#413B5E] font-semibold outline-none"
          />
        </div>

        <div>
          <p className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Category</p>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Category">
            {BROADCAST_TAGS.map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={tag === t}
                onClick={() => setTag(t)}
                className={`h-8 px-3 rounded-full border text-xs font-medium transition-colors ${
                  tag === t ? 'bg-[#413B5E] text-white border-[#413B5E]' : 'bg-white text-[#413B5E] border-[#D0CDE1] hover:border-[#8574B7]/40'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="ann-body" className="block text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            Message
          </label>
          <textarea
            id="ann-body"
            value={body}
            maxLength={BROADCAST_BODY_MAX}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            placeholder={'Write the announcement. Blank lines start new paragraphs; https:// links become tappable.'}
            className="w-full px-3 py-2.5 border border-[#D0CDE1] focus:border-[#8574B7] rounded-xl text-sm leading-relaxed text-[#413B5E] outline-none resize-y"
          />
          <p className="mt-1 text-right text-[11px] text-slate-600 tabular-nums">
            {body.length}/{BROADCAST_BODY_MAX}
          </p>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-[#D0CDE1] px-3 h-12">
          <span className="text-sm font-semibold text-[#413B5E] flex items-center gap-1.5">
            <Pin className="w-4 h-4 text-[#8574B7]" aria-hidden />
            Pin to top
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={pinned}
            aria-label="Pin to top"
            onClick={() => setPinned((v) => !v)}
            className={`w-11 h-6 rounded-full relative transition-colors ${pinned ? 'bg-[#8574B7]' : 'bg-[#E8E6F1]'}`}
          >
            <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${pinned ? 'left-6' : 'left-1'}`} />
          </button>
        </div>

        <button
          type="submit"
          disabled={!canSend}
          className="w-full bg-[#8574B7] hover:bg-[#534377] text-white font-medium h-11 px-6 rounded-full shadow-[0_2px_10px_rgba(102,93,150,0.25)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" aria-hidden />
          Broadcast to All Members
        </button>
      </form>

      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 mb-2">Past broadcasts</p>
      {!items ? (
        <Loading />
      ) : items.length === 0 ? (
        <EmptyState icon={Megaphone} title="No announcements yet" body="Broadcasts you send appear here." />
      ) : (
        <ul className="rounded-2xl border border-[#D0CDE1] bg-white divide-y divide-[#D0CDE1] overflow-hidden">
          {items.map((a) => (
            <li key={a.id} className="px-3 py-3">
              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-[#413B5E]/75 tabular-nums">{formatDate(a.published_at)}</span>
                <span className="bg-[#8574B7]/10 text-[#8574B7] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider text-[10px]">{a.tag}</span>
                {a.is_pinned && (
                  <span className="inline-flex items-center gap-0.5 font-semibold text-[#413B5E]">
                    <Pin className="w-3 h-3" aria-hidden />
                    Pinned
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm font-semibold text-[#413B5E]">{a.title}</p>
              <BroadcastBody text={a.body} className="mt-0.5 text-xs text-[#413B5E]/75 leading-relaxed line-clamp-2" />
              <div className="mt-2 flex gap-2">
                <AdminButton
                  busy={busyId === a.id}
                  disabled={!!busyId}
                  onClick={() => act(a.id, { action: 'set_pinned', pinned: !a.is_pinned }, a.is_pinned ? 'Unpinned.' : 'Pinned to the top.')}
                >
                  {a.is_pinned ? <PinOff className="w-3.5 h-3.5" aria-hidden /> : <Pin className="w-3.5 h-3.5" aria-hidden />}
                  {a.is_pinned ? 'Unpin' : 'Pin'}
                </AdminButton>
                <AdminButton tone="danger" disabled={!!busyId} onClick={() => act(a.id, { action: 'delete' }, 'Announcement deleted.')}>
                  <Trash2 className="w-3.5 h-3.5" aria-hidden />
                  Delete
                </AdminButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      {confirming && (
        <BottomSheet title="Broadcast to all members?" subtitle={title.trim()} onClose={() => !sending && setConfirming(false)}>
          <div className="p-4 space-y-4">
            <p className="text-sm text-[#413B5E]/80 leading-relaxed">
              This announcement appears immediately in every member&apos;s Announcements feed, and members see an unread dot in the menu.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <AdminButton size="lg" onClick={() => setConfirming(false)} disabled={sending}>
                Cancel
              </AdminButton>
              <AdminButton size="lg" tone="primary" busy={sending} onClick={broadcast}>
                Broadcast
              </AdminButton>
            </div>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}

export default AnnouncementsManager;
