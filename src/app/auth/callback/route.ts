import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAllowedDomain } from "@/lib/auth/domain-check";
import { sanitizeRedirectPath } from "@/lib/utils/validation";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = sanitizeRedirectPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error && data?.user) {
        if (!isAllowedDomain(data.user.email)) {
          await supabase.auth.signOut();
          return NextResponse.redirect(`${origin}/login?error=unauthorized&message=${encodeURIComponent("Only @kluniversity.in emails are allowed.")}`);
        }
        const forwardedHost = request.headers.get("x-forwarded-host");
        const isLocal = process.env.NODE_ENV === "development";
        if (isLocal) return NextResponse.redirect(`${origin}${next}`);
        if (forwardedHost) return NextResponse.redirect(`https://${forwardedHost}${next}`);
        return NextResponse.redirect(`${origin}${next}`);
      }
    } catch {
      return NextResponse.redirect(`${origin}/login?error=auth_error&message=${encodeURIComponent("Session expired. Please sign in again.")}`);
    }
  }
  return NextResponse.redirect(`${origin}/login?error=auth_error&message=${encodeURIComponent("Authentication failed.")}`);
}
