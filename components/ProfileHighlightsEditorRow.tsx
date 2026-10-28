'use client';

import { useState } from 'react';
import { ChevronRight, Loader2, MessageCircle } from 'lucide-react';
import { useHighlights, type EditableInterest } from '@/hooks/useHighlights';
import { EditHighlightsModal } from '@/components/EditHighlightsModal';

export function ProfileHighlightsEditorRow() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { availableInterests, isLoading, saveHighlights } = useHighlights();

  const activeHighlights: EditableInterest[] = availableInterests.filter((i) => i.is_highlight);

  return (
    <div className="rounded-3xl bg-white border border-[#DDD7E5] shadow-xs p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-[#524B5E]">
          Profile Highlights
        </span>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#6555B8] hover:underline"
        >
          {activeHighlights.length > 0 ? `Manage (${activeHighlights.length}/3)` : 'Add Highlights'}
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-2 text-xs text-[#6C637B]">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading your highlights...
        </div>
      ) : activeHighlights.length === 0 ? (
        <p className="text-xs text-[#6C637B]">
          No highlights chosen. Select up to 3 interests to showcase on your profile.
        </p>
      ) : (
        <div className="space-y-2.5 pt-1">
          {activeHighlights.map((item) => (
            <div
              key={item.tag_id}
              className="rounded-2xl border border-[#DDD7E5] bg-white p-3"
            >
              <span className="inline-flex items-center rounded-full border border-[#6555B8]/30 bg-[#6555B8]/10 px-2.5 py-1 text-[11px] font-semibold text-[#6555B8]">
                {item.label}
              </span>
              {item.highlight_story && (
                <div className="mt-2 flex items-start gap-2 rounded-xl bg-[#F8F7FA] p-2.5 text-xs text-[#6C637B]">
                  <MessageCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#6555B8]" />
                  <p className="italic">{item.highlight_story}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <EditHighlightsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        availableInterests={availableInterests}
        onSave={saveHighlights}
      />
    </div>
  );
}