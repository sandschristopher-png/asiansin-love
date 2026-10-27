'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { X, Check, AlertCircle, Loader2 } from 'lucide-react';

export interface EditableInterest {
  tag_id: string;
  label: string;
  is_highlight: boolean;
  highlight_story?: string | null;
}

interface EditHighlightsModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableInterests: EditableInterest[];
  onSave: (updatedHighlights: { tag_id: string; highlight_story: string }[]) => Promise<boolean>;
}

export function EditHighlightsModal({
  isOpen,
  onClose,
  availableInterests,
  onSave,
}: EditHighlightsModalProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [stories, setStories] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedIds(
      availableInterests.filter((i) => i.is_highlight).map((i) => i.tag_id).slice(0, 3)
    );
    const map: Record<string, string> = {};
    availableInterests.forEach((i) => {
      if (i.highlight_story) map[i.tag_id] = i.highlight_story;
    });
    setStories(map);
    setError(null);
  }, [isOpen, availableInterests]);

  if (!isOpen) return null;

  const toggleHighlight = (tagId: string) => {
    setError(null);
    if (selectedIds.includes(tagId)) {
      setSelectedIds((prev) => prev.filter((id) => id !== tagId));
    } else {
      if (selectedIds.length >= 3) {
        setError('You can select a maximum of 3 Highlights.');
        return;
      }
      setSelectedIds((prev) => [...prev, tagId]);
    }
  };

  const handleStoryChange = (tagId: string, text: string) => {
    if (text.length <= 120) {
      setStories((prev) => ({ ...prev, [tagId]: text }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    const payload = selectedIds.map((id) => ({
      tag_id: id,
      highlight_story: (stories[id] || '').trim(),
    }));

    const success = await onSave(payload);
    setIsSaving(false);

    if (success) {
      onClose();
    } else {
      setError('Failed to update Highlights. Please try again.');
    }
  };

  const selectedObjects = availableInterests.filter((i) => selectedIds.includes(i.tag_id));

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-[#DDD7E5] bg-[#F8F7FA] shadow-xl max-h-[90dvh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[#EEE9F3] shrink-0">
          <h3 className="text-sm font-bold text-[#1C1924]">
            Curate Your Top 3 Highlights
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-[#6C637B] hover:bg-[#F3EFFC] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto no-scrollbar px-5 py-4 space-y-4">
          <p className="text-xs text-[#6C637B] leading-relaxed">
            Pick up to 3 interests to spotlight on your profile and write a quick story or comment to give matches an easy conversation starter.
          </p>

          {error && (
            <div
              role="alert"
              className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-100 p-3 text-xs text-rose-600"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold text-[#524B5E]">
              <span>Select Interests ({selectedIds.length}/3)</span>
            </div>
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1">
              {availableInterests.map((item) => {
                const isSelected = selectedIds.includes(item.tag_id);
                return (
                  <button
                    key={item.tag_id}
                    type="button"
                    onClick={() => toggleHighlight(item.tag_id)}
                    className={'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ' + (isSelected
                      ? 'bg-[#6555B8] text-white shadow-xs'
                      : 'border border-[#DDD7E5] bg-white text-[#524B5E] hover:border-[#6555B8]/50')}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedObjects.length > 0 && (
            <div className="space-y-3 pt-2">
              <span className="text-xs font-semibold text-[#524B5E]">
                Mini-Stories &amp; Context
              </span>
              <div className="space-y-3">
                {selectedObjects.map((item) => {
                  const val = stories[item.tag_id] || '';
                  return (
                    <div
                      key={item.tag_id}
                      className="rounded-xl border border-[#DDD7E5] bg-white p-3"
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-xs font-bold text-[#1C1924]">
                          {item.label}
                        </span>
                        <span className="text-[10px] text-[#6C637B]">
                          {val.length}/120
                        </span>
                      </div>
                      <input
                        type="text"
                        value={val}
                        maxLength={120}
                        onChange={(e) => handleStoryChange(item.tag_id, e.target.value)}
                        placeholder={`Why do you love ${item.label}? (e.g., favorite spots, habits)`}
                        className="w-full rounded-lg border border-[#DDD7E5] bg-[#F8F7FA] px-3 py-2 text-xs text-[#1C1924] outline-none focus:border-[#6555B8] transition-colors"
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#6555B8] py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-[#5849a6] disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                'Save Highlights'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}