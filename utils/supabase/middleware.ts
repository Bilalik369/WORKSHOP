import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

const LOGIN_PATH = "/admin/login";

/**
 * Rafraîchit la session Supabase (cookies) et bloque l'administration aux
 * visiteurs non connectés, avant même le rendu des pages. La liste
 * ADMIN_EMAILS est ensuite vérifiée par chaque page et chaque action.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const isLoginPage = request.nextUrl.pathname === LOGIN_PATH;

  if (!supabaseUrl || !supabaseKey) {
    return isLoginPage ? supabaseResponse : redirectToLogin(request);
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // Vérifie le jeton (et le renouvelle s'il a expiré).
  const { data } = await supabase.auth.getClaims();

  if (!data?.claims && !isLoginPage) {
    const response = redirectToLogin(request);
    // Conserve les cookies éventuellement renouvelés ou effacés.
    supabaseResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
    return response;
  }

  return supabaseResponse;
}

function redirectToLogin(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = LOGIN_PATH;
  url.search = "";
  return NextResponse.redirect(url);
}
