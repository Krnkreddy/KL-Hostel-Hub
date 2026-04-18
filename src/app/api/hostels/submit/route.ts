import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const { name, location, price_min, price_max, gender, description, distance, amenities } = body;

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return NextResponse.json({ error: "Hostel name is required (min 2 chars)" }, { status: 400 });
  }
  if (gender && !["male", "female", "co-ed"].includes(gender)) {
    return NextResponse.json({ error: "Invalid gender" }, { status: 400 });
  }

  const { data: hostel, error } = await supabase.from("pending_hostels").insert({
    submitted_by: user.id,
    name: name.trim(),
    location: (location || "").trim(),
    price_min: Math.max(0, Number(price_min) || 0),
    price_max: Math.max(0, Number(price_max) || 0),
    gender: gender || "co-ed",
    description: (description || "").trim(),
    distance: (distance || "").trim(),
    amenities: Array.isArray(amenities) ? amenities.filter((a: unknown) => typeof a === "string") : [],
    status: "pending",
  }).select().single();

  if (error) return NextResponse.json({ error: "Failed to submit hostel" }, { status: 500 });

  // Notify admins
  try {
    const svc = await createServiceClient();
    const { data: admins } = await svc.from("profiles").select("id").eq("role", "admin");
    if (admins && admins.length > 0) {
      await svc.from("notifications").insert(
        admins.map((a) => ({
          user_id: a.id,
          message: `New hostel "${name.trim()}" submitted for review`,
          type: "hostel_submitted",
          link: "/dashboard",
        }))
      );
    }
  } catch { /* non-blocking */ }

  return NextResponse.json({ id: hostel.id, status: "pending" }, { status: 201 });
}
