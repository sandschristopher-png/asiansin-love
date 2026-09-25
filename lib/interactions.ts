export type InteractionType = 'like' | 'save' | 'pass';

const STORAGE_KEY_LIKES = 'ail_liked_ids';
const STORAGE_KEY_SAVES = 'ail_saved_ids';
const STORAGE_KEY_PASSES = 'ail_passed_ids';

function getStoredIds(key: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setStoredIds(key: string, ids: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(ids));
  } catch (err) {
    console.error('Failed to persist interaction', err);
  }
}

export function getLocalInteractions() {
  return {
    liked: getStoredIds(STORAGE_KEY_LIKES),
    saved: getStoredIds(STORAGE_KEY_SAVES),
    passed: getStoredIds(STORAGE_KEY_PASSES),
  };
}

export async function toggleInteraction(
  targetId: string,
  type: InteractionType
): Promise<{ active: boolean; currentList: string[] }> {
  const key =
    type === 'like'
      ? STORAGE_KEY_LIKES
      : type === 'save'
      ? STORAGE_KEY_SAVES
      : STORAGE_KEY_PASSES;

  const current = getStoredIds(key);
  const exists = current.includes(targetId);

  const updated = exists
    ? current.filter((id) => id !== targetId)
    : [...current, targetId];

  setStoredIds(key, updated);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('ail-interaction-sync', {
        detail: { targetId, type, active: !exists },
      })
    );
  }

  return { active: !exists, currentList: updated };
}

export async function undoPass(targetId: string): Promise<string[]> {
  const current = getStoredIds(STORAGE_KEY_PASSES);
  const updated = current.filter((id) => id !== targetId);
  setStoredIds(STORAGE_KEY_PASSES, updated);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('ail-interaction-sync', {
        detail: { targetId, type: 'pass', active: false },
      })
    );
  }

  return updated;
}