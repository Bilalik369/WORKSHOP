import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { isAdminEmail } from "@/lib/env";
import { createClient } from "@/utils/supabase/server";

/** Retour du lien magique : ouvre la session puis vérifie que l'adresse est autorisée. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();
  let failed = true;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    failed = Boolean(error);
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    failed = Boolean(error);
  }

  if (!failed) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (isAdminEmail(user?.email)) {
      return NextResponse.redirect(`${origin}/admin/reservations`);
    }
    await supabase.auth.signOut();
  }

  return NextResponse.redirect(`${origin}/admin/login?erreur=lien`);
}
