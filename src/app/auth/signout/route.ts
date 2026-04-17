import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();

  // ✅ BUG-11 FIX: Use request host instead of env fallback to localhost
  const host = request.headers.get("host") || "";
  const proto = request.headers.get("x-forwarded-proto") || "http";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`;

  return NextResponse.redirect(new URL("/", baseUrl));
}
