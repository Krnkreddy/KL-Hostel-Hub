import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateRatings } from "@/lib/utils/validation";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: review } = await supabase.from("reviews").select("user_id").eq("id", id).single();
  if (!review || review.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.title === "string") { const t = body.title.trim(); if (t.length < 3 || t.length > 200) return NextResponse.json({ error: "Title must be 3-200 chars" }, { status: 400 }); updates.title = t; }
  if (typeof body.content === "string") { const c = body.content.trim(); if (c.length < 10 || c.length > 5000) return NextResponse.json({ error: "Review must be 10-5000 chars" }, { status: 400 }); updates.content = c; }
  const { data, error } = await supabase.from("reviews").update(updates).eq("id", id).select().single();
  if (error) return NextResponse.json({ error: "Failed to update" }, { status: 400 });
  if (body.rating && typeof body.rating === "object") {
    const vr = validateRatings(body.rating as Record<string, unknown>);
    if (!vr) return NextResponse.json({ error: "Ratings must be 1-5" }, { status: 400 });
    await supabase.from("ratings").update(vr).eq("review_id", id);
  }
  return NextResponse.json({ data, error: null });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: review } = await supabase.from("reviews").select("user_id").eq("id", id).single();
  if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (review.user_id !== user.id) {
    const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!p || p.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Failed to delete" }, { status: 400 });
  return NextResponse.json({ success: true });
}
