import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeHostelPayload } from "@/lib/utils/validation";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: hostel, error } = await supabase.from("hostels").select("*").eq("id", id).single();
  if (error || !hostel) return NextResponse.json({ data: null, error: "Not found" }, { status: 404 });
  const { data: ratings } = await supabase.rpc("get_hostel_ratings", { hostel_uuid: id });
  return NextResponse.json({ data: { ...hostel, ratings: ratings?.[0] || null }, error: null });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  let body; try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const sanitized = sanitizeHostelPayload(body);
  if (Object.keys(sanitized).length === 0) return NextResponse.json({ error: "No valid fields" }, { status: 400 });
  const { data, error } = await supabase.from("hostels").update(sanitized).eq("id", id).select().single();
  if (error) return NextResponse.json({ data: null, error: "Failed to update" }, { status: 400 });
  return NextResponse.json({ data, error: null });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { error } = await supabase.from("hostels").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Failed to delete" }, { status: 400 });
  return NextResponse.json({ success: true });
}
