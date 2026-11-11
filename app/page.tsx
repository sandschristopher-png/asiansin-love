import { redirect } from "next/navigation";
import { HeroLanding } from "@/components/HeroLanding";
import { createClient } from "@/lib/supabase/server";
import { getRequestLocale } from "@/lib/i18n/server";
import { getMessages } from "@/lib/i18n/messages";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // No session: serve the hero landing directly, no spinner, no client-side auth call
  if (!session) {
    // Locale from the NEXT_LOCALE cookie: the first byte is already in the visitor's language.
    const locale = await getRequestLocale();
    return <HeroLanding locale={locale} messages={getMessages(locale)} />;
  }

  // Signed in: check onboarding completion and route accordingly
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", session.user.id)
    .single();

  if (!profile?.onboarding_completed) {
    redirect("/onboarding");
  }

  redirect("/discover");
}