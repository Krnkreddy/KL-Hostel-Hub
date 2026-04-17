import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { validateRatings, isValidUUID } from "@/lib/utils/validation";
import { REVIEW_IMAGE_BUCKET } from "@/lib/constants";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // ✅ BUG-03 FIX: Validate review ID format
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: "Invalid review ID" }, { status: 400 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: review } = await supabase.from("reviews").select("user_id").eq("id", id).single();
  if (!review || review.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (typeof body.title === "string") {
    const t = body.title.trim();
    if (t.length < 3 || t.length > 200) return NextResponse.json({ error: "Title must be 3-200 chars" }, { status: 400 });
    updates.title = t;
  }

  if (typeof body.content === "string") {
    const c = body.content.trim();
    if (c.length < 10 || c.length > 5000) return NextResponse.json({ error: "Review must be 10-5000 chars" }, { status: 400 });
    updates.content = c;
  }

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
  const { id } = await params;
  const supabase = await createClient();

  // ✅ BUG-03 FIX: Validate review ID format
  if (!isValidUUID(id)) {
    return NextResponse.json({ error: "Invalid review ID" }, { status: 400 });
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: review } = await supabase.from("reviews").select("user_id").eq("id", id).single();
  if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (review.user_id !== user.id) {
    const { data: p } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (!p || p.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // ✅ BUG-05 FIX: Delete associated images from Storage BEFORE deleting the review.
  // When the review row is deleted, review_images rows cascade-delete, losing the file paths.
  const { data: images } = await supabase
    .from("review_images")
    .select("image_url")
    .eq("review_id", id);

  if (images && images.length > 0) {
    const storagePaths = images
      .map((img) => {
        // Extract path after the bucket name: ".../review-images/userId/reviewId/filename"
        const match = img.image_url.split(`/${REVIEW_IMAGE_BUCKET}/`)[1];
        return match || null;
      })
      .filter(Boolean) as string[];

    if (storagePaths.length > 0) {
      await supabase.storage.from(REVIEW_IMAGE_BUCKET).remove(storagePaths);
    }
  }

  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Failed to delete" }, { status: 400 });

  return NextResponse.json({ success: true });
}
