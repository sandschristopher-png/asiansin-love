import { supabase } from './supabase/client';

export async function hardSignOut() {
  try { await supabase.auth.signOut(); } catch (e) { /* session may already be dead */ }
  // Purge all Supabase local storage keys so ghost sessions can't resurrect
  if (typeof window !== 'undefined' && window.localStorage) {
    const doomed: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('sb-') || k.startsWith('ail_'))) doomed.push(k);
    }
    doomed.forEach((k) => localStorage.removeItem(k));
  }
}
