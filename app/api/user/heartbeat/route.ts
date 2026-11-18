import { errMsg } from '@/lib/errors';
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { after } from "next/server";
import { checkNewCountry } from "@/lib/verify/riskFlags";
import { stepUpDb } from "@/lib/verify/stepUp";

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    // getSession reads local JWT (no network round-trip to Supabase Auth)
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    const user = session?.user ?? null;

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const nowIso = new Date().toISOString();

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ last_active: nowIso })
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // First ping of a session only (x-session-start): is this login from a new country?
    if (req.headers.get("x-session-start") === "1") {
      const edge = req.headers.get("x-vercel-ip-country");
      after(() => checkNewCountry(stepUpDb(), user.id, edge));
    }

    return NextResponse.json({ success: true, last_active: nowIso });
  } catch (err) {
    return NextResponse.json({ error: errMsg(err) || "Internal error" }, { status: 500 });
  }
}