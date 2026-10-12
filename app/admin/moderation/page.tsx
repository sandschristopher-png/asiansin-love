'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  AlertTriangle,
  User,
  Clock,
  ChevronRight,
  Loader2,
  X
} from 'lucide-react';

interface ModeratedMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  is_quarantined: boolean;
  created_at: string;
  sender?: {
    id?: string;
    username?: string;
    full_name?: string;
    reputation_score?: number;
  };
  recipient?: {
    id?: string;
    username?: string;
    full_name?: string;
  };
}

export default function AdminModerationPage() {
  const [messages, setMessages] = useState<ModeratedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMessage, setActiveMessage] = useState<ModeratedMessage | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [penaltyPoints, setPenaltyPoints] = useState<number>(10);
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchQuarantinedMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/admin/moderation');
      if (!res.ok) {
        throw new Error(`Failed to load queue (Status: ${res.status})`);
      }
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err: any) {
      setError(err.message || 'Unable to fetch moderation queue.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuarantinedMessages();
  }, [fetchQuarantinedMessages]);

  const handleAction = async (action: 'release' | 'confirm') => {
    if (!activeMessage) return;

    try {
      setActionLoading(true);
      setActionFeedback(null);

      const res = await fetch('/api/admin/moderation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          messageId: activeMessage.id,
          notes: reviewNotes.trim() || undefined,
          penaltyPoints: action === 'confirm' ? penaltyPoints : 0,
        }),
      });

      const result = await res.json();

      if (!res.ok || !result.success) {
        throw new Error(result.error || `Failed to ${action} message`);
      }

      setActionFeedback({
        type: 'success',
        text: action === 'release' 
          ? 'Quarantine lifted. Message delivered to conversation stream.'
          : `Violation confirmed. Sender docked ${penaltyPoints} points.`,
      });

      setMessages((prev) => prev.filter((m) => m.id !== activeMessage.id));
      setActiveMessage(null);
      setReviewNotes('');
    } catch (err: any) {
      setActionFeedback({
        type: 'error',
        text: err.message || 'Action failed to execute.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredMessages = messages.filter((m) => {
    const q = searchQuery.toLowerCase();
    const senderName = m.sender?.username || m.sender?.full_name || m.sender_id;
    return (
      m.content.toLowerCase().includes(q) ||
      senderName.toLowerCase().includes(q) ||
      m.id.toLowerCase().includes(q)
    );
  });

  const getReputationBadge = (score?: number) => {
    const s = score ?? 100;
    if (s >= 80) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800">
          Rep {s}
        </span>
      );
    }
    if (s >= 50) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-950/60 text-amber-400 border border-amber-800">
          Rep {s}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-950/60 text-rose-400 border border-rose-800">
        Rep {s}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* Mobile-Sized Single Column Container */}
      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-5">
        
        {/* Sticky-Friendly Header */}
        <header className="space-y-3 border-b border-slate-900 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-rose-950/60 border border-rose-800/80 rounded-xl text-rose-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">Moderation Queue</h1>
                <p className="text-xs text-slate-400">Review quarantined safety incidents</p>
              </div>
            </div>

            <button
              onClick={() => fetchQuarantinedMessages()}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition disabled:opacity-50"
              aria-label="Refresh queue"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Filter by keyword or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-sm placeholder:text-slate-500 focus:outline-none focus:border-rose-500 text-slate-100"
            />
          </div>
        </header>

        {/* Global Feedback Alert */}
        {actionFeedback && (
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-all ${
              actionFeedback.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                : 'bg-rose-950/40 border-rose-800 text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {actionFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{actionFeedback.text}</span>
            </div>
            <button
              onClick={() => setActionFeedback(null)}
              className="underline text-slate-400 hover:text-slate-200 ml-3"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Status / Message List */}
        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-3 bg-slate-900/30 rounded-2xl border border-slate-800/80">
            <Loader2 className="w-7 h-7 animate-spin text-rose-500" />
            <p className="text-xs">Loading pending items...</p>
          </div>
        ) : error ? (
          <div className="p-6 bg-rose-950/30 border border-rose-900/60 rounded-2xl text-center text-rose-300 space-y-2">
            <AlertTriangle className="w-5 h-5 mx-auto" />
            <p className="text-xs font-medium">{error}</p>
            <button
              onClick={() => fetchQuarantinedMessages()}
              className="text-xs text-rose-400 underline"
            >
              Retry
            </button>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-slate-900/30 rounded-2xl border border-slate-800/80 space-y-2">
            <CheckCircle2 className="w-9 h-9 text-emerald-500/80 mx-auto" />
            <p className="text-sm font-semibold text-slate-200">All Clean</p>
            <p className="text-xs text-slate-500">No quarantined messages need review right now.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMessages.map((msg) => {
              const senderLabel = msg.sender?.username || msg.sender?.full_name || `User ${msg.sender_id.slice(0, 8)}`;
              
              return (
                <div
                  key={msg.id}
                  onClick={() => {
                    setActiveMessage(msg);
                    setActionFeedback(null);
                  }}
                  role="button"
                  tabIndex={0}
                  className="w-full text-left p-4 rounded-2xl border bg-slate-900/60 border-slate-800/90 active:scale-[0.99] hover:border-slate-700 transition cursor-pointer space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium text-slate-200 truncate max-w-[140px] sm:max-w-none">
                        {senderLabel}
                      </span>
                      {getReputationBadge(msg.sender?.reputation_score)}
                    </div>
                    <span className="text-[11px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Flagged Content Preview */}
                  <p className="text-xs sm:text-sm text-slate-300 font-mono bg-slate-950/70 p-3 rounded-xl border border-slate-800/60 break-words line-clamp-3">
                    "{msg.content}"
                  </p>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="text-rose-400 text-[11px] font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Quarantined
                    </span>
                    <span className="text-slate-400 font-medium flex items-center gap-1 text-[11px]">
                      Review & Actions <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Mobile-First Bottom Sheet / Centered Modal */}
      {activeMessage && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={() => setActiveMessage(null)}
          />

          {/* Drawer Body */}
          <div className="relative w-full sm:max-w-lg bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-2xl max-h-[92vh] overflow-y-auto p-5 sm:p-6 space-y-5 shadow-2xl z-10 animate-in slide-in-from-bottom duration-200">
            {/* Sheet Grab Handle on Mobile */}
            <div className="w-12 h-1.5 bg-slate-700/60 rounded-full mx-auto sm:hidden" />

            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <h3 className="text-base font-semibold text-slate-100">Review Message</h3>
              </div>
              <button
                onClick={() => setActiveMessage(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sender Metadata Bar */}
            <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Sender:</span>
                <span className="font-semibold text-slate-200">
                  {activeMessage.sender?.username || activeMessage.sender_id.slice(0, 12)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Reputation:</span>
                <div>{getReputationBadge(activeMessage.sender?.reputation_score)}</div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Timestamp:</span>
                <span className="text-slate-300">{new Date(activeMessage.created_at).toLocaleString()}</span>
              </div>
            </div>

            {/* Flagged Message Box */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Quarantined Content
              </label>
              <div className="p-3.5 bg-rose-950/20 border border-rose-900/50 rounded-xl text-rose-200 text-xs sm:text-sm font-mono break-words select-all">
                {activeMessage.content}
              </div>
            </div>

            {/* Penalty Setting */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Penalty Points (if confirming violation)
                </label>
                <select
                  value={penaltyPoints}
                  onChange={(e) => setPenaltyPoints(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500"
                >
                  <option value={0}>0 pts (No deduction)</option>
                  <option value={10}>-10 pts (Minor caution)</option>
                  <option value={25}>-25 pts (Off-platform contact/solicitation)</option>
                  <option value={50}>-50 pts (Severe scam/wire request)</option>
                  <option value={100}>-100 pts (Immediate account freeze)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Review Notes (Optional)
                </label>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Reason for releasing or confirming..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>
            </div>

            {/* Large Mobile-Friendly Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleAction('release')}
                disabled={actionLoading}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition disabled:opacity-50 min-h-[46px]"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Release
              </button>

              <button
                onClick={() => handleAction('confirm')}
                disabled={actionLoading}
                className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition disabled:opacity-50 min-h-[46px]"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
