"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { InAppToast } from "@/components/InAppToast";
import { GoogleAuthButton } from "@/components/GoogleAuthButton";

const RESET_EXPIRED_MESSAGE = "That password reset link has expired or was already used. Request a new one from Forgot?";

export default function LoginPage() {
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const closeToast = useCallback(() => setToast(null), []);

  // /auth/callback and /reset-password send members back here when a recovery link is no good.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("notice") !== "reset_expired") return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of the URL on mount
    setToast(RESET_EXPIRED_MESSAGE);
    params.delete("notice");
    const qs = params.toString();
    window.history.replaceState(null, "", window.location.pathname + (qs ? "?" + qs : ""));
  }, []);

  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "Incorrect email or password. Please try again."
          : error.message
      );
      setLoading(false);
      return;
    }
    if (data?.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", data.user.id)
        .maybeSingle();

      try {
        localStorage.setItem("ail_returning", "1");
        if (!profile?.onboarding_completed) sessionStorage.setItem("ail_active_onboarding", "1");
      } catch {}
      window.location.href = profile?.onboarding_completed ? "/discover" : "/onboarding";
    }
  }

  return (
    <div className="min-h-[100dvh] w-full bg-[#FAF8FD] flex items-center justify-center px-4 py-3 sm:p-6 font-sans antialiased selection:bg-[#6555b8]/15 selection:text-[#6555b8]">
      <InAppToast message={toast} onClose={closeToast} durationMs={7000} />
      <main className="w-full max-w-[420px] bg-white rounded-3xl border border-[#ECE8F4] shadow-xl shadow-[#1C1536]/5 px-6 py-6 sm:p-9 space-y-5">
        
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="flex justify-center mb-2">
            <BrandLogo size="header" href="/" />
          </div>
          <h1 className="font-brand text-2xl font-extrabold text-[#2D264B] tracking-tight">Welcome back</h1>
          <p className="text-xs text-[#6C637B]">
            Sign in to continue your journey.
          </p>
        </div>

        {/* Google Sign-In + "or with email" divider */}
        <GoogleAuthButton onError={setError} />

        {/* Email Sign-In Form */}
        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label htmlFor="email" className="text-xs font-bold text-[#1C1924] block">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full py-3 px-4 rounded-2xl bg-white border border-slate-200 text-base text-[#1C1924] placeholder:text-[#A8A1B5] focus:outline-none focus:border-[#6555B8] focus:ring-4 focus:ring-[#6555B8]/15 transition"
            />
          </div>

          <div className="space-y-1.5 text-left">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-xs font-bold text-[#1C1924] block">
                Password
              </label>
              <Link href="/forgot-password" className="text-xs font-semibold text-[#6555B8] hover:underline">
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="w-full py-3 px-4 pr-11 rounded-2xl bg-white border border-slate-200 text-base text-[#1C1924] placeholder:text-[#A8A1B5] focus:outline-none focus:border-[#6555B8] focus:ring-4 focus:ring-[#6555B8]/15 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#A8A1B5] hover:text-[#524B5E] transition cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5">
              {error}
            </p>
          )}

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-xl bg-[#6555B8] text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-[#6555B8]/20 hover:bg-[#5444A0] active:scale-[0.99] transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
          <p className="text-center text-[11.5px] text-[#8C849B]">100% private. We never post to external accounts.</p>
        </form>

        {/* Bottom Signup Action */}
        <div className="text-center text-xs text-[#6C637B]">
          New to asiansin.love?{" "}
          <Link
            href="/signup"
            className="font-bold text-[#6555B8] hover:underline transition"
          >
            Create an account
          </Link>
        </div>

        {/* Legal */}
        <p className="text-[11px] leading-relaxed text-[#9A93A8] text-center">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="font-semibold text-[#6555B8] hover:underline">Terms</Link>
          {" "}and{" "}
          <Link href="/privacy" className="font-semibold text-[#6555B8] hover:underline">Privacy Policy</Link>.
        </p>
      </main>
    </div>
  );
}