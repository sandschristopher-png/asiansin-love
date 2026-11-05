import { AmbientAurora } from '@/components/ui/AmbientAurora';

/** Ambient aurora behind every onboarding step; the wizard cards sit above it on z-10. */
export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-white">
      <div className="absolute inset-0 pointer-events-none z-0">
        <AmbientAurora />
      </div>
      <div className="relative z-10">{children}</div>
    </div>
  );
}
