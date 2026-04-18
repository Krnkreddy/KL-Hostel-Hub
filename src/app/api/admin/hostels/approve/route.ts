import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { isValidUUID } from "@/lib/utils/validation";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check admin
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const { hostel_id, action, note } = body;

  if (!hostel_id || !isValidUUID(hostel_id)) return NextResponse.json({ error: "Invalid hostel ID" }, { status: 400 });
  if (!action || !["approve", "reject"].includes(action)) return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  const svc = await createServiceClient();
  const { data: pending } = await svc.from("pending_hostels").select("*").eq("id", hostel_id).single();
  if (!pending) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (pending.status !== "pending") return NextResponse.json({ error: "Already processed" }, { status: 400 });

  if (action === "approve") {
    // Insert into main hostels table
    const { error: insertErr } = await svc.from("hostels").insert({
      name: pending.name,
      slug: pending.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      address: pending.location || "",
      gender: pending.gender || "co-ed",
      price_min: pending.price_min || 0,
      price_max: pending.price_max || 0,
      distance_from_campus: Number(pending.distance) || 0,
      amenities: pending.amenities || [],
      is_verified: true,
    });
    if (insertErr) return NextResponse.json({ error: "Failed to create hostel" }, { status: 500 });

    await svc.from("pending_hostels").update({ status: "approved", admin_note: note || null }).eq("id", hostel_id);

    // Notify submitter
    await svc.from("notifications").insert({
      user_id: pending.submitted_by,
      message: `Your hostel "${pending.name}" has been approved by admin!`,
      type: "hostel_approved",
      link: "/hostels",
    });

    return NextResponse.json({ status: "approved" });
  }

  // Reject
  await svc.from("pending_hostels").update({ status: "rejected", admin_note: note || null }).eq("id", hostel_id);

  await svc.from("notifications").insert({
    user_id: pending.submitted_by,
    message: `Your hostel "${pending.name}" was not approved.${note ? ` Reason: ${note}` : ""}`,
    type: "hostel_rejected",
  });

  return NextResponse.json({ status: "rejected" });
}
