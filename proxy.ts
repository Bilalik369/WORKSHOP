import type { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { updateSession } from "./utils/supabase/middleware";

const handleI18n = createIntlMiddleware(routing);

export default async function proxy(request: NextRequest) {
  // L'espace admin n'est pas traduit : on y rafraîchit seulement la session Supabase.
  if (request.nextUrl.pathname.startsWith("/admin")) {
    return updateSession(request);
  }
  return handleI18n(request);
}

export const config = {
  // Tout sauf l'API, les fichiers internes de Next et les fichiers statiques.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
