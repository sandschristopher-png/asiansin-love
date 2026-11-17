import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { HeroLanding } from "@/components/HeroLanding";
import { PhilippinesLanding } from "@/components/PhilippinesLanding";
import { createClient } from "@/lib/supabase/server";
import { getRequestLocale } from "@/lib/i18n/server";
import { getMessages } from "@/lib/i18n/messages";
import { isPhilippines, resolveCountry } from "@/lib/geoLanding";

export default async function Home({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // No session: serve the hero landing directly, no spinner, no client-side auth call
  if (!session) {
    // mia_lang cookie, else Accept-Language: the first byte is already in the visitor's language.
    const locale = await getRequestLocale();
    const messages = getMessages(locale);
    // Visitors from the Philippines (edge country header) get their own landing page at this same URL,
    // rendered on the server: no redirect and no flicker. ?country=PH / ?country=US override it for QA.
    const [h, params] = await Promise.all([headers(), searchParams]);
    if (isPhilippines(resolveCountry((name) => h.get(name), params.country))) {
      return <PhilippinesLanding locale={locale} messages={messages} />;
    }
    return <HeroLanding locale={locale} messages={messages} />;
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
