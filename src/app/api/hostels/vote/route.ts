import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isValidUUID } from "@/lib/utils/validation";

const VOTE_THRESHOLD = 5;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { hostel_id, vote_type } = body;

  if (!hostel_id || !isValidUUID(hostel_id)) return NextResponse.json({ error: "Invalid hostel ID" }, { status: 400 });
  if (!vote_type || !["upvote", "downvote"].includes(vote_type)) return NextResponse.json({ error: "Invalid vote type" }, { status: 400 });

  // Check hostel exists and is pending
  const { data: hostel } = await supabase.from("pending_hostels").select("id, status, submitted_by, name").eq("id", hostel_id).single();
  if (!hostel) return NextResponse.json({ error: "Hostel not found" }, { status: 404 });
  if (hostel.status !== "pending") return NextResponse.json({ error: "Hostel is no longer pending" }, { status: 400 });
  if (hostel.submitted_by === user.id) return NextResponse.json({ error: "Cannot vote on your own submission" }, { status: 400 });

  // Check existing vote
  const { data: existing } = await supabase.from("hostel_votes").select("id, vote_type").eq("hostel_id", hostel_id).eq("user_id", user.id).single();

  if (existing) {
    if (existing.vote_type === vote_type) {
      await supabase.from("hostel_votes").delete().eq("id", existing.id);
      return NextResponse.json({ action: "removed" });
    }
    await supabase.from("hostel_votes").update({ vote_type }).eq("id", existing.id);
  } else {
    const { error } = await supabase.from("hostel_votes").insert({ hostel_id, user_id: user.id, vote_type });
    if (error) return NextResponse.json({ error: "Failed to vote" }, { status: 500 });
  }

  // Check auto-approval threshold
  const { data: counts } = await supabase.rpc("get_hostel_vote_counts", { hostel_uuid: hostel_id });
  const upvotes = counts?.[0]?.upvotes || 0;

  if (upvotes >= VOTE_THRESHOLD) {
    try {
      const svc = await createServiceClient();
      // Auto-approve: insert into hostels table
      await svc.from("hostels").insert({
        name: hostel.name,
        slug: hostel.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
        address: "", gender: "co-ed", price_min: 0, price_max: 0,
        distance_from_campus: 0, amenities: [], is_verified: false,
      });
      await svc.from("pending_hostels").update({ status: "approved" }).eq("id", hostel_id);

      // Notify submitter
      await svc.from("notifications").insert({
        user_id: hostel.submitted_by,
        message: `Your hostel "${hostel.name}" has been auto-approved by community votes!`,
        type: "hostel_approved",
        link: "/hostels",
      });

      // Notify admins
      const { data: admins } = await svc.from("profiles").select("id").eq("role", "admin");
      if (admins?.length) {
        await svc.from("notifications").insert(
          admins.map((a) => ({ user_id: a.id, message: `Hostel "${hostel.name}" auto-approved (${upvotes} votes)`, type: "vote_threshold", link: "/dashboard" }))
        );
      }

      return NextResponse.json({ action: "voted", auto_approved: true, upvotes });
    } catch { /* fallthrough */ }
  }

  return NextResponse.json({ action: existing ? "changed" : "voted", vote_type, upvotes });
}
