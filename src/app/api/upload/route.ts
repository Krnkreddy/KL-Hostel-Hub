import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { MAX_IMAGE_SIZE_BYTES, ALLOWED_IMAGE_TYPES, REVIEW_IMAGE_BUCKET, MAX_REVIEW_IMAGES } from "@/lib/constants";
import { detectFileType } from "@/lib/utils/validation";

export async function POST(request: Request) {
  // Auth check with user client
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let formData: FormData;
  try { formData = await request.formData(); } catch { return NextResponse.json({ error: "Invalid form data" }, { status: 400 }); }

  const file = formData.get("file") as File | null;
  const reviewId = formData.get("review_id") as string | null;
  if (!file || !reviewId) return NextResponse.json({ error: "File and review_id required" }, { status: 400 });
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return NextResponse.json({ error: "Only JPEG, PNG, WebP allowed" }, { status: 400 });
  if (file.size > MAX_IMAGE_SIZE_BYTES) return NextResponse.json({ error: "Max 5MB" }, { status: 400 });

  const detected = await detectFileType(file);
  if (!detected || !ALLOWED_IMAGE_TYPES.includes(detected)) return NextResponse.json({ error: "Invalid image format" }, { status: 400 });

  // Verify review belongs to user
  const { data: review } = await supabase.from("reviews").select("user_id").eq("id", reviewId).single();
  if (!review || review.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Check image count limit
  const { count } = await supabase.from("review_images").select("*", { count: "exact", head: true }).eq("review_id", reviewId);
  if ((count || 0) >= MAX_REVIEW_IMAGES) return NextResponse.json({ error: `Max ${MAX_REVIEW_IMAGES} images` }, { status: 400 });

  // Use service client for storage upload (bypasses storage RLS)
  const serviceClient = await createServiceClient();
  const extMap: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extMap[detected] || "jpg"}`;
  const filePath = `${user.id}/${reviewId}/${safeName}`;

  const { error: ue } = await serviceClient.storage.from(REVIEW_IMAGE_BUCKET).upload(filePath, file, { cacheControl: "3600", upsert: false, contentType: detected });
  if (ue) {
    console.error("Storage upload error:", ue);
    return NextResponse.json({ error: "Upload failed: " + ue.message }, { status: 500 });
  }

  const { data: urlData } = serviceClient.storage.from(REVIEW_IMAGE_BUCKET).getPublicUrl(filePath);

  // Insert record into review_images (also via service client to bypass table RLS edge cases)
  const { data: rec, error: de } = await serviceClient.from("review_images").insert({
    review_id: reviewId,
    image_url: urlData.publicUrl,
  }).select().single();

  if (de) {
    console.error("DB insert error:", de);
    await serviceClient.storage.from(REVIEW_IMAGE_BUCKET).remove([filePath]);
    return NextResponse.json({ error: "Failed to save image record" }, { status: 500 });
  }

  return NextResponse.json({ data: rec, error: null }, { status: 201 });
}
