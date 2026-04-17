import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MAX_IMAGE_SIZE_BYTES, ALLOWED_IMAGE_TYPES, REVIEW_IMAGE_BUCKET, MAX_REVIEW_IMAGES } from "@/lib/constants";
import { detectFileType } from "@/lib/utils/validation";

export async function POST(request: Request) {
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
  const { data: review } = await supabase.from("reviews").select("user_id").eq("id", reviewId).single();
  if (!review || review.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { count } = await supabase.from("review_images").select("*", { count: "exact", head: true }).eq("review_id", reviewId);
  if ((count || 0) >= MAX_REVIEW_IMAGES) return NextResponse.json({ error: `Max ${MAX_REVIEW_IMAGES} images` }, { status: 400 });
  const extMap: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extMap[detected] || "jpg"}`;
  const filePath = `${user.id}/${reviewId}/${safeName}`;
  const { error: ue } = await supabase.storage.from(REVIEW_IMAGE_BUCKET).upload(filePath, file, { cacheControl: "3600", upsert: false, contentType: detected });
  if (ue) return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  const { data: urlData } = supabase.storage.from(REVIEW_IMAGE_BUCKET).getPublicUrl(filePath);
  const { data: rec, error: de } = await supabase.from("review_images").insert({ review_id: reviewId, image_url: urlData.publicUrl }).select().single();
  if (de) { await supabase.storage.from(REVIEW_IMAGE_BUCKET).remove([filePath]); return NextResponse.json({ error: "Failed to save" }, { status: 500 }); }
  return NextResponse.json({ data: rec, error: null }, { status: 201 });
}
