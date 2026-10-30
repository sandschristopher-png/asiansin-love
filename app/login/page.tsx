"use client";

import { useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";
import { Eye, EyeOff, Loader2, LogIn } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

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
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  }

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
    <div className="min-h-screen w-full bg-[#FAF8FD] flex items-center justify-center p-4 sm:p-6 font-sans antialiased selection:bg-[#6555b8]/15 selection:text-[#6555b8]">
      <main className="w-full max-w-[420px] bg-white rounded-3xl border border-[#DDD7E5] shadow-xl shadow-[#1C1536]/5 p-7 sm:p-9 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-3">
            <BrandLogo size="md" />
          </div>
          <h1 className="text-2xl font-black text-[#1C1924] tracking-tight">Welcome back</h1>
          <p className="text-xs text-[#6C637B]">
            Sign in to continue your journey.
          </p>
        </div>

        {/* Google Sign-In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="w-full py-3.5 px-4 rounded-2xl bg-white border border-[#DDD7E5] text-[#1C1924] text-xs font-bold flex items-center justify-center gap-2.5 shadow-xs hover:bg-[#FAF8FD] hover:border-[#6555B8]/40 active:scale-[0.99] transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {googleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#6555B8]" />
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
              <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
            </svg>
          )}
          <span>{googleLoading ? "Redirecting..." : "Continue with Google"}</span>
        </button>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-2">
          <div className="w-full border-t border-[#F0EDF5]" />
          <span className="absolute bg-white px-3 text-[10px] font-bold uppercase tracking-widest text-[#9E97A9]">
            or with email
          </span>
        </div>

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
              className="w-full py-3 px-4 rounded-2xl bg-white border border-[#DDD7E5] text-xs text-[#1C1924] placeholder:text-[#A8A1B5] focus:outline-none focus:border-[#6555B8] focus:ring-4 focus:ring-[#6555B8]/10 transition"
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
                className="w-full py-3 px-4 pr-11 rounded-2xl bg-white border border-[#DDD7E5] text-xs text-[#1C1924] placeholder:text-[#A8A1B5] focus:outline-none focus:border-[#6555B8] focus:ring-4 focus:ring-[#6555B8]/10 transition"
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
            className="w-full py-3.5 px-6 rounded-2xl bg-[#6555B8] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-[#6555B8]/20 hover:bg-[#5444A0] active:scale-[0.99] transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </>
            )}
          </button>
        </form>

        {/* Bottom Signup Action */}
        <div className="pt-2 text-center text-xs text-[#6C637B]">
          New to Asians in Love?{" "}
          <Link
            href="/signup"
            className="font-bold text-[#6555B8] hover:underline transition"
          >
            Create your free profile
          </Link>
        </div>

        {/* Legal */}
        <p className="text-[11px] leading-relaxed text-[#8C849B] text-center pt-1 border-t border-[#F0EDF5]">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="font-semibold text-[#6555B8] hover:underline">
            Terms of Service
          </Link>{" "}and{" "}
          <Link href="/privacy" className="font-semibold text-[#6555B8] hover:underline">
            Privacy Policy
          </Link>.
        </p>
      </main>
    </div>
  );
}