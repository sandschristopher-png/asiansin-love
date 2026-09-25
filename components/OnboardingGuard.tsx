'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    async function evaluateOnboardingStatus() {
      // Allow unrestricted public routes
      const publicPaths = ['/login', '/onboarding', '/standards', '/privacy', '/terms'];
      if (publicPaths.some((p) => pathname.startsWith(p))) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .maybeSingle();

      // If user is authenticated but hasn't completed onboarding, enforce the flow
      if (profile && profile.onboarding_completed === false) {
        router.push('/onboarding');
      }
    }

    evaluateOnboardingStatus();
  }, [pathname, router]);

  return <>{children}</>;
}
