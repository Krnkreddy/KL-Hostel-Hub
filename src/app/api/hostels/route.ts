import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeSearchInput, clampPaginationLimit, clampPageNumber, sanitizeHostelPayload } from "@/lib/utils/validation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const supabase = await createClient();
  let query = supabase.from("hostels").select("*", { count: "exact" });
  const search = searchParams.get("search");
  if (search) { const safe = sanitizeSearchInput(search); if (safe.length > 0) query = query.or(`name.ilike.%${safe}%,address.ilike.%${safe}%`); }
  const gender = searchParams.get("gender");
  if (gender && gender !== "all" && ["male","female","co-ed"].includes(gender)) query = query.eq("gender", gender);
  switch (searchParams.get("sort")) {
    case "price_low": query = query.order("price_min", { ascending: true }); break;
    case "price_high": query = query.order("price_min", { ascending: false }); break;
    case "distance": query = query.order("distance_from_campus", { ascending: true }); break;
    default: query = query.order("created_at", { ascending: false });
  }
  const page = clampPageNumber(parseInt(searchParams.get("page") || "1"));
  const limit = clampPaginationLimit(parseInt(searchParams.get("limit") || "12"));
  query = query.range((page - 1) * limit, page * limit - 1);
  const { data, error, count } = await query;
  if (error) return NextResponse.json({ data: null, error: "Failed to fetch hostels" }, { status: 500 });
  return NextResponse.json({ data, error: null, count });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json();
  const sanitized = sanitizeHostelPayload(body);
  if (!sanitized.name || !sanitized.address) return NextResponse.json({ error: "Name and address required" }, { status: 400 });
  const { data, error } = await supabase.from("hostels").insert(sanitized).select().single();
  if (error) return NextResponse.json({ data: null, error: "Failed to create hostel" }, { status: 400 });
  return NextResponse.json({ data, error: null }, { status: 201 });
}
