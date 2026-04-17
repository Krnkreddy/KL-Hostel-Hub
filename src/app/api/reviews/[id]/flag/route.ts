import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: reviewId } = await params; const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (typeof body.reason !== "string") return NextResponse.json({ error: "Reason required" }, { status: 400 });
  const reason = body.reason.trim();
  if (reason.length < 5 || reason.length > 500) return NextResponse.json({ error: "Reason must be 5-500 chars" }, { status: 400 });
  const { data: review } = await supabase.from("reviews").select("user_id").eq("id", reviewId).single();
  if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (review.user_id === user.id) return NextResponse.json({ error: "Cannot flag your own review" }, { status: 400 });
  const { error } = await supabase.from("review_flags").insert({ review_id: reviewId, user_id: user.id, reason });
  if (error) { if (error.code === "23505") return NextResponse.json({ error: "Already flagged" }, { status: 409 }); return NextResponse.json({ error: "Failed to flag" }, { status: 400 }); }
  return NextResponse.json({ success: true }, { status: 201 });
}
