'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Loader2, User, LogOut, Trash2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { HandleUpgradeModal } from '@/components/HandleUpgradeModal';
import HandleChangeCard from '@/components/HandleChangeCard';

export default function SettingsPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setDeleteError(data.error || 'Failed to delete account. Please try again.');
        setIsDeleting(false);
        return;
      }
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setDeleteError(err.message || 'An unexpected error occurred.');
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    async function loadUserProfile() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          setInitialLoading(false);
          return;
        }

        setUserId(session.user.id);

        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', session.user.id)
          .single();

        if (!error && data?.username) {
          setUsername(data.username);
        }
      } catch (err: any) {
        console.error('Failed to load profile:', err);
      } finally {
        setInitialLoading(false);
      }
    }

    loadUserProfile();
  }, []);

  const handleSaveHandle = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!userId) {
      setErrorMessage('You must be signed in to update your username.');
      return;
    }

    const cleanUsername = username.trim().replace(/^@/, '');

    if (!cleanUsername) {
      setErrorMessage('Username cannot be empty.');
      return;
    }

    if (cleanUsername.length < 3 || cleanUsername.length > 20) {
      setErrorMessage('Username must be between 3 and 20 characters.');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      setErrorMessage('Only letters, numbers, and underscores are allowed.');
      return;
    }

    setIsSaving(true);

    try {
      const res = await fetch('/api/users/change-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 409 || data.error?.includes('taken')) {
          setErrorMessage('That username handle is already taken. Please pick another.');
        } else if (res.status === 403 && (data.requires_payment || data.error?.includes('Plus') || data.error?.includes('AIL+'))) {
          setShowUpgradeModal(true);
        } else {
          setErrorMessage(data.error || 'Failed to update username.');
        }
        return;
      }

      setUsername(cleanUsername);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected network error occurred.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      window.location.href = '/';
    }
  };

  return (
    <div className="w-full min-h-full bg-[#F8F7FA] text-[#1C1924] flex flex-col font-sans">
      <main className="flex-1 w-full px-4 pt-4 pb-28 space-y-5">

        {/* Account Settings Card */}
        <div className="bg-white rounded-3xl border border-[#DDD7E5] p-5 shadow-xs space-y-5">
                  <HandleChangeCard />

          {/* AIL+ Membership Card */}
          <div className="p-4 rounded-2xl bg-[#F8F7FA] border border-[#DDD7E5] flex items-start gap-3.5">
            <img src="/ail-plus.png" alt="AIL+" className="w-9 h-9 rounded-2xl object-cover shrink-0" />
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-1.5">
                <h2
                  className="text-xs sm:text-sm font-bold text-[#1C1924]"
                  style={{ fontFamily: 'var(--font-brand)' }}
                >
                  AIL+ Membership
                </h2>
                <span className="text-[9px] font-bold uppercase tracking-wider bg-[#6555b8] text-white px-2 py-0.5 rounded-full">
                  $14.99/mo
                </span>
              </div>
              <p className="text-xs text-[#6C637B] leading-relaxed">
                Travel Passport Mode, custom profile usernames, priority placement, and unlimited direct messaging.
              </p>
              <div className="pt-1.5">
                <Link
                  href="/plus"
                  className="inline-block px-4 py-1.5 rounded-full bg-white border border-[#DDD7E5] hover:border-[#6555b8] text-xs font-semibold text-[#6555b8] hover:bg-[#F3EFFC] transition shadow-2xs"
                >
                  Explore AIL+ Privileges &rarr;
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Account Links */}
          <div className="border-t border-[#F0EDF5] pt-3 flex flex-col gap-1">
            <Link
              href="/profile"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-[#524B5E] hover:bg-[#F8F7FA] hover:text-[#1C1924] transition"
            >
              <User className="w-4 h-4 text-[#6555b8]" />
              <span>View &amp; Edit My Profile</span>
            </Link>
            <Link
              href="/verify"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-[#524B5E] hover:bg-[#F8F7FA] hover:text-[#1C1924] transition"
            >
              <ShieldCheck className="w-4 h-4 text-[#6555b8]" />
              <span>Identity &amp; Pose Verification</span>
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition text-left cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-3xl border border-rose-200 p-5 shadow-xs space-y-3">
          <div className="space-y-1">
            <h3
              className="text-xs font-bold uppercase tracking-wider text-rose-600"
              style={{ fontFamily: 'var(--font-brand)' }}
            >
              Danger Zone
            </h3>
            <p className="text-xs text-[#6C637B] leading-relaxed">
              Permanently delete your profile, photos, matches, and messages. This action is irreversible.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Profile &amp; Account</span>
          </button>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <div className="relative w-full max-w-sm bg-white rounded-3xl border border-[#DDD7E5] shadow-2xl p-6 space-y-4">
              <div className="space-y-1.5 text-center">
                <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 mx-auto flex items-center justify-center mb-2">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h3
                  className="text-base font-bold text-[#1C1924]"
                  style={{ fontFamily: 'var(--font-brand)' }}
                >
                  Delete Profile &amp; Account?
                </h3>
                <p className="text-xs text-[#6C637B] leading-relaxed">
                  This will permanently delete your photos, matches, verification status, and all conversations. You cannot undo this action.
                </p>
              </div>

              {deleteError && (
                <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-2xl border border-rose-200 text-center">
                  {deleteError}
                </p>
              )}

              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteAccount}
                  className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isDeleting ? 'Deleting Profile...' : 'Yes, Permanently Delete'}</span>
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => { setShowDeleteModal(false); setDeleteError(null); }}
                  className="w-full py-3 rounded-2xl border border-[#DDD7E5] text-xs font-semibold text-[#524B5E] hover:bg-[#F8F7FA] transition cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <HandleUpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
        />
      </main>
    </div>
  );
}
