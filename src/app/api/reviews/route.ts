import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAllowedDomain } from "@/lib/auth/domain-check";
import { clampPageNumber, clampPaginationLimit, validateRatings } from "@/lib/utils/validation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const supabase = await createClient();
  const hostelId = searchParams.get("hostel_id");
  const page = clampPageNumber(parseInt(searchParams.get("page") || "1"));
  const limit = clampPaginationLimit(parseInt(searchParams.get("limit") || "10"));
  let query = supabase.from("reviews").select("*, profile:profiles(*), rating:ratings(*), images:review_images(*)", { count: "exact" });
  if (hostelId) query = query.eq("hostel_id", hostelId);
  query = query.order("created_at", { ascending: false }).range((page - 1) * limit, page * limit - 1);
  const { data, error, count } = await query;
  if (error) return NextResponse.json({ data: null, error: "Failed to fetch reviews" }, { status: 500 });
  return NextResponse.json({ data, error: null, count });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAllowedDomain(user.email)) return NextResponse.json({ error: "Only @kluniversity.in accounts" }, { status: 403 });
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  if (typeof body.hostel_id !== "string" || typeof body.title !== "string" || typeof body.content !== "string" || !body.rating || typeof body.rating !== "object")
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  const title = (body.title as string).trim(); const content = (body.content as string).trim();
  if (title.length < 3 || title.length > 200) return NextResponse.json({ error: "Title must be 3-200 chars" }, { status: 400 });
  if (content.length < 10 || content.length > 5000) return NextResponse.json({ error: "Review must be 10-5000 chars" }, { status: 400 });
  const validatedRatings = validateRatings(body.rating as Record<string, unknown>);
  if (!validatedRatings) return NextResponse.json({ error: "All ratings must be 1-5" }, { status: 400 });
  const validDurations = ["Less than 3 months","3-6 months","6 months - 1 year","1-2 years","2+ years"];
  const stayDuration = body.stay_duration && typeof body.stay_duration === "string" && validDurations.includes(body.stay_duration) ? body.stay_duration : null;
  const { data: review, error: re } = await supabase.from("reviews").insert({ hostel_id: body.hostel_id, user_id: user.id, title, content, stay_duration: stayDuration }).select().single();
  if (re) { if (re.code === "23505") return NextResponse.json({ error: "You already reviewed this hostel" }, { status: 409 }); return NextResponse.json({ error: "Failed to create review" }, { status: 400 }); }
  const { error: ratErr } = await supabase.from("ratings").insert({ review_id: review.id, ...validatedRatings });
  if (ratErr) { await supabase.from("reviews").delete().eq("id", review.id); return NextResponse.json({ error: "Failed to save ratings" }, { status: 400 }); }
  return NextResponse.json({ data: review, error: null }, { status: 201 });
}
