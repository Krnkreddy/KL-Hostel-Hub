import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { full_name } = body;

  if (!full_name || typeof full_name !== "string" || full_name.trim().length === 0 || full_name.trim().length > 100) {
    return NextResponse.json({ error: "Invalid name" }, { status: 400 });
  }

  const svc = await createServiceClient();
  const { error } = await svc.from("profiles").update({ full_name: full_name.trim() }).eq("id", user.id);

  if (error) {
    console.error("[profile] Update error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
