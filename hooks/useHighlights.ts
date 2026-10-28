'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';

export interface EditableInterest {
  tag_id: string;
  label: string;
  is_highlight: boolean;
  highlight_story?: string | null;
}

export function useHighlights() {
  const [availableInterests, setAvailableInterests] = useState<EditableInterest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchInterests = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_user_editable_interests');
      if (error) {
        console.error('[useHighlights] Fetch error:', error.message);
        return;
      }
      if (data) {
        const formatted: EditableInterest[] = data.map((item: any) => ({
          tag_id: item.tag_id,
          label: item.label,
          is_highlight: Boolean(item.is_highlight),
          highlight_story: item.highlight_story || null,
        }));
        setAvailableInterests(formatted);
      }
    } catch (err) {
      console.error('[useHighlights] Unexpected fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInterests();
  }, [fetchInterests]);

  const saveHighlights = async (
    payload: { tag_id: string; highlight_story: string }[]
  ): Promise<boolean> => {
    setIsSaving(true);
    try {
      const { error } = await supabase.rpc('update_user_highlights', {
        p_highlights: payload,
      });
      if (error) {
        console.error('[useHighlights] Save error:', error.message);
        return false;
      }
      await fetchInterests();
      return true;
    } catch (err) {
      console.error('[useHighlights] Unexpected save error:', err);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    availableInterests,
    isLoading,
    isSaving,
    refetch: fetchInterests,
    saveHighlights,
  };
}